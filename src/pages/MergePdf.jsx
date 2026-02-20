import { useState, useEffect, useRef, useCallback } from 'react';
import FileUploader from '../components/FileUploader';
import { mergePdfs, mergePages } from '../utils/pdfUtils';
import { Layers, Download, X, Plus, FileText, ChevronLeft, ChevronRight, Eye, Pencil, RotateCcw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';


pdfjsLib.GlobalWorkerOptions.workerSrc = https://cdnjs.cloudflare.com/ajax/libs/pdf.js//pdf.worker.min.mjs;

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
    const idx = allPages.findIndex((p) => p.id === previewData.id);
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
                    {idx > 0 && <button onClick={() => onNavigate(allPages[idx - 1])} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 text-gray-700 hover:text-red-500 z-10"><ChevronLeft className="h-6 w-6" /></button>}
                    <canvas ref={canvasRef} className="block bg-white shadow-xl rounded max-w-full max-h-[70vh]" />
                    {idx < allPages.length - 1 && <button onClick={() => onNavigate(allPages[idx + 1])} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 text-gray-700 hover:text-red-500 z-10"><ChevronRight className="h-6 w-6" /></button>}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-center gap-2 text-xs text-gray-500">
                    <span>← → Navigate</span><span>•</span><span>Esc to close</span>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const MergePdf = () => {
    const [allPages, setAllPages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [previewPage, setPreviewPage] = useState(null);

    // Edit mode state
    const [editMode, setEditMode] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState([]);

    // File tracking
    const [fileRefs, setFileRefs] = useState([]); // { file, color }
    const fileColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500', 'bg-amber-500'];
    const fileColorIdx = useRef(0);

    // ─── Load PDFs ────────────────────────────────────────────────────────────
    const loadPdfFiles = useCallback(async (newFiles) => {
        setIsLoading(true);
        try {
            const newPages = [];
            const newRefs = [];
            for (const file of newFiles) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    const color = fileColors[fileColorIdx.current % fileColors.length];
                    fileColorIdx.current++;
                    newRefs.push({ file, color, name: file.name });
                    for (let i = 1; i <= pdfDoc.numPages; i++) {
                        newPages.push({
                            id: `${file.name}-${Date.now()}-${Math.random()}-p${i}`,
                            file, pdfDoc, pageNum: i,
                            totalPages: pdfDoc.numPages,
                            fileName: file.name, fileColor: color,
                        });
                    }
                } catch (err) {
                    console.error(`Error loading ${file.name}:`, err);
                    alert(`Failed to load "${file.name}". Make sure it's a valid PDF.`);
                }
            }
            setAllPages((prev) => [...prev, ...newPages]);
            setFileRefs((prev) => [...prev, ...newRefs]);
            setDownloadUrl(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleFilesSelected = (files) => loadPdfFiles(files);

    const handleRemoveFile = (fileName) => {
        const idsToRemove = allPages.filter((p) => p.fileName === fileName).map((p) => p.id);
        setAllPages((prev) => prev.filter((p) => p.fileName !== fileName));
        setFileRefs((prev) => prev.filter((f) => f.name !== fileName));
        setSelectedOrder((prev) => prev.filter((id) => !idsToRemove.includes(id)));
        setDownloadUrl(null);
    };

    // ─── Edit mode checkbox toggle ────────────────────────────────────────────
    const togglePage = (pageId) => {
        setSelectedOrder((prev) =>
            prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
        );
        setDownloadUrl(null);
    };

    const selectAll = () => { setSelectedOrder(allPages.map((p) => p.id)); setDownloadUrl(null); };
    const deselectAll = () => { setSelectedOrder([]); setDownloadUrl(null); };

    const enterEditMode = () => {
        setEditMode(true);
        setSelectedOrder([]);
        setDownloadUrl(null);
    };

    const exitEditMode = () => {
        setEditMode(false);
        setSelectedOrder([]);
        setDownloadUrl(null);
    };

    // ─── Merge ────────────────────────────────────────────────────────────────
    const handleMerge = async () => {
        setIsProcessing(true);
        try {
            let blob;
            if (editMode && selectedOrder.length > 0) {
                // Merge only selected pages in custom order
                const pageOrder = selectedOrder.map((id) => {
                    const page = allPages.find((p) => p.id === id);
                    return { file: page.file, pageIndex: page.pageNum - 1 };
                });
                blob = await mergePages(pageOrder);
            } else {
                // Default: merge all files in upload order
                const uniqueFiles = [];
                const seen = new Set();
                for (const p of allPages) {
                    if (!seen.has(p.file)) {
                        seen.add(p.file);
                        uniqueFiles.push(p.file);
                    }
                }
                blob = await mergePdfs(uniqueFiles);
            }
            setDownloadUrl(URL.createObjectURL(blob));
        } catch (error) {
            console.error('Merge error:', error);
            alert('Failed to merge PDFs. Please ensure all files are valid PDFs.');
        } finally {
            setIsProcessing(false);
        }
    };

    const uniqueFileNames = [...new Set(allPages.map((p) => p.fileName))];

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Layers className="h-8 w-8 text-red-500" />
                        Merge PDF files
                    </h1>
                    <p className="text-gray-600">
                        Combine PDFs in the order you want with the easiest PDF merger available.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {allPages.length === 0 && !isLoading ? (
                        <FileUploader onFilesSelected={handleFilesSelected} />
                    ) : (
                        <div className="space-y-6">
                            {/* ── Header ─────────────────────────────────────────── */}
                            <div className="flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-700">
                                        {uniqueFileNames.length} {uniqueFileNames.length === 1 ? 'File' : 'Files'} • {allPages.length} {allPages.length === 1 ? 'Page' : 'Pages'}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {editMode
                                            ? <>☑️ Click pages to set custom merge order — <span className="font-medium text-red-500">{selectedOrder.length} selected</span></>
                                            : 'All pages will merge in order. Click ✏️ to rearrange.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Edit mode toggle */}
                                    {!editMode ? (
                                        <button
                                            onClick={enterEditMode}
                                            className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition-colors"
                                            title="Rearrange page order"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Rearrange Pages
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={selectAll}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={deselectAll}
                                                className="text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                                Reset
                                            </button>
                                            <button
                                                onClick={exitEditMode}
                                                className="text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                ✕ Exit Edit
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => document.getElementById('add-more-input').click()}
                                        className="flex items-center gap-1 text-red-500 font-medium hover:text-red-700 text-sm bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add files
                                    </button>
                                    <input id="add-more-input" type="file" className="hidden" multiple accept=".pdf"
                                        onChange={(e) => handleFilesSelected(Array.from(e.target.files))} />
                                </div>
                            </div>

                            {/* ── File legend ────────────────────────────────────── */}
                            {uniqueFileNames.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    {uniqueFileNames.map((name) => {
                                        const p = allPages.find((pg) => pg.fileName === name);
                                        return (
                                            <div key={name} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 text-sm group">
                                                <div className={`w-3 h-3 rounded-full ${p?.fileColor}`} />
                                                <span className="text-gray-700 truncate max-w-[200px]">{name}</span>
                                                <button onClick={() => handleRemoveFile(name)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove file">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Edit mode banner ──────────────────────────────── */}
                            {editMode && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
                                    <Pencil className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-sm text-amber-800">
                                        <strong>Rearrange Mode:</strong> Click pages in the order you want them. The first page you click becomes page 1, the next becomes page 2, and so on.
                                    </p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                                    <span className="ml-3 text-gray-600">Loading PDF pages...</span>
                                </div>
                            )}

                            {/* ── Page grid ──────────────────────────────────────── */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[550px] overflow-y-auto pr-1">
                                {allPages.map((page) => {
                                    const orderIdx = selectedOrder.indexOf(page.id);
                                    const isSelected = editMode && orderIdx !== -1;
                                    const orderNum = orderIdx + 1;

                                    return (
                                        <div
                                            key={page.id}
                                            className={`rounded-lg border-2 shadow-sm overflow-hidden transition-all group select-none
                                                ${isSelected
                                                    ? 'border-red-400 bg-red-50 shadow-md ring-2 ring-red-200'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}
                                            `}
                                        >
                                            {/* Color bar */}
                                            <div className={`h-1 ${page.fileColor}`} />

                                            <div className="relative">
                                                {/* Edit mode: checkbox/order badge */}
                                                {editMode && (
                                                    <div
                                                        className="absolute top-1 left-1 z-10 cursor-pointer"
                                                        onClick={() => togglePage(page.id)}
                                                    >
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md
                                                            ${isSelected
                                                                ? 'bg-red-500 text-white scale-110'
                                                                : 'bg-white/90 text-gray-400 border-2 border-gray-300 hover:border-red-400 hover:text-red-400'}
                                                        `}>
                                                            {isSelected ? orderNum : ''}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Eye preview */}
                                                <div
                                                    className="absolute top-1 right-1 z-10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setPreviewPage(page)}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white">
                                                        <Eye className="h-3.5 w-3.5 text-gray-600" />
                                                    </div>
                                                </div>

                                                {/* Thumbnail */}
                                                <div
                                                    className={`p-1.5 ${editMode ? 'cursor-pointer' : ''}`}
                                                    onClick={editMode ? () => togglePage(page.id) : undefined}
                                                >
                                                    <PageThumbnail pageData={{ pdfDoc: page.pdfDoc, pageNum: page.pageNum }} />
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className={`px-2 py-1.5 border-t text-center transition-colors
                                                ${isSelected ? 'bg-red-100 border-red-200' : 'bg-gray-50 border-gray-100'}`}
                                            >
                                                <span className={`text-xs font-medium ${isSelected ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {isSelected ? `#${orderNum} in merge` : `Page ${page.pageNum}`}
                                                </span>
                                                <span className="text-[10px] text-gray-400 block truncate" title={page.fileName}>
                                                    {page.fileName.length > 15 ? page.fileName.slice(0, 13) + '…' : page.fileName}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Selected order summary (edit mode only) ──────── */}
                            {editMode && selectedOrder.length > 0 && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                        📋 Merge Order ({selectedOrder.length} pages)
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedOrder.map((id, i) => {
                                            const pg = allPages.find((p) => p.id === id);
                                            if (!pg) return null;
                                            return (
                                                <span key={id} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs shadow-sm">
                                                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                                    <span className="text-gray-600 truncate max-w-[80px]">{pg.fileName.length > 10 ? pg.fileName.slice(0, 8) + '…' : pg.fileName}</span>
                                                    <span className="text-gray-400">p{pg.pageNum}</span>
                                                    <button onClick={() => togglePage(id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Action buttons ─────────────────────────────────── */}
                            <div className="pt-4 flex justify-center gap-4">
                                {downloadUrl ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <a href={downloadUrl} download="merged_document.pdf"
                                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                                            <Download className="h-5 w-5" />
                                            Download Merged PDF
                                        </a>
                                        <button onClick={() => { setAllPages([]); setFileRefs([]); setSelectedOrder([]); setEditMode(false); setDownloadUrl(null); }}
                                            className="text-sm text-gray-500 hover:text-gray-700 underline">
                                            Start over
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleMerge}
                                        disabled={isProcessing || allPages.length === 0 || (editMode && selectedOrder.length === 0)}
                                        className={`flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                            ${isProcessing || allPages.length === 0 || (editMode && selectedOrder.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <Layers className="h-5 w-5" />
                                        {isProcessing
                                            ? 'Merging...'
                                            : editMode
                                                ? `Merge ${selectedOrder.length} Pages`
                                                : `Merge All ${allPages.length} Pages`}
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
                    allPages={allPages}
                    onClose={() => setPreviewPage(null)}
                    onNavigate={(p) => setPreviewPage(p)}
                />
            )}
        </div>
    );
};

export default MergePdf;
