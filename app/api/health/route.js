import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'SababPDF Next.js API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: 'GET /api/health',
            convertPptx: 'POST /api/convert/pptx-to-pdf',
            convertWord: 'POST /api/convert/word-to-pdf'
        }
    });
}
