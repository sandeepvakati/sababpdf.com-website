'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FileBadge, ArrowRight, Download, Loader2, Crop, Check, X } from 'lucide-react';
import ToolPageContent from '@/components/ToolPageContent';
import { cropPdf } from '@/utils/conversionUtils';
import * as pdfjsLib from 'pdfjs-dist';

const cropPdfContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click "Select PDF file to Crop" and choose your PDF file. SababPDF will render all pages as interactive thumbnails in the sidebar and display the active page in the main workspace.' },
        { title: 'Select the Crop Area', description: 'Click and drag on the page preview to draw a rectangle around the area you want to keep. The blue overlay shows the selected region with its pixel dimensions. You can optionally check "Apply to All Pages" to crop every page identically.' },
        { title: 'Crop and Download', description: 'Click "Crop PDF" to process the document. SababPDF will trim all selected pages to the area you defined. Download the cropped PDF — perfect for removing margins, headers, or unwanted areas from scanned documents.' },
    ],
    whyUseThis: [
        { title: 'Visual Selection', description: 'Draw your crop area directly on a rendered preview of the PDF page. See exactly what will be included in the final output — no guessing with manual coordinate entry.' },
        { title: 'Per-Page or All-Pages Cropping', description: 'Crop a single page or apply the same crop area to all pages in the document. The "Apply to All Pages" option is perfect for uniformly trimming margins from multi-page documents.' },
        { title: 'Page Navigation', description: 'Browse through all pages using the sidebar thumbnails. Click any thumbnail to switch to that page and define a unique crop area for it.' },
        { title: 'Browser-Based Privacy', description: 'The entire cropping process — rendering, selection, and export — happens in your browser. Your PDF is never sent to any external server.' },
    ],
    tips: [
        'Draw your crop rectangle carefully. The more precise your selection, the better the final result will look.',
        'For scanned documents with large margins, cropping can significantly reduce file size by removing empty whitespace.',
        'Use "Apply to All Pages" when your document has consistent margins or borders that need to be removed from every page.',
        'If you make a mistake with the crop selection, simply click and drag again to create a new selection rectangle.',
        'After cropping, you can use our Compress PDF tool to further reduce the file size of the cropped document.',
    ],
    faqs: [
        { question: 'Does cropping reduce the PDF quality?', answer: 'Cropping is a lossless operation on the content within the crop area. The text, images, and formatting inside your selected area remain at their original quality. Only the content outside the crop area is removed.' },
        { question: 'Can I crop different areas on different pages?', answer: 'Currently, you can draw one crop selection. If "Apply to All Pages" is checked, the same crop area applies to all pages. If unchecked, only the currently active page is cropped. For different crops on different pages, process one page at a time.' },
        { question: 'What is the minimum crop size?', answer: 'The minimum crop selection is 10x10 pixels. Smaller selections will trigger a warning asking you to select a larger area. This prevents accidentally creating tiny, unusable cropped documents.' },
        { question: 'Can I undo a crop after downloading?', answer: 'Once cropped, the removed content is permanently gone from the new PDF. Always keep your original, uncropped file if you might need the full document later.' },
        { question: 'Does cropping work with scanned documents?', answer: 'Yes! Cropping works equally well with scanned documents, text-based PDFs, and mixed-content files. For scanned documents, cropping is especially useful for removing scanner borders, shadows, or finger marks at the edges.' },
    ],
    relatedTools: [
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'PDF to JPG', href: '/pdf-to-jpg', icon: '🖼️' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'Add Page Numbers', href: '/add-page-numbers', icon: '🔢' },
        { name: 'Repair PDF', href: '/repair-pdf', icon: '🛠️' },
    ],
};

// Configure PDF.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

const PageThumbnail = ({ pdf, pageIndex, isActive, onClick }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (pdf && canvasRef.current) {
            const renderThumbnail = async () => {
                try {
                    const page = await pdf.getPage(pageIndex + 1);
                    const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnail
                    const canvas = canvasRef.current;
                    const context = canvas.getContext('2d');

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport }).promise;
                } catch (error) {
                    console.error("Error rendering thumbnail:", error);
                }
            };
            renderThumbnail();
        }
    }, [pdf, pageIndex]);

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer p-2 rounded transition-all border-2 ${isActive ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-100'}`}
        >
            <canvas ref={canvasRef} className="mx-auto shadow-sm bg-white block" />
            <p className={`text-center text-xs mt-1 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                Page {pageIndex + 1}
            </p>
        </div>
    );
};

const CropPdf = () => {
    const [file, setFile] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [pdfDocument, setPdfDocument] = useState(null);
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [cropSelection, setCropSelection] = useState(null); // { x, y, width, height }
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [applyToAll, setApplyToAll] = useState(false);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Load PDF
    useEffect(() => {
        if (file) {
            const loadPdf = async () => {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);
                    let pdf;
                    try {
                        pdf = await pdfjsLib.getDocument({ data: uint8Array.slice() }).promise;
                    } catch (firstErr) {
                        try {
                            pdf = await pdfjsLib.getDocument({ data: uint8Array.slice(), isEvalSupported: false, disableAutoFetch: true, disableStream: true }).promise;
                        } catch (retryErr) {
                            throw retryErr;
                        }
                    }
                    setPdfDocument(pdf);
                    setCropSelection(null);
                } catch (error) {
                    console.error("Error loading PDF:", error);
                    alert('Failed to load PDF. Make sure it\'s a valid PDF file and not password-protected.');
                }
            };
            loadPdf();
        } else {
            setPdfDocument(null);
        }
    }, [file]);

    // Render Page
    useEffect(() => {
        if (pdfDocument && canvasRef.current) {
            const renderPage = async () => {
                try {
                    const page = await pdfDocument.getPage(activePageIndex + 1);
                    // Use a manageable viewport scale
                    const scale = 1.0;
                    const scaledViewport = page.getViewport({ scale });

                    const canvas = canvasRef.current;
                    const context = canvas.getContext('2d');

                    canvas.height = scaledViewport.height;
                    canvas.width = scaledViewport.width;

                    await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
                } catch (error) {
                    console.error("Error rendering page:", error);
                }
            };
            renderPage();
        }
    }, [pdfDocument, activePageIndex]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile?.type === 'application/pdf') {
            setFile(selectedFile);
            setDownloadUrl(null);
            setCropSelection(null);
            setActivePageIndex(0);
        }
    };

    // Selection Handlers
    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e) => {
        if (!file || downloadUrl) return;
        setIsDragging(true);
        const pos = getMousePos(e);
        setStartPos(pos);
        setCropSelection({ x: pos.x, y: pos.y, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const pos = getMousePos(e);
        const width = pos.x - startPos.x;
        const height = pos.y - startPos.y;

        // Handle negative width/height by adjusting x/y
        setCropSelection({
            x: width > 0 ? startPos.x : pos.x,
            y: height > 0 ? startPos.y : pos.y,
            width: Math.abs(width),
            height: Math.abs(height)
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleCrop = async () => {
        if (!cropSelection || cropSelection.width < 10 || cropSelection.height < 10) {
            alert("Please select a valid crop area.");
            return;
        }

        setIsConverting(true);
        try {
            const cropData = {
                pageIndex: activePageIndex,
                x: cropSelection.x,
                y: cropSelection.y,
                width: cropSelection.width,
                height: cropSelection.height,
                viewWidth: canvasRef.current.width,
                viewHeight: canvasRef.current.height,
                applyToAll: applyToAll
            };

            const croppedBlob = await cropPdf(file, cropData);
            const url = URL.createObjectURL(croppedBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error(error);
            alert("Error cropping PDF.");
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-8 min-h-screen">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Crop PDF</h1>
                    {file && !downloadUrl && (
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded shadow-sm">
                                <input
                                    type="checkbox"
                                    checked={applyToAll}
                                    onChange={(e) => setApplyToAll(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Apply to All Pages
                            </label>
                            <button
                                onClick={handleCrop}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
                            >
                                {isConverting ? <Loader2 className="animate-spin" size={16} /> : <><Crop size={16} /> Crop PDF</>}
                            </button>
                        </div>
                    )}
                </div>

                {!file ? (
                    <div className="max-w-xl mx-auto bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Crop className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Select PDF file to Crop</h3>
                        <p className="text-gray-500 mb-6">Adjust the visible area of your PDF pages.</p>
                        <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Sidebar */}
                        <div className="w-full md:w-56 flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm max-h-[600px] overflow-y-auto">
                                <h3 className="font-semibold mb-3 text-gray-700 sticky top-0 bg-white pb-2 border-b">Pages</h3>
                                <div className="space-y-3">
                                    {pdfDocument && Array.from({ length: pdfDocument.numPages }, (_, i) => (
                                        <PageThumbnail
                                            key={i}
                                            pdf={pdfDocument}
                                            pageIndex={i}
                                            isActive={activePageIndex === i}
                                            onClick={() => { setActivePageIndex(i); setCropSelection(null); }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Workspace */}
                        <div className="flex-1 bg-gray-200 p-8 rounded-lg overflow-auto flex justify-center min-h-[500px] relative">
                            {downloadUrl ? (
                                <div className="text-center bg-white p-8 rounded-lg self-center shadow-lg">
                                    <h3 className="text-xl font-bold mb-4">PDF Cropped Successfully!</h3>
                                    <a
                                        href={downloadUrl}
                                        download={`Cropped_${file.name}`}
                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-md transition-all"
                                    >
                                        <Download /> Download File
                                    </a>
                                    <button
                                        onClick={() => { setFile(null); setDownloadUrl(null); }}
                                        className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                                    >
                                        Crop another file
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="relative shadow-2xl inline-block bg-white"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    <canvas ref={canvasRef} className="block" />
                                    {/* Crop Overlay */}
                                    {cropSelection && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: cropSelection.x,
                                                top: cropSelection.y,
                                                width: cropSelection.width,
                                                height: cropSelection.height,
                                                backgroundColor: 'rgba(0, 100, 255, 0.2)',
                                                border: '2px solid #2563eb',
                                            }}
                                        >
                                            {/* Dimensions Label */}
                                            <span className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-1 rounded shadow-sm">
                                                {Math.round(cropSelection.width)} x {Math.round(cropSelection.height)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ToolPageContent
                title="Crop PDF Pages"
                howToUse={cropPdfContent.howToUse}
                whyUseThis={cropPdfContent.whyUseThis}
                tips={cropPdfContent.tips}
                faqs={cropPdfContent.faqs}
                relatedTools={cropPdfContent.relatedTools}
            />
        </div>
    );
};

export default CropPdf;
