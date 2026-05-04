const fs = require('fs');
const content = fs.readFileSync('lib/pdfUtils.js', 'utf8');

const regex = /export async function addWatermark[\s\S]*?return new Blob\(\[bytes\], { type: 'application\/pdf' }\);\n}/m;

const replacement = `export async function addWatermark(file, options = {}) {
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
        x,
        y,
        size: fontSize,
        font,
        color: rgbColor,
        opacity: Number(opacity),
        rotate: degrees(Number(rotation)),
      });
    };

    if (mosaic) {
      const stepX = textWidth + 50;
      const stepY = textHeight + 100;
      const spanX = Math.max(width, height) * 1.5;
      const spanY = Math.max(width, height) * 1.5;
      
      for (let x = -spanX; x < spanX; x += stepX) {
        for (let y = -spanY; y < spanY; y += stepY) {
          drawStamp(x, y);
        }
      }
    } else {
      let anchorX, anchorY;
      const pad = 50;

      if (position.includes('left')) anchorX = pad;
      else if (position.includes('right')) anchorX = width - textWidth - pad;
      else anchorX = width / 2 - textWidth / 2;

      if (position.includes('bottom')) anchorY = pad + textHeight / 3;
      else if (position.includes('top')) anchorY = height - textHeight - pad;
      else anchorY = height / 2 - textHeight / 3;

      if (rotation !== 0) {
        anchorX += textWidth / 2;
        anchorY += textHeight / 2;
        if (position.includes('right')) anchorX -= textHeight;
        if (position.includes('top')) anchorY -= textWidth/2;
      }

      drawStamp(anchorX, anchorY);
    }
  }

  const bytes = await pdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}`;

if (content.match(regex)) {
  fs.writeFileSync('lib/pdfUtils.js', content.replace(regex, replacement));
  console.log('Success');
} else {
  console.log('Regex did not match');
}
