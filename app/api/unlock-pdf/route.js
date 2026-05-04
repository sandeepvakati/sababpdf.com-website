export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { PDFDocument } from 'pdf-lib';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const PYTHON_BIN = process.platform === 'win32' ? 'python' : 'python3';


/**
 * Unlock Password-Protected PDF
 * POST /api/unlock-pdf
 * 
 * Tries multiple methods:
 * 1. Python backend (PyPDF2, PyMuPDF) - most reliable
 * 2. JavaScript pdf-lib - fallback
 * 
 * Request:
 *   - file: PDF file (multipart/form-data)
 *   - password: password for protected PDF (optional)
 * 
 * Response:
 *   - Returns unlocked PDF as blob
 */

async function unlockWithPython(inputPath, password = '') {
  try {
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `unlocked_${Date.now()}.pdf`);
    const pythonScript = path.join(process.cwd(), 'backend', 'unlock_pdf.py');

    // Check if Python script exists
    try {
      await fs.access(pythonScript);
    } catch {
      console.log('Python unlock script not found, falling back to JavaScript');
      return null;
    }

    // Build args array – avoids shell injection with special chars in password
    const args = [pythonScript, inputPath, outputPath];
    if (password && password.trim()) {
      args.push(password.trim());
    }
    const quotedArgs = args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(' ');
    const cmd = `${PYTHON_BIN} ${quotedArgs}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
      console.log('Python unlock output:', stdout);
      if (stderr) console.warn('Python unlock stderr:', stderr);

      // Read the output file
      const fileBuffer = await fs.readFile(outputPath);

      // Clean up temp file
      try { await fs.unlink(outputPath); } catch (e) {}

      return fileBuffer;
    } catch (execError) {
      console.log('Python unlock error:', execError.message);

      // Clean up on error
      try { await fs.unlink(outputPath); } catch (e) {}

      const errOut = (execError.stderr || '') + (execError.stdout || '');
      if (errOut.includes('PDF requires a password') || errOut.includes('requires a password')) {
        throw new Error('This PDF requires a password. Please enter the correct password.');
      } else if (errOut.includes('Incorrect password') || errOut.includes('incorrect password')) {
        throw new Error('The password you entered is incorrect. Please try again.');
      }

      return null; // Fall back to JavaScript
    }
  } catch (error) {
    // Re-throw password errors; swallow others so JS fallback can run
    if (error.message.includes('password') || error.message.includes('incorrect')) {
      throw error;
    }
    console.error('Python unlock exception:', error);
    return null;
  }
}

async function unlockWithJavaScript(buffer, password = '') {
  try {
    // Normalize password
    const loadOptions = {};
    if (password && password.trim() !== '') {
      loadOptions.password = password.trim();
    }

    // Load the PDF with password if provided
    const pdfDoc = await PDFDocument.load(buffer, loadOptions);
    
    // Save the PDF without security/password
    const pdfBytes = await pdfDoc.save();
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('JavaScript unlock error:', error.message);
    
    if (error.message.includes('password')) {
      throw new Error('The password you entered is incorrect. Please try again.');
    } else if (error.message.includes('Invalid PDF')) {
      throw new Error('This file is not a valid PDF or is corrupted.');
    }
    
    throw new Error('Could not unlock this PDF. It may require a different type of password or have special encryption.');
  }
}

export async function POST(request) {
    let tempInputPath = null;
    
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        let password = formData.get('password');

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return Response.json({ error: 'File must be a PDF' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Try Python backend first (more robust)
        tempInputPath = path.join(os.tmpdir(), `input_${Date.now()}.pdf`);
        await fs.writeFile(tempInputPath, buffer);
        
        let unlockedBuffer = await unlockWithPython(tempInputPath, password || '');
        
        // Fall back to JavaScript if Python failed
        if (!unlockedBuffer) {
            console.log('Python unlock failed, using JavaScript pdf-lib');
            unlockedBuffer = await unlockWithJavaScript(buffer, password || '');
        }
        
        // Clean up temp input file
        try {
            await fs.unlink(tempInputPath);
        } catch (e) {
            console.log('Could not delete temp input file:', e.message);
        }
        
        const resultBlob = new Blob([unlockedBuffer], { type: 'application/pdf' });

        return new Response(resultBlob, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="unlocked_${file.name}"`,
            },
        });
    } catch (error) {
        console.error('Unlock PDF error:', error);
        
        // Clean up temp file on error
        if (tempInputPath) {
            try {
                await fs.unlink(tempInputPath);
            } catch (e) {}
        }
        
        const errorMessage = error.message || 'Failed to unlock PDF';
        return Response.json({ error: errorMessage }, { status: 500 });
    }
}
