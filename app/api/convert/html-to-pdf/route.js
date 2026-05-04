import { randomUUID } from 'crypto';
import puppeteer from 'puppeteer';
import os from 'os';
import path from 'path';
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PDF_MIME = 'application/pdf';
const WORK_ROOT = path.join(os.tmpdir(), 'sababpdf-html-to-pdf');

const DEFAULT_TIMEOUT_MS = 60 * 1000;
const CONFIGURED_TIMEOUT_MS = Number(process.env.HTML_TO_PDF_TIMEOUT_MS);
const CONVERTER_TIMEOUT_MS =
  Number.isFinite(CONFIGURED_TIMEOUT_MS) && CONFIGURED_TIMEOUT_MS > 0
    ? CONFIGURED_TIMEOUT_MS
    : DEFAULT_TIMEOUT_MS;

function sanitizeBaseName(filename) {
  return (filename || 'document')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9\-_ ]+/g, '')
    .trim() || 'document';
}

function buildJsonResponse(message, status) {
  return Response.json({ error: message }, { status });
}

// ─── Run Puppeteer to fetch and convert HTML to PDF perfectly ───
async function runPuppeteer(inputPath, outputDir, isUrl) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const outputPath = path.join(outputDir, 'output.pdf');

    // Set viewport to standard 1080p width to force desktop layouts on responsive sites
    await page.setViewport({ width: 1920, height: 1080 });

    if (isUrl) {
      console.log('[HTML-to-PDF] Puppeteer fetching URL:', inputPath);
      // Wait until network is mostly idle to ensure images load
      await page.goto(inputPath, { waitUntil: 'networkidle2', timeout: CONVERTER_TIMEOUT_MS });
    } else {
      console.log('[HTML-to-PDF] Puppeteer loading local file:', inputPath);
      // Local files load almost instantly
      let normalized = inputPath.replace(/\\/g, '/');
      if (process.platform === 'win32' && /^[A-Za-z]:/.test(normalized)) {
        normalized = '/' + normalized;
      }
      await page.goto(`file://${normalized}`, { waitUntil: 'networkidle0', timeout: CONVERTER_TIMEOUT_MS });
    }

    console.log('[HTML-to-PDF] Capturing PDF layout directly...');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true, // critical for standard background coloring of web pages
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    return { code: 0, outputPath, timedOut: false };
  } catch (error) {
    console.error('[HTML-to-PDF] Puppeteer core error:', error);
    return { 
      code: -1, 
      stderr: error.message, 
      timedOut: error.message.includes('Timeout') || error.message.includes('Navigation timeout')
    };
  } finally {
    if (browser) await browser.close();
  }
}

export async function POST(request) {
  const workDir = path.join(WORK_ROOT, randomUUID());

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const url = formData.get('url');

    if (!file && !url) {
      return buildJsonResponse('No HTML file or URL was provided.', 400);
    }

    await mkdir(workDir, { recursive: true });

    let inputPath;
    let fileName = 'document.html';
    let isUrl = false;

    if (url) {
      isUrl = true;
      inputPath = url;
      try {
        fileName = new URL(url).hostname.replace('www.', '') + '.html';
      } catch {
        // ignore
      }
    } else {
      fileName = file.name || 'document.html';
      const validExts = ['.html', '.htm'];
      const fileExt = '.' + fileName.split('.').pop().toLowerCase();
      if (!validExts.includes(fileExt)) {
        return buildJsonResponse('Please upload an HTML file (.html or .htm).', 400);
      }

      inputPath = path.join(workDir, `input${fileExt}`);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await writeFile(inputPath, fileBuffer);
    }

    // Run Puppeteer conversion
    let result = await runPuppeteer(inputPath, workDir, isUrl);

    if (result.timedOut) {
      return buildJsonResponse('HTML to PDF conversion timed out. Please try a simpler document or URL.', 504);
    }

    if (result.code !== 0) {
      console.error('[HTML-to-PDF] Conversion failed:', result.stderr);
      return buildJsonResponse('Failed to convert HTML string or URL to PDF reliably.', 500);
    }

    let outputPath = null;
    let outputStats = null;
    
    try {
      outputPath = result.outputPath;
      outputStats = await stat(outputPath);
    } catch {
      outputStats = null;
    }

    if (!outputStats || outputStats.size === 0) {
      return buildJsonResponse('Output PDF size is completely empty/invalid.', 500);
    }

    const outputBytes = await readFile(outputPath);
    const downloadName = `${sanitizeBaseName(fileName)}.pdf`;

    console.log('[HTML-to-PDF] Puppeteer Conversion successful. Size:', outputBytes.length, 'bytes');

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
    console.error('[HTML-to-PDF] Unexpected error:', error.message);
    return buildJsonResponse(`Conversion failed: ${error.message}`, 500);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
