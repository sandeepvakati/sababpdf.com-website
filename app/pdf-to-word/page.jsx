'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { convertPdfToWord } from '@/utils/conversionUtils';
import { FileText, Download, FileJson, Trash2 } from 'lucide-react';

const pdfToWordContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click the upload area or drag and drop a PDF file. SababPDF accepts all standard PDF documents including scanned PDFs, text-based PDFs, and mixed-content files.' },
        { title: 'Start the Conversion', description: 'Click the "Convert to Word" button. SababPDF will extract text, headings, paragraphs, and formatting from your PDF and reconstruct them into an editable Word document (.docx format).' },
        { title: 'Download Your Word File', description: 'Once the conversion is complete, click "Download Word" to save the editable .docx file to your device. Open it in Microsoft Word, Google Docs, or any compatible word processor to edit the content.' },
    ],
    whyUseThis: [
        { title: 'Accurate Text Extraction', description: 'SababPDF intelligently extracts text content from PDFs while preserving paragraph structure, headings, and basic formatting. The output is a clean, editable Word document you can work with immediately.' },
        { title: 'No Software Required', description: 'You do not need Microsoft Word, Adobe Acrobat, or any paid software installed on your computer. The conversion runs entirely in your browser and produces a standard .docx file.' },
        { title: 'Privacy First', description: 'Your PDF is processed locally in your browser. The file is never uploaded to any server, ensuring complete privacy for sensitive documents like legal contracts, resumes, or medical records.' },
        { title: 'Works on All Devices', description: 'Convert PDFs to Word on your desktop, laptop, tablet, or mobile phone. No app downloads needed — just open SababPDF in any modern browser and start converting.' },
    ],
    tips: [
        'For best results, use text-based PDFs rather than scanned images. Text-based PDFs produce much more accurate Word documents.',
        'If your PDF contains complex layouts with multiple columns, tables, or graphics, the Word output may need minor formatting adjustments.',
        'After conversion, open the Word file and use "Find and Replace" to quickly fix any formatting inconsistencies.',
        'For scanned document PDFs, consider using our PDF to Excel tool with OCR enabled first to extract tabular data.',
        'Large PDFs with hundreds of pages may take a bit longer to convert. Be patient while the processing completes.',
    ],
    faqs: [
        { question: 'Will the Word file look exactly like my PDF?', answer: 'The converter preserves text content, headings, and basic formatting. However, complex layouts, custom fonts, and precise positioning may differ slightly. The goal is to give you editable text that you can refine, not a pixel-perfect replica of the PDF appearance.' },
        { question: 'Can I convert scanned PDFs to Word?', answer: 'SababPDF works best with text-based PDFs where the text is selectable. For scanned PDFs (which are essentially images), the tool may extract limited text. For scanned documents, specialized OCR software may produce better results.' },
        { question: 'Is there a page limit for conversion?', answer: 'There is no strict page limit. You can convert PDFs of any size. However, very large documents (100+ pages) may take longer to process since everything runs in your browser.' },
        { question: 'What Word format is produced?', answer: 'The output is a .docx file, which is the modern Microsoft Word format. It can be opened in Microsoft Word 2007 and later, Google Docs, LibreOffice Writer, Apple Pages, and most other word processors.' },
        { question: 'Is my PDF uploaded to a server?', answer: 'No. SababPDF processes your PDF entirely in your browser using JavaScript. Your file never leaves your device. This makes it safe for confidential documents that you cannot share with third-party services.' },
    ],
    relatedTools: [
        { name: 'Word to PDF', href: '/word-to-pdf', icon: '📝' },
        { name: 'PDF to Excel', href: '/pdf-to-excel', icon: '📊' },
        { name: 'PDF to JPG', href: '/pdf-to-jpg', icon: '🖼️' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'Unlock PDF', href: '/unlock-pdf', icon: '🔓' },
    ],
};

const PdfToWord = () => {
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
            const wordBlob = await convertPdfToWord(file);
            const url = URL.createObjectURL(wordBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting PDF to Word:', error);
            // Show specific error message if available (e.g., "No text found...")
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
                        <FileText className="h-8 w-8 text-blue-600" />
                        PDF to Word
                    </h1>
                    <p className="text-gray-600">
                        Convert your PDF files to editable DOCX documents.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded">
                                        <FileJson className="h-6 w-6 text-blue-600" />
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
                                            download={`${file.name.replace(/\.[^/.]+$/, "")}.docx`}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Word
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to Word'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Convert PDF to Word"
                howToUse={pdfToWordContent.howToUse}
                whyUseThis={pdfToWordContent.whyUseThis}
                tips={pdfToWordContent.tips}
                faqs={pdfToWordContent.faqs}
                relatedTools={pdfToWordContent.relatedTools}
            />
        </div>
    );
};

export default PdfToWord;
