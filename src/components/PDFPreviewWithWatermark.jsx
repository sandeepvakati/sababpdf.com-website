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
                        const viewport = page.getViewport({ scale: 1.5 });

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

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-y-auto bg-gray-800 rounded-xl p-4 space-y-4"
        >
            {renderedPages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                    Loading PDF pages...
                </div>
            ) : (
                renderedPages.map((pageData) => (
                    <div
                        key={pageData.pageNum}
                        className="relative bg-white mx-auto shadow-lg"
                        style={{
                            width: `${pageData.width}px`,
                            height: `${pageData.height}px`
                        }}
                    >
                        {/* PDF Page Canvas */}
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
                        <div
                            className="absolute pointer-events-none text-center select-none"
                            style={{
                                color: options.color,
                                opacity: options.opacity,
                                fontSize: `${options.fontSize}px`,
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

                        {/* Page Number Badge */}
                        <div className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-75 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Page {pageData.pageNum} of {numPages}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default PDFPreviewWithWatermark;
