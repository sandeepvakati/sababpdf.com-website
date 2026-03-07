'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { convertPdfToWord } from '@/utils/conversionUtils';
import { FileText, Download, FileJson, Trash2, Eye } from 'lucide-react';
import { loadPdfjs } from '@/utils/loadPdfjs';

const pdfToWordContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click the upload area or drag and drop a PDF file. SababPDF accepts all standard PDF documents including scanned PDFs, text-based PDFs, and mixed-content files.' },
        { title: 'Preview Pages', description: 'After uploading, SababPDF renders every page of your PDF as thumbnail previews so you can verify the document before converting.' },
        { title: 'Convert and Download', description: 'Click "Convert to Word" to start. The tool renders each page as an image and embeds it into the Word document along with extracted text, preserving images, charts, and graphics. Download the .docx file when done.' },
    ],
    whyUseThis: [
        { title: 'Images Preserved', description: 'Unlike basic text extractors, SababPDF renders each page as a high-quality image and embeds it into the Word document. All images, charts, diagrams, and formatting from the PDF are preserved.' },
        { title: 'Searchable Text', description: 'In addition to page images, SababPDF extracts the text content and includes it in the Word file. This means you can search, copy, and edit the text in Word.' },
        { title: 'Privacy First', description: 'Your PDF is processed locally in your browser. The file is never uploaded to any server, ensuring complete privacy for sensitive documents like legal contracts, resumes, or medical records.' },
        { title: 'Works on All Devices', description: 'Convert PDFs to Word on your desktop, laptop, tablet, or mobile phone. No app downloads needed — just open SababPDF in any modern browser and start converting.' },
    ],
    tips: [
        'For best results, use text-based PDFs rather than scanned images. Text-based PDFs produce much more accurate text extraction alongside the page images.',
        'The Word output includes both page images and extracted text. You can delete the images and keep only the text if desired.',
        'Large PDFs with many pages may take a bit longer to convert as each page is rendered. The progress bar shows you the current status.',
        'After conversion, open the Word file and use "Find and Replace" to quickly fix any text extraction inconsistencies.',
        'For scanned document PDFs, the page images will still appear correctly in the Word output even if text extraction is limited.',
    ],
    faqs: [
        { question: 'Will the Word file look exactly like my PDF?', answer: 'Each page of your PDF is rendered as a high-quality image and embedded in the Word document. This means the visual appearance is preserved exactly — including images, charts, logos, and formatting. Extracted text is also included below each page image for editing.' },
        { question: 'Are images from my PDF preserved?', answer: 'Yes! Each PDF page is rendered as a full-page image and embedded in the Word file. All images, graphics, charts, and visual elements are preserved exactly as they appear in the original PDF.' },
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

// Page thumbnail component
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
        <div className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <canvas ref={canvasRef} className="w-full h-auto" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                <span className="text-white text-xs font-semibold">Page {pageNum}</span>
            </div>
        </div>
    );
};

const PdfToWord = () => {
    const [file, setFile] = useState(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // Load PDF for preview when file is selected
    const handleFileSelected = useCallback(async (files) => {
        if (files.length === 0) return;
        const selectedFile = files[0];
        setFile(selectedFile);
        setDownloadUrl(null);
        setProgress({ current: 0, total: 0 });

        try {
            const pdfjsLib = await loadPdfjs();
            if (!pdfjsLib) return;
            const arrayBuffer = await selectedFile.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const pdf = await pdfjsLib.getDocument({ data: uint8Array.slice() }).promise;
            setPdfDoc(pdf);
            setPageCount(pdf.numPages);
        } catch (err) {
            console.error('Error loading PDF for preview:', err);
            // Still allow conversion even if preview fails
            setPdfDoc(null);
            setPageCount(0);
        }
    }, []);

    const handleRemoveFile = () => {
        setFile(null);
        setPdfDoc(null);
        setPageCount(0);
        setDownloadUrl(null);
        setProgress({ current: 0, total: 0 });
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setProgress({ current: 0, total: pageCount || 0 });
        try {
            const wordBlob = await convertPdfToWord(file, (current, total) => {
                setProgress({ current, total });
            });
            const url = URL.createObjectURL(wordBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting PDF to Word:', error);
            alert(error.message || 'Failed to convert PDF file. Please try a different document.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-blue-600" />
                        PDF to Word
                    </h1>
                    <p className="text-gray-600">
                        Convert your PDF files to editable DOCX documents with images preserved.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-6">
                            {/* File info bar */}
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded">
                                        <FileJson className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                            {pageCount > 0 && ` • ${pageCount} page${pageCount > 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Page preview grid */}
                            {pdfDoc && pageCount > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Eye className="h-4 w-4 text-gray-500" />
                                        <h3 className="text-sm font-semibold text-gray-700">Page Preview</h3>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-100">
                                        {Array.from({ length: pageCount }, (_, i) => (
                                            <PageThumbnail key={i + 1} pdfDoc={pdfDoc} pageNum={i + 1} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Progress bar during conversion */}
                            {isProcessing && progress.total > 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Converting page {progress.current} of {progress.total}...</span>
                                        <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <div className="flex items-center gap-2 text-green-600 mb-2">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="font-medium">Conversion complete!</span>
                                        </div>
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
                                        {isProcessing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Converting...
                                            </>
                                        ) : 'Convert to Word'}
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
