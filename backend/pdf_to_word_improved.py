#!/usr/bin/env python3
"""
Fast PDF to Word Converter using pdf2docx
Optimized for speed with good quality table detection
"""

import sys
import os
import json
import logging
import time

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

try:
    from pdf2docx import Converter
except ImportError as e:
    print(json.dumps({"success": False, "message": f"Missing dependency: {e}. Install with: pip install pdf2docx"}))
    sys.exit(1)


def convert_pdf_to_word(pdf_path, docx_path, mode='no-ocr'):
    """
    Convert PDF to Word using pdf2docx library
    Optimized for faster conversion
    """
    start_time = time.time()
    
    try:
        logger.info(f"Opening PDF: {pdf_path}")
        
        # Get PDF info first
        import fitz
        pdf_doc = fitz.open(pdf_path)
        total_pages = len(pdf_doc)
        pdf_doc.close()
        
        logger.info(f"PDF has {total_pages} pages")
        
        def run_conversion(use_multiprocessing):
            cv = Converter(pdf_path)
            try:
                cv.convert(
                    docx_path,
                    start=0,
                    end=None,
                    multi_processing=use_multiprocessing,
                )
            finally:
                cv.close()

        # Conversion settings optimized for speed when multiprocessing is allowed.
        logger.info("Starting conversion...")

        try:
            run_conversion(use_multiprocessing=True)
        except PermissionError:
            logger.warning("Multiprocessing is not available here. Retrying in single-process mode.")
            run_conversion(use_multiprocessing=False)
        
        elapsed = time.time() - start_time
        logger.info(f"Conversion completed in {elapsed:.1f} seconds")
        logger.info(f"Saved document to: {docx_path}")
        
        # Verify output
        if os.path.exists(docx_path) and os.path.getsize(docx_path) > 0:
            output_size = os.path.getsize(docx_path)
            
            print(json.dumps({
                "success": True,
                "message": f"Converted {total_pages} pages in {elapsed:.1f}s",
                "pages": total_pages,
                "output_size": output_size,
                "time_taken": round(elapsed, 1)
            }))
            return 0
        else:
            print(json.dumps({"success": False, "message": "Output file is empty"}))
            return 1
            
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"Conversion error after {elapsed:.1f}s: {e}")
        print(json.dumps({"success": False, "message": str(e)}))
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "message": "Usage: python script.py <input.pdf> <output.docx> [mode]"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    mode = sys.argv[3] if len(sys.argv) > 3 else 'no-ocr'
    
    if not os.path.exists(pdf_path):
        print(json.dumps({"success": False, "message": f"Input file not found: {pdf_path}"}))
        sys.exit(1)
    
    logger.info(f"Starting conversion: {pdf_path} -> {docx_path}")
    exit_code = convert_pdf_to_word(pdf_path, docx_path, mode)
    sys.exit(exit_code)
