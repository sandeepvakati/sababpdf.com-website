import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const PptxGenJS = (await import('pptxgenjs')).default;
        const pdfParse = (await import('pdf-parse')).default;

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdfParse(buffer);

        const pptx = new PptxGenJS();
        const pages = data.text.split('\f'); // form feed = page break in PDFs

        pages.forEach((pageText, i) => {
            const slide = pptx.addSlide();
            const lines = pageText.trim().split('\n').filter(l => l.trim()).slice(0, 20);

            if (lines[0]) {
                slide.addText(lines[0], { x: 0.5, y: 0.3, w: 9, h: 1, fontSize: 24, bold: true, color: '363636' });
            }
            if (lines.length > 1) {
                slide.addText(lines.slice(1).join('\n'), { x: 0.5, y: 1.5, w: 9, h: 5, fontSize: 14, color: '666666' });
            }
        });

        const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' });

        return new NextResponse(pptxBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': 'attachment; filename="converted.pptx"',
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
