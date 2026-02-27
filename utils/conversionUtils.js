import { PDFDocument, degrees, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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
                continue;
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

export const convertPdfToImages = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const images = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
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

export const convertWordToPdf = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/convert/word-to-pdf', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to convert Word to PDF');
        }

        const blob = await response.blob();
        return blob;
    } catch (error) {
        console.error("Word to PDF conversion error:", error);
        throw error;
    }
};

export const convertPdfToWord = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        const children = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            let lastY = null;
            let currentLineText = [];

            textContent.items.forEach((item) => {
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

            if (currentLineText.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun(currentLineText.join(' '))]
                }));
            }
        }

        if (children.length === 0) {
            console.log("No text found in PDF, attempting OCR...");

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

        const blob = await Packer.toBlob(doc);
        return blob;

    } catch (error) {
        console.error("PDF to Word conversion error:", error);
        throw error;
    }
};

export const convertExcelToPdf = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const html = XLSX.utils.sheet_to_html(worksheet);

                const container = document.createElement('div');
                container.innerHTML = html;
                container.style.padding = '20px';

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

export const convertPdfToExcel = async (file, options = {}) => {
    try {
        const { useOcr = false } = options;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        const rows = [];

        if (!useOcr) {
            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const items = textContent.items;

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

        if (useOcr && !hasText) {
            console.log("Starting OCR conversion...");

            let worker = null;
            try {
                const { createWorker } = await import('tesseract.js');
                worker = await createWorker('eng');

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
                                const lineText = line.text.trim();
                                if (lineText) {
                                    const spaceSplit = lineText.split(/\s{2,}/).filter(s => s.trim());
                                    if (spaceSplit.length > 1) {
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
                                        if (gap > 10) {
                                            cells.push(currentCell.join(" "));
                                            currentCell = [];
                                        }
                                    }
                                    currentCell.push(words[w].text);
                                }
                                if (currentCell.length > 0) cells.push(currentCell.join(" "));

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
                            const rawLines = result.data.text.split('\n');
                            rawLines.forEach(l => {
                                if (l.trim()) rows.push([l.trim()]);
                            });
                        }
                    } catch (ocrError) {
                        console.error("OCR error on page " + i, ocrError);
                    }

                    rows.push([]);
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


        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    } catch (error) {
        console.error("PDF to Excel conversion error:", error);
        throw error;
    }
};

export const convertPdfToPpt = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        const pres = new PptxGenJS();

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            const slide = pres.addSlide();
            slide.addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
        }

        const blob = await pres.write({ outputType: 'blob' });
        return blob;

    } catch (error) {
        console.error("PDF to PowerPoint conversion error:", error);
        throw error;
    }
};

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

export const addPageNumbers = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

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
            });
        });

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Add Page Numbers error:", error);
        throw error;
    }
};

export const addWatermark = async (file, watermarkText, options = {}) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        const {
            watermarkType = 'text',
            watermarkImage = null,
            color = '#ff0000',
            fontSize = 50,
            opacity = 0.3,
            rotation = 45,
            position = 'center',
            isMosaic = false
        } = options;

        if (watermarkType === 'image' && watermarkImage) {
            const imageBytes = await watermarkImage.arrayBuffer();
            let embeddedImage;

            if (watermarkImage.type === 'image/png') {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else if (watermarkImage.type === 'image/jpeg' || watermarkImage.type === 'image/jpg') {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
            } else {
                throw new Error('Unsupported image format. Please use PNG or JPG.');
            }

            const imageWidth = parseInt(fontSize) * 2;
            const imageHeight = (embeddedImage.height / embeddedImage.width) * imageWidth;

            pages.forEach(page => {
                const { width, height } = page.getSize();

                const drawImageWatermark = (x, y) => {
                    page.drawImage(embeddedImage, {
                        x: x,
                        y: y,
                        width: imageWidth,
                        height: imageHeight,
                        opacity: parseFloat(opacity),
                        rotate: degrees(parseInt(rotation)),
                    });
                };

                if (isMosaic) {
                    const gapX = imageWidth + 100;
                    const gapY = imageHeight + 100;
                    for (let x = -width; x < width * 2; x += gapX) {
                        for (let y = -height; y < height * 2; y += gapY) {
                            drawImageWatermark(x, y);
                        }
                    }
                } else {
                    let x, y;

                    if (position.includes('left')) x = 20;
                    else if (position.includes('right')) x = width - imageWidth - 20;
                    else x = width / 2 - imageWidth / 2;

                    if (position.includes('top')) y = height - imageHeight - 20;
                    else if (position.includes('bottom')) y = 20;
                    else y = height / 2 - imageHeight / 2;

                    drawImageWatermark(x, y);
                }
            });
        } else {
            const font = await pdfDoc.embedFont('Helvetica-Bold');

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
                    const gapX = textWidth + 100;
                    const gapY = textHeight + 100;
                    for (let x = -width; x < width * 2; x += gapX) {
                        for (let y = -height; y < height * 2; y += gapY) {
                            drawWatermark(x, y);
                        }
                    }
                } else {
                    let x, y;

                    if (position.includes('left')) x = 20;
                    else if (position.includes('right')) x = width - textWidth - 20;
                    else x = width / 2 - textWidth / 2;

                    if (position.includes('top')) y = height - textHeight - 20;
                    else if (position.includes('bottom')) y = 20;
                    else y = height / 2 - textHeight / 2;

                    drawWatermark(x, y);
                }
            });
        }

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Add Watermark error:", error);
        throw error;
    }
};

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

export const unlockPdf = async (file, password) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { password });

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("Unlock PDF error:", error);
        if (error.message.includes('password')) {
            throw new Error("Incorrect password");
        }
        throw error;
    }
};

const extractPptxContent = async (file) => {
    try {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);

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
                slideWidth = 960;
                slideHeight = 540;
            }
        } catch (e) {
            console.warn("Could not parse presentation.xml for size, using defaults.");
            slideWidth = 960;
            slideHeight = 540;
        }

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
                    if (target) relsMap.set(id, target);
                }
            }

            const slideElements = [];

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

            const getColor = (node) => {
                if (!node) return null;
                const solidFill = node.getElementsByTagName('a:solidFill')[0];
                if (solidFill) {
                    const srgbClr = solidFill.getElementsByTagName('a:srgbClr')[0];
                    if (srgbClr) return '#' + srgbClr.getAttribute('val');
                    const schemeClr = solidFill.getElementsByTagName('a:schemeClr')[0];
                    if (schemeClr) {
                        const val = schemeClr.getAttribute('val');
                        if (val === 'tx1' || val === 'dk1') return '#000000';
                        if (val === 'bg1' || val === 'lt1') return '#ffffff';
                        if (val === 'accent1') return '#5b9bd5';
                        if (val === 'accent2') return '#ed7d31';
                        if (val === 'accent3') return '#a5a5a5';
                        if (val === 'accent4') return '#ffc000';
                        if (val === 'accent5') return '#4472c4';
                        if (val === 'accent6') return '#70ad47';
                        return '#cccccc';
                    }
                }
                return null;
            };

            const getTextColor = (node) => {
                if (!node) return null;
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

            const traverseShapes = async (node) => {
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
                else if (node.nodeName === 'p:sp') {
                    const spPr = node.getElementsByTagName('p:spPr')[0];
                    const pos = getTransform(spPr);

                    const bgColor = getColor(spPr);

                    let isCircle = false;
                    const prstGeom = spPr.getElementsByTagName('a:prstGeom')[0];
                    if (prstGeom && prstGeom.getAttribute('prst') === 'ellipse') {
                        isCircle = true;
                    }

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

                        if (i === 0 && !textColor) {
                            textColor = getTextColor(p);
                        }
                    }

                    const fullText = textLines.join('\n');

                    if ((fullText.trim() || bgColor) && pos) {
                        slideElements.push({
                            type: 'text',
                            content: fullText,
                            x: pos.x, y: pos.y, w: pos.w, h: pos.h,
                            bgColor: bgColor,
                            textColor: textColor,
                            isCircle: isCircle,
                            isShape: !!bgColor
                        });
                    }
                }
                else if (node.nodeName === 'p:grpSp') {
                    for (let i = 0; i < node.childNodes.length; i++) {
                        await traverseShapes(node.childNodes[i]);
                    }
                }
            };

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

export const powerPointToPdf = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/convert/pptx-to-pdf', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to convert PowerPoint to PDF');
        }

        const blob = await response.blob();
        return blob;
    } catch (error) {
        console.error("PPTX to PDF conversion error:", error);
        throw error;
    }
};

export const convertToPdfA = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const form = pdfDoc.getForm();
        if (form) {
            try {
                form.flatten();
            } catch (e) {

            }
        }

        pdfDoc.setTitle(file.name.replace('.pdf', ''));
        pdfDoc.setSubject('PDF/A Conversion');
        pdfDoc.setProducer('iLovePDF Clone (pdf-lib)');
        pdfDoc.setCreator('iLovePDF Clone');
        pdfDoc.setCreationDate(new Date());
        pdfDoc.setModificationDate(new Date());

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error("PDF to PDF/A conversion error:", error);
        throw error;
    }
};

export const applyRedactions = async (file, redactions) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        const redactionsByPage = {};
        redactions.forEach(r => {
            if (!redactionsByPage[r.pageIndex]) {
                redactionsByPage[r.pageIndex] = [];
            }
            redactionsByPage[r.pageIndex].push(r);
        });

        for (const [pageIndexStr, pageRedactions] of Object.entries(redactionsByPage)) {
            const pageIndex = parseInt(pageIndexStr);
            if (pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            const { width: pageWidth, height: pageHeight } = page.getSize();

            for (const r of pageRedactions) {
                const scaleX = pageWidth / r.viewWidth;
                const scaleY = pageHeight / r.viewHeight;

                const x = r.x * scaleX;
                const width = r.width * scaleX;
                const height = r.height * scaleY;

                const y = pageHeight - (r.y * scaleY) - height;

                page.drawRectangle({
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    color: rgb(0, 0, 0),
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

export const convertUrlToPdf = async (url, options = {}) => {
    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.contents) {
            throw new Error("Failed to fetch content from URL");
        }

        let htmlContent = data.contents;

        try {
            const baseUrl = new URL(url);
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            const images = doc.querySelectorAll('img');
            images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                    try {
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

        const container = document.createElement('div');
        container.innerHTML = htmlContent;

        container.style.width = '100%';
        container.style.padding = '20px';

        document.body.appendChild(container);

        const opt = {
            margin: options.margin ? parseInt(options.margin) : 10,
            filename: 'webpage.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
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

export const cropPdf = async (file, cropData) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        pages.forEach((page, index) => {
            if (cropData.applyToAll || index === cropData.pageIndex) {
                const { width: pageWidth, height: pageHeight } = page.getSize();

                const scaleX = pageWidth / cropData.viewWidth;
                const scaleY = pageHeight / cropData.viewHeight;

                const x = cropData.x * scaleX;
                const width = cropData.width * scaleX;
                const height = cropData.height * scaleY;

                const y = pageHeight - (cropData.y * scaleY) - height;

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
