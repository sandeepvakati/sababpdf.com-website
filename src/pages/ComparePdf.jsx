import React, { useState, useEffect, useRef } from 'react';
import { Upload, ArrowRightLeft, Layers, Eye, ZoomIn, ZoomOut, Move } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
// Configure PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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
                    const doc1 = await pdfjsLib.getDocument({ data: buffer1 }).promise;
                    setPdf1(doc1);

                    const buffer2 = await file2.arrayBuffer();
                    const doc2 = await pdfjsLib.getDocument({ data: buffer2 }).promise;
                    setPdf2(doc2);

                    // Use the max page count of the two (or min? usually max to see all)
                    setNumPages(Math.max(doc1.numPages, doc2.numPages));
                    setCurrentPage(1);
                } catch (error) {
                    console.error("Error loading PDFs:", error);
                    alert("Error loading PDF files. Please try again.");
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

            await renderPageToCanvas(pdf1, currentPage, canvas1Ref.current);
            await renderPageToCanvas(pdf2, currentPage, canvas2Ref.current);
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
                                    <button onClick={() => setFile1(null)} className="text-xs text-red-500 mt-2 underline">Remove</button>
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
                                    <button onClick={() => setFile2(null)} className="text-xs text-red-500 mt-2 underline">Remove</button>
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
                                <button className={`p-2 rounded ${viewMode === 'side-by-side' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setViewMode('side-by-side')} title="Side by Side">
                                    <ArrowRightLeft className="w-5 h-5" />
                                </button>
                                <button className={`p-2 rounded ${viewMode === 'overlay' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setViewMode('overlay')} title="Overlay">
                                    <Layers className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">Prev</button>
                                <span className="font-medium">Page {currentPage} of {numPages}</span>
                                <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage === numPages} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">Next</button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-gray-100 rounded"><ZoomOut className="w-5 h-5" /></button>
                                <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 hover:bg-gray-100 rounded"><ZoomIn className="w-5 h-5" /></button>
                            </div>

                            {viewMode === 'overlay' && (
                                <div className="flex items-center gap-2 w-32">
                                    <span className="text-xs">Opacity</span>
                                    <input type="range" min="0" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            )}

                            <button onClick={() => { setPdf1(null); setPdf2(null); setFile1(null); setFile2(null); }} className="text-red-500 hover:text-red-700 text-sm font-medium">Reset</button>
                        </div>

                        {/* Viewing Area */}
                        <div className="flex-grow bg-gray-200 p-4 rounded-lg overflow-auto flex justify-center">
                            {viewMode === 'side-by-side' ? (
                                <div className="flex gap-4">
                                    <div className="bg-white shadow-lg">
                                        <div className="bg-gray-100 text-xs p-1 text-center font-semibold">Original</div>
                                        <canvas ref={canvas1Ref} />
                                    </div>
                                    <div className="bg-white shadow-lg">
                                        <div className="bg-gray-100 text-xs p-1 text-center font-semibold text-blue-600">Modified</div>
                                        <canvas ref={canvas2Ref} />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative bg-white shadow-lg">
                                    <div className="absolute top-0 left-0 z-10 pointer-events-none mix-blend-multiply transition-opacity duration-200" style={{ opacity: 1 }}>
                                        {/* Bottom Layer (Original) */}
                                        <canvas ref={canvas1Ref} />
                                    </div>
                                    <div className="absolute top-0 left-0 z-20 pointer-events-none mix-blend-multiply transition-opacity duration-200" style={{ opacity: opacity }}>
                                        {/* Top Layer (Modified) - usually we want to see difference. 
                                            Standard overlay: Original opaque, Modified transparent on top.
                                        */}
                                        <canvas ref={canvas2Ref} />
                                    </div>
                                    {/* Placeholder to give size to the container since absolute children don't */}
                                    <div style={{ width: canvas1Ref.current?.width || '100px', height: canvas1Ref.current?.height || '100px' }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComparePdf;
