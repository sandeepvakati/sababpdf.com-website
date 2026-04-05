#!/usr/bin/env python3
"""
Word to PDF Converter - Enhanced Version
Uses LibreOffice headless mode for high-fidelity conversion
Supports: .doc, .docx formats with full formatting preservation
"""

import sys
import os
import subprocess
import json
import time
from pathlib import Path

def find_libreoffice():
    """Find LibreOffice executable on the system"""
    if sys.platform == 'win32':
        # Windows - check common installation paths
        possible_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            r"C:\Program Files\LibreOffice 7\program\soffice.exe",
            r"C:\Program Files\LibreOffice 6\program\soffice.exe",
            r"%PROGRAMFILES%\LibreOffice\program\soffice.exe",
            r"%PROGRAMFILES(X86)%\LibreOffice\program\soffice.exe",
        ]

        for cmd_path in possible_paths:
            expanded_path = os.path.expandvars(cmd_path)
            if os.path.exists(expanded_path):
                return expanded_path

        # Try using 'where' command
        try:
            result = subprocess.run(['where', 'soffice'], capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip().split('\n')[0]
        except:
            pass

        return None
    else:
        # Linux/Mac
        for cmd in ['libreoffice', 'soffice']:
            try:
                result = subprocess.run(['which', cmd], capture_output=True, text=True)
                if result.returncode == 0:
                    return cmd
            except:
                pass
        return None


def convert_word_to_pdf(input_path: str, output_path: str) -> tuple[bool, str]:
    """
    Convert Word document to PDF using LibreOffice with high-quality settings

    Args:
        input_path: Path to input DOC/DOCX file
        output_path: Path for output PDF

    Returns:
        (success: bool, message: str)
    """

    # Check if input file exists
    if not os.path.exists(input_path):
        return False, f"Input file not found: {input_path}"

    # Check file size (LibreOffice has limits)
    file_size = os.path.getsize(input_path)
    if file_size > 100 * 1024 * 1024:  # 100MB limit
        return False, "File too large. Maximum size is 100MB."

    # Find LibreOffice
    libreoffice_cmd = find_libreoffice()
    if not libreoffice_cmd:
        return False, "LibreOffice not found. Please install LibreOffice from https://www.libreoffice.org/download/"

    try:
        # Get output directory
        output_dir = os.path.dirname(output_path) or '.'
        os.makedirs(output_dir, exist_ok=True)

        # Create a temporary directory for conversion to avoid conflicts
        temp_dir = os.path.join(output_dir, f'temp_conversion_{int(time.time())}')
        os.makedirs(temp_dir, exist_ok=True)

        # Use LibreOffice's native PDF export with high-quality settings
        # This preserves formatting, tables, and layout much better
        cmd = [
            libreoffice_cmd,
            '--headless',
            '--norestore',
            '--convert-to', 'pdf:writer_pdf_Export',
            '--outdir', temp_dir,
            input_path
        ]

        print(f"Converting: {input_path} -> {output_path}", file=sys.stderr)
        print(f"Using LibreOffice: {libreoffice_cmd}", file=sys.stderr)
        print(f"Using high-quality PDF export filter", file=sys.stderr)

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        # LibreOffice creates PDF with same base name as input
        input_base = os.path.splitext(os.path.basename(input_path))[0]
        expected_output = os.path.join(temp_dir, f"{input_base}.pdf")

        # Wait for file to be written
        time.sleep(1)

        # Check if conversion was successful
        if os.path.exists(expected_output):
            # Copy to expected output path
            import shutil
            shutil.copy2(expected_output, output_path)

            # Clean up temp directory
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except:
                pass

            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                return True, "Successfully converted Word to PDF with high quality"

        # If native export failed, try alternative filter
        print(f"Native export failed, trying alternative filter...", file=sys.stderr)
        
        cmd_alt = [
            libreoffice_cmd,
            '--headless',
            '--norestore',
            '--convert-to', 'pdf',
            '--outdir', temp_dir,
            input_path
        ]

        result_alt = subprocess.run(
            cmd_alt,
            capture_output=True,
            text=True,
            timeout=300
        )

        time.sleep(1)

        if os.path.exists(expected_output):
            import shutil
            shutil.copy2(expected_output, output_path)

            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except:
                pass

            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                return True, "Successfully converted Word to PDF"

        # Check for errors in stderr
        if result.stderr:
            error_msg = result.stderr.strip()
            # Filter out common warnings
            error_lines = [line for line in error_msg.split('\n')
                          if 'warn:' not in line.lower() and 'warning' not in line.lower()]
            if error_lines:
                print(f"LibreOffice output: {'; '.join(error_lines[:3])}", file=sys.stderr)

        if result.returncode != 0:
            return False, f"LibreOffice conversion failed (exit code {result.returncode})"

        return False, "Conversion completed but output file not found"

    except subprocess.TimeoutExpired:
        return False, "Conversion timed out after 5 minutes. Try a smaller document."
    except FileNotFoundError:
        return False, "LibreOffice not found. Please install LibreOffice."
    except PermissionError:
        return False, "Permission denied. Check file permissions."
    except Exception as e:
        return False, f"Conversion error: {str(e)}"


def main():
    """CLI entry point"""
    if len(sys.argv) < 3:
        print("Usage: python word_to_pdf_converter.py <input_doc> <output_pdf>")
        sys.exit(1)

    input_doc = sys.argv[1]
    output_pdf = sys.argv[2]

    success, message = convert_word_to_pdf(input_doc, output_pdf)

    result = {
        'success': success,
        'message': message,
        'input': input_doc,
        'output': output_pdf,
    }

    print(json.dumps(result, indent=2))
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
