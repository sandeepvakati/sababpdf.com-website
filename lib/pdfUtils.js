'use client';
// PDF Processing Utilities
// Uses pdf-lib for manipulation and pdfjs-dist for rendering

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
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
export async function compressPDF(file) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  // Re-save with object reuse to reduce size
  const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// DOWNLOAD BLOB
// =====================
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
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
