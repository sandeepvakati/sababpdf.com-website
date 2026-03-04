'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Upload, ArrowRightLeft, Layers, Eye, ZoomIn, ZoomOut } from 'lucide-react';
import ToolPageContent from '@/components/ToolPageContent';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const comparePdfContent = {
    howToUse: [
        { title: 'Upload Two PDF Files', description: 'Upload the "Original" PDF in the left upload box and the "Modified" PDF in the right upload box. Both files need to be selected before comparison begins.' },
        { title: 'Choose a Comparison Mode', description: 'Use the toolbar to switch between "Side by Side" view (both PDFs displayed next to each other) or "Overlay" view (both PDFs layered on top of each other with adjustable opacity to spot differences).' },
        { title: 'Navigate and Zoom', description: 'Use the page navigation buttons to move through each page. Zoom in and out to examine details. In overlay mode, adjust the opacity slider to blend between the two documents and spot visual differences.' },
    ],
    whyUseThis: [
        { title: 'Visual Comparison', description: 'See exactly how two versions of a PDF differ by viewing them side by side or overlaid on top of each other. Much more effective than manually switching between files.' },
        { title: 'Two Viewing Modes', description: 'Side-by-side mode shows both documents next to each other for easy scanning. Overlay mode stacks them with adjustable opacity to highlight even subtle differences in layout, text, or images.' },
        { title: 'Page-by-Page Navigation', description: 'Navigate through every page of both documents simultaneously. The tool handles documents of different lengths, showing a blank canvas for pages that exist in one file but not the other.' },
        { title: 'Browser-Based & Private', description: 'Both PDF files are processed entirely in your browser. Nothing is uploaded to any server, making it safe to compare confidential contracts, legal documents, and sensitive business files.' },
    ],
    tips: [
        'Use Overlay mode with around 50% opacity to quickly spot differences between two versions of the same document.',
        'Zoom in (up to 300%) to examine fine details like font changes, spacing adjustments, or subtle image modifications.',
        'This tool works best for comparing two versions of the same document. Comparing completely different documents is possible but less useful.',
        'If the documents have different page counts, the tool will show empty canvases for pages that do not exist in the shorter document.',
        'Use this tool before finalizing contracts or reports to ensure all intended changes were made correctly.',
    ],
    faqs: [
        { question: 'Does this tool highlight the differences?', answer: 'The current version provides visual comparison through side-by-side and overlay views. You can spot differences yourself by switching between views and adjusting opacity. Automated text-level difference highlighting is a feature we are working on for a future update.' },
        { question: 'Can I compare more than two PDFs?', answer: 'Currently, the tool compares exactly two PDF files at a time. If you need to compare three or more versions, compare them in pairs — original vs version 1, then original vs version 2.' },
        { question: 'What if the two PDFs have different page counts?', answer: 'The tool handles this gracefully. It uses the page count of the longer document and shows a blank canvas for pages that only exist in one of the two files.' },
        { question: 'Are my documents uploaded to a server?', answer: 'No. Both PDF files are loaded and rendered entirely in your browser using JavaScript. Your documents never leave your device, making this tool safe for confidential materials.' },
        { question: 'Can I compare scanned PDFs?', answer: 'Yes. The tool renders and displays the visual content of any PDF, including scanned documents. However, since comparison is visual rather than text-based, you will be comparing the visual appearance of each page.' },
    ],
    relatedTools: [
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📝' },
        { name: 'Redact PDF', href: '/redact-pdf', icon: '⬛' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
    ],
};

// Configure PDF.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

const ComparePdf = () => {
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [pdf1, setPdf1] = useState(null);
    const [pdf2, setPdf2] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' | 'overlay'
    const [opacity, setOpacity] = useState(0.5); // For overlay mode

    const canvas1Ref = useRef(null);
    const canvas2Ref = useRef(null);

    // Initial load
    useEffect(() => {
        const loadPdfs = async () => {
            if (file1 && file2) {
                try {
                    const buffer1 = await file1.arrayBuffer();
                    const uint8_1 = new Uint8Array(buffer1);
                    let doc1;
                    try {
                        doc1 = await pdfjsLib.getDocument({ data: uint8_1.slice() }).promise;
                    } catch (e) {
                        doc1 = await pdfjsLib.getDocument({ data: uint8_1.slice(), isEvalSupported: false, disableAutoFetch: true, disableStream: true }).promise;
                    }
                    setPdf1(doc1);

                    const buffer2 = await file2.arrayBuffer();
                    const uint8_2 = new Uint8Array(buffer2);
                    let doc2;
                    try {
                        doc2 = await pdfjsLib.getDocument({ data: uint8_2.slice() }).promise;
                    } catch (e) {
                        doc2 = await pdfjsLib.getDocument({ data: uint8_2.slice(), isEvalSupported: false, disableAutoFetch: true, disableStream: true }).promise;
                    }
                    setPdf2(doc2);

                    // Use the max page count of the two
                    setNumPages(Math.max(doc1.numPages, doc2.numPages));
                    setCurrentPage(1);
                } catch (error) {
                    console.error("Error loading PDFs:", error);
                    alert("Failed to load PDF files. Make sure they are valid PDFs and not password-protected.");
                }
            }
        };
        loadPdfs();
    }, [file1, file2]);

    // Render pages
    useEffect(() => {
        const renderPages = async () => {
            if (!pdf1 || !pdf2) return;

            const renderPageToCanvas = async (pdf, pageNum, canvas) => {
                if (pageNum > pdf.numPages) {
                    // Clear canvas if page doesn't exist (e.g. file 1 has 5 pages, file 2 has 3)
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    return;
                }
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale });
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: ctx, viewport }).promise;
            };

            if (canvas1Ref.current) await renderPageToCanvas(pdf1, currentPage, canvas1Ref.current);
            if (canvas2Ref.current) await renderPageToCanvas(pdf2, currentPage, canvas2Ref.current);
        };

        renderPages();
    }, [pdf1, pdf2, currentPage, scale]);

    const handleFileChange = (e, setFile) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8 flex flex-col">
            <div className="max-w-7xl mx-auto px-4 w-full flex-grow flex flex-col">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare PDF</h1>
                    <p className="text-gray-600">Upload two PDF files to visually compare them side-by-side or using an overlay.</p>
                </div>

                {!pdf1 || !pdf2 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
                        {/* Upload Box 1 */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-center h-64">
                            {file1 ? (
                                <div className="text-green-600 font-semibold flex flex-col items-center">
                                    <div className="bg-green-100 p-3 rounded-full mb-2"><Eye className="w-6 h-6" /></div>
                                    {file1.name}
                                    <button onClick={() => setFile1(null)} className="text-xs text-red-500 mt-2 underline hover:text-red-700">Remove</button>
                                </div>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                                    <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                    <span className="text-lg font-medium text-gray-700">Upload Original PDF</span>
                                    <span className="text-sm text-gray-500 mt-1">or drop file here</span>
                                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, setFile1)} />
                                </label>
                            )}
                        </div>

                        {/* Upload Box 2 */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-center h-64">
                            {file2 ? (
                                <div className="text-blue-600 font-semibold flex flex-col items-center">
                                    <div className="bg-blue-100 p-3 rounded-full mb-2"><Eye className="w-6 h-6" /></div>
                                    {file2.name}
                                    <button onClick={() => setFile2(null)} className="text-xs text-red-500 mt-2 underline hover:text-red-700">Remove</button>
                                </div>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                                    <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                    <span className="text-lg font-medium text-gray-700">Upload Modified PDF</span>
                                    <span className="text-sm text-gray-500 mt-1">or drop file here</span>
                                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, setFile2)} />
                                </label>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col flex-grow">
                        {/* Toolbar */}
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4 justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <button className={`p-2 rounded transition-colors ${viewMode === 'side-by-side' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'}`} onClick={() => setViewMode('side-by-side')} title="Side by Side">
                                    <ArrowRightLeft className="w-5 h-5" />
                                </button>
                                <button className={`p-2 rounded transition-colors ${viewMode === 'overlay' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'}`} onClick={() => setViewMode('overlay')} title="Overlay">
                                    <Layers className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors">Prev</button>
                                <span className="font-medium text-gray-700">Page {currentPage} of {numPages}</span>
                                <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage === numPages} className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors">Next</button>
                            </div>

                            <div className="flex items-center gap-2 text-gray-700">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-gray-100 rounded transition-colors"><ZoomOut className="w-5 h-5" /></button>
                                <span className="w-12 text-center font-medium">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 hover:bg-gray-100 rounded transition-colors"><ZoomIn className="w-5 h-5" /></button>
                            </div>

                            {viewMode === 'overlay' && (
                                <div className="flex items-center gap-2 w-32">
                                    <span className="text-xs font-medium text-gray-600 truncate">Opacity</span>
                                    <input type="range" min="0" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>
                            )}

                            <button onClick={() => { setPdf1(null); setPdf2(null); setFile1(null); setFile2(null); }} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors">Close</button>
                        </div>

                        {/* Viewing Area */}
                        <div className="flex-grow bg-gray-200 p-4 rounded-lg overflow-auto flex justify-center items-start min-h-[500px]">
                            {viewMode === 'side-by-side' ? (
                                <div className="flex gap-4">
                                    <div className="bg-white shadow-lg border border-gray-300">
                                        <div className="bg-gray-100 text-xs p-1.5 text-center font-semibold text-gray-700 border-b border-gray-300">Original</div>
                                        <canvas ref={canvas1Ref} className="block" />
                                    </div>
                                    <div className="bg-white shadow-lg border border-gray-300">
                                        <div className="bg-blue-50 text-xs p-1.5 text-center font-semibold text-blue-700 border-b border-gray-300">Modified</div>
                                        <canvas ref={canvas2Ref} className="block" />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative bg-white shadow-lg border border-gray-300 inline-block">
                                    <div className="absolute top-0 left-0 z-10 pointer-events-none mix-blend-multiply transition-opacity duration-200" style={{ opacity: 1 }}>
                                        {/* Bottom Layer (Original) */}
                                        <canvas ref={canvas1Ref} className="block" />
                                    </div>
                                    <div className="absolute top-0 left-0 z-20 pointer-events-none mix-blend-multiply transition-opacity duration-200" style={{ opacity: opacity }}>
                                        {/* Top Layer (Modified) */}
                                        <canvas ref={canvas2Ref} className="block" />
                                    </div>
                                    {/* Placeholder to give size to the container since absolute children don't */}
                                    <div style={{ width: canvas1Ref.current?.width || '100px', height: canvas1Ref.current?.height || '100px' }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ToolPageContent
                title="Compare PDF Documents"
                howToUse={comparePdfContent.howToUse}
                whyUseThis={comparePdfContent.whyUseThis}
                tips={comparePdfContent.tips}
                faqs={comparePdfContent.faqs}
                relatedTools={comparePdfContent.relatedTools}
            />
        </div>
    );
};

export default ComparePdf;
