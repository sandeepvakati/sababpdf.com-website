'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { convertWordToPdf } from '@/utils/conversionUtils';
import { FileText, Download, FileJson, Trash2, Eye } from 'lucide-react';
import { loadPdfjs } from '@/utils/loadPdfjs';

const wordToPdfContent = {
    howToUse: [
        { title: 'Upload Your Word File', description: 'Click the upload area or drag and drop a .docx file. SababPDF currently supports the modern .docx format (Word 2007 and later). If you have an older .doc file, save it as .docx first in your word processor.' },
        { title: 'Preview the Document', description: 'Once uploaded, click "Preview Pages" to see exact page thumbnails of what your PDF will look like before you convert it.' },
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

// Page thumbnail component for exact visual preview
const PageThumbnail = ({ pdfDoc, pageNum }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        const renderPage = async () => {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 0.4 });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: context, viewport }).promise;
            } catch (err) {
                console.error(`Error rendering page ${pageNum}:`, err);
            }
        };
        renderPage();
    }, [pdfDoc, pageNum]);

    return (
        <div className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow aspect-[1/1.414]">
            <canvas ref={canvasRef} className="w-full h-full object-contain bg-white" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                <span className="text-white text-xs font-semibold">Page {pageNum}</span>
            </div>
        </div>
    );
};

const WordToPdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    // Preview states
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Cache the generated PDF blob so we don't have to convert twice
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);

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

            // Clear preview states
            setPdfDoc(null);
            setPageCount(0);
            setShowPreview(false);
            setGeneratedPdfBlob(null);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setDownloadUrl(null);
        setPdfDoc(null);
        setPageCount(0);
        setShowPreview(false);
        setGeneratedPdfBlob(null);
    };

    const handlePreview = async () => {
        if (!file) return;

        setIsPreviewLoading(true);
        try {
            // 1. Convert Word to PDF strictly in the background to get exact pages
            const pdfBlob = generatedPdfBlob || await convertWordToPdf(file);
            setGeneratedPdfBlob(pdfBlob); // cache it

            // 2. Load the resulting PDF to extract thumbnails
            const pdfjsLib = await loadPdfjs();
            if (!pdfjsLib) throw new Error("Could not load PDF.js");

            const arrayBuffer = await pdfBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const pdf = await pdfjsLib.getDocument({ data: uint8Array.slice() }).promise;

            setPdfDoc(pdf);
            setPageCount(pdf.numPages);
            setShowPreview(true);
        } catch (err) {
            console.error("Failed to generate preview:", err);
            alert("Failed to generate preview. The document might be too complex.");
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            // If we already generated the PDF for the preview, use it! Instant conversion!
            let finalPdfBlob = generatedPdfBlob;

            if (!finalPdfBlob) {
                finalPdfBlob = await convertWordToPdf(file);
                setGeneratedPdfBlob(finalPdfBlob);
            }

            const url = URL.createObjectURL(finalPdfBlob);
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
                        Convert your DOCX files to PDF instantly and preview before converting.
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
                                <div className="flex items-center gap-2">
                                    {!showPreview && !downloadUrl && (
                                        <button
                                            onClick={handlePreview}
                                            disabled={isPreviewLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors border border-indigo-200 disabled:opacity-50"
                                        >
                                            {isPreviewLoading ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                            {isPreviewLoading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Loading...
                                        </span>
                                    ) : (
                                        'Preview Pages'
                                    )}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleRemoveFile}
                                        className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* EXACT THUMBNAIL PREVIEW AREA */}
                            {showPreview && pdfDoc && pageCount > 0 && (
                                <div className="border border-gray-200 bg-gray-50 rounded-xl p-6">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center justify-between">
                                        <span>Preview Pages</span>
                                        <span className="text-sm bg-blue-100 text-blue-800 py-1 px-3 rounded-full">
                                            {pageCount} Page{pageCount !== 1 ? 's' : ''}
                                        </span>
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2">
                                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                                            <PageThumbnail key={pageNum} pdfDoc={pdfDoc} pageNum={pageNum} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center flex-col sm:flex-row items-center gap-4">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <div className="flex items-center gap-2 text-green-600 mb-2 justify-center">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="font-medium">Conversion complete!</span>
                                        </div>
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
                                        {isProcessing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Converting...
                                            </>
                                        ) : 'Convert to PDF'}
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
