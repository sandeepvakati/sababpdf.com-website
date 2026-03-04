'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FileBadge, ArrowRight, Download, Loader2, Trash2, Undo, MousePointer } from 'lucide-react';
import ToolPageContent from '@/components/ToolPageContent';
import { applyRedactions } from '@/utils/conversionUtils';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const redactPdfContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Select the PDF file containing sensitive information you need to redact. SababPDF will render the document and display an interactive page preview.' },
        { title: 'Draw Redaction Boxes', description: 'Click and drag on the page to draw black boxes over the text, images, or areas you want to permanently redact. Each redaction appears as a black rectangle. Use the page navigation sidebar to switch between pages and add redactions to any page.' },
        { title: 'Apply and Download', description: 'Click "Apply Redactions" to permanently blackout all marked areas. The redacted content is irreversibly removed from the PDF. Download the redacted document — the blacked-out information cannot be recovered or copied.' },
    ],
    whyUseThis: [
        { title: 'Permanent Redaction', description: 'Unlike simply placing a black shape over text, SababPDF permanently removes the underlying content. The redacted information cannot be selected, copied, searched, or extracted from the resulting PDF.' },
        { title: 'Visual Redaction Interface', description: 'Draw redaction boxes directly on a rendered preview of each page. See exactly what will be hidden before applying the redactions. The interactive interface makes it easy to precisely target sensitive information.' },
        { title: 'Multi-Page Support', description: 'Navigate through all pages and add redections to any page in the document. The sidebar shows how many redactions you have created and which pages they are on.' },
        { title: 'Private & Secure', description: 'All redaction processing happens in your browser. Your sensitive documents are never uploaded to any server, which is critical when handling confidential legal, medical, or financial documents.' },
    ],
    tips: [
        'Draw your redaction box slightly larger than the text you want to hide to ensure complete coverage.',
        'Use the "Clear All" button to remove all redactions and start over if needed.',
        'Individual redactions can be removed by clicking the trash icon next to them in the sidebar.',
        'Always verify the redacted PDF by opening it and trying to select text in the redacted areas to confirm the content is truly removed.',
        'Keep a copy of the original, unredacted PDF in a secure location before applying redactions, as the process is irreversible.',
    ],
    faqs: [
        { question: 'Is the redaction permanent?', answer: 'Yes. When you apply redactions, the underlying content (text, images, data) beneath each black box is permanently removed from the PDF file. It cannot be undone, recovered, or extracted by any means. This is true, secure redaction — not just a visual overlay.' },
        { question: 'Can someone copy or search redacted text?', answer: 'No. The text and data beneath each redaction box is completely removed from the document. Anyone who receives the redacted PDF will not be able to select, copy, search, or extract the hidden content in any way.' },
        { question: 'Can I redact specific text automatically?', answer: 'Currently, redaction is done by manually drawing boxes over the areas you want to hide. You visually identify the sensitive content and draw a box over it. Automatic text-search-based redaction is a feature we may add in the future.' },
        { question: 'Can I undo redactions after downloading?', answer: 'No. Once redactions are applied and the file is downloaded, the process is irreversible. The original content is permanently removed. Always keep a backup copy of the original, unredacted document before applying redactions.' },
        { question: 'What types of content can I redact?', answer: 'You can redact any visual content in the PDF: text, images, signatures, tables, charts, headers, footers, page numbers, or any other element. Simply draw a box over the area and it will be permanently blacked out.' },
    ],
    relatedTools: [
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Crop PDF', href: '/crop-pdf', icon: '✂️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📝' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Compare PDF', href: '/compare-pdf', icon: '🔍' },
    ],
};

// Configure PDF.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

const RedactPdf = () => {
    const [file, setFile] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [pdfDocument, setPdfDocument] = useState(null);
    const [pages, setPages] = useState([]); // Array of viewport info
    const [redactions, setRedactions] = useState([]); // Array of { id, pageIndex, x, y, width, height, viewWidth, viewHeight }
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState(null); // Temp rect while dragging

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Load PDF Document
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
                } catch (error) {
                    console.error("Error loading PDF:", error);
                    alert('Failed to load PDF. Make sure it\'s a valid PDF file and not password-protected.');
                }
            };
            loadPdf();
        } else {
            setPdfDocument(null);
            setPages([]);
            setRedactions([]);
        }
    }, [file]);

    // Render Active Page
    useEffect(() => {
        if (pdfDocument && canvasRef.current) {
            const renderPage = async () => {
                try {
                    const page = await pdfDocument.getPage(activePageIndex + 1);
                    const viewport = page.getViewport({ scale: 1.5 }); // Good viewing scale
                    const canvas = canvasRef.current;
                    const context = canvas.getContext('2d');

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport }).promise;
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
            setActivePageIndex(0);
            setRedactions([]);
        }
    };

    // Drawing Handlers
    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e) => {
        if (!file || downloadUrl) return;
        setIsDrawing(true);
        const pos = getMousePos(e);
        setStartPos(pos);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        setCurrentRect({
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            width: Math.abs(pos.x - startPos.x),
            height: Math.abs(pos.y - startPos.y)
        });
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentRect && currentRect.width > 5 && currentRect.height > 5) {
            // Add new redaction
            setRedactions([...redactions, {
                id: Date.now(),
                pageIndex: activePageIndex,
                x: currentRect.x,
                y: currentRect.y,
                width: currentRect.width,
                height: currentRect.height,
                viewWidth: canvasRef.current.width,
                viewHeight: canvasRef.current.height
            }]);
        }
        setCurrentRect(null);
    };

    const handleApplyRedactions = async () => {
        if (redactions.length === 0) return;
        setIsConverting(true);
        try {
            const redactedBlob = await applyRedactions(file, redactions);
            const url = URL.createObjectURL(redactedBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error(error);
            alert("Error applying redactions.");
        } finally {
            setIsConverting(false);
        }
    };

    const removeRedaction = (id) => {
        setRedactions(redactions.filter(r => r.id !== id));
    };

    return (
        <div className="bg-gray-50 flex-grow py-8 min-h-screen">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Redact PDF</h1>
                    {file && !downloadUrl && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRedactions([])}
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1 transition-colors"
                            >
                                <Undo size={14} /> Clear All
                            </button>
                            <button
                                onClick={handleApplyRedactions}
                                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                {isConverting ? <Loader2 className="animate-spin" size={16} /> : 'Apply Redactions'}
                            </button>
                        </div>
                    )}
                </div>

                {!file ? (
                    <div className="max-w-xl mx-auto bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                        <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Sidebar */}
                        <div className="w-full md:w-64 flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h3 className="font-semibold mb-2 text-gray-700">Pages</h3>
                                {pdfDocument && (
                                    <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
                                        {Array.from({ length: pdfDocument.numPages }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActivePageIndex(i)}
                                                className={`p-2 border rounded transition-all text-sm font-medium ${activePageIndex === i ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                                            >
                                                Page {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h3 className="font-semibold mb-2 text-gray-700">Redactions ({redactions.length})</h3>
                                <p className="text-xs text-gray-500 mb-2">Click and drag on the page to draw blackout boxes.</p>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {redactions.map((r, i) => (
                                        <div key={r.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                            <span className="text-gray-700 font-medium">Page {r.pageIndex + 1}</span>
                                            <button onClick={() => removeRedaction(r.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {redactions.length === 0 && (
                                        <div className="text-center py-4 text-sm text-gray-400 italic">No redactions yet</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Workspace */}
                        <div className="flex-1 bg-gray-200 p-4 rounded-lg overflow-auto flex justify-center relative min-h-[500px]">
                            {downloadUrl ? (
                                <div className="text-center bg-white p-8 rounded-lg shadow-lg self-center">
                                    <h3 className="text-xl font-bold mb-4">Redaction Complete</h3>
                                    <a
                                        href={downloadUrl}
                                        download={`Redacted_${file.name}`}
                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-md transition-all"
                                    >
                                        <Download /> Download Redacted PDF
                                    </a>
                                </div>
                            ) : (
                                <div
                                    className="relative shadow-lg cursor-crosshair inline-block"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    <canvas ref={canvasRef} className="bg-white block" />
                                    {/* Render Existing Redactions for active page */}
                                    {redactions.filter(r => r.pageIndex === activePageIndex).map(r => (
                                        <div
                                            key={r.id}
                                            style={{
                                                position: 'absolute',
                                                left: r.x,
                                                top: r.y,
                                                width: r.width,
                                                height: r.height,
                                                backgroundColor: 'black',
                                                opacity: 0.8,
                                            }}
                                            className="border border-white/20"
                                        />
                                    ))}
                                    {/* Render Current Dragging Rect */}
                                    {currentRect && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: currentRect.x,
                                                top: currentRect.y,
                                                width: currentRect.width,
                                                height: currentRect.height,
                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                border: '1px dashed red'
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ToolPageContent
                title="Redact PDF Documents"
                howToUse={redactPdfContent.howToUse}
                whyUseThis={redactPdfContent.whyUseThis}
                tips={redactPdfContent.tips}
                faqs={redactPdfContent.faqs}
                relatedTools={redactPdfContent.relatedTools}
            />
        </div>
    );
};

export default RedactPdf;
