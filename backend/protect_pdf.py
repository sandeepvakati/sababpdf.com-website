import sys
import os

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.stderr.write("PyMuPDF (fitz) is not installed. Please install it using: pip install pymupdf\n")
    sys.exit(1)

def protect_pdf(input_path, output_path, password):
    try:
        doc = fitz.open(input_path)
        # Protect with AES-256
        doc.save(
            output_path,
            encryption=fitz.PDF_ENCRYPT_AES_256,
            owner_pw=password,
            user_pw=password,
            permissions=int(fitz.PDF_PERM_ACCESSIBILITY | fitz.PDF_PERM_PRINT)
        )
        doc.close()
        sys.exit(0)
    except Exception as e:
        sys.stderr.write(str(e) + "\n")
        sys.exit(2)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.stderr.write("Usage: python protect_pdf.py <input_path> <output_path> <password>\n")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    password = sys.argv[3]
    
    protect_pdf(input_path, output_path, password)
