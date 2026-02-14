import { PDFDocument } from 'pdf-lib';

export const mergePdfs = async (files) => {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const splitPdf = async (file, pageIndices) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const compressPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    // Simple re-save which can optimize the file structure (remove unused objects etc.)
    // pdf-lib's save() does some optimization by default.
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const getPdfPageCount = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
};

export const repairPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    // Load with ignoreEncryption: true to attempt to open even if slightly corrupted or encrypted without password (if empty)
    // and potentially other loose parsing options if available. pdf-lib is generally strict but simply saving it often fixes structure.
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    // Create a new document and copy pages to it to ensure a clean structure
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};
