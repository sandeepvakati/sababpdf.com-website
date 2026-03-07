import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function decodeXmlEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}

function extractSlideText(xml) {
    const textMatches = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)];
    const text = textMatches
        .map((match) => decodeXmlEntities(match[1] || '').trim())
        .filter(Boolean)
        .join('\n');
    return text;
}

function wrapTextToWidth(text, font, fontSize, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [''];

    const lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i += 1) {
        const candidate = `${currentLine} ${words[i]}`;
        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
            currentLine = candidate;
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
            return NextResponse.json({ error: 'No file' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = await JSZip.loadAsync(buffer);

        const slideFiles = Object.keys(zip.files)
            .filter((filePath) => /ppt\/slides\/slide\d+\.xml/.test(filePath))
            .sort((a, b) => {
                const aNum = Number((a.match(/slide(\d+)\.xml/) || [])[1] || 0);
                const bNum = Number((b.match(/slide(\d+)\.xml/) || [])[1] || 0);
                return aNum - bNum;
            });

        if (slideFiles.length === 0) {
            return NextResponse.json({ error: 'No slides found in PPTX file' }, { status: 422 });
        }

        const pdfDoc = await PDFDocument.create();
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const marginX = 40;
        const maxWidth = pageWidth - marginX * 2;

        for (let i = 0; i < slideFiles.length; i += 1) {
            const xml = await zip.files[slideFiles[i]].async('string');
            const slideText = extractSlideText(xml);

            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            page.drawText(`Slide ${i + 1}`, {
                x: marginX,
                y: pageHeight - 60,
                font: titleFont,
                size: 20,
                color: rgb(0.2, 0.2, 0.2),
            });

            const paragraph = slideText || 'No text content detected on this slide.';
            let y = pageHeight - 95;

            for (const sourceLine of paragraph.split('\n')) {
                const wrappedLines = wrapTextToWidth(sourceLine, bodyFont, 12, maxWidth);
                for (const line of wrappedLines) {
                    if (y < 45) break;
                    page.drawText(line, {
                        x: marginX,
                        y,
                        font: bodyFont,
                        size: 12,
                        color: rgb(0.1, 0.1, 0.1),
                    });
                    y -= 16;
                }
                y -= 6;
                if (y < 45) break;
            }
        }

        const pdfBuffer = Buffer.from(await pdfDoc.save());

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="converted.pdf"',
            },
        });
    } catch (error) {
        console.error('[pptx-to-pdf] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
