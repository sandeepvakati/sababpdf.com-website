import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PDF_MIME  = 'application/pdf';
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const CONVERTER_SCRIPT = path.join(process.cwd(), 'backend', 'word_to_pdf_converter.py');
const WORK_ROOT = path.join(os.tmpdir(), 'sababpdf-word-to-pdf');
const CONVERTER_TIMEOUT_MS = Number(process.env.WORD_TO_PDF_TIMEOUT_MS) > 0
  ? Number(process.env.WORD_TO_PDF_TIMEOUT_MS)
  : 5 * 60 * 1000;

// ── LibreOffice path detection ─────────────────────────────────────────────
const LO_WIN_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files\\LibreOffice 26\\program\\soffice.exe',
  'C:\\Program Files\\LibreOffice 7\\program\\soffice.exe',
  'C:\\Program Files\\LibreOffice 6\\program\\soffice.exe',
];

function findLibreOffice() {
  if (process.env.LIBREOFFICE_BIN) return process.env.LIBREOFFICE_BIN;
  if (process.platform === 'win32') {
    for (const p of LO_WIN_PATHS) {
      if (existsSync(p)) return p;
    }
    return null;
  }
  // Linux / Mac — check known fixed paths (no PATH dependency)
  for (const cmd of ['libreoffice', 'soffice']) {
    for (const prefix of ['/usr/bin', '/usr/local/bin', '/opt/libreoffice/program']) {
      const full = `${prefix}/${cmd}`;
      if (existsSync(full)) return full;
    }
  }
  return null;
}

// Detect once at module load time (sync, no PATH dependency)
const LO_BIN = findLibreOffice();

console.log('[Word-to-PDF] LibreOffice binary:', LO_BIN || 'NOT FOUND');

// ── Helpers ────────────────────────────────────────────────────────────────
function sanitizeBaseName(filename) {
  return (filename || 'document')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_ ]+/g, '')
    .trim() || 'document';
}

function buildJsonResponse(message, status) {
  return Response.json({ error: message }, { status });
}

/** Run python word_to_pdf_converter.py */
function runPythonConverter(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [CONVERTER_SCRIPT, inputPath, outputPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '', stderr = '', timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, CONVERTER_TIMEOUT_MS);

    child.stdout.on('data', (c) => { stdout += c.toString(); });
    child.stderr.on('data', (c) => { stderr += c.toString(); });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim(), timedOut });
    });
  });
}

/** Run LibreOffice directly (bypasses Python) */
function runLibreOfficeDirect(loBin, inputPath, outputDir) {
  return new Promise((resolve) => {
    const child = spawn(loBin, [
      '--headless',
      '--norestore',
      '--convert-to', 'pdf:writer_pdf_Export',
      '--outdir', outputDir,
      inputPath,
    ], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });

    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ success: false, reason: 'LibreOffice timed out.' });
    }, CONVERTER_TIMEOUT_MS);

    child.stderr.on('data', (c) => { stderr += c.toString(); });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ success: code === 0, reason: stderr.trim() });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ success: false, reason: e.message });
    });
  });
}

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(request) {
  // Early check — if LibreOffice is definitely missing, refuse immediately
  if (!LO_BIN) {
    return buildJsonResponse(
      'Word to PDF conversion requires LibreOffice. ' +
      'Please install it from https://www.libreoffice.org/download/ and restart the server. ' +
      'If LibreOffice is already installed in a non-standard location, set the LIBREOFFICE_BIN environment variable.',
      503
    );
  }

  const workDir = path.join(WORK_ROOT, randomUUID());

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) return buildJsonResponse('No Word file was uploaded.', 400);

    const fileName = file.name || 'document.docx';
    const fileExt  = '.' + fileName.split('.').pop().toLowerCase();
    if (!['.doc', '.docx'].includes(fileExt)) {
      return buildJsonResponse('Please upload a Word document (.doc or .docx).', 400);
    }

    await mkdir(workDir, { recursive: true });

    const inputPath  = path.join(workDir, `input${fileExt}`);
    const baseName   = sanitizeBaseName(fileName);
    const outputPath = path.join(workDir, `${baseName}-converted.pdf`);

    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

    const startedAt = Date.now();

    // ── STRATEGY 1: Python script (uses find_libreoffice() internally) ──
    let pyOk = false;
    try {
      if (existsSync(CONVERTER_SCRIPT)) {
        const pyResult = await runPythonConverter(inputPath, outputPath);
        if (!pyResult.timedOut && pyResult.code === 0) {
          try {
            const s = await stat(outputPath);
            if (s.size > 0) pyOk = true;
          } catch { /* not created */ }
        }
        if (!pyOk) {
          console.warn('[Word-to-PDF] Python script failed:', pyResult.stdout || pyResult.stderr);
        }
      }
    } catch (e) {
      console.warn('[Word-to-PDF] Python spawn error:', e.message);
    }

    if (pyOk) {
      console.log('[Word-to-PDF] Python converter succeeded in', Date.now() - startedAt, 'ms');
      const bytes = await readFile(outputPath);
      return successResponse(bytes, baseName);
    }

    // ── STRATEGY 2: LibreOffice direct call ──
    console.log('[Word-to-PDF] Trying LibreOffice direct:', LO_BIN);
    const loResult = await runLibreOfficeDirect(LO_BIN, inputPath, workDir);

    if (loResult.success) {
      // LO names the PDF after the input file's basename (without extension)
      const inputBase = path.basename(inputPath, fileExt);   // "input"
      const loPdf     = path.join(workDir, `${inputBase}.pdf`);

      // Move LO's output to our expected outputPath if they differ
      try {
        if (loPdf !== outputPath) {
          const s = await stat(loPdf);
          if (s.size > 0) await writeFile(outputPath, await readFile(loPdf));
        }
      } catch { /* might already be at outputPath */ }

      try {
        const s = await stat(outputPath);
        if (s.size > 0) {
          console.log('[Word-to-PDF] LibreOffice direct succeeded in', Date.now() - startedAt, 'ms');
          const bytes = await readFile(outputPath);
          return successResponse(bytes, baseName);
        }
      } catch { /* fall through */ }
    }

    console.error('[Word-to-PDF] Both strategies failed. LO reason:', loResult.reason);
    return buildJsonResponse(
      `Conversion failed: LibreOffice ran but did not produce a PDF. ` +
      (loResult.reason ? loResult.reason.split('\n')[0] : 'Unknown error.'),
      500
    );

  } catch (error) {
    console.error('[Word-to-PDF] Unexpected error:', error.message);
    return buildJsonResponse(`Conversion failed: ${error.message}`, 500);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

function successResponse(bytes, baseName) {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': PDF_MIME,
      'Content-Disposition': `attachment; filename="${baseName}-converted.pdf"`,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'no-store',
    },
  });
}
