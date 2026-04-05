import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { access, mkdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { createReadStream } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
// Use enhanced converter for best quality
const ENHANCED_CONVERTER_SCRIPT = path.join(process.cwd(), 'backend', 'pdf_to_word_enhanced.py');
const WORK_ROOT = path.join(os.tmpdir(), 'sababpdf-pdf-to-word');
const DEFAULT_CONVERTER_TIMEOUT_MS = 30 * 60 * 1000;
const CONFIGURED_CONVERTER_TIMEOUT_MS = Number(process.env.PDF_TO_WORD_TIMEOUT_MS);
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

function normalizeMode(mode) {
  if (mode === 'layout') {
    return 'layout';
  }

  if (mode === 'ocr') {
    return 'ocr';
  }

  return 'no-ocr';
}

function runPythonConverter(inputPath, outputPath, mode) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [ENHANCED_CONVERTER_SCRIPT, inputPath, outputPath, normalizeMode(mode)], {
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
    await access(ENHANCED_CONVERTER_SCRIPT);
  } catch {
    return buildJsonResponse('PDF to Word converter script was not found in the project.', 500);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const mode = normalizeMode(formData.get('mode'));

    if (!(file instanceof File)) {
      return buildJsonResponse('No PDF file was uploaded.', 400);
    }

    const fileName = file.name || 'document.pdf';
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return buildJsonResponse('Upload a PDF file for PDF to Word conversion.', 400);
    }

    await mkdir(workDir, { recursive: true });

    const inputPath = path.join(workDir, `${randomUUID()}.pdf`);
    const outputPath = path.join(workDir, `${sanitizeBaseName(fileName)}-converted.docx`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(inputPath, fileBuffer);

    console.log(`[PDF-to-Word] Using ENHANCED converter for best quality`);

    const result = await runPythonConverter(inputPath, outputPath, mode);

    if (result.timedOut) {
      return buildJsonResponse('PDF to Word conversion timed out before the converter could finish. Increase PDF_TO_WORD_TIMEOUT_MS for very large PDFs or try a smaller file.', 504);
    }

    let parsed = null;
    if (result.stdout) {
      try {
        parsed = JSON.parse(result.stdout);
      } catch {
        parsed = null;
      }
    }

    let outputStats = null;
    try {
      outputStats = await stat(outputPath);
    } catch {
      outputStats = null;
    }

    if (result.code !== 0 || !outputStats || outputStats.size === 0) {
      const errorMessage = parsed?.message ||
        result.stdout ||
        `Converter exited with code ${result.code}` ||
        'PDF to Word conversion failed. Ensure pymupdf, python-docx, Pillow, and pdfplumber are installed: pip install pymupdf python-docx Pillow pdfplumber pdf2docx';

      // Filter stderr to only show actual errors (not warnings)
      let errorDetails = '';
      if (result.stderr) {
        const errorLines = result.stderr.split('\n').filter(line =>
          line.includes('ERROR') || line.includes('Traceback') || line.includes('Exception')
        );
        if (errorLines.length > 0) {
          errorDetails = errorLines.join('\n');
        }
      }

      console.error('[PDF-to-Word] Conversion failed:', {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
        outputExists: !!outputStats,
        outputSize: outputStats?.size || 0,
      });

      return buildJsonResponse(errorMessage + (errorDetails ? '\n' + errorDetails : ''), 500);
    }

    const outputBytes = await readFile(outputPath);
    const downloadName = `${sanitizeBaseName(fileName)}-converted.docx`;

    return new Response(new Uint8Array(outputBytes), {
      status: 200,
      headers: {
        'Content-Type': DOCX_MIME,
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': String(outputBytes.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[PDF-to-Word] Unexpected error:', error);
    return buildJsonResponse(error.message || 'PDF to Word conversion failed unexpectedly.', 500);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
