import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFPreviewWithWatermark = ({ file, watermarkText, options }) => {
    const containerRef = useRef(null);
    const [numPages, setNumPages] = useState(0);
    const [renderedPages, setRenderedPages] = useState([]);

    useEffect(() => {
        if (!file) return;

        const loadPDF = async () => {
            try {
                const fileReader = new FileReader();

                fileReader.onload = async function () {
                    const typedarray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    setNumPages(pdf.numPages);

                    // Render all pages
                    const pages = [];
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 0.8 }); // Smaller for grid view

                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise;

                        pages.push({
                            pageNum,
                            canvas,
                            width: viewport.width,
                            height: viewport.height
                        });
                    }
                    setRenderedPages(pages);
                };

                fileReader.readAsArrayBuffer(file);
            } catch (error) {
                console.error('Error loading PDF:', error);
            }
        };

        loadPDF();
    }, [file]);

    // Render mosaic watermark pattern
    const renderMosaicWatermark = (pageWidth, pageHeight) => {
        const watermarks = [];
        const spacing = 200; // Space between watermarks

        for (let y = 0; y < pageHeight; y += spacing) {
            for (let x = 0; x < pageWidth; x += spacing) {
                watermarks.push(
                    <div
                        key={`${x}-${y}`}
                        className="absolute pointer-events-none text-center select-none"
                        style={{
                            color: options.color,
                            opacity: options.opacity,
                            fontSize: `${options.fontSize}px`,
                            fontWeight: 'bold',
                            top: `${y}px`,
                            left: `${x}px`,
                            transform: `rotate(${options.rotation}deg)`,
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                            textShadow: '0 0 10px rgba(0,0,0,0.3)'
                        }}
                    >
                        {watermarkText || 'WATERMARK'}
                    </div>
                );
            }
        }
        return watermarks;
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-y-auto bg-gray-100 rounded-xl p-6"
        >
            {renderedPages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p>Loading PDF pages...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {renderedPages.map((pageData) => (
                        <div
                            key={pageData.pageNum}
                            className="relative bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border-2 border-gray-200 hover:border-purple-400"
                        >
                            {/* PDF Page Canvas */}
                            <div className="relative" style={{ aspectRatio: `${pageData.width}/${pageData.height}` }}>
                                <canvas
                                    ref={(el) => {
                                        if (el && pageData.canvas) {
                                            el.width = pageData.canvas.width;
                                            el.height = pageData.canvas.height;
                                            const ctx = el.getContext('2d');
                                            ctx.drawImage(pageData.canvas, 0, 0);
                                        }
                                    }}
                                    className="w-full h-full"
                                />

                                {/* Watermark Overlay */}
                                {options.isMosaic ? (
                                    // Mosaic pattern - multiple watermarks
                                    renderMosaicWatermark(pageData.width, pageData.height)
                                ) : (
                                    // Single watermark
                                    <div
                                        className="absolute pointer-events-none text-center select-none"
                                        style={{
                                            color: options.color,
                                            opacity: options.opacity,
                                            fontSize: `${options.fontSize * 0.8}px`, // Scale down for grid view
                                            fontWeight: 'bold',
                                            top: options.position.includes('top') ? '15%' :
                                                options.position.includes('bottom') ? '85%' : '50%',
                                            left: options.position.includes('left') ? '15%' :
                                                options.position.includes('right') ? '85%' : '50%',
                                            transform: `translate(-50%, -50%) rotate(${options.rotation}deg)`,
                                            whiteSpace: 'nowrap',
                                            zIndex: 10,
                                            textShadow: '0 0 10px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {watermarkText || 'WATERMARK'}
                                    </div>
                                )}
                            </div>

                            {/* Page Number Badge */}
                            <div className="absolute top-2 left-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                {pageData.pageNum}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PDFPreviewWithWatermark;
