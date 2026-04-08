import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { access, mkdir, readFile, rm, stat, writeFile } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PDF_MIME = 'application/pdf';
const WORK_ROOT = path.join(os.tmpdir(), 'sababpdf-excel-to-pdf');

// Find LibreOffice binary
function findLibreOfficeBin() {
  if (process.env.LIBREOFFICE_BIN) return process.env.LIBREOFFICE_BIN;

  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return `"${candidate}"`;
    }
    return 'soffice';
  }

  const linuxCandidates = [
    '/usr/bin/libreoffice',
    '/usr/bin/libreoffice26.2',
    '/usr/bin/libreoffice25.8',
    '/usr/bin/soffice',
  ];
  for (const candidate of linuxCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'libreoffice';
}

const LIBREOFFICE_BIN = findLibreOfficeBin();

const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const CONFIGURED_TIMEOUT_MS = Number(process.env.EXCEL_TO_PDF_TIMEOUT_MS);
const CONVERTER_TIMEOUT_MS =
  Number.isFinite(CONFIGURED_TIMEOUT_MS) && CONFIGURED_TIMEOUT_MS > 0
    ? CONFIGURED_TIMEOUT_MS
    : DEFAULT_TIMEOUT_MS;

function sanitizeBaseName(filename) {
  return (filename || 'spreadsheet')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9\-_ ]+/g, '')
    .trim() || 'spreadsheet';
}

function buildJsonResponse(message, status) {
  return Response.json({ error: message }, { status });
}

function runLibreOffice(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const args = ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, inputPath];

    // On Windows the binary may be a quoted path, so use shell mode
    const useShell = process.platform === 'win32';

    const child = spawn(LIBREOFFICE_BIN, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: useShell,
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
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim(), timedOut });
    });
  });
}

export async function POST(request) {
  const workDir = path.join(WORK_ROOT, randomUUID());

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return buildJsonResponse('No Excel file was uploaded.', 400);
    }

    const fileName = file.name || 'spreadsheet.xlsx';
    const validExts = ['.xls', '.xlsx'];
    const fileExt = '.' + fileName.split('.').pop().toLowerCase();
    if (!validExts.includes(fileExt)) {
      return buildJsonResponse('Please upload an Excel file (.xls or .xlsx).', 400);
    }

    await mkdir(workDir, { recursive: true });

    const inputPath = path.join(workDir, `${randomUUID()}${fileExt}`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(inputPath, fileBuffer);

    // Run LibreOffice conversion
    let result;
    try {
      result = await runLibreOffice(inputPath, workDir);
    } catch (error) {
      console.error('[Excel-to-PDF] LibreOffice spawn error:', error.message);
      return buildJsonResponse(
        'LibreOffice is not installed or could not be found. Please install LibreOffice to use this feature.',
        500,
      );
    }

    if (result.timedOut) {
      return buildJsonResponse(
        'Excel to PDF conversion timed out. Please try a smaller spreadsheet.',
        504,
      );
    }

    // Find the output PDF – LibreOffice uses the input basename with .pdf extension
    const inputBaseName = path.basename(inputPath, fileExt);
    const outputPath = path.join(workDir, `${inputBaseName}.pdf`);

    let outputStats = null;
    try {
      outputStats = await stat(outputPath);
    } catch {
      outputStats = null;
    }

    if (result.code !== 0 || !outputStats || outputStats.size === 0) {
      const errorDetail = result.stderr || result.stdout || '';

      let userMessage = 'Excel to PDF conversion failed.';

      if (/not found|cannot find|command not found/i.test(errorDetail)) {
        userMessage =
          'LibreOffice is not installed on the server. Please install LibreOffice to convert Excel files.';
      } else if (/access denied|permission/i.test(errorDetail)) {
        userMessage = 'Permission error during conversion. Please try again.';
      } else if (/source file could not be loaded|general input\/output error/i.test(errorDetail)) {
        userMessage = 'LibreOffice could not open this spreadsheet. Re-save it as .xlsx and try again.';
      }

      console.error('[Excel-to-PDF] Conversion error:', errorDetail);
      return buildJsonResponse(userMessage, 500);
    }

    const outputBytes = await readFile(outputPath);
    const downloadName = `${sanitizeBaseName(fileName)}.pdf`;

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
    console.error('[Excel-to-PDF] Unexpected error:', error.message);
    return buildJsonResponse(`Conversion failed: ${error.message}`, 500);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
