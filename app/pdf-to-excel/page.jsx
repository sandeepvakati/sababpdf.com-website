'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { convertPdfToExcel } from '@/utils/conversionUtils';
import { FileSpreadsheet, Download, FileJson, Trash2 } from 'lucide-react';

const pdfToExcelContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click the upload area or drag and drop a PDF file containing tabular data like invoices, financial reports, or data tables. SababPDF will read the document and prepare it for conversion.' },
        { title: 'Enable OCR if Needed', description: 'If your PDF is a scanned document (an image of a printed page), check the "Use OCR" option. OCR (Optical Character Recognition) extracts text from scanned images, enabling conversion even when the PDF does not contain selectable text.' },
        { title: 'Convert and Download', description: 'Click "Convert to Excel" and SababPDF will extract tabular data from your PDF and structure it into an editable Excel spreadsheet (.xlsx). Download the result and open it in Excel, Google Sheets, or any spreadsheet application.' },
    ],
    whyUseThis: [
        { title: 'OCR Support for Scanned PDFs', description: 'Unlike basic converters, SababPDF includes OCR technology that can extract text from scanned documents and images. This means even photos of receipts, printed invoices, or scanned reports can be converted to editable spreadsheets.' },
        { title: 'Editable Spreadsheet Output', description: 'The output .xlsx file contains properly structured data that you can filter, sort, calculate with formulas, and manipulate just like any other Excel spreadsheet. Save hours of manual data entry.' },
        { title: 'No Software Installation', description: 'Convert PDFs to Excel directly in your browser without installing Microsoft Excel, Adobe Acrobat, or any other software. Works on Windows, Mac, Linux, and mobile devices.' },
        { title: 'Secure & Private', description: 'All processing happens locally in your browser. Sensitive financial data, business reports, and personal information are never uploaded to external servers.' },
    ],
    tips: [
        'For best results, use PDFs that contain clearly structured tables with consistent formatting, borders, and column headers.',
        'Enable OCR only for scanned documents. For text-based PDFs, leaving OCR off produces faster and more accurate results.',
        'After conversion, review the Excel file to check that column alignment is correct. Complex multi-column layouts may need minor adjustments.',
        'If your PDF has multiple tables on different pages, each table may appear on a separate row group in the Excel output.',
        'For very large PDFs, OCR processing may take several minutes. Be patient while the tool processes each page.',
    ],
    faqs: [
        { question: 'When should I enable the OCR option?', answer: 'Enable OCR when your PDF was created by scanning a printed document. Scanned PDFs are essentially images and do not contain selectable text. OCR reads the text from these images so it can be converted to editable spreadsheet data. For digital PDFs where you can select and copy text, leave OCR off for faster processing.' },
        { question: 'How accurate is the data extraction?', answer: 'Accuracy depends on the quality and structure of the source PDF. Well-formatted tables with clear borders and consistent formatting produce excellent results. Complex layouts with merged cells, nested tables, or unusual formatting may require some manual cleanup.' },
        { question: 'What Excel format is the output?', answer: 'The output is a .xlsx file (the modern Excel format). It can be opened in Microsoft Excel 2007 and later, Google Sheets, LibreOffice Calc, Apple Numbers, and most other spreadsheet applications.' },
        { question: 'Can I convert a PDF with multiple pages?', answer: 'Yes, all pages in the PDF are processed. Tabular data from each page is extracted and included in the Excel output. Data from different pages may appear in sequence within the spreadsheet.' },
        { question: 'Is there a limit on PDF file size?', answer: 'There is no strict size limit. However, since processing occurs in your browser, very large PDFs (especially with OCR enabled) may take longer. For optimal performance, keep files under 20 MB.' },
    ],
    relatedTools: [
        { name: 'Excel to PDF', href: '/excel-to-pdf', icon: '📊' },
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📝' },
        { name: 'PDF to JPG', href: '/pdf-to-jpg', icon: '🖼️' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Unlock PDF', href: '/unlock-pdf', icon: '🔓' },
        { name: 'Scan to PDF', href: '/scan-to-pdf', icon: '📱' },
    ],
};

const PdfToExcel = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const [useOcr, setUseOcr] = useState(false);

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            // Reset OCR option when new file is selected, or keep it? 
            // Better to keep user choice or reset? Let's keep it manual.
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setDownloadUrl(null);
        setUseOcr(false);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const excelBlob = await convertPdfToExcel(file, { useOcr });
            const url = URL.createObjectURL(excelBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting PDF to Excel:', error);
            alert(error.message || 'Failed to convert PDF file. Please try a different document.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                        PDF to Excel
                    </h1>
                    <p className="text-gray-600">
                        Convert your PDF files to editable Excel spreadsheets.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-green-100 p-2 rounded">
                                        <FileJson className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useOcr"
                                    checked={useOcr}
                                    onChange={(e) => setUseOcr(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label htmlFor="useOcr" className="text-gray-700 font-medium select-none cursor-pointer">
                                    Use OCR (for Scanned Documents/Images)
                                </label>
                            </div>

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download={`${file.name.replace(/\.[^/.]+$/, "")}.xlsx`}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Excel
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to Excel'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Convert PDF to Excel"
                howToUse={pdfToExcelContent.howToUse}
                whyUseThis={pdfToExcelContent.whyUseThis}
                tips={pdfToExcelContent.tips}
                faqs={pdfToExcelContent.faqs}
                relatedTools={pdfToExcelContent.relatedTools}
            />
        </div>
    );
};

export default PdfToExcel;
