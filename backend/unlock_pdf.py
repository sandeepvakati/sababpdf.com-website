#!/usr/bin/env python3
"""
Robust PDF Unlock Tool
Handles both user and owner passwords using multiple methods
"""

import sys
import os
from pathlib import Path

def unlock_pdf_pypdf(input_path, output_path, password=''):
    """
    Unlock PDF using PyPDF2 - most reliable method
    Removes both user and owner passwords
    """
    try:
        from PyPDF2 import PdfReader, PdfWriter

        reader = PdfReader(input_path)

        # If PDF is encrypted, try to decrypt
        if reader.is_encrypted:
            if not password:
                # Try with empty password (owner/blank password)
                result = reader.decrypt('')
                if result == 0:
                    raise ValueError('PDF requires a password')
            else:
                result = reader.decrypt(password)
                if result == 0:
                    raise ValueError('Incorrect password')

        # Create new PDF without encryption
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)

        # Copy metadata if available
        if reader.metadata:
            writer.add_metadata(reader.metadata)

        with open(output_path, 'wb') as output_file:
            writer.write(output_file)

        return True
    except ImportError:
        return None  # PyPDF2 not available
    except Exception as e:
        raise Exception(f'PyPDF2 unlock failed: {str(e)}')


def unlock_pdf_pymupdf(input_path, output_path, password=''):
    """
    Unlock PDF using PyMuPDF (fitz) - alternative method
    Good for handling various encryption types
    """
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(input_path)
        
        # If document is encrypted, try to authenticate
        if doc.is_encrypted:
            if password:
                auth = doc.authenticate(password)
                if not auth:
                    raise ValueError('Incorrect password')
            else:
                # Try with empty password
                auth = doc.authenticate('')
                if not auth:
                    raise ValueError('PDF requires a password')
        
        # Save without encryption
        doc.save(output_path, encryption=fitz.PDF_ENCRYPT_NONE)
        doc.close()
        
        return True
    except ImportError:
        return None  # PyMuPDF not available
    except Exception as e:
        raise Exception(f'PyMuPDF unlock failed: {str(e)}')


def unlock_pdf_pikepdf(input_path, output_path, password=''):
    """
    Unlock PDF using pikepdf - second fallback
    Handles many encryption types including AES-256
    """
    try:
        import pikepdf

        open_kwargs = {}
        if password and password.strip():
            open_kwargs['password'] = password.strip()

        try:
            pdf = pikepdf.open(input_path, **open_kwargs)
        except pikepdf.PasswordError:
            if not password:
                raise ValueError('PDF requires a password')
            raise ValueError('Incorrect password')

        pdf.save(output_path)
        pdf.close()
        return True
    except ImportError:
        return None  # pikepdf not available
    except Exception as e:
        raise Exception(f'pikepdf unlock failed: {str(e)}')



def unlock_pdf(input_path, output_path, password=''):
    """
    Main unlock function - tries multiple methods
    Returns True if successful
    """
    errors = []

    # Try PyPDF2 first
    result = unlock_pdf_pypdf(input_path, output_path, password)
    if result is True:
        return True
    elif result is None:
        errors.append('PyPDF2 not installed')

    # Try PyMuPDF as second option
    result = unlock_pdf_pymupdf(input_path, output_path, password)
    if result is True:
        return True
    elif result is None:
        errors.append('PyMuPDF not installed')

    # Try pikepdf as last resort
    result = unlock_pdf_pikepdf(input_path, output_path, password)
    if result is True:
        return True
    elif result is None:
        errors.append('pikepdf not installed')

    raise Exception(f'Could not unlock PDF. Install PyPDF2, PyMuPDF or pikepdf. Errors: {"; ".join(errors)}')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python unlock_pdf.py <input_file> <output_file> [password]')
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    password = sys.argv[3] if len(sys.argv) > 3 else ''
    
    try:
        unlock_pdf(input_file, output_file, password)
        print(f'SUCCESS: PDF unlocked and saved to {output_file}')
    except Exception as e:
        print(f'ERROR: {str(e)}', file=sys.stderr)
        sys.exit(1)
