'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { convertWordToPdf } from '@/utils/conversionUtils';
import { FileText, Download, FileJson, Trash2 } from 'lucide-react';

const wordToPdfContent = {
    howToUse: [
        { title: 'Upload Your Word File', description: 'Click the upload area or drag and drop a .docx file. SababPDF currently supports the modern .docx format (Word 2007 and later). If you have an older .doc file, save it as .docx first in your word processor.' },
        { title: 'Convert to PDF', description: 'Click the "Convert to PDF" button. SababPDF will process your Word document and generate a high-quality PDF version that preserves your text, headings, and paragraph structure.' },
        { title: 'Download Your PDF', description: 'Once conversion is complete, click "Download PDF" to save the file to your device. The PDF is ready to share, print, or upload to any platform.' },
    ],
    whyUseThis: [
        { title: 'Instant Conversion', description: 'Convert your Word documents to PDF in seconds. No waiting for email delivery or server processing queues — the result is available immediately in your browser.' },
        { title: 'Universal Compatibility', description: 'PDFs look identical on every device and operating system. Converting to PDF ensures your document formatting stays consistent whether viewed on Windows, Mac, phone, or tablet.' },
        { title: 'No Microsoft Word Needed', description: 'You do not need Microsoft Word installed to convert .docx files to PDF. SababPDF handles the conversion entirely through your web browser, making it accessible from any device.' },
        { title: 'Secure & Private', description: 'Your Word file is processed locally in your browser and is never uploaded to any external server. This makes it safe to convert confidential business documents, legal contracts, and personal files.' },
    ],
    tips: [
        'For the best results, make sure your Word document uses standard formatting. Complex layouts with text boxes, embedded objects, or advanced Word features may not convert perfectly.',
        'If your Word file has many images, the resulting PDF may be larger. Consider using our Compress PDF tool afterward to reduce the file size.',
        'Always review the PDF after conversion to ensure all content, especially tables and images, appears correctly before sharing.',
        'If you need to convert the PDF back to Word later, use our PDF to Word tool.',
        'For older .doc files, open them in Google Docs or LibreOffice, save as .docx, then upload to SababPDF for conversion.',
    ],
    faqs: [
        { question: 'Does the conversion preserve formatting?', answer: 'SababPDF preserves text content, headings, paragraph styles, and basic formatting. Simple documents convert very well. Complex layouts with advanced Word features like SmartArt, track changes, or macros may not be fully preserved.' },
        { question: 'Can I convert .doc files (older Word format)?', answer: 'Currently, SababPDF supports .docx files (the modern Word format used since Word 2007). If you have an older .doc file, you can easily convert it to .docx by opening it in Microsoft Word, Google Docs, or LibreOffice and saving it in the newer format.' },
        { question: 'Is there a file size limit?', answer: 'There is no strict file size limit. However, since the conversion happens in your browser, very large documents (over 50 MB) may be slower. For optimal performance, keep your Word files under 20 MB.' },
        { question: 'Will my document look the same as in Word?', answer: 'The PDF output preserves text, headings, and paragraph structure accurately. However, exact font rendering may vary if your document uses custom or proprietary fonts that are not available in the browser environment.' },
        { question: 'Can I convert multiple Word files at once?', answer: 'Currently, this tool converts one file at a time. To create a single PDF from multiple Word documents, convert each one separately and then use our Merge PDF tool to combine them.' },
    ],
    relatedTools: [
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📄' },
        { name: 'Excel to PDF', href: '/excel-to-pdf', icon: '📊' },
        { name: 'HTML to PDF', href: '/html-to-pdf', icon: '🌐' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'Add Page Numbers', href: '/add-page-numbers', icon: '🔢' },
    ],
};

const WordToPdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

            if (fileExtension === 'doc') {
                alert('This tool currently supports .docx files only. Please save your file as .docx and try again.');
                return;
            }

            setFile(selectedFile);
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
            const pdfBlob = await convertWordToPdf(file);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting Word to PDF:', error);
            alert('Failed to convert Word file. Please try a simpler document.');
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
                        Word to PDF
                    </h1>
                    <p className="text-gray-600">
                        Convert your DOC and DOCX files to PDF instantly.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".docx" />
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
                                        className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to PDF'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Convert Word to PDF"
                howToUse={wordToPdfContent.howToUse}
                whyUseThis={wordToPdfContent.whyUseThis}
                tips={wordToPdfContent.tips}
                faqs={wordToPdfContent.faqs}
                relatedTools={wordToPdfContent.relatedTools}
            />
        </div>
    );
};

export default WordToPdf;
