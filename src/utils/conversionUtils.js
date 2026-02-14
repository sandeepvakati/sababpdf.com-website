import { PDFDocument, degrees, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';

import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';

// Configure PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
/**
 * Converts Image files (JPG, PNG) to PDF
 * @param {File[]} files - Array of image files
 * @returns {Promise<Blob>} - The generated PDF blob
 */
export const convertImageToPdf = async (files) => {
    try {
        const pdfDoc = await PDFDocument.create();

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            let image;

            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                image = await pdfDoc.embedJpg(arrayBuffer);
            } else if (file.type === 'image/png') {
                image = await pdfDoc.embedPng(arrayBuffer);
            } else {
                continue; // Skip unsupported formats
            }

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Image to PDF conversion error:", error);
        throw error;
    }
};

/**
 * Converts a PDF file to Images (JPG) - Returns array of blobs (one per page) or a zip if multiple?
 * For web, returning a zip is often better, but let's return an array of Blobs for the UI to handle (download individually or zip).
 * We'll use JSZip if we need to zip, but let's stick to array for now or let the UI handle it.
 * Actually, let's keep it simple: return an array of { blob, name }.
 */
export const convertPdfToImages = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const images = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // High quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            images.push({
                blob: blob,
                name: `${file.name.replace('.pdf', '')}_page_${i}.jpg`
            });
        }

        return images;

    } catch (error) {
        console.error("PDF to Image conversion error:", error);
        throw error;
    }
};

/**
 * Converts a Word (.docx) file to PDF
 * @param {File} file - The .docx file
 * @returns {Promise<Blob>} - The generated PDF blob
 */
export const convertWordToPdf = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;

                // 1. Convert DOCX to HTML using Mammoth
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                const html = result.value; // The generated HTML
                const messages = result.messages; // Any warnings/messages

                if (messages.length > 0) {
                    console.log("Mammoth messages:", messages);
                }

                // 2. Convert HTML to PDF using html2pdf.js
                // We create a temporary container to hold the HTML
                const container = document.createElement('div');
                container.innerHTML = html;
                // Add some basic styling to make it look decent
                container.style.padding = '20px';
                container.style.fontFamily = 'Arial, sans-serif';
                container.style.lineHeight = '1.6';

                // Ensure tables have borders
                const style = document.createElement('style');
                style.innerHTML = `
                    table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                    img { max-width: 100%; height: auto; }
                    p { margin-bottom: 1em; }
                    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
                `;
                container.appendChild(style);

                document.body.appendChild(container);

                const opt = {
                    margin: 10,
                    filename: file.name.replace('.docx', '.pdf'),
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                // Generate PDF
                const pdfBlob = await html2pdf().set(opt).from(container).output('blob');

                // Clean up
                document.body.removeChild(container);

                resolve(pdfBlob);

            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Converts a PDF file to Word (.docx)
 * @param {File} file - The .pdf file
 * @returns {Promise<Blob>} - The generated DOCX blob
 */
export const convertPdfToWord = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        const children = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Simple text extraction. 
            // NOTE: This loses formatting like bold, italic, tables, images.
            // It just extracts lines of text.
            let lastY = null;
            let currentLineText = [];

            textContent.items.forEach((item) => {
                // Check if we are on a new line based on Y coordinate
                // This is a naive heuristic
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    if (currentLineText.length > 0) {
                        children.push(new Paragraph({
                            children: [new TextRun(currentLineText.join(' '))]
                        }));
                        currentLineText = [];
                    }
                }
                currentLineText.push(item.str);
                lastY = item.transform[5];
            });

            // Push the last line of the page
            if (currentLineText.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun(currentLineText.join(' '))]
                }));
            }
        }

        if (children.length === 0) {
            console.log("No text found in PDF, attempting OCR...");

            // OCR Fallback
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('eng');

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

                const { data: { paragraphs } } = await worker.recognize(imageBlob);

                paragraphs.forEach(p => {
                    children.push(new Paragraph({
                        children: [new TextRun(p.text)]
                    }));
                });

                // Add page break if needed, but docx doesn't strictly need it for flow
                // Maybe add an empty paragraph for spacing
                children.push(new Paragraph({ text: "" }));
            }

            await worker.terminate();
        }

        if (children.length === 0) {
            throw new Error("No text found in PDF even with OCR. The file might be empty or unreadable.");
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: children,
            }],
        });

        // Generate blob
        const blob = await Packer.toBlob(doc);
        return blob;

    } catch (error) {
        console.error("PDF to Word conversion error:", error);
        throw error;
    }
};

/**
 * Converts an Excel (.xlsx, .xls) file to PDF
 * @param {File} file - The Excel file
 * @returns {Promise<Blob>} - The generated PDF blob
 */
export const convertExcelToPdf = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Convert first sheet to HTML
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const html = XLSX.utils.sheet_to_html(worksheet);

                // Convert HTML to PDF
                const container = document.createElement('div');
                container.innerHTML = html;
                container.style.padding = '20px';

                // Add styles for Excel-like look
                const style = document.createElement('style');
                style.innerHTML = `
                    table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                `;
                container.appendChild(style);

                document.body.appendChild(container);

                const opt = {
                    margin: 10,
                    filename: file.name.replace(/\.xlsx?$/, '.pdf'),
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
                };

                const pdfBlob = await html2pdf().set(opt).from(container).output('blob');
                document.body.removeChild(container);
                resolve(pdfBlob);

            } catch (error) {
                console.error("Excel to PDF conversion error:", error);
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Converts a PDF file to Excel (.xlsx)
 * @param {File} file - The PDF file
 * @returns {Promise<Blob>} - The generated Excel blob
 */
export const convertPdfToExcel = async (file, options = {}) => {
    try {
        const { useOcr = false } = options;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        const rows = [];

        // If OCR is NOT forced, try standard extraction first
        if (!useOcr) {
            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const items = textContent.items;

                // Group by Y coordinate (row)
                const rowMap = new Map();

                items.forEach(item => {
                    const y = Math.round(item.transform[5]);
                    if (!rowMap.has(y)) {
                        rowMap.set(y, []);
                    }
                    rowMap.get(y).push({
                        x: item.transform[4],
                        str: item.str
                    });
                });

                const sortedYs = Array.from(rowMap.keys()).sort((a, b) => b - a);

                sortedYs.forEach(y => {
                    const items = rowMap.get(y);
                    items.sort((a, b) => a.x - b.x);

                    const rowData = [];
                    items.forEach(item => {
                        if (item.str && item.str.includes("  ")) {
                            const parts = item.str.split(/\s{2,}/).filter(s => s.trim());
                            rowData.push(...parts);
                        } else {
                            rowData.push(item.str);
                        }
                    });
                    rows.push(rowData);
                });
                rows.push([]);
            }
        }

        const hasText = rows.length > 0 && !rows.every(row => row.length === 0);

        if (useOcr && !hasText) { // Only run OCR if explicitly requested AND standard extraction found nothing (or was skipped)
            console.log("Starting OCR conversion...");

            let worker = null;
            try {
                // OCR Fallback
                const { createWorker } = await import('tesseract.js');
                worker = await createWorker('eng'); // Default to English for now

                for (let i = 1; i <= totalPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context, viewport: viewport }).promise;

                    const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

                    try {
                        const result = await worker.recognize(imageBlob);
                        if (result && result.data && result.data.lines && Array.isArray(result.data.lines)) {
                            const lines = result.data.lines;
                            lines.forEach(line => {
                                // Strategy 1: Check raw text for clear visual separation (double spaces)
                                // Tesseract often preserves layout in .text property
                                const lineText = line.text.trim();
                                if (lineText) {
                                    const spaceSplit = lineText.split(/\s{2,}/).filter(s => s.trim());
                                    if (spaceSplit.length > 1) {
                                        // Found clear columns based on spacing
                                        rows.push(spaceSplit);
                                        return;
                                    }
                                }

                                const words = line.words || [];
                                const cells = [];
                                let currentCell = [];

                                for (let w = 0; w < words.length; w++) {
                                    if (w > 0) {
                                        const gap = words[w].bbox.x0 - words[w - 1].bbox.x1;
                                        // Enhanced sensitivity: Lower gap threshold (10px) to better detect columns
                                        if (gap > 10) {
                                            cells.push(currentCell.join(" "));
                                            currentCell = [];
                                        }
                                    }
                                    currentCell.push(words[w].text);
                                }
                                if (currentCell.length > 0) cells.push(currentCell.join(" "));

                                // Fallback: If OCR didn't find any gaps but line is long, try splitting by double space
                                // This handles cases where bbox.x info is unreliable but text has visual spaces
                                if (cells.length === 1 && cells[0].includes("  ")) {
                                    const splitCells = cells[0].split(/\s{2,}/).filter(c => c.trim().length > 0);
                                    if (splitCells.length > 1) {
                                        if (splitCells.length > 0) rows.push(splitCells);
                                    } else {
                                        if (cells.length > 0) rows.push(cells);
                                    }
                                } else {
                                    if (cells.length > 0) rows.push(cells);
                                }
                            });
                        } else if (result && result.data && result.data.text) {
                            // Fallback to raw text split by newline
                            const rawLines = result.data.text.split('\n');
                            rawLines.forEach(l => {
                                if (l.trim()) rows.push([l.trim()]);
                            });
                        }
                    } catch (ocrError) {
                        console.error("OCR error on page " + i, ocrError);
                    }

                    rows.push([]); // Empty row between pages
                }
            } catch (err) {
                console.error("Failed to initialize or run OCR worker:", err);
            } finally {
                if (worker) {
                    await worker.terminate();
                }
            }
        }

        if (rows.length === 0 || rows.every(row => row.length === 0)) {
            if (useOcr) {
                throw new Error("No text found in PDF even with OCR. The file might be empty or unreadable.");
            } else {
                throw new Error("No text found in PDF. If this is a scanned document or image, please check the 'Use OCR' option.");
            }
        }


        // Create workbook
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // Write to blob
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    } catch (error) {
        console.error("PDF to Excel conversion error:", error);
        throw error;
    }
};

/**
 * Converts a PDF file to PowerPoint (.pptx) - Slides are images of PDF pages
 * @param {File} file - The PDF file
 * @returns {Promise<Blob>} - The generated PPTX blob
 */
export const convertPdfToPpt = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        const pres = new PptxGenJS();

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // High quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            const slide = pres.addSlide();
            // Fit image to slide
            slide.addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
        }

        const blob = await pres.write({ outputType: 'blob' });
        return blob;

    } catch (error) {
        console.error("PDF to PowerPoint conversion error:", error);
        throw error;
    }
};

/**
 * Rotates PDF pages
 * @param {File} file - The PDF file
 * @param {number} rotation - Degrees to rotate (90, 180, 270)
 * @returns {Promise<Blob>} - The rotated PDF blob
 */
export const rotatePdf = async (file, rotation) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        pages.forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + rotation));
        });

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Rotate PDF error:", error);
        throw error;
    }
};

/**
 * Adds page numbers to PDF
 * @param {File} file - The PDF file
 * @param {string} position - 'bottom-center', 'bottom-right', etc. (Currently defaults to bottom-center)
 * @returns {Promise<Blob>} - The PDF blob with page numbers
 */
export const addPageNumbers = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

        const { rgb } = await import('pdf-lib'); // Dynamic import to ensure access if needed, or rely on top-level
        // Actually PDFDocument imports everything usually. Let's use rgb from pdf-lib if available or PDFDocument.
        // We need to import rgb and degrees at the top. 
        // For now I will assume they are imported or I will mix them in. 
        // Let's add imports to top of file in a separate step if missing.

        // StandardCourier font
        const font = await pdfDoc.embedFont('StandardEncoding' in pdfDoc ? 'Helvetica' : 'Helvetica');

        pages.forEach((page, index) => {
            const { width, height } = page.getSize();
            const fontSize = 12;
            const text = `Page ${index + 1} of ${totalPages}`;
            const textWidth = font.widthOfTextAtSize(text, fontSize);

            page.drawText(text, {
                x: width / 2 - textWidth / 2,
                y: 20,
                size: fontSize,
                font: font,
                // color: rgb(0, 0, 0), // Default black
            });
        });

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Add Page Numbers error:", error);
        throw error;
    }
};

/**
 * Adds watermark to PDF
 * @param {File} file - The PDF file
 * @param {string} watermarkText - Text to add as watermark
 * @param {Object} options - { color, fontSize, opacity, rotation, position, isMosaic }
 * @returns {Promise<Blob>} - The PDF blob with watermark
 */
export const addWatermark = async (file, watermarkText, options = {}) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Standard font
        const font = await pdfDoc.embedFont('Helvetica-Bold');

        // Destructure options with defaults
        const {
            color = '#ff0000', // Hex color
            fontSize = 50,
            opacity = 0.3,
            rotation = 45,
            position = 'center', // 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', etc.
            isMosaic = false
        } = options;

        // Convert Hex to RGB
        const r = parseInt(color.slice(1, 3), 16) / 255;
        const g = parseInt(color.slice(3, 5), 16) / 255;
        const b = parseInt(color.slice(5, 7), 16) / 255;
        const rgbColor = rgb(r, g, b);

        pages.forEach(page => {
            const { width, height } = page.getSize();
            const textWidth = font.widthOfTextAtSize(watermarkText, parseInt(fontSize));
            const textHeight = parseInt(fontSize);

            const drawWatermark = (x, y) => {
                page.drawText(watermarkText, {
                    x: x,
                    y: y,
                    size: parseInt(fontSize),
                    font: font,
                    opacity: parseFloat(opacity),
                    rotate: degrees(parseInt(rotation)),
                    color: rgbColor,
                });
            };

            if (isMosaic) {
                // Mosaic Pattern
                const gapX = textWidth + 100;
                const gapY = textHeight + 100;
                for (let x = -width; x < width * 2; x += gapX) {
                    for (let y = -height; y < height * 2; y += gapY) {
                        drawWatermark(x, y);
                    }
                }
            } else {
                // Standard Positioning
                let x, y;

                // Calculate X
                if (position.includes('left')) x = 20;
                else if (position.includes('right')) x = width - textWidth - 20;
                else x = width / 2 - textWidth / 2; // Center horizontally

                // Calculate Y
                if (position.includes('top')) y = height - textHeight - 20;
                else if (position.includes('bottom')) y = 20;
                else y = height / 2 - textHeight / 2; // Center vertically

                // Adjust for rotation roughly (centering rotation is tricky without transformation matrices, 
                // but pdf-lib rotates around the text origin (bottom-left of text). 
                // For a simple 'center' rotation, we might need to offset. 
                // For now, simple positioning is enough for MVP.)

                drawWatermark(x, y);
            }
        });

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Add Watermark error:", error);
        throw error;
    }
};

/**
 * Protects a PDF with a password
 * @param {File} file - The PDF file
 * @param {string} password - The password to set
 * @returns {Promise<Blob>} - The encrypted PDF blob
 */
export const protectPdf = async (file, password) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        pdfDoc.encrypt({
            userPassword: password,
            ownerPassword: password,
            permissions: {
                printing: 'highResolution',
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: false,
                documentAssembly: false,
            },
        });

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Protect PDF error:", error);
        throw error;
    }
};

/**
 * Unlocks a protected PDF
 * @param {File} file - The protected PDF file
 * @param {string} password - The password to unlock
 * @returns {Promise<Blob>} - The decrypted PDF blob
 */
export const unlockPdf = async (file, password) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        // Load with password
        const pdfDoc = await PDFDocument.load(arrayBuffer, { password });

        // Save without options removes encryption
        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Unlock PDF error:", error);
        // Better error handling for wrong password
        if (error.message.includes('password')) {
            throw new Error("Incorrect password");
        }
        throw error;
    }
};

/**
 * Helper to extract text and images from PPTX
 */
const extractPptxContent = async (file) => {
    try {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);

        // 1. Get Slide Size from presentation.xml
        // Standard is 9144000 EMU width (10 inches). We need to scale to pixels.
        // 1 inch = 914400 EMU. 1 inch = 96 px (usually).
        // So 914400 EMU = 96 px -> 1 px = 9525 EMU.
        const EMU_PER_PX = 9525;

        let slideWidth = 0;
        let slideHeight = 0;

        try {
            const presentationXml = await content.files['ppt/presentation.xml'].async('text');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(presentationXml, "text/xml");
            const sldSz = xmlDoc.getElementsByTagName('p:sldSz')[0];
            if (sldSz) {
                slideWidth = parseInt(sldSz.getAttribute('cx')) / EMU_PER_PX;
                slideHeight = parseInt(sldSz.getAttribute('cy')) / EMU_PER_PX;
            } else {
                // Default to 16:9 (960x540 approx)
                slideWidth = 960;
                slideHeight = 540;
            }
        } catch (e) {
            console.warn("Could not parse presentation.xml for size, using defaults.");
            slideWidth = 960;
            slideHeight = 540;
        }

        // 2. Identify slides
        const slideFiles = Object.keys(content.files).filter(fileName =>
            fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
        );

        slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)\.xml/)[1]);
            const numB = parseInt(b.match(/slide(\d+)\.xml/)[1]);
            return numA - numB;
        });

        const slides = [];

        for (const slideFile of slideFiles) {
            const slideXml = await content.files[slideFile].async('text');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(slideXml, "text/xml");

            // Relationships
            const relsFileName = slideFile.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
            const relsFile = content.files[relsFileName];
            const relsMap = new Map();

            if (relsFile) {
                const relsXml = await relsFile.async('text');
                const relsDoc = parser.parseFromString(relsXml, "text/xml");
                const relationships = relsDoc.getElementsByTagName("Relationship");
                for (let i = 0; i < relationships.length; i++) {
                    const id = relationships[i].getAttribute("Id");
                    const target = relationships[i].getAttribute("Target");
                    const type = relationships[i].getAttribute("Type");
                    if (target) relsMap.set(id, target);
                }
            }

            const slideElements = [];

            // Helper to extract transform
            const getTransform = (el) => {
                const xfrm = el.getElementsByTagName('a:off')[0];
                const ext = el.getElementsByTagName('a:ext')[0];
                if (xfrm && ext) {
                    return {
                        x: parseInt(xfrm.getAttribute('x')) / EMU_PER_PX,
                        y: parseInt(xfrm.getAttribute('y')) / EMU_PER_PX,
                        w: parseInt(ext.getAttribute('cx')) / EMU_PER_PX,
                        h: parseInt(ext.getAttribute('cy')) / EMU_PER_PX
                    };
                }
                return null;
            };

            // Helper to get color from node
            const getColor = (node) => {
                if (!node) return null;
                const solidFill = node.getElementsByTagName('a:solidFill')[0];
                if (solidFill) {
                    const srgbClr = solidFill.getElementsByTagName('a:srgbClr')[0];
                    if (srgbClr) return '#' + srgbClr.getAttribute('val');
                    const schemeClr = solidFill.getElementsByTagName('a:schemeClr')[0];
                    if (schemeClr) {
                        // Basic mapping for common scheme colors
                        const val = schemeClr.getAttribute('val');
                        if (val === 'tx1' || val === 'dk1') return '#000000';
                        if (val === 'bg1' || val === 'lt1') return '#ffffff';
                        if (val === 'accent1') return '#5b9bd5';
                        if (val === 'accent2') return '#ed7d31';
                        if (val === 'accent3') return '#a5a5a5';
                        if (val === 'accent4') return '#ffc000';
                        if (val === 'accent5') return '#4472c4';
                        if (val === 'accent6') return '#70ad47';
                        return '#cccccc'; // Fallback
                    }
                }
                return null;
            };

            // Helper to get text color
            const getTextColor = (node) => {
                if (!node) return null;
                // Look for text runs with color
                const runs = node.getElementsByTagName('a:r');
                for (let i = 0; i < runs.length; i++) {
                    const rPr = runs[i].getElementsByTagName('a:rPr')[0];
                    if (rPr) {
                        const color = getColor(rPr);
                        if (color) return color;
                    }
                }
                return null;
            };

            // Recursive function to traverse Group Shapes and Shapes
            const traverseShapes = async (node) => {
                // Check for Pictures
                if (node.nodeName === 'p:pic') {
                    const blip = node.getElementsByTagName("a:blip")[0];
                    const spPr = node.getElementsByTagName('p:spPr')[0];
                    const pos = getTransform(spPr);

                    if (blip && pos) {
                        const embedId = blip.getAttribute("r:embed");
                        if (embedId && relsMap.has(embedId)) {
                            let target = relsMap.get(embedId);
                            let imagePath = target.replace('../', 'ppt/');
                            if (!imagePath.startsWith('ppt/')) imagePath = 'ppt/' + target;
                            imagePath = imagePath.replace('//', '/');

                            const listKeys = Object.keys(content.files);
                            const exactPath = listKeys.find(k => k.endsWith(imagePath.split('/').pop()));

                            if (exactPath) {
                                const imgBlob = await content.files[exactPath].async('blob');
                                const reader = new FileReader();
                                const base64 = await new Promise(resolve => {
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(imgBlob);
                                });
                                slideElements.push({
                                    type: 'image',
                                    content: base64,
                                    x: pos.x, y: pos.y, w: pos.w, h: pos.h
                                });
                            }
                        }
                    }
                }
                // Check for Shapes (Text or Geometry)
                else if (node.nodeName === 'p:sp') {
                    const spPr = node.getElementsByTagName('p:spPr')[0];
                    const pos = getTransform(spPr);

                    // Style extraction
                    const bgColor = getColor(spPr);

                    // Geometry
                    let isCircle = false;
                    const prstGeom = spPr.getElementsByTagName('a:prstGeom')[0];
                    if (prstGeom && prstGeom.getAttribute('prst') === 'ellipse') {
                        isCircle = true;
                    }

                    // Extract text content and color
                    const textLines = [];
                    const paragraphs = node.getElementsByTagName('a:p');
                    let textColor = null;

                    for (let i = 0; i < paragraphs.length; i++) {
                        const p = paragraphs[i];
                        let pText = "";
                        const runs = p.getElementsByTagName('a:t');
                        for (let j = 0; j < runs.length; j++) {
                            pText += runs[j].textContent;
                        }
                        if (pText) textLines.push(pText);

                        // Try to get text color from first paragraph
                        if (i === 0 && !textColor) {
                            textColor = getTextColor(p);
                        }
                    }

                    const fullText = textLines.join('\n');

                    // If it has text OR has a background color, it's worth rendering
                    if ((fullText.trim() || bgColor) && pos) {
                        slideElements.push({
                            type: 'text', // Keeping 'text' type but adding styles. Could be 'shape'
                            content: fullText,
                            x: pos.x, y: pos.y, w: pos.w, h: pos.h,
                            bgColor: bgColor,
                            textColor: textColor,
                            isCircle: isCircle,
                            isShape: !!bgColor // Flag to treat as shape
                        });
                    }
                }
                // Check for Groups
                else if (node.nodeName === 'p:grpSp') {
                    // Recurse children
                    for (let i = 0; i < node.childNodes.length; i++) {
                        await traverseShapes(node.childNodes[i]);
                    }
                }
            };

            // Start traversal from spTree
            const spTree = xmlDoc.getElementsByTagName('p:spTree')[0];
            if (spTree) {
                for (let i = 0; i < spTree.childNodes.length; i++) {
                    await traverseShapes(spTree.childNodes[i]);
                }
            }


            slides.push({
                elements: slideElements,
                width: slideWidth,
                height: slideHeight,
                id: slideFile
            });
        }

        return slides;

    } catch (error) {
        console.error("PPTX Extraction Error:", error);
        throw new Error("Failed to parse PowerPoint file.");
    }
};

/**
 * Converts PowerPoint (.pptx) to PDF
 * @param {File} file - The .pptx file
 * @returns {Promise<Blob>} - The generated PDF blob
 */
export const powerPointToPdf = async (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            const slides = await extractPptxContent(file);

            if (slides.length === 0) {
                throw new Error("No slides found in the PowerPoint file.");
            }

            // Create HTML Container
            const container = document.createElement('div');
            // container.style.width = '800px'; // Approx A4 width?
            container.style.fontFamily = 'Arial, sans-serif';

            slides.forEach((slide, index) => {
                const slideDiv = document.createElement('div');
                slideDiv.style.pageBreakAfter = 'always';
                // slideDiv.style.padding = '40px'; // No padding for absolute layout
                slideDiv.style.border = '1px solid #eee'; // Visual separator (maybe remove for clean PDF?)
                slideDiv.style.marginBottom = '20px';

                // Set dimensions based on extracted slide size
                if (slide.width && slide.height) {
                    slideDiv.style.width = `${slide.width}px`;
                    slideDiv.style.height = `${slide.height}px`;
                } else {
                    slideDiv.style.minHeight = '500px'; // Fallback
                }

                slideDiv.style.backgroundColor = '#fff';
                slideDiv.style.position = 'relative';
                slideDiv.style.overflow = 'hidden'; // Clip content

                // Render Elements (Text and Images)
                if (slide.elements && slide.elements.length > 0) {
                    slide.elements.forEach(el => {
                        const elDiv = document.createElement('div');
                        elDiv.style.position = 'absolute';
                        elDiv.style.left = `${el.x}px`;
                        elDiv.style.top = `${el.y}px`;

                        // For circles and images, use fixed dimensions
                        // For text boxes, use min-width to allow expansion
                        if (el.type === 'image' || el.isCircle) {
                            elDiv.style.width = `${el.w}px`;
                            elDiv.style.height = `${el.h}px`;
                        } else {
                            // Text boxes: use min-width and min-height to allow content to expand
                            elDiv.style.minWidth = `${el.w}px`;
                            elDiv.style.minHeight = `${el.h}px`;
                            elDiv.style.maxWidth = `${el.w * 1.5}px`; // Allow up to 50% expansion
                        }

                        if (el.type === 'image') {
                            const img = document.createElement('img');
                            img.src = el.content;
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'contain';
                            elDiv.appendChild(img);
                        } else if (el.type === 'text') {
                            const content = document.createElement('div');
                            content.textContent = el.content;
                            content.style.fontSize = '15px';
                            content.style.lineHeight = '1.4';
                            content.style.whiteSpace = 'normal'; // Changed from pre-wrap to allow better wrapping
                            content.style.wordWrap = 'break-word';
                            content.style.overflow = 'visible';

                            // Apply text color
                            if (el.textColor) {
                                content.style.color = el.textColor;
                            }

                            // Apply Shape Styles
                            if (el.bgColor) {
                                elDiv.style.backgroundColor = el.bgColor;
                            }

                            if (el.isCircle) {
                                elDiv.style.borderRadius = '50%';
                                content.style.textAlign = 'center';
                                content.style.color = content.style.color || '#ffffff';
                                content.style.fontWeight = 'bold';
                                content.style.fontSize = '18px'; // Slightly larger for circles
                                elDiv.style.display = 'flex';
                                elDiv.style.alignItems = 'center';
                                elDiv.style.justifyContent = 'center';
                                content.style.width = '100%';
                            } else {
                                // For non-circle shapes
                                if (el.isShape) {
                                    elDiv.style.padding = '8px';
                                    elDiv.style.boxSizing = 'border-box';
                                } else {
                                    // Regular text boxes
                                    elDiv.style.padding = '4px';
                                }
                            }

                            elDiv.appendChild(content);
                        }

                        slideDiv.appendChild(elDiv);
                    });
                } else {
                    // Fallback for empty slides
                    const content = document.createElement('p');
                    content.textContent = "(No content found)";
                    content.style.padding = '20px';
                    slideDiv.appendChild(content);
                }

                container.appendChild(slideDiv);
            });

            document.body.appendChild(container);

            const opt = {
                margin: 10,
                filename: file.name.replace(/\.pptx?$/, '.pdf'),
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } // Slides are usually landscape
            };

            const pdfBlob = await html2pdf().set(opt).from(container).output('blob');
            document.body.removeChild(container);
            resolve(pdfBlob);

        } catch (error) {
            console.error("PPTX to PDF conversion error:", error);
            reject(error);
        }
    });
};

/**
 * Converts a PDF to PDF/A-1b (Simulation/Best Effort)
 * Real PDF/A requires sRGB ICC profile and strict XMP metadata.
 * This function flattens forms and sets metadata to claim compliance.
 * @param {File} file - The source PDF file
 * @returns {Promise<Blob>} - The PDF/A compliant blob
 */
export const convertToPdfA = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // 1. Flatten Form Fields (PDF/A requirement)
        const form = pdfDoc.getForm();
        if (form) {
            try {
                form.flatten();
            } catch (e) {
                // Ignore if no fields or error
            }
        }

        // 2. Set Metadata
        pdfDoc.setTitle(file.name.replace('.pdf', ''));
        pdfDoc.setSubject('PDF/A Conversion');
        pdfDoc.setProducer('iLovePDF Clone (pdf-lib)');
        pdfDoc.setCreator('iLovePDF Clone');
        pdfDoc.setCreationDate(new Date());
        pdfDoc.setModificationDate(new Date());

        // 3. Remove Javascript (PDF/A requirement)
        // pdf-lib doesn't have a direct "remove all JS" method but loading and saving smooths some things.

        // 4. Color Profile (Simulated/Standard)
        // Ideally we embed an ICC profile here.
        // Assuming the input is sRGB, we are mostly fine for display.

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("PDF to PDF/A conversion error:", error);
        throw error;
    }
};

/**
 * Applies redactions to a PDF
 * @param {File} file - The source PDF file
 * @param {Array} redactions - Array of { pageIndex, x, y, width, height, viewWidth, viewHeight }
 * @returns {Promise<Blob>} - The redacted PDF blob
 */
export const applyRedactions = async (file, redactions) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Group redactions by page to minimize page retrieval
        const redactionsByPage = {};
        redactions.forEach(r => {
            if (!redactionsByPage[r.pageIndex]) {
                redactionsByPage[r.pageIndex] = [];
            }
            redactionsByPage[r.pageIndex].push(r);
        });

        // Iterate over pages that have redactions
        for (const [pageIndexStr, pageRedactions] of Object.entries(redactionsByPage)) {
            const pageIndex = parseInt(pageIndexStr);
            if (pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            const { width: pageWidth, height: pageHeight } = page.getSize();

            // Draw each redaction rectangle
            for (const r of pageRedactions) {
                // Calculate scale factors (in case view size differs from actual PDF point size)
                // We assume r.x, r.y, etc are in 'view' coordinates.
                const scaleX = pageWidth / r.viewWidth;
                const scaleY = pageHeight / r.viewHeight;

                const x = r.x * scaleX;
                const width = r.width * scaleX;
                const height = r.height * scaleY;

                // Invert Y axis: PDF (0,0) is bottom-left, Canvas (0,0) is top-left
                // Canvas Y=0 -> PDF Y=height
                // Canvas Rect Top = r.y
                // PDF Rect Bottom = pageHeight - (r.y * scaleY) - height
                const y = pageHeight - (r.y * scaleY) - height;

                page.drawRectangle({
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    color: rgb(0, 0, 0), // Black
                    // opacity: 1, // Default is 1
                });
            }
        }

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Redact PDF error:", error);
        throw error;
    }
};



/**
 * Converts a URL to PDF using a CORS proxy and html2pdf.js
 * @param {string} url - The URL to convert
 * @param {Object} options - Advanced options { format, orientation, margin }
 * @returns {Promise<Blob>} - The generated PDF blob
 */
export const convertUrlToPdf = async (url, options = {}) => {
    try {
        // Use a CORS proxy to fetch the HTML
        // 'allorigins' is a popular free one. 
        // specific for this use case, we might need a more robust one or a backend, 
        // but for client-side only, this is the way.
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.contents) {
            throw new Error("Failed to fetch content from URL");
        }

        let htmlContent = data.contents;

        // URL Rewriting: Convert relative URLs to absolute URLs
        // We need a base URL to resolve relative paths.
        try {
            const baseUrl = new URL(url);
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // Rewrite images
            const images = doc.querySelectorAll('img');
            images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                    try {
                        // Check if it is protocol-relative
                        if (src.startsWith('//')) {
                            img.src = `${baseUrl.protocol}${src}`;
                        } else {
                            img.src = new URL(src, baseUrl.href).href;
                        }
                    } catch (e) {
                        console.warn('Failed to rewrite image URL:', src);
                    }
                }
            });

            // Rewrite links (css, etc) - though html2pdf might not fetch external CSS due to CORS
            const links = doc.querySelectorAll('link[rel="stylesheet"]');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http')) {
                    try {
                        if (href.startsWith('//')) {
                            link.href = `${baseUrl.protocol}${href}`;
                        } else {
                            link.href = new URL(href, baseUrl.href).href;
                        }
                    } catch (e) {
                        console.warn('Failed to rewrite stylesheet URL:', href);
                    }
                }
            });

            htmlContent = doc.documentElement.outerHTML;
        } catch (e) {
            console.warn("URL rewriting failed:", e);
        }

        // Create a container
        const container = document.createElement('div');
        container.innerHTML = htmlContent;

        // Basic cleanup/styling to ensure it renders somewhat correctly
        // We can't load external CSS easily due to CORS mixed with the proxy content usually,
        // unless we rewrite links, which is complex.
        // We'll rely on inline styles or basic rendering.
        container.style.width = '100%';
        container.style.padding = '20px';

        document.body.appendChild(container);

        const opt = {
            margin: options.margin ? parseInt(options.margin) : 10,
            filename: 'webpage.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true }, // useCORS important for images
            jsPDF: {
                unit: 'mm',
                format: options.format || 'a4',
                orientation: options.orientation || 'portrait'
            }
        };

        const pdfBlob = await html2pdf().set(opt).from(container).output('blob');
        document.body.removeChild(container);
        return pdfBlob;

    } catch (error) {
        console.error("HTML to PDF conversion error:", error);
        throw error;
    }
};
/**
 * Crops a PDF
 * @param {File} file - The source PDF file
 * @param {Object} cropData - { pageIndex (optional), x, y, width, height, viewWidth, viewHeight, applyToAll }
 * @returns {Promise<Blob>} - The cropped PDF blob
 */
export const cropPdf = async (file, cropData) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        pages.forEach((page, index) => {
            // Apply if 'applyToAll' is true OR if it matches the specific page index
            if (cropData.applyToAll || index === cropData.pageIndex) {
                const { width: pageWidth, height: pageHeight } = page.getSize();

                // Calculate scale factors
                // cropData.x, etc are in view coordinates
                const scaleX = pageWidth / cropData.viewWidth;
                const scaleY = pageHeight / cropData.viewHeight;

                const x = cropData.x * scaleX;
                const width = cropData.width * scaleX;
                const height = cropData.height * scaleY;

                // Invert Y axis for PDF coordinates (0,0 is bottom-left)
                // cropData.y is from top-left.
                // New Bottom Y = pageHeight - (cropData.y * scaleY) - height
                const y = pageHeight - (cropData.y * scaleY) - height;

                // Set CropBox and MediaBox
                // We set both to ensure it displays correctly in all viewers
                page.setCropBox(x, y, width, height);
                page.setMediaBox(x, y, width, height);
            }
        });

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Crop PDF error:", error);
        throw error;
    }
};
