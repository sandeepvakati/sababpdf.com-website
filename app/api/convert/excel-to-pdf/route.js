import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PDF_MIME = 'application/pdf';
const WORK_ROOT = path.join(os.tmpdir(), 'sababpdf-excel-to-pdf');

// ─── Find LibreOffice binary ───
function findLibreOfficeBin() {
  if (process.env.LIBREOFFICE_BIN) return process.env.LIBREOFFICE_BIN;

  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return 'soffice';
  }

  const linuxCandidates = [
    '/usr/bin/libreoffice',
    '/usr/bin/libreoffice26.2',
    '/usr/bin/libreoffice25.8',
    '/usr/bin/soffice',
  ];
  for (const c of linuxCandidates) {
    if (fs.existsSync(c)) return c;
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

/**
 * Convert a Windows/POSIX path to a proper file:/// URL for LibreOffice.
 * Handles drive letters and spaces correctly.
 */
function pathToFileUrl(filePath) {
  // Normalize to forward slashes
  let normalized = filePath.replace(/\\/g, '/');
  // On Windows, ensure the path starts with /
  if (process.platform === 'win32' && /^[A-Za-z]:/.test(normalized)) {
    normalized = '/' + normalized;
  }
  // Encode spaces and special characters (but not slashes or colons)
  normalized = normalized.replace(/ /g, '%20');
  return `file://${normalized}`;
}

// ─── Run LibreOffice using spawn for better error handling ───
function runLibreOffice(inputPath, outputDir) {
  return new Promise((resolve) => {
    // Create a private user-profile dir so LibreOffice doesn't collide
    // with any running desktop instance on the same machine.
    const profileDir = path.join(outputDir, '.libreoffice-profile');
    const profileUrl = pathToFileUrl(profileDir);

    const args = [
      `-env:UserInstallation=${profileUrl}`,
      '--headless',
      '--norestore',
      '--nolockcheck',
      '--convert-to', 'pdf',
      '--outdir', outputDir,
      inputPath,
    ];

    console.log('[Excel-to-PDF] Running:', LIBREOFFICE_BIN);
    console.log('[Excel-to-PDF] Args:', args.join(' '));

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(LIBREOFFICE_BIN, args, {
      windowsHide: true,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Timeout handler
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, CONVERTER_TIMEOUT_MS);

    child.on('error', (error) => {
      clearTimeout(timer);
      console.error('[Excel-to-PDF] Spawn error:', error.message);
      resolve({
        code: -1,
        stdout: stdout.trim(),
        stderr: `Spawn error: ${error.message}`,
        timedOut: false,
        spawnError: true,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code: timedOut ? -1 : (code ?? 1),
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        timedOut,
        spawnError: false,
      });
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
    const validExts = ['.xls', '.xlsx', '.csv', '.ods'];
    const fileExt = '.' + fileName.split('.').pop().toLowerCase();
    if (!validExts.includes(fileExt)) {
      return buildJsonResponse('Please upload an Excel file (.xls, .xlsx, .csv, or .ods).', 400);
    }

    await mkdir(workDir, { recursive: true });

    // Use a simple alphanumeric name to avoid any path issues
    const safeInputName = `input${fileExt}`;
    const inputPath = path.join(workDir, safeInputName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, fileBuffer);

    console.log('[Excel-to-PDF] Input file written:', inputPath, `(${fileBuffer.length} bytes)`);

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

    // Check for spawn errors (binary not found)
    if (result.spawnError) {
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

    // Find the output PDF – look for any .pdf in the work directory
    let outputPath = null;
    let outputStats = null;

    try {
      const dirFiles = await readdir(workDir);
      console.log('[Excel-to-PDF] Work dir contents after conversion:', dirFiles);

      // First try the expected name (input.pdf)
      const expectedName = safeInputName.replace(/\.[^.]+$/, '.pdf');
      if (dirFiles.includes(expectedName)) {
        outputPath = path.join(workDir, expectedName);
        outputStats = await stat(outputPath);
      }

      // If not found, scan for any .pdf file
      if (!outputStats || outputStats.size === 0) {
        const pdfFile = dirFiles.find((f) => f.toLowerCase().endsWith('.pdf'));
        if (pdfFile) {
          outputPath = path.join(workDir, pdfFile);
          outputStats = await stat(outputPath);
        }
      }
    } catch (scanError) {
      console.error('[Excel-to-PDF] Error scanning output dir:', scanError.message);
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
      } else if (/locked|lock file/i.test(errorDetail)) {
        userMessage = 'LibreOffice detected a lock conflict. Please try again in a moment.';
      }

      console.error('[Excel-to-PDF] Conversion error:', errorDetail);
      console.error('[Excel-to-PDF] Exit code:', result.code);
      console.error('[Excel-to-PDF] LibreOffice stdout:', result.stdout);
      console.error('[Excel-to-PDF] LibreOffice stderr:', result.stderr);

      return buildJsonResponse(userMessage, 500);
    }

    const outputBytes = await readFile(outputPath);
    const downloadName = `${sanitizeBaseName(fileName)}.pdf`;

    console.log('[Excel-to-PDF] Conversion successful. Output size:', outputBytes.length, 'bytes');

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
