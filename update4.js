const fs = require('fs');
const content = fs.readFileSync('lib/pdfUtils.js', 'utf8');

const prefix = content.split('export async function addWatermark(')[0];
const suffix = 'export async function addPageNumbers(' + content.split('export async function addPageNumbers(')[1];

const replacement = \export async function addWatermark(file, options = {}) {
  const {
    text = 'SababPDF.com',
    opacity = 0.5,
    color = '#000000',
    fontSize = 60,
    rotation = 0,
    position = 'center', 
    mosaic = false,
    fontFamily = 'Arial',
    isBold = false,
    isItalic = false,
  } = options;

  const { PDFDocument, rgb, degrees, StandardFonts } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer);
  
  let fontType;
  if (fontFamily === 'Times') {
    if (isBold && isItalic) fontType = StandardFonts.TimesRomanBoldItalic;
    else if (isBold) fontType = StandardFonts.TimesRomanBold;
    else if (isItalic) fontType = StandardFonts.TimesRomanItalic;
    else fontType = StandardFonts.TimesRoman;
  } else if (fontFamily === 'Courier') {
    if (isBold && isItalic) fontType = StandardFonts.CourierBoldOblique;
    else if (isBold) fontType = StandardFonts.CourierBold;
    else if (isItalic) fontType = StandardFonts.CourierOblique;
    else fontType = StandardFonts.Courier;
  } else {
    // Default to Helvetica
    if (isBold && isItalic) fontType = StandardFonts.HelveticaBoldOblique;
    else if (isBold) fontType = StandardFonts.HelveticaBold;
    else if (isItalic) fontType = StandardFonts.HelveticaOblique;
    else fontType = StandardFonts.Helvetica;
  }
  
  const font = await pdf.embedFont(fontType);
  const pages = pdf.getPages();

  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const rgbColor = rgb(r, g, b);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    
    const drawStamp = (x, y) => {
      page.drawText(text, {
        x: x,
        y: y,
        size: fontSize,
        font,
        color: rgbColor,
        opacity: Number(opacity),
        rotate: degrees(Number(rotation)),
      });
    };

    if (mosaic) {
      const stepX = textWidth + 80;
      const stepY = textHeight + 120;
      const spanX = Math.max(width, height) * 1.5;
      const spanY = Math.max(width, height) * 1.5;
      
      for (let x = -spanX; x < spanX; x += stepX) {
        for (let y = -spanY; y < spanY; y += stepY) {
          drawStamp(x, y);
        }
      }
    } else {
      let anchorX = 0;
      let anchorY = 0;
      const pad = 50;

      if (position.includes('left')) anchorX = pad;
      else if (position.includes('center') || position === 'bottom' || position === 'top') anchorX = (width - textWidth) / 2;
      else if (position.includes('right')) anchorX = width - textWidth - pad;
      else anchorX = (width - textWidth) / 2;

      if (position.includes('top')) anchorY = height - textHeight - pad;
      else if (position.includes('middle') || position === 'center') anchorY = height / 2;
      else if (position.includes('bottom')) anchorY = pad + textHeight;
      else anchorY = height / 2;

      if (rotation !== 0) {
        anchorX += textWidth / 2;
        anchorY += textHeight / 3;
        if (position.includes('right')) anchorX -= textHeight;
        if (position.includes('top')) anchorY -= textWidth/2;
      }

      drawStamp(anchorX, anchorY);
    }
  }

  const bytes = await pdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// =====================
// ADD PAGE NUMBERS
// =====================
\;

fs.writeFileSync('lib/pdfUtils.js', prefix + replacement + suffix);
console.log('Success robustly');
