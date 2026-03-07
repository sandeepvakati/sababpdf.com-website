import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

        // Use pdf-parse to extract text
        const pdfParse = (await import('pdf-parse')).default;
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdfParse(buffer);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('PDF Content');

        const lines = data.text.split('\n').filter(l => l.trim());
        lines.forEach((line, i) => {
            sheet.getRow(i + 1).getCell(1).value = line.trim();
        });

        const xlsxBuffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(xlsxBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="converted.xlsx"',
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
