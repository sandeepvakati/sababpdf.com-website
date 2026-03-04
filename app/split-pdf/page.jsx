'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { splitPdf } from '@/utils/pdfUtils';
import { Scissors, Download, X, FileText, ChevronLeft, ChevronRight, Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
}

const splitPdfContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click the upload area or drag and drop a single PDF file. SababPDF will instantly load all pages and display thumbnails so you can see every page in your document.' },
        { title: 'Select Pages to Extract', description: 'You have two options: type a page range manually (e.g., "1-5, 8, 11-13") or click the "Pick Pages" button to visually select pages by clicking on their thumbnails. Click pages in the exact order you want them in the output file.' },
        { title: 'Split and Download', description: 'Click the "Split PDF" button and your extracted pages will be compiled into a new, smaller PDF file. Download the result instantly — no waiting, no email required.' },
    ],
    whyUseThis: [
        { title: 'Visual Page Selection', description: 'See every page as a thumbnail before splitting. Click pages in any order to build your custom extracted document — no guessing which page number contains what content.' },
        { title: 'Flexible Range Input', description: 'Use our smart range input to quickly specify pages. Type "1-5" for the first five pages, "3,7,12" for specific pages, or mix both styles like "1-3, 7, 10-15" for maximum flexibility.' },
        { title: 'Completely Private', description: 'Your PDF never leaves your browser. All splitting is done locally using client-side JavaScript, so confidential documents like contracts, medical records, or financial statements remain 100% private.' },
        { title: 'No Quality Loss', description: 'SababPDF extracts pages from the original PDF data without re-encoding. Text stays sharp, images stay crisp, and all formatting is perfectly preserved in the output file.' },
    ],
    tips: [
        'Use the "Pick Pages" mode when you need to extract pages in a non-sequential order or want to visually confirm each page before extraction.',
        'For large documents, use the page range input (e.g., "1-10") for faster selection instead of clicking each page individually.',
        'You can preview any page in full size by hovering over a thumbnail and clicking the eye icon — this helps you find the exact pages you need.',
        'After splitting, you can merge the extracted pages with other PDFs using our Merge PDF tool to create custom compilations.',
        'If you need to split a PDF into individual single-page files, extract one page at a time and download each separately.',
    ],
    faqs: [
        { question: 'Can I extract non-consecutive pages from a PDF?', answer: 'Yes! You can extract any combination of pages. Use the range input (e.g., "1, 5, 8-12, 20") or click the "Pick Pages" button to visually select pages in any order. The extracted pages will appear in the order you specified.' },
        { question: 'Is there a page limit for splitting PDFs?', answer: 'There is no hard limit. SababPDF can handle PDFs with hundreds of pages. However, very large files (500+ pages) may take a few extra seconds to load thumbnails depending on your device performance.' },
        { question: 'Does splitting a PDF affect the original file?', answer: 'No, the original PDF file on your computer is never modified. SababPDF creates a brand new PDF containing only the pages you selected. Your source file remains completely untouched.' },
        { question: 'Can I split a password-protected PDF?', answer: 'If the PDF has a password that restricts editing, you may need to unlock it first using our Unlock PDF tool. Once unlocked, you can split it normally. PDFs with only a viewing password will work directly.' },
        { question: 'What happens to bookmarks and links when I split a PDF?', answer: 'When you extract pages, internal bookmarks and hyperlinks that reference pages outside the extracted range may no longer work. However, all content, formatting, and embedded media on the extracted pages will be perfectly preserved.' },
    ],
    relatedTools: [
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
        { name: 'Add Page Numbers', href: '/add-page-numbers', icon: '🔢' },
        { name: 'Crop PDF', href: '/crop-pdf', icon: '✂️' },
        { name: 'PDF to JPG', href: '/pdf-to-jpg', icon: '🖼️' },
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
    ],
};

const PageThumbnail = ({ pageData }) => {
    const canvasRef = useRef(null);
    useEffect(() => {
        let cancelled = false;
        const render = async () => {
            if (!pageData?.pdfDoc || !canvasRef.current) return;
            try {
                const page = await pageData.pdfDoc.getPage(pageData.pageNum);
                if (cancelled) return;
                const vp = page.getViewport({ scale: 0.35 });
                const canvas = canvasRef.current;
                canvas.height = vp.height;
                canvas.width = vp.width;
                await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            } catch (err) {
                console.error('Thumbnail error:', err);
            }
        };
        render();
        return () => { cancelled = true; };
    }, [pageData]);
    return <canvas ref={canvasRef} className="block w-full h-auto bg-white" style={{ maxHeight: '180px' }} />;
};

const PagePreviewModal = ({ previewData, onClose, allPages, onNavigate }) => {
    const canvasRef = useRef(null);
    const idx = allPages.findIndex((p) => p.pageNum === previewData.pageNum);
    useEffect(() => {
        let cancelled = false;
        const render = async () => {
            if (!previewData?.pdfDoc || !canvasRef.current) return;
            try {
                const page = await previewData.pdfDoc.getPage(previewData.pageNum);
                if (cancelled) return;
                const vp = page.getViewport({ scale: 1.5 });
                const canvas = canvasRef.current;
                canvas.height = vp.height;
                canvas.width = vp.width;
                await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            } catch (err) { console.error('Preview error:', err); }
        };
        render();
        return () => { cancelled = true; };
    }, [previewData]);
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && idx > 0) onNavigate(allPages[idx - 1]);
            if (e.key === 'ArrowRight' && idx < allPages.length - 1) onNavigate(allPages[idx + 1]);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [idx, allPages, onClose, onNavigate]);
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{previewData.fileName}</p>
                        <p className="text-xs text-gray-500">Page {previewData.pageNum} of {previewData.totalPages}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-800 transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-gray-100 relative">
                    {idx > 0 && <button onClick={() => onNavigate(allPages[idx - 1])} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 text-gray-700 hover:text-green-500 z-10"><ChevronLeft className="h-6 w-6" /></button>}
                    <canvas ref={canvasRef} className="block bg-white shadow-xl rounded max-w-full max-h-[70vh]" />
                    {idx < allPages.length - 1 && <button onClick={() => onNavigate(allPages[idx + 1])} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 text-gray-700 hover:text-green-500 z-10"><ChevronRight className="h-6 w-6" /></button>}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-center gap-2 text-xs text-gray-500">
                    <span>← → Navigate</span><span>•</span><span>Esc to close</span>
                </div>
            </div>
        </div>
    );
};

export default function SplitPdfPage() {
    const [file, setFile] = useState(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [previewPage, setPreviewPage] = useState(null);

    const [range, setRange] = useState('');

    const [editMode, setEditMode] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState([]);

    const handleFileSelected = useCallback(async (files) => {
        if (files.length === 0) return;
        const selectedFile = files[0];
        setFile(selectedFile);
        setRange('');
        setDownloadUrl(null);
        setEditMode(false);
        setSelectedOrder([]);
        setIsLoading(true);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            let doc;
            try {
                doc = await pdfjsLib.getDocument({ data: uint8Array.slice() }).promise;
            } catch (firstErr) {
                try {
                    doc = await pdfjsLib.getDocument({ data: uint8Array.slice(), isEvalSupported: false, disableAutoFetch: true, disableStream: true }).promise;
                } catch (retryErr) {
                    throw retryErr;
                }
            }
            setPdfDoc(doc);
            setPageCount(doc.numPages);
            setRange(`1-${doc.numPages}`);
        } catch (error) {
            console.error('Error reading PDF:', error);
            alert('Failed to load PDF. Make sure it\'s a valid PDF file and not password-protected.');
            setFile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleRemoveFile = () => {
        setFile(null);
        setPdfDoc(null);
        setPageCount(0);
        setRange('');
        setDownloadUrl(null);
        setEditMode(false);
        setSelectedOrder([]);
    };

    const parseRange = (rangeStr, maxPages) => {
        const pages = new Set();
        rangeStr.split(',').map((p) => p.trim()).forEach((part) => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= maxPages) pages.add(i - 1);
                    }
                }
            } else {
                const page = Number(part);
                if (!isNaN(page) && page >= 1 && page <= maxPages) pages.add(page - 1);
            }
        });
        return Array.from(pages).sort((a, b) => a - b);
    };

    const togglePage = (pageNum) => {
        setSelectedOrder((prev) =>
            prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
        );
        setDownloadUrl(null);
    };

    const selectAll = () => {
        setSelectedOrder(Array.from({ length: pageCount }, (_, i) => i + 1));
        setDownloadUrl(null);
    };
    const deselectAll = () => { setSelectedOrder([]); setDownloadUrl(null); };

    const enterEditMode = () => { setEditMode(true); setSelectedOrder([]); setDownloadUrl(null); };
    const exitEditMode = () => { setEditMode(false); setSelectedOrder([]); setDownloadUrl(null); };

    const handleSplit = async () => {
        if (!file) return;

        let pageIndices;
        if (editMode) {
            if (selectedOrder.length === 0) {
                alert('Please select at least one page.');
                return;
            }
            pageIndices = selectedOrder.map((p) => p - 1);
        } else {
            pageIndices = parseRange(range, pageCount);
            if (pageIndices.length === 0) {
                alert('Please enter a valid page range.');
                return;
            }
        }

        setIsProcessing(true);
        try {
            const splitPdfBlob = await splitPdf(file, pageIndices);
            setDownloadUrl(URL.createObjectURL(splitPdfBlob));
        } catch (error) {
            console.error('Error splitting PDF:', error);
            alert('Failed to split PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const allPagesList = pdfDoc
        ? Array.from({ length: pageCount }, (_, i) => ({
            pdfDoc, pageNum: i + 1, totalPages: pageCount, fileName: file?.name || 'PDF',
        }))
        : [];

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Scissors className="h-8 w-8 text-green-500" />
                        Split PDF file
                    </h1>
                    <p className="text-gray-600">
                        Extract pages from your PDF. Click ✏️ to pick pages in custom order.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file && !isLoading ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} />
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <FileText className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{file?.name}</p>
                                        <p className="text-sm text-gray-500">{pageCount} Pages • {(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button onClick={handleRemoveFile} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {editMode
                                            ? <>☑️ Click pages to select — <span className="font-medium text-green-600">{selectedOrder.length} selected</span></>
                                            : 'Preview your pages below. Use range input or ✏️ to pick pages.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {!editMode ? (
                                        <button
                                            onClick={enterEditMode}
                                            className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition-colors"
                                            title="Pick pages visually"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Pick Pages
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={selectAll} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                Select All
                                            </button>
                                            <button onClick={deselectAll} className="text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                                <RotateCcw className="h-3.5 w-3.5" /> Reset
                                            </button>
                                            <button onClick={exitEditMode} className="text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                                                ✕ Exit Edit
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {editMode && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
                                    <Pencil className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-sm text-amber-800">
                                        <strong>Pick Mode:</strong> Click pages in the order you want them in the extracted PDF. 1st click = page 1, 2nd = page 2, etc.
                                    </p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                    <span className="ml-3 text-gray-600">Loading PDF pages...</span>
                                </div>
                            )}

                            {pdfDoc && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[550px] overflow-y-auto pr-1">
                                    {Array.from({ length: pageCount }, (_, i) => {
                                        const pageNum = i + 1;
                                        const orderIdx = selectedOrder.indexOf(pageNum);
                                        const isSelected = editMode && orderIdx !== -1;
                                        const orderNum = orderIdx + 1;

                                        return (
                                            <div
                                                key={pageNum}
                                                className={`rounded-lg border-2 shadow-sm overflow-hidden transition-all group select-none
                                                    ${isSelected
                                                        ? 'border-green-400 bg-green-50 shadow-md ring-2 ring-green-200'
                                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}
                                                `}
                                            >
                                                <div className="relative">
                                                    {editMode && (
                                                        <div className="absolute top-1 left-1 z-10 cursor-pointer" onClick={() => togglePage(pageNum)}>
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md
                                                                ${isSelected
                                                                    ? 'bg-green-500 text-white scale-110'
                                                                    : 'bg-white/90 text-gray-400 border-2 border-gray-300 hover:border-green-400 hover:text-green-400'}
                                                            `}>
                                                                {isSelected ? orderNum : ''}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Eye preview */}
                                                    <div
                                                        className="absolute top-1 right-1 z-10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setPreviewPage({ pdfDoc, pageNum, totalPages: pageCount, fileName: file?.name })}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white">
                                                            <Eye className="h-3.5 w-3.5 text-gray-600" />
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={`p-1.5 ${editMode ? 'cursor-pointer' : ''}`}
                                                        onClick={editMode ? () => togglePage(pageNum) : undefined}
                                                    >
                                                        <PageThumbnail pageData={{ pdfDoc, pageNum }} />
                                                    </div>
                                                </div>

                                                <div className={`px-2 py-1.5 border-t text-center transition-colors
                                                    ${isSelected ? 'bg-green-100 border-green-200' : 'bg-gray-50 border-gray-100'}`}
                                                >
                                                    <span className={`text-xs font-medium ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                                                        {isSelected ? `#${orderNum} in extract` : `Page ${pageNum}`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {editMode && selectedOrder.length > 0 && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                        📋 Extract Order ({selectedOrder.length} pages)
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedOrder.map((pageNum, i) => (
                                            <span key={pageNum} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs shadow-sm">
                                                <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                                <span className="text-gray-600">Page {pageNum}</span>
                                                <button onClick={() => togglePage(pageNum)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!editMode && (
                                <div>
                                    <label htmlFor="range" className="block text-sm font-medium text-gray-700 mb-1">
                                        Page Range (e.g., 1-5, 8, 11-13)
                                    </label>
                                    <input
                                        type="text"
                                        id="range"
                                        value={range}
                                        onChange={(e) => { setRange(e.target.value); setDownloadUrl(null); }}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                        placeholder="1-5, 8, 11-13"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">Total pages: {pageCount}</p>
                                </div>
                            )}

                            <div className="flex justify-center pt-2">
                                {downloadUrl ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <a href={downloadUrl} download={`split_${file?.name}`}
                                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                                            <Download className="h-5 w-5" />
                                            Download Extracted PDF
                                        </a>
                                        <button onClick={handleRemoveFile} className="text-sm text-gray-500 hover:text-gray-700 underline">
                                            Start over
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleSplit}
                                        disabled={isProcessing || (editMode && selectedOrder.length === 0)}
                                        className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                            ${isProcessing || (editMode && selectedOrder.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <Scissors className="h-5 w-5" />
                                        {isProcessing
                                            ? 'Processing...'
                                            : editMode
                                                ? `Extract ${selectedOrder.length} Pages`
                                                : 'Split PDF'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {previewPage && (
                <PagePreviewModal
                    previewData={previewPage}
                    allPages={allPagesList}
                    onClose={() => setPreviewPage(null)}
                    onNavigate={(p) => setPreviewPage(p)}
                />
            )}

            <ToolPageContent
                title="Split PDF Files"
                howToUse={splitPdfContent.howToUse}
                whyUseThis={splitPdfContent.whyUseThis}
                tips={splitPdfContent.tips}
                faqs={splitPdfContent.faqs}
                relatedTools={splitPdfContent.relatedTools}
            />
        </div>
    );
}
