@echo off
echo ====================================
echo PDF to Word Converter - Test Script
echo ====================================
echo.

cd /d "%~dp0"

echo Testing Python converter...
python -c "
import sys
sys.path.insert(0, '.')
from pdf_to_word_table import check_dependencies

if check_dependencies():
    print('✓ All dependencies are available')
    print('✓ Converter is ready to use')
else:
    print('✗ Missing dependencies')
    sys.exit(1)
"

if %errorlevel% neq 0 (
    echo.
    echo Please install required packages:
    echo   pip install pymupdf python-docx pdfplumber Pillow
    pause
    exit /b 1
)

echo.
echo ====================================
echo Converter is ready!
echo ====================================
echo.
echo To test with a PDF file:
echo   python pdf_to_word_table.py input.pdf output.docx
echo.
pause
