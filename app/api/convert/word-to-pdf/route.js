import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { access, mkdir, readFile, rm, stat, writeFile } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PDF_MIME = 'application/pdf';
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const CONVERTER_SCRIPT = path.join(process.cwd(), 'backend', 'word_to_pdf_converter.py');
const WORK_ROOT = path.join(os.tmpdir(), 'sababpdf-word-to-pdf');
const DEFAULT_CONVERTER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const CONFIGURED_CONVERTER_TIMEOUT_MS = Number(process.env.WORD_TO_PDF_TIMEOUT_MS);
const CONVERTER_TIMEOUT_MS = Number.isFinite(CONFIGURED_CONVERTER_TIMEOUT_MS) && CONFIGURED_CONVERTER_TIMEOUT_MS > 0
  ? CONFIGURED_CONVERTER_TIMEOUT_MS
  : DEFAULT_CONVERTER_TIMEOUT_MS;

function sanitizeBaseName(filename) {
  return (filename || 'document')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_ ]+/g, '')
    .trim() || 'document';
}

function buildJsonResponse(message, status) {
  return Response.json({ error: message }, { status });
}

function runPythonConverter(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [CONVERTER_SCRIPT, inputPath, outputPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, CONVERTER_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        timedOut,
      });
    });
  });
}

export async function POST(request) {
  const workDir = path.join(WORK_ROOT, randomUUID());

  try {
    await access(CONVERTER_SCRIPT);
  } catch {
    console.log('[Word-to-PDF] Python converter script found');
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return buildJsonResponse('No Word file was uploaded.', 400);
    }

    const fileName = file.name || 'document.docx';
    const validExts = ['.doc', '.docx'];
    const fileExt = '.' + fileName.split('.').pop().toLowerCase();
    if (!validExts.includes(fileExt)) {
      return buildJsonResponse('Please upload a Word document (.doc or .docx).', 400);
    }

    await mkdir(workDir, { recursive: true });

    const inputPath = path.join(workDir, `${randomUUID()}${fileExt}`);
    const outputPath = path.join(workDir, `${sanitizeBaseName(fileName)}-converted.pdf`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(inputPath, fileBuffer);

    // Try Python converter first
    let result;
    let useLibreOfficeDirect = false;
    
    try {
      result = await runPythonConverter(inputPath, outputPath);
    } catch (pythonError) {
      console.log('[Word-to-PDF] Python converter failed, trying LibreOffice directly...');
      useLibreOfficeDirect = true;
    }

    // If Python converter failed or returned error, try LibreOffice directly
    if (useLibreOfficeDirect || (result && result.code !== 0)) {
      // Fallback to LibreOffice command
      const libreofficeCmd = process.platform === 'win32'
        ? '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"'
        : 'libreoffice';

      return new Promise((resolve) => {
        const child = spawn(libreofficeCmd, [
          '--headless',
          '--convert-to', 'pdf',
          '--outdir', workDir,
          inputPath
        ], {
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        });

        let stderr = '';
        const timer = setTimeout(() => {
          child.kill('SIGTERM');
          resolve(buildJsonResponse('Conversion timed out. Please try again.', 504));
        }, CONVERTER_TIMEOUT_MS);

        child.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });

        child.on('close', async (code) => {
          clearTimeout(timer);

          // Check if output was created
          let outputStats = null;
          try {
            outputStats = await stat(outputPath);
          } catch {
            // Try alternative output path (LibreOffice might use different name)
            const altOutputPath = path.join(workDir, `${path.basename(inputPath, fileExt)}.pdf`);
            try {
              outputStats = await stat(altOutputPath);
              // Rename to expected output
              await writeFile(outputPath, await readFile(altOutputPath));
              await rm(altOutputPath, { force: true });
            } catch {
              outputStats = null;
            }
          }

          if (code !== 0 || !outputStats || outputStats.size === 0) {
            const errorMsg = stderr.trim();
            let userMessage = 'Word to PDF conversion failed.';
            
            if (errorMsg.includes('not found') || errorMsg.includes('cannot find')) {
              userMessage = 'LibreOffice is not installed. Please install LibreOffice to use this feature.';
            } else if (errorMsg.includes('access denied') || errorMsg.includes('permission')) {
              userMessage = 'Permission error during conversion. Please try again.';
            }
            
            console.error('[Word-to-PDF] Conversion error:', errorMsg);
            resolve(buildJsonResponse(userMessage, 500));
          } else {
            const outputBytes = await readFile(outputPath);
            const downloadName = `${sanitizeBaseName(fileName)}-converted.pdf`;

            resolve(new Response(new Uint8Array(outputBytes), {
              status: 200,
              headers: {
                'Content-Type': PDF_MIME,
                'Content-Disposition': `attachment; filename="${downloadName}"`,
                'Content-Length': String(outputBytes.length),
                'Cache-Control': 'no-store',
              },
            }));
          }
        });
      });
    }

    if (result.timedOut) {
      return buildJsonResponse('Word to PDF conversion timed out. Please try a smaller document.', 504);
    }

    let outputStats = null;
    try {
      outputStats = await stat(outputPath);
    } catch {
      outputStats = null;
    }

    if (result.code !== 0 || !outputStats || outputStats.size === 0) {
      return buildJsonResponse('Word to PDF conversion failed. Please ensure LibreOffice is installed.', 500);
    }

    const outputBytes = await readFile(outputPath);
    const downloadName = `${sanitizeBaseName(fileName)}-converted.pdf`;

    return new Response(new Uint8Array(outputBytes), {
      status: 200,
      headers: {
        'Content-Type': PDF_MIME,
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': String(outputBytes.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Word-to-PDF] Unexpected error:', error.message);
    return buildJsonResponse(`Conversion failed: ${error.message}`, 500);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
