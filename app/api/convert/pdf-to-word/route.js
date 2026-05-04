import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { access, mkdir, readFile, rm, stat, writeFile } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const ENHANCED_CONVERTER_SCRIPT = path.join(process.cwd(), 'backend', 'pdf_to_word_enhanced.py');
const TABLE_FALLBACK_CONVERTER_SCRIPT = path.join(process.cwd(), 'backend', 'pdf_to_word_table.py');
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

function getConverterScripts(mode) {
  if (mode === 'no-ocr') {
    return [ENHANCED_CONVERTER_SCRIPT, TABLE_FALLBACK_CONVERTER_SCRIPT];
  }

  return [ENHANCED_CONVERTER_SCRIPT];
}

function getConverterLabel(scriptPath) {
  return path.basename(scriptPath, '.py');
}

function runPythonConverter(scriptPath, inputPath, outputPath, mode) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [scriptPath, inputPath, outputPath, normalizeMode(mode)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let forceKilled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, CONVERTER_TIMEOUT_MS);

    const killTimer = setTimeout(() => {
      if (!timedOut || child.exitCode !== null || child.killed) {
        return;
      }

      forceKilled = true;
      child.kill('SIGKILL');
    }, CONVERTER_TIMEOUT_MS + 5000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      clearTimeout(killTimer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      clearTimeout(killTimer);
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        timedOut,
        forceKilled,
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

    const startedAt = Date.now();
    const scripts = getConverterScripts(mode);
    const attempts = [];
    let successfulResult = null;
    let successfulStats = null;
    let successfulScript = null;

    console.log(`[PDF-to-Word] Starting ${mode} conversion for ${fileName} with ${scripts.map(getConverterLabel).join(' -> ')}`);

    for (const scriptPath of scripts) {
      try {
        await access(scriptPath);
      } catch {
        continue;
      }

      await rm(outputPath, { force: true }).catch(() => {});

      const result = await runPythonConverter(scriptPath, inputPath, outputPath, mode);

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

      attempts.push({
        script: getConverterLabel(scriptPath),
        result,
        parsed,
        outputStats,
      });

      console.log('[PDF-to-Word] Converter attempt finished:', {
        fileName,
        mode,
        script: getConverterLabel(scriptPath),
        code: result.code,
        timedOut: result.timedOut,
        forceKilled: result.forceKilled,
        outputSize: outputStats?.size || 0,
        elapsedMs: Date.now() - startedAt,
      });

      if (!result.timedOut && result.code === 0 && outputStats && outputStats.size > 0) {
        successfulResult = { result, parsed };
        successfulStats = outputStats;
        successfulScript = scriptPath;
        break;
      }
    }

    if (!successfulResult || !successfulStats) {
      const timedOutAttempt = attempts.find((attempt) => attempt.result.timedOut);
      if (timedOutAttempt) {
        return buildJsonResponse('PDF to Word conversion timed out before the converter could finish. Increase PDF_TO_WORD_TIMEOUT_MS for very large PDFs or try a smaller file.', 504);
      }

      const lastAttempt = attempts[attempts.length - 1];
      const stderr = lastAttempt?.result?.stderr || '';
      const stdout = lastAttempt?.result?.stdout || '';

      // Surface encryption / password errors clearly
      const allOutput = (stderr + ' ' + stdout).toLowerCase();
      if (allOutput.includes('encrypted') || allOutput.includes('password') || allOutput.includes('document closed')) {
        return buildJsonResponse('This PDF is password-protected or encrypted. Please remove the password first using the Unlock PDF tool.', 400);
      }

      const errorMessage =
        lastAttempt?.parsed?.message ||
        `Converter exited with code ${lastAttempt?.result?.code ?? 'unknown'}. Ensure pymupdf, python-docx, Pillow, and pdfplumber are installed.`;

      let errorDetails = '';
      if (stderr) {
        const errorLines = stderr.split('\n').filter((line) =>
          line.includes('ERROR') || line.includes('Traceback') || line.includes('Exception')
        );
        if (errorLines.length > 0) {
          errorDetails = errorLines.slice(0, 3).join('\n');
        }
      }

      console.error('[PDF-to-Word] Conversion failed after all attempts:', attempts.map((attempt) => ({
        script: attempt.script,
        code: attempt.result.code,
        timedOut: attempt.result.timedOut,
        outputSize: attempt.outputStats?.size || 0,
      })));

      return buildJsonResponse(errorMessage + (errorDetails ? '\n' + errorDetails : ''), 500);
    }

    const outputBytes = await readFile(outputPath);
    const downloadName = `${sanitizeBaseName(fileName)}-converted.docx`;

    console.log('[PDF-to-Word] Conversion succeeded:', {
      fileName,
      mode,
      script: getConverterLabel(successfulScript),
      outputSize: successfulStats.size,
      elapsedMs: Date.now() - startedAt,
    });

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
