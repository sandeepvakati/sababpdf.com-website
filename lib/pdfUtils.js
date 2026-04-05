'use client';
// PDF Processing Utilities
// Uses pdf-lib for manipulation and pdfjs-dist for rendering

let pdfjsModulePromise;

async function loadPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import('pdfjs-dist').then((pdfjsLib) => {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }
      return pdfjsLib;
    });
  }

  return pdfjsModulePromise;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

async function renderCompressedPdf(sourceData, { scale = 0.92, quality = 0.72 } = {}) {
  const pdfjsLib = await loadPdfJs();
  const { PDFDocument } = await import('pdf-lib');
  const sourcePdf = await pdfjsLib.getDocument({ data: sourceData }).promise;
  const compressedPdf = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
    const page = await sourcePdf.getPage(pageNumber);
    const outputViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });

    if (!context) {
      throw new Error('Could not prepare a canvas for PDF compression.');
    }

    canvas.width = Math.max(1, Math.ceil(renderViewport.width));
    canvas.height = Math.max(1, Math.ceil(renderViewport.height));
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: renderViewport,
    }).promise;

    const imageBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('The browser could not generate the compressed page image.'));
            return;
          }

          resolve(blob);
        },
        'image/jpeg',
        quality,
      );
    });

    const imageBytes = await imageBlob.arrayBuffer();
    const image = await compressedPdf.embedJpg(imageBytes);
    const compressedPage = compressedPdf.addPage([outputViewport.width, outputViewport.height]);
    compressedPage.drawImage(image, {
      x: 0,
      y: 0,
      width: outputViewport.width,
      height: outputViewport.height,
    });

    page.cleanup();
  }

  const bytes = await compressedPdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 25,
  });

  if (typeof sourcePdf.destroy === 'function') {
    await sourcePdf.destroy();
  }

  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// MERGE PDFs
// =====================
export async function mergePDFs(files) {
  const { PDFDocument } = await import('pdf-lib');
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }

  const bytes = await mergedPdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// SPLIT PDF
// =====================
export async function splitPDF(file, ranges) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(buffer);
  const results = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const pageIndices = range.map(n => n - 1).filter(i => i >= 0 && i < srcPdf.getPageCount());
    const pages = await newPdf.copyPages(srcPdf, pageIndices);
    pages.forEach(p => newPdf.addPage(p));
    const bytes = await newPdf.save();
    results.push(new Blob([bytes], { type: 'application/pdf' }));
  }

  return results;
}

// =====================
// SPLIT PDF into individual pages
// =====================
export async function splitPDFAllPages(file) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(buffer);
  const count = srcPdf.getPageCount();
  const results = [];

  for (let i = 0; i < count; i++) {
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(srcPdf, [i]);
    newPdf.addPage(page);
    const bytes = await newPdf.save();
    results.push({ blob: new Blob([bytes], { type: 'application/pdf' }), name: `page_${i + 1}.pdf` });
  }

  return results;
}

// =====================
// ROTATE PDF
// =====================
export async function rotatePDF(file, rotation = 90, pageIndices = null) {
  const { PDFDocument, degrees } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer);
  const pages = pdf.getPages();
  const targets = pageIndices || pages.map((_, i) => i);

  targets.forEach(i => {
    const page = pages[i];
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotation) % 360));
  });

  const bytes = await pdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// DELETE PAGES
// =====================
export async function deletePages(file, pageIndicesToDelete) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(buffer);
  const newPdf = await PDFDocument.create();
  const totalPages = srcPdf.getPageCount();
  const keepIndices = [];

  for (let i = 0; i < totalPages; i++) {
    if (!pageIndicesToDelete.includes(i)) {
      keepIndices.push(i);
    }
  }

  const pages = await newPdf.copyPages(srcPdf, keepIndices);
  pages.forEach(p => newPdf.addPage(p));

  const bytes = await newPdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// EXTRACT PAGES
// =====================
export async function extractPages(file, pageRange, onProgress) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(buffer);
  const newPdf = await PDFDocument.create();
  const totalPages = srcPdf.getPageCount();

  // Parse page range string (e.g., "1-3, 5, 7-9")
  const pageIndices = new Set();
  const ranges = pageRange.split(',').map(r => r.trim()).filter(r => r);

  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages) {
        for (let i = start; i <= end; i++) {
          pageIndices.add(i - 1); // Convert to 0-indexed
        }
      }
    } else {
      const pageNum = parseInt(range, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pageIndices.add(pageNum - 1); // Convert to 0-indexed
      }
    }
  }

  if (pageIndices.size === 0) {
    throw new Error('No valid pages specified');
  }

  // Sort page indices
  const sortedIndices = Array.from(pageIndices).sort((a, b) => a - b);

  // Copy selected pages
  const pages = await newPdf.copyPages(srcPdf, sortedIndices);
  pages.forEach((p, i) => {
    newPdf.addPage(p);
    if (onProgress) {
      onProgress(Math.min(90, Math.round(((i + 1) / sortedIndices.length) * 90)));
    }
  });

  const bytes = await newPdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// REORDER PAGES
// =====================
export async function reorderPages(file, newOrder) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(buffer);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(srcPdf, newOrder);
  pages.forEach(p => newPdf.addPage(p));
  const bytes = await newPdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// ADD WATERMARK
// =====================
export async function addWatermark(file, { text = 'WATERMARK', opacity = 0.3, color = '#808080', fontSize = 60, rotation = -45 }) {
  const { PDFDocument, rgb, degrees, StandardFonts } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  // Parse hex color
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - (font.widthOfTextAtSize(text, fontSize) / 2),
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(rotation),
    });
  }

  const bytes = await pdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// ADD PAGE NUMBERS
// =====================
export async function addPageNumbers(file, { position = 'bottom-center', startFrom = 1, fontSize = 11, prefix = '', suffix = '' }) {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const margin = 30;

  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const pageNum = `${prefix}${idx + startFrom}${suffix}`;
    const textWidth = font.widthOfTextAtSize(pageNum, fontSize);
    let x, y;

    switch (position) {
      case 'top-left':    x = margin; y = height - margin; break;
      case 'top-center':  x = (width - textWidth) / 2; y = height - margin; break;
      case 'top-right':   x = width - textWidth - margin; y = height - margin; break;
      case 'bottom-left': x = margin; y = margin; break;
      case 'bottom-right':x = width - textWidth - margin; y = margin; break;
      default:            x = (width - textWidth) / 2; y = margin;
    }

    page.drawText(pageNum, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
  });

  const bytes = await pdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// PROTECT PDF (Password)
// =====================
export async function protectPDF(file, password) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer);
  // pdf-lib doesn't support AES encryption, show note
  // For now, save as-is (server-side needed for real encryption)
  const bytes = await pdf.save({ userPassword: password, ownerPassword: password + '_owner' });
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// JPG / IMAGE TO PDF
// =====================
export async function imagesToPDF(files) {
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const mime = file.type;
    let img;

    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      img = await pdf.embedJpg(bytes);
    } else if (mime === 'image/png') {
      img = await pdf.embedPng(bytes);
    } else {
      // Convert other formats via canvas
      img = await embedImageViaCanvas(pdf, file);
    }

    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }

  const resultBytes = await pdf.save();
  return new Blob([resultBytes], { type: 'application/pdf' });
}

async function embedImageViaCanvas(pdf, file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        const buf = await blob.arrayBuffer();
        const embedded = await pdf.embedJpg(new Uint8Array(buf));
        URL.revokeObjectURL(url);
        resolve(embedded);
      }, 'image/jpeg', 0.92);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// =====================
// PDF TO JPG (using pdfjs-dist)
// =====================
export async function pdfToImages(file, scale = 2.0) {
  const pdfjsLib = await loadPdfJs();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const images = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    await new Promise(res => {
      canvas.toBlob(blob => {
        images.push({ blob, name: `page_${i}.jpg` });
        res();
      }, 'image/jpeg', 0.92);
    });
  }

  return images;
}

export async function getPdfPreviewData(file, previewWidth = 180) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = previewWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });

  if (!context) {
    throw new Error('Could not render a PDF preview in this browser.');
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const previewUrl = canvas.toDataURL('image/jpeg', 0.88);
  page.cleanup();
  if (typeof pdf.destroy === 'function') {
    await pdf.destroy();
  }

  return {
    previewUrl,
    pageCount: pdf.numPages,
  };
}

export async function getPdfPagePreviews(file, pageNumbers = [], previewWidth = 140) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const totalPages = pdf.numPages;
  const targets = pageNumbers.length
    ? Array.from(new Set(pageNumbers)).filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    : Array.from({ length: Math.min(totalPages, 6) }, (_, index) => index + 1);
  const pages = [];

  for (const pageNumber of targets) {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = previewWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });

    if (!context) {
      throw new Error('Could not render page previews in this browser.');
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    pages.push({
      pageNumber,
      previewUrl: canvas.toDataURL('image/jpeg', 0.86),
    });

    page.cleanup();
  }

  if (typeof pdf.destroy === 'function') {
    await pdf.destroy();
  }

  return {
    pageCount: totalPages,
    pages,
  };
}

// =====================
// SVG TO JPG
// =====================
export async function svgToJpg(file, { quality = 0.92, scale = 2, background = '#ffffff' } = {}) {
  const svgText = await file.text();

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));

    img.onload = () => {
      const sourceWidth = Math.max(1, Math.round(img.naturalWidth || img.width || 1200));
      const sourceHeight = Math.max(1, Math.round(img.naturalHeight || img.height || 1200));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not prepare a canvas for SVG conversion.'));
        return;
      }

      canvas.width = sourceWidth * scale;
      canvas.height = sourceHeight * scale;
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error('The browser could not convert this SVG file to JPG.'));
            return;
          }

          resolve(blob);
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The SVG file could not be loaded. Check that it is a valid SVG image.'));
    };

    img.src = url;
  });
}

// =====================
// GET PDF PAGE COUNT
// =====================
export async function getPDFPageCount(file) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer);
  return pdf.getPageCount();
}

// =====================
// COMPRESS PDF (basic optimization via pdf-lib re-save)
// =====================
export async function compressPDF(file, { strength = 55, targetBytes = null } = {}) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const baseBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
  let bestBlob = new Blob([baseBytes], { type: 'application/pdf' });
  const originalSize = file.size || buffer.byteLength;

  if (bestBlob.size > originalSize) {
    bestBlob = new Blob([buffer], { type: 'application/pdf' });
  }

  const normalizedStrength = clamp(strength / 100, 0, 1);
  let scale = clamp(1.08 - normalizedStrength * 0.46, 0.56, 1.08);
  let quality = clamp(0.9 - normalizedStrength * 0.42, 0.38, 0.9);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const candidate = await renderCompressedPdf(buffer, { scale, quality });

    if (candidate.size < bestBlob.size) {
      bestBlob = candidate;
    }

    if (targetBytes && bestBlob.size <= targetBytes) {
      break;
    }

    scale = clamp(scale - 0.12, 0.42, 1.08);
    quality = clamp(quality - 0.1, 0.26, 0.9);
  }

  return bestBlob;
}

// =====================
// DOWNLOAD BLOB
// =====================
export function downloadBlob(blob, filename, mimeType) {
  // Ensure the blob has the correct MIME type for proper file association
  const effectiveMime = mimeType || blob.type || 'application/octet-stream';
  const typedBlob = blob.type === effectiveMime ? blob : new Blob([blob], { type: effectiveMime });
  const url = URL.createObjectURL(typedBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
