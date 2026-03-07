import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function wrapTextToWidth(text, font, fontSize, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [''];

    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i += 1) {
        const nextCandidate = `${currentLine} ${words[i]}`;
        if (font.widthOfTextAtSize(nextCandidate, fontSize) <= maxWidth) {
            currentLine = nextCandidate;
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }

    lines.push(currentLine);
    return lines;
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const { value: extractedText } = await mammoth.extractRawText({ buffer });
        const normalizedText = (extractedText || '').replace(/\r\n/g, '\n').trim();

        if (!normalizedText) {
            return NextResponse.json({ error: 'Could not parse Word document' }, { status: 422 });
        }

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const marginX = 50;
        const marginTop = 50;
        const marginBottom = 50;
        const fontSize = 11;
        const lineHeight = 16;
        const maxWidth = pageWidth - marginX * 2;

        let page = pdfDoc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - marginTop;

        const lines = normalizedText.split('\n');
        for (const sourceLine of lines) {
            const sanitizedLine = sourceLine.replace(/\t/g, '    ').trimEnd();
            const wrappedLines = sanitizedLine
                ? wrapTextToWidth(sanitizedLine, font, fontSize, maxWidth)
                : [''];

            for (const line of wrappedLines) {
                if (y < marginBottom) {
                    page = pdfDoc.addPage([pageWidth, pageHeight]);
                    y = pageHeight - marginTop;
                }
                page.drawText(line, {
                    x: marginX,
                    y,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                });
                y -= lineHeight;
            }
        }

        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="converted.pdf"',
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('[word-to-pdf] Error:', error);
        return NextResponse.json({ error: `Conversion failed: ${error.message}` }, { status: 500 });
    }
}
