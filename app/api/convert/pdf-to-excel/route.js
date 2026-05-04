import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const WORK_ROOT = path.join(os.tmpdir(), 'sababpdf-pdf-to-excel');
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const CONFIGURED_TIMEOUT_MS = Number(process.env.PDF_TO_EXCEL_TIMEOUT_MS);
const CONVERTER_TIMEOUT_MS = Number.isFinite(CONFIGURED_TIMEOUT_MS) && CONFIGURED_TIMEOUT_MS > 0
  ? CONFIGURED_TIMEOUT_MS
  : DEFAULT_TIMEOUT_MS;

function sanitizeBaseName(filename) {
  return (filename || 'document')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_ ]+/g, '')
    .trim() || 'document';
}

function buildJsonResponse(message, status) {
  return Response.json({ error: message }, { status });
}

function normalizePythonError(stderr, stdout) {
  const cleanedLines = `${stderr || ''}\n${stdout || ''}`
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== 'Data-loss while decompressing corrupted data');

  const combined = cleanedLines.join('\n');

  if (/No tables were detected in this PDF/i.test(combined)) {
    return combined;
  }

  if (/pandas is not installed/i.test(combined)) {
    return 'PDF to Excel needs Python packages that are not installed yet. Run `pip install pandas openpyxl pdfplumber` and try again.';
  }

  if (/No module named/i.test(combined)) {
    return `PDF to Excel is missing a Python dependency. ${combined}`;
  }

  return combined || 'PDF to Excel conversion failed. Install pandas, openpyxl, and pdfplumber for table extraction.';
}

function runPythonConverter(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const pythonCode = `
import importlib.util
import shutil
import sys

input_path = sys.argv[1]
output_path = sys.argv[2]

if importlib.util.find_spec("pandas") is None:
    sys.stderr.write("pandas is not installed. Install it with: pip install pandas openpyxl\\n")
    sys.exit(6)

import pandas as pd

usable_tables = []
tabula_error = ""
pdfplumber_error = ""

def add_dataframe_tables(candidate_tables):
    if candidate_tables is None:
        return
    if hasattr(candidate_tables, "empty"):
        candidate_tables = [candidate_tables]
    for table in candidate_tables:
        if table is None or getattr(table, "empty", False):
            continue
        if getattr(table, "shape", (0, 0))[0] == 0 or getattr(table, "shape", (0, 0))[1] == 0:
            continue
        usable_tables.append({"kind": "dataframe", "value": table.copy()})

def normalize_rows(rows):
    cleaned_rows = []
    width = 0
    for row in rows or []:
        if row is None:
            continue
        normalized = []
        for cell in row:
            if cell is None:
                normalized.append("")
            elif isinstance(cell, str):
                normalized.append(cell.strip())
            else:
                normalized.append(cell)
        if any(cell not in ("", None) for cell in normalized):
            cleaned_rows.append(normalized)
            width = max(width, len(normalized))
    if not cleaned_rows or width == 0:
        return None
    return [row + [""] * (width - len(row)) for row in cleaned_rows]

tabula_spec = importlib.util.find_spec("tabula")
if tabula_spec is not None and shutil.which("java") is not None:
    import tabula

    for options in (
        {"pages": "all", "multiple_tables": True, "lattice": True},
        {"pages": "all", "multiple_tables": True, "stream": True},
        {"pages": "all", "multiple_tables": True, "stream": True, "guess": False},
    ):
        try:
            add_dataframe_tables(tabula.read_pdf(input_path, **options))
            if usable_tables:
                break
        except Exception as exc:
            tabula_error = str(exc)
elif tabula_spec is None:
    tabula_error = "tabula-py is not installed."
else:
    tabula_error = "Java is not installed."

pdfplumber_spec = importlib.util.find_spec("pdfplumber")
if not usable_tables and pdfplumber_spec is not None:
    import pdfplumber

    extraction_settings = [
        None,
        {"vertical_strategy": "lines", "horizontal_strategy": "lines", "intersection_tolerance": 5},
        {"vertical_strategy": "text", "horizontal_strategy": "text", "snap_tolerance": 3, "join_tolerance": 3},
    ]

    try:
        with pdfplumber.open(input_path) as pdf:
            for settings in extraction_settings:
                row_tables = []
                for page in pdf.pages:
                    tables = page.extract_tables(table_settings=settings) if settings else page.extract_tables()
                    for raw_table in tables or []:
                        normalized_rows = normalize_rows(raw_table)
                        if normalized_rows:
                            row_tables.append(normalized_rows)
                if row_tables:
                    usable_tables.extend({"kind": "rows", "value": rows} for rows in row_tables)
                    break
    except Exception as exc:
        pdfplumber_error = str(exc)
elif pdfplumber_spec is None:
    pdfplumber_error = "pdfplumber is not installed."

if not usable_tables:
    details = " ".join(
        part for part in (
            f"tabula: {tabula_error}" if tabula_error else "",
            f"pdfplumber: {pdfplumber_error}" if pdfplumber_error else "",
        ) if part
    ).strip()
    if details:
        sys.stderr.write(f"No tables were detected in this PDF. {details}")
    else:
        sys.stderr.write("No tables were detected in this PDF.")
    sys.exit(5)

try:
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        for index, table in enumerate(usable_tables, start=1):
            sheet_name = f"Table {index}"[:31]
            if table["kind"] == "dataframe":
                table["value"].to_excel(writer, sheet_name=sheet_name, index=False)
            else:
                pd.DataFrame(table["value"]).to_excel(writer, sheet_name=sheet_name, index=False, header=False)
except Exception as exc:
    sys.stderr.write(str(exc))
    sys.exit(4)
`;

    const child = spawn(PYTHON_BIN, ['-c', pythonCode, inputPath, outputPath], {
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
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return buildJsonResponse('No PDF file was uploaded.', 400);
    }

    const fileName = file.name || 'document.pdf';
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return buildJsonResponse('Upload a PDF file for PDF to Excel conversion.', 400);
    }

    await mkdir(workDir, { recursive: true });

    const inputPath = path.join(workDir, `${randomUUID()}.pdf`);
    const outputPath = path.join(workDir, `${sanitizeBaseName(fileName)}-converted.xlsx`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(inputPath, fileBuffer);

    let result;
    try {
      result = await runPythonConverter(inputPath, outputPath);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return buildJsonResponse('Python was not found on this machine. Install Python or set the `PYTHON_BIN` environment variable, then try again.', 500);
      }

      throw error;
    }

    if (result.timedOut) {
      return buildJsonResponse('PDF to Excel conversion timed out. Try a smaller PDF or one with fewer tables.', 504);
    }

    let outputStats = null;
    try {
      outputStats = await stat(outputPath);
    } catch {
      outputStats = null;
    }

    if (result.code !== 0 || !outputStats || outputStats.size === 0) {
      const errorMessage = normalizePythonError(result.stderr, result.stdout);

      return buildJsonResponse(errorMessage, 500);
    }

    const outputBytes = await readFile(outputPath);
    const downloadName = `${sanitizeBaseName(fileName)}.xlsx`;

    return new Response(new Uint8Array(outputBytes), {
      status: 200,
      headers: {
        'Content-Type': XLSX_MIME,
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': String(outputBytes.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[PDF-to-Excel] Unexpected error:', error);
    return buildJsonResponse(error.message || 'PDF to Excel conversion failed unexpectedly.', 500);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
