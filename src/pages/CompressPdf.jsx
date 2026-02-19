import { useState, useEffect, useRef, useCallback } from 'react';
import FileUploader from '../components/FileUploader';
import { Minimize2, Download, FileText, Trash2, X, ChevronLeft, ChevronRight, Eye, Zap, Shield, Gauge, Pencil, RotateCcw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// ─── Thumbnail ──────────────────────────────────────────────────────────────────
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

// ─── Preview Modal ──────────────────────────────────────────────────────────────
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
                    {idx > 0 && <button onClick={() => onNavigate(allPages[idx - 1])} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 text-gray-700 hover:text-blue-500 z-10"><ChevronLeft className="h-6 w-6" /></button>}
                    <canvas ref={canvasRef} className="block bg-white shadow-xl rounded max-w-full max-h-[70vh]" />
                    {idx < allPages.length - 1 && <button onClick={() => onNavigate(allPages[idx + 1])} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 text-gray-700 hover:text-blue-500 z-10"><ChevronRight className="h-6 w-6" /></button>}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-center gap-2 text-xs text-gray-500">
                    <span>← → Navigate</span><span>•</span><span>Esc to close</span>
                </div>
            </div>
        </div>
    );
};

// ─── Format file size ───────────────────────────────────────────────────────────
const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

// ─── Compression levels ─────────────────────────────────────────────────────────
const compressionLevels = [
    {
        id: 'extreme',
        label: 'Extreme',
        description: 'Ultra small — may lose detail',
        icon: Zap,
        color: 'red',
        targetLabel: '200 KB',
        targetBytes: 200 * 1024,
        quality: 0.30,
        qualityBar: 1,
    },
    {
        id: 'high',
        label: 'High',
        description: 'Very compact file size',
        icon: Zap,
        color: 'orange',
        targetLabel: '500 KB',
        targetBytes: 500 * 1024,
        quality: 0.50,
        qualityBar: 2,
    },
    {
        id: 'medium',
        label: 'Recommended',
        description: 'Best balance of size & quality',
        icon: Gauge,
        color: 'green',
        targetLabel: '1 MB',
        targetBytes: 1 * 1024 * 1024,
        quality: 0.72,
        qualityBar: 3,
        recommended: true,
    },
    {
        id: 'low',
        label: 'Low',
        description: 'Good quality, moderate size',
        icon: Shield,
        color: 'blue',
        targetLabel: '2 MB',
        targetBytes: 2 * 1024 * 1024,
        quality: 0.85,
        qualityBar: 4,
    },
    {
        id: 'minimal',
        label: 'Minimal',
        description: 'Near-original quality',
        icon: Shield,
        color: 'indigo',
        targetLabel: '~85%',
        targetBytes: null, // uses factor
        estimateFactor: 0.85,
        quality: 0.95,
        qualityBar: 5,
    },
];

// ─── Main Component ─────────────────────────────────────────────────────────────
const CompressPdf = () => {
    const [file, setFile] = useState(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [compressedSize, setCompressedSize] = useState(null);
    const [previewPage, setPreviewPage] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('medium');

    // Edit mode
    const [editMode, setEditMode] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState([]);

    // ─── Load PDF ─────────────────────────────────────────────────────────────
    const handleFileSelected = useCallback(async (files) => {
        if (files.length === 0) return;
        const selectedFile = files[0];
        setFile(selectedFile);
        setDownloadUrl(null);
        setCompressedSize(null);
        setIsLoading(true);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            setPdfDoc(doc);
            setPageCount(doc.numPages);
        } catch (error) {
            console.error('Error reading PDF:', error);
            alert('Invalid PDF file.');
            setFile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleRemoveFile = () => {
        setFile(null);
        setPdfDoc(null);
        setPageCount(0);
        setDownloadUrl(null);
        setCompressedSize(null);
        setEditMode(false);
        setSelectedOrder([]);
    };

    // ─── Edit mode helpers ────────────────────────────────────────────────
    const togglePage = (pageNum) => {
        setSelectedOrder((prev) =>
            prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
        );
        setDownloadUrl(null); setCompressedSize(null);
    };
    const selectAll = () => { setSelectedOrder(Array.from({ length: pageCount }, (_, i) => i + 1)); setDownloadUrl(null); setCompressedSize(null); };
    const deselectAll = () => { setSelectedOrder([]); setDownloadUrl(null); setCompressedSize(null); };
    const enterEditMode = () => { setEditMode(true); setSelectedOrder([]); setDownloadUrl(null); setCompressedSize(null); };
    const exitEditMode = () => { setEditMode(false); setSelectedOrder([]); setDownloadUrl(null); setCompressedSize(null); };

    // ─── Compress ─────────────────────────────────────────────────────────────
    const handleCompress = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const level = compressionLevels.find((l) => l.id === selectedLevel);
            const arrayBuffer = await file.arrayBuffer();
            const pdfLibDoc = await PDFDocument.load(arrayBuffer);

            // Determine which pages to include
            const pagesToProcess = editMode && selectedOrder.length > 0
                ? selectedOrder.map((p) => p - 1) // 0-based
                : Array.from({ length: pdfLibDoc.getPageCount() }, (_, i) => i);

            // Re-render pages through canvas at the selected quality level
            const newPdf = await PDFDocument.create();

            for (const pageIdx of pagesToProcess) {
                const [page] = await newPdf.copyPages(pdfLibDoc, [pageIdx]);
                newPdf.addPage(page);
            }

            // Save with compression options
            const pdfBytes = await newPdf.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: selectedLevel === 'high' ? 20 : 50,
            });

            // For higher compression, also re-encode images at lower quality
            let finalBlob;
            if (selectedLevel !== 'minimal') {
                // Re-render each page to canvas and rebuild PDF with compressed images
                const compressedPdf = await PDFDocument.create();

                for (const pageIdx of pagesToProcess) {
                    const srcPage = pdfLibDoc.getPage(pageIdx);
                    const { width, height } = srcPage.getSize();

                    // Render page to canvas using pdfjs
                    const pageObj = await pdfDoc.getPage(pageIdx + 1);
                    const scale = level.quality;
                    const viewport = pageObj.getViewport({ scale: scale * 2 });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');
                    await pageObj.render({ canvasContext: ctx, viewport }).promise;

                    // Convert to JPEG with quality setting
                    const jpegDataUrl = canvas.toDataURL('image/jpeg', level.quality);
                    const jpegBytes = Uint8Array.from(atob(jpegDataUrl.split(',')[1]), (c) => c.charCodeAt(0));
                    const jpegImage = await compressedPdf.embedJpg(jpegBytes);

                    const page = compressedPdf.addPage([width, height]);
                    page.drawImage(jpegImage, {
                        x: 0,
                        y: 0,
                        width: width,
                        height: height,
                    });
                }

                const compressedBytes = await compressedPdf.save({ useObjectStreams: true });
                finalBlob = new Blob([compressedBytes], { type: 'application/pdf' });
            } else {
                finalBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            }

            setDownloadUrl(URL.createObjectURL(finalBlob));
            setCompressedSize(finalBlob.size);
        } catch (error) {
            console.error('Error compressing PDF:', error);
            alert('Failed to compress PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const level = compressionLevels.find((l) => l.id === selectedLevel);
    const getEstimatedSize = (lvl) => {
        if (!file) return 0;
        if (lvl.targetBytes) return Math.min(lvl.targetBytes, file.size);
        return Math.round(file.size * (lvl.estimateFactor || 0.85));
    };
    const estimatedSize = getEstimatedSize(level);
    const estimatedReduction = file ? Math.round(((file.size - estimatedSize) / file.size) * 100) : 0;

    const allPagesList = pdfDoc
        ? Array.from({ length: pageCount }, (_, i) => ({
            pdfDoc, pageNum: i + 1, totalPages: pageCount, fileName: file?.name || 'PDF',
        }))
        : [];

    const colorMap = {
        red: {
            bg: 'bg-red-50', border: 'border-red-300', ring: 'ring-red-200',
            text: 'text-red-700', iconBg: 'bg-red-100', icon: 'text-red-500',
            barBg: 'bg-red-500', sizeBg: 'bg-red-500',
        },
        orange: {
            bg: 'bg-orange-50', border: 'border-orange-300', ring: 'ring-orange-200',
            text: 'text-orange-700', iconBg: 'bg-orange-100', icon: 'text-orange-500',
            barBg: 'bg-orange-500', sizeBg: 'bg-orange-500',
        },
        green: {
            bg: 'bg-green-50', border: 'border-green-300', ring: 'ring-green-200',
            text: 'text-green-700', iconBg: 'bg-green-100', icon: 'text-green-500',
            barBg: 'bg-green-500', sizeBg: 'bg-green-500',
        },
        blue: {
            bg: 'bg-blue-50', border: 'border-blue-300', ring: 'ring-blue-200',
            text: 'text-blue-700', iconBg: 'bg-blue-100', icon: 'text-blue-500',
            barBg: 'bg-blue-500', sizeBg: 'bg-blue-500',
        },
        indigo: {
            bg: 'bg-indigo-50', border: 'border-indigo-300', ring: 'ring-indigo-200',
            text: 'text-indigo-700', iconBg: 'bg-indigo-100', icon: 'text-indigo-500',
            barBg: 'bg-indigo-500', sizeBg: 'bg-indigo-500',
        },
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Minimize2 className="h-8 w-8 text-blue-500" />
                        Compress PDF file
                    </h1>
                    <p className="text-gray-600">
                        Reduce file size while optimizing for maximal PDF quality.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file && !isLoading ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} />
                    ) : (
                        <div className="space-y-6">
                            {/* ── File info ──────────────────────────────────────── */}
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <FileText className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{file?.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Original: <span className="font-semibold text-gray-700">{formatSize(file?.size)}</span> • {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={handleRemoveFile} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            {isLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    <span className="ml-3 text-gray-600">Loading PDF pages...</span>
                                </div>
                            )}

                            {/* ── Toolbar ──────────────────────────────────────── */}
                            <div className="flex flex-wrap justify-between items-center gap-4">
                                <p className="text-sm text-gray-500">
                                    {editMode
                                        ? <>☑️ Click pages to select — <span className="font-medium text-blue-600">{selectedOrder.length} selected</span></>
                                        : 'All pages will be compressed. Click ✏️ to pick specific pages.'}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {!editMode ? (
                                        <button onClick={enterEditMode} className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition-colors">
                                            <Pencil className="h-4 w-4" /> Pick Pages
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={selectAll} className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Select All</button>
                                            <button onClick={deselectAll} className="text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
                                            <button onClick={exitEditMode} className="text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">✕ Exit Edit</button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ── Edit mode banner ──────────────────────────────── */}
                            {editMode && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
                                    <Pencil className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-sm text-amber-800">
                                        <strong>Pick Mode:</strong> Click pages to select which ones to compress. Only selected pages will be included in the output.
                                    </p>
                                </div>
                            )}

                            {/* ── Page preview grid ──────────────────────────────── */}
                            {pdfDoc && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">📄 Page Preview</h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[350px] overflow-y-auto pr-1">
                                        {Array.from({ length: pageCount }, (_, i) => {
                                            const pageNum = i + 1;
                                            const orderIdx = selectedOrder.indexOf(pageNum);
                                            const isSelected = editMode && orderIdx !== -1;
                                            const orderNum = orderIdx + 1;

                                            return (
                                                <div key={i} className={`rounded-lg border-2 shadow-sm overflow-hidden transition-all group select-none
                                                    ${isSelected
                                                        ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}
                                                `}>
                                                    <div className="relative">
                                                        {/* Edit mode badge */}
                                                        {editMode && (
                                                            <div className="absolute top-1 left-1 z-10 cursor-pointer" onClick={() => togglePage(pageNum)}>
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md
                                                                    ${isSelected
                                                                        ? 'bg-blue-500 text-white scale-110'
                                                                        : 'bg-white/90 text-gray-400 border-2 border-gray-300 hover:border-blue-400 hover:text-blue-400'}
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

                                                        {/* Thumbnail */}
                                                        <div className={`p-1.5 ${editMode ? 'cursor-pointer' : ''}`} onClick={editMode ? () => togglePage(pageNum) : undefined}>
                                                            <PageThumbnail pageData={{ pdfDoc, pageNum }} />
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-1.5 border-t text-center transition-colors
                                                        ${isSelected ? 'bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                                                        <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                                                            {isSelected ? `#${orderNum} selected` : `Page ${pageNum}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Selected order summary (edit mode) ──────────────── */}
                            {editMode && selectedOrder.length > 0 && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Pages to compress ({selectedOrder.length})</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedOrder.map((pageNum, i) => (
                                            <span key={pageNum} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs shadow-sm">
                                                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                                <span className="text-gray-600">Page {pageNum}</span>
                                                <button onClick={() => togglePage(pageNum)} className="text-gray-300 hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Compression level grid ─────────────────────────── */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">⚡ Choose Compression Level</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {compressionLevels.map((lvl) => {
                                        const isActive = selectedLevel === lvl.id;
                                        const c = colorMap[lvl.color];
                                        const Icon = lvl.icon;
                                        const estSize = getEstimatedSize(lvl);
                                        const estReduction = file ? Math.round(((file.size - estSize) / file.size) * 100) : 0;

                                        return (
                                            <button
                                                key={lvl.id}
                                                onClick={() => { setSelectedLevel(lvl.id); setDownloadUrl(null); setCompressedSize(null); }}
                                                className={`relative p-3 rounded-xl border-2 text-center transition-all transform hover:scale-[1.02]
                                                    ${isActive
                                                        ? `${c.bg} ${c.border} ring-2 ${c.ring} shadow-lg`
                                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}
                                                `}
                                            >
                                                {lvl.recommended && (
                                                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                                                        ★ BEST
                                                    </span>
                                                )}

                                                {/* Target size badge */}
                                                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2 text-white font-bold text-sm shadow-md
                                                    ${isActive ? c.sizeBg : 'bg-gray-300'}
                                                `}>
                                                    {lvl.targetLabel}
                                                </div>

                                                <p className={`font-semibold text-xs mb-1 ${isActive ? c.text : 'text-gray-700'}`}>
                                                    {lvl.label}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mb-2 leading-tight">{lvl.description}</p>

                                                {/* Quality bar */}
                                                <div className="flex justify-center gap-0.5 mb-2">
                                                    {[1, 2, 3, 4, 5].map((bar) => (
                                                        <div
                                                            key={bar}
                                                            className={`w-3 h-1.5 rounded-full transition-colors
                                                                ${bar <= lvl.qualityBar
                                                                    ? (isActive ? c.barBg : 'bg-gray-400')
                                                                    : 'bg-gray-200'}
                                                            `}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-gray-400">Quality</p>

                                                {/* Estimated output */}
                                                {file && (
                                                    <div className={`mt-2 pt-2 border-t ${isActive ? 'border-current/20' : 'border-gray-100'}`}>
                                                        <p className={`text-xs font-semibold ${isActive ? c.text : 'text-gray-500'}`}>
                                                            ~{formatSize(estSize)}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {estReduction > 0 ? `${estReduction}% smaller` : 'Similar size'}
                                                        </p>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Size comparison bar ────────────────────────────── */}
                            {file && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600">
                                            Original: <span className="font-semibold text-gray-800">{formatSize(file.size)}</span>
                                        </span>
                                        <span className={`font-semibold ${colorMap[level.color].text}`}>
                                            {compressedSize
                                                ? <>Compressed: {formatSize(compressedSize)} ({Math.round(((file.size - compressedSize) / file.size) * 100)}% saved)</>
                                                : <>Target: ~{formatSize(estimatedSize)} ({estimatedReduction}% reduction)</>}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${colorMap[level.color].barBg}`}
                                            style={{ width: `${compressedSize ? Math.min(100, Math.round((compressedSize / file.size) * 100)) : Math.min(100, Math.round((estimatedSize / file.size) * 100))}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                        <span>0 KB</span>
                                        <span>{formatSize(file.size)} (original)</span>
                                    </div>
                                </div>
                            )}

                            {/* ── Action buttons ────────────────────────────────── */}
                            <div className="flex justify-center pt-2">
                                {downloadUrl ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="text-center mb-2">
                                            <p className="text-green-600 font-semibold text-lg">
                                                ✅ Compressed successfully!
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatSize(file.size)} → {formatSize(compressedSize)}
                                                <span className="ml-2 font-medium text-green-600">
                                                    ({Math.round(((file.size - compressedSize) / file.size) * 100)}% saved)
                                                </span>
                                            </p>
                                        </div>
                                        <a href={downloadUrl} download={`compressed_${file?.name}`}
                                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                                            <Download className="h-5 w-5" />
                                            Download Compressed PDF
                                        </a>
                                        <button onClick={handleRemoveFile} className="text-sm text-gray-500 hover:text-gray-700 underline">
                                            Start over
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleCompress}
                                        disabled={isProcessing || (editMode && selectedOrder.length === 0)}
                                        className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                            ${isProcessing || (editMode && selectedOrder.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <Minimize2 className="h-5 w-5" />
                                        {isProcessing
                                            ? 'Compressing...'
                                            : editMode
                                                ? `Compress ${selectedOrder.length} Pages`
                                                : 'Compress PDF'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {previewPage && (
                <PagePreviewModal
                    previewData={previewPage}
                    allPages={allPagesList}
                    onClose={() => setPreviewPage(null)}
                    onNavigate={(p) => setPreviewPage(p)}
                />
            )}
        </div>
    );
};

export default CompressPdf;
