export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { access, mkdir, readFile, rm, stat, writeFile } from 'fs/promises';

const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const PROTECT_SCRIPT = path.join(process.cwd(), 'backend', 'protect_pdf.py');
const WORK_ROOT = path.join(os.tmpdir(), 'sababpdf-protect-pdf');

function buildJsonResponse(message, status) {
  return Response.json({ error: message }, { status });
}

function runPythonProtector(inputPath, outputPath, password) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [PROTECT_SCRIPT, inputPath, outputPath, password], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

export async function POST(request) {
  const workDir = path.join(WORK_ROOT, randomUUID());

  try {
    try {
      await access(PROTECT_SCRIPT);
    } catch {
      return buildJsonResponse('Protect PDF script was not found in the project.', 500);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const password = formData.get('password');

    if (!(file instanceof File)) {
      return buildJsonResponse('No PDF file was uploaded.', 400);
    }
    if (!password) {
      return buildJsonResponse('No password provided.', 400);
    }

    const fileName = file.name || 'document.pdf';
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return buildJsonResponse('Upload a PDF file to protect.', 400);
    }

    await mkdir(workDir, { recursive: true });

    const inputPath = path.join(workDir, `${randomUUID()}.pdf`);
    const outputPath = path.join(workDir, `protected.pdf`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(inputPath, fileBuffer);

    const result = await runPythonProtector(inputPath, outputPath, password);

    if (result.code !== 0) {
      const errorMessage = result.stderr || 'Failed to protect PDF. Ensure pymupdf is installed.';
      return buildJsonResponse(errorMessage, 500);
    }

    const outputBytes = await readFile(outputPath);

    return new Response(new Uint8Array(outputBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protected_${fileName}"`,
        'Content-Length': String(outputBytes.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Protect PDF Error:', error);
    return buildJsonResponse(error.message || 'Protect PDF failed unexpectedly.', 500);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
