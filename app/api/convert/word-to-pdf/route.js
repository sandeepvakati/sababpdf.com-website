import { NextResponse } from 'next/server';
import libre from 'libreoffice-convert';
import { promisify } from 'util';

const convertAsync = promisify(libre.convert);

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[${new Date().toISOString()}] Converting file: ${file.name}`);
        const startTime = Date.now();

        // Convert Word to PDF using LibreOffice
        const pdfBuf = await convertAsync(buffer, '.pdf', undefined);

        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] Conversion completed in ${duration}ms`);

        // Return the PDF buffer
        return new NextResponse(pdfBuf, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^/.]+$/, ".pdf")}"`,
            },
        });

    } catch (error) {
        console.error('Conversion error:', error);
        return NextResponse.json(
            { error: 'Conversion failed', details: error.message },
            { status: 500 }
        );
    }
}
