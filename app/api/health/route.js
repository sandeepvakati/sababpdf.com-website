import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'SababPDF Next.js API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: 'GET /api/health',
            contact: 'POST /api/contact',
            convertPptx: 'POST /api/convert/pptx-to-pdf',
            convertWord: 'POST /api/convert/word-to-pdf',
            convertPdfToExcel: 'POST /api/convert/pdf-to-excel',
            convertPdfToPptx: 'POST /api/convert/pdf-to-pptx'
        }
    });
}
