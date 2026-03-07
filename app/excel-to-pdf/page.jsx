'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { convertExcelToPdf } from '@/utils/conversionUtils';
import { FileSpreadsheet, Download, FileJson, Trash2 } from 'lucide-react';

const excelToPdfContent = {
    howToUse: [
        { title: 'Upload Your Excel File', description: 'Click the upload area or drag and drop your .xlsx or .xls spreadsheet file. SababPDF will read your spreadsheet data including all sheets, formatting, and cell values.' },
        { title: 'Convert to PDF', description: 'Click the "Convert to PDF" button. SababPDF processes your spreadsheet and generates a clean, well-formatted PDF that preserves your table structure, column headers, and data layout.' },
        { title: 'Download Your PDF', description: 'Once the conversion is complete, click "Download PDF" to save the file. The PDF version of your spreadsheet is ready for sharing, printing, or archiving.' },
    ],
    whyUseThis: [
        { title: 'Preserves Table Structure', description: 'Your spreadsheet data is converted into clean, readable PDF tables with proper column alignment and row formatting. Headers, cell borders, and data layout are all maintained.' },
        { title: 'No Excel Required', description: 'You do not need Microsoft Excel installed on your computer. SababPDF reads .xlsx and .xls files directly in your browser and converts them to PDF without any additional software.' },
        { title: 'Share Without Editing Risk', description: 'PDFs cannot be easily edited, making them ideal for sharing financial reports, invoices, data summaries, and other spreadsheets where you want to prevent accidental changes.' },
        { title: 'Secure Local Processing', description: 'Your spreadsheet is processed entirely in your browser. Sensitive financial data, employee information, or business metrics are never uploaded to any external server.' },
    ],
    tips: [
        'For best results, make sure your Excel file has clean formatting with clear headers and consistent data types in each column.',
        'If your spreadsheet has multiple sheets, all sheets will be included in the PDF output. Remove any sheets you do not want to include before converting.',
        'Very wide spreadsheets with many columns may need to be reformatted or split into multiple sheets for optimal PDF readability.',
        'After conversion, use our Compress PDF tool if the resulting PDF is too large for email attachments or uploads.',
        'If you need to convert the PDF back to Excel later, use our PDF to Excel tool.',
    ],
    faqs: [
        { question: 'Does the PDF preserve formulas from Excel?', answer: 'The PDF shows the calculated values (results) of your formulas, not the formulas themselves. PDFs are static documents and do not support live calculations. This is actually ideal for sharing results without exposing your formula logic.' },
        { question: 'Are charts and graphs preserved?', answer: 'Currently, the conversion focuses primarily on tabular data. Charts, graphs, and embedded images may not be fully reproduced in the PDF output. For best results, export charts separately as images.' },
        { question: 'Can I convert .xls files (older Excel format)?', answer: 'Yes, SababPDF supports both the modern .xlsx format and the older .xls format. Both file types can be uploaded and converted to PDF.' },
        { question: 'How does it handle multiple sheets?', answer: 'All sheets in your Excel workbook will be processed and included in the PDF output. Each sheet appears as a separate section in the resulting PDF document.' },
        { question: 'Is there a file size limit?', answer: 'There is no strict file size limit. However, since processing happens in your browser, very large spreadsheets with thousands of rows may take longer. For optimal performance, keep files under 10 MB.' },
    ],
    relatedTools: [
        { name: 'PDF to Excel', href: '/pdf-to-excel', icon: '📊' },
        { name: 'Word to PDF', href: '/word-to-pdf', icon: '📝' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'HTML to PDF', href: '/html-to-pdf', icon: '🌐' },
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📄' },
    ],
};

const ExcelToPdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setDownloadUrl(null);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const pdfBlob = await convertExcelToPdf(file);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting Excel to PDF:', error);
            alert('Failed to convert Excel file. Please ensure it is a valid .xlsx or .xls file.');
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
                        Excel to PDF
                    </h1>
                    <p className="text-gray-600">
                        Convert your Excel spreadsheets to PDF instantly.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".xlsx,.xls" />
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

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download={`${file.name.replace(/\.[^/.]+$/, "")}.pdf`}
                                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download PDF
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Converting...
                                        </span>
                                    ) : (
                                        'Convert to PDF'
                                    )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Convert Excel to PDF"
                howToUse={excelToPdfContent.howToUse}
                whyUseThis={excelToPdfContent.whyUseThis}
                tips={excelToPdfContent.tips}
                faqs={excelToPdfContent.faqs}
                relatedTools={excelToPdfContent.relatedTools}
            />
        </div>
    );
};

export default ExcelToPdf;
