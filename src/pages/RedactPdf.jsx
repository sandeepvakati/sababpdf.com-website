import React, { useState, useRef, useEffect } from 'react';
import { FileBadge, ArrowRight, Download, Loader2, Trash2, Undo, MousePointer } from 'lucide-react';
import { applyRedactions } from '../utils/conversionUtils';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker specifically for this component if needed, 
// but it should be globally configured in conversionUtils or index.
// We'll assume global config or re-apply it safely.
// conversionUtils sets it: pdfjsLib.GlobalWorkerOptions.workerSrc = ...

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
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                setPdfDocument(pdf);
                // We'll render just the active page for interaction
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
                const page = await pdfDocument.getPage(activePageIndex + 1);
                const viewport = page.getViewport({ scale: 1.5 }); // Good viewing scale
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;
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
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1"
                            >
                                <Undo size={14} /> Clear All
                            </button>
                            <button
                                onClick={handleApplyRedactions}
                                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center gap-2"
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
                                <h3 className="font-semibold mb-2">Pages</h3>
                                {pdfDocument && (
                                    <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                                        {Array.from({ length: pdfDocument.numPages }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActivePageIndex(i)}
                                                className={`p-2 border rounded ${activePageIndex === i ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
                                            >
                                                Page {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h3 className="font-semibold mb-2">Redactions ({redactions.length})</h3>
                                <p className="text-xs text-gray-500 mb-2">Click and drag on the page to draw blackout boxes.</p>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {redactions.map((r, i) => (
                                        <div key={r.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                            <span>Page {r.pageIndex + 1}</span>
                                            <button onClick={() => removeRedaction(r.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Workspace */}
                        <div className="flex-1 bg-gray-200 p-4 rounded-lg overflow-auto flex justify-center relative">
                            {downloadUrl ? (
                                <div className="text-center bg-white p-8 rounded-lg">
                                    <h3 className="text-xl font-bold mb-4">Redaction Complete</h3>
                                    <a
                                        href={downloadUrl}
                                        download={`Redacted_${file.name}`}
                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                                    >
                                        <Download /> Download Redacted PDF
                                    </a>
                                </div>
                            ) : (
                                <div
                                    className="relative shadow-lg cursor-crosshair"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    <canvas ref={canvasRef} className="bg-white" />
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
        </div>
    );
};

export default RedactPdf;
