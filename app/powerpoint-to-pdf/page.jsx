'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { powerPointToPdf } from '@/utils/conversionUtils';
import { Presentation, Download, FileJson, Trash2 } from 'lucide-react';

const pptToPdfContent = {
    howToUse: [
        { title: 'Upload Your PowerPoint File', description: 'Click the upload area or drag and drop a .pptx file. SababPDF supports the modern .pptx format (PowerPoint 2007 and later).' },
        { title: 'Convert to PDF', description: 'Click the "Convert to PDF" button. SababPDF will process your PowerPoint presentation and generate a high-quality PDF version that preserves your slides.' },
        { title: 'Download Your PDF', description: 'Once conversion is complete, click "Download PDF" to save the file to your device. The PDF is ready to share, print, or upload to any platform.' },
    ],
    whyUseThis: [
        { title: 'Instant Conversion', description: 'Convert your PowerPoint presentations to PDF in seconds. No waiting for email delivery or server processing queues — the result is available immediately.' },
        { title: 'Universal Compatibility', description: 'PDFs look identical on every device and operating system. Converting to PDF ensures your presentation formatting stays consistent whether viewed on Windows, Mac, phone, or tablet.' },
        { title: 'No PowerPoint Needed', description: 'You do not need Microsoft PowerPoint installed to convert .pptx files to PDF. SababPDF handles the conversion for you.' },
        { title: 'Preserve Your Slides', description: 'Your slides, text, images, and layout are preserved in the PDF output, making it perfect for sharing presentations without worrying about compatibility.' },
    ],
    tips: [
        'For the best results, make sure your PowerPoint uses standard fonts and formatting.',
        'If your presentation has many high-resolution images, the resulting PDF may be larger. Consider using our Compress PDF tool afterward.',
        'Always review the PDF after conversion to ensure all slides appear correctly before sharing.',
        'If you need to convert the PDF back to PowerPoint later, use our PDF to PowerPoint tool.',
    ],
    faqs: [
        { question: 'Does the conversion preserve animations?', answer: 'PDF is a static format, so animations and transitions are not preserved. Each slide is converted as a static page in the PDF.' },
        { question: 'Can I convert .ppt files (older format)?', answer: 'Currently, SababPDF supports .pptx files (the modern PowerPoint format). If you have an older .ppt file, save it as .pptx first in PowerPoint or LibreOffice.' },
        { question: 'Is there a file size limit?', answer: 'There is no strict file size limit. However, very large presentations may take longer to process. For optimal performance, keep your files under 50 MB.' },
        { question: 'Can I convert multiple presentations at once?', answer: 'Currently, this tool converts one file at a time. To combine multiple presentations, convert each one separately and then use our Merge PDF tool.' },
    ],
    relatedTools: [
        { name: 'PDF to PowerPoint', href: '/pdf-to-powerpoint', icon: '📊' },
        { name: 'Word to PDF', href: '/word-to-pdf', icon: '📄' },
        { name: 'Excel to PDF', href: '/excel-to-pdf', icon: '📊' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'Add Page Numbers', href: '/add-page-numbers', icon: '🔢' },
    ],
};

const PowerPointToPdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

            if (fileExtension === 'ppt') {
                alert('This tool currently supports .pptx files only. Please save your file as .pptx and try again.');
                return;
            }

            setFile(selectedFile);
            setDownloadUrl(null);
            setError(null);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setDownloadUrl(null);
        setError(null);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        try {
            const pdfBlob = await powerPointToPdf(file);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (err) {
            console.error('Error converting PowerPoint to PDF:', err);
            setError('Failed to convert PowerPoint file. Please try again or use a different file.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Presentation className="h-8 w-8 text-orange-600" />
                        PowerPoint to PDF
                    </h1>
                    <p className="text-gray-600">
                        Convert your PowerPoint presentations to PDF instantly.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pptx" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-orange-100 p-2 rounded">
                                        <FileJson className="h-6 w-6 text-orange-600" />
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

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center">
                                    {error}
                                </div>
                            )}

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
                                        className={`flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
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
                title="Convert PowerPoint to PDF"
                howToUse={pptToPdfContent.howToUse}
                whyUseThis={pptToPdfContent.whyUseThis}
                tips={pptToPdfContent.tips}
                faqs={pptToPdfContent.faqs}
                relatedTools={pptToPdfContent.relatedTools}
            />
        </div>
    );
};

export default PowerPointToPdf;
