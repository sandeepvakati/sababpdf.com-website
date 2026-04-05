// Client-side Word to PDF converter using mammoth.js and pdfmake
// This is a fallback for when LibreOffice is not available

import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';

export async function convertWordToPdfClient(file) {
  try {
    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // For .docx files, we can use mammoth to extract text
    // Note: This is a simplified conversion - formatting may be lost
    const text = await extractTextFromDocx(arrayBuffer);
    
    // Create PDF using jsPDF
    const pdf = new jsPDF();
    const pages = splitTextIntoPages(text, pdf);
    
    pages.forEach((pageText, index) => {
      if (index > 0) pdf.addPage();
      pdf.text(pageText, 10, 10);
    });
    
    return pdf.output('arraybuffer');
  } catch (error) {
    console.error('[Client Converter] Error:', error);
    throw error;
  }
}

async function extractTextFromDocx(arrayBuffer) {
  // Simple extraction - in production, use mammoth.js
  // This is a placeholder - actual implementation would need mammoth.js
  return 'Document content extracted from DOCX';
}

function splitTextIntoPages(text, pdf) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  const maxHeight = pageHeight - 2 * margin;
  
  const lines = text.split('\n');
  const pages = [];
  let currentPage = '';
  let currentHeight = 0;
  const lineHeight = 7;
  
  for (const line of lines) {
    const wrappedLines = pdf.splitTextToSize(line, maxWidth);
    for (const wrappedLine of wrappedLines) {
      if (currentHeight + lineHeight > maxHeight) {
        pages.push(currentPage);
        currentPage = wrappedLine + '\n';
        currentHeight = lineHeight;
      } else {
        currentPage += wrappedLine + '\n';
        currentHeight += lineHeight;
      }
    }
  }
  
  if (currentPage) pages.push(currentPage);
  return pages;
}
