export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const password = formData.get('password') || '';

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return Response.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const { PDFDocument } = await import('pdf-lib');
      
      // Try to load the PDF with password (if empty string, it will work for unprotected PDFs)
      const pdfDoc = await PDFDocument.load(buffer, { 
        password: password || undefined 
      });
      
      // Save the unlocked PDF
      const pdfBytes = await pdfDoc.save();
      const resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      return new Response(resultBlob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="unlocked_${file.name}"`,
        },
      });
    } catch (pdfError) {
      console.error('PDF processing error:', pdfError);
      throw new Error('Could not unlock PDF. Ensure the password is correct.');
    }
  } catch (error) {
    console.error('Unlock PDF error:', error);

    const errorMessage = error.message || 'Failed to unlock PDF';

    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
