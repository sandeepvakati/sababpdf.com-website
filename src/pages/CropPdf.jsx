import React, { useState, useRef, useEffect } from 'react';
import { FileBadge, ArrowRight, Download, Loader2, Crop, Check, X } from 'lucide-react';
import { cropPdf } from '../utils/conversionUtils';
import * as pdfjsLib from 'pdfjs-dist';

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
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                setPdfDocument(pdf);
                // Reset selection when file loads
                setCropSelection(null);
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
                const page = await pdfDocument.getPage(activePageIndex + 1);
                // Use a manageable viewport scale
                const viewport = page.getViewport({ scale: 1.0 });
                // Adjust scale to fit container width if needed, or keeping logical 1.0 for simplicity of UI rect
                // Let's use 1.0 or 1.5. 1.5 is better for visibility.

                // Better strategy: Calculate scale to fit width of container?
                // For simplicity in this demo, fixed scale.
                const scale = 1.0;
                const scaledViewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;

                await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
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
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                Apply to All Pages
                            </label>
                            <button
                                onClick={handleCrop}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 shadow-sm"
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
                                            <span className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-1 rounded">
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
        </div>
    );
};

export default CropPdf;
