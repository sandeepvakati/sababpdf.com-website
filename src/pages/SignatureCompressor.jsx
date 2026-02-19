import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Upload, Trash2, Crop, Minimize2, Image, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical, X } from 'lucide-react';

// ─── Format file size ───────────────────────────────────────────────────────────
const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

// ─── Crop presets ───────────────────────────────────────────────────────────────
const cropPresets = [
    { id: 'free', label: 'Free', width: null, height: null, description: 'Custom crop', icon: '✂️' },
    { id: '200x200', label: '200×200', width: 200, height: 200, description: 'Small square', icon: '🔲' },
    { id: '300x100', label: '300×100', width: 300, height: 100, description: 'Signature strip', icon: '📝' },
    { id: '400x150', label: '400×150', width: 400, height: 150, description: 'Wide signature', icon: '✍️' },
    { id: '500x200', label: '500×200', width: 500, height: 200, description: 'Large signature', icon: '📋' },
    { id: '600x300', label: '600×300', width: 600, height: 300, description: 'Document stamp', icon: '📄' },
    { id: '800x400', label: '800×400', width: 800, height: 400, description: 'Banner crop', icon: '🖼️' },
    { id: '1024x768', label: '1024×768', width: 1024, height: 768, description: '4:3 ratio', icon: '🖥️' },
];

// ─── Compression targets ────────────────────────────────────────────────────────
const compressionTargets = [
    { id: '10kb', label: '10 KB', targetBytes: 10 * 1024, color: 'red', quality: 0.05, description: 'Ultra tiny' },
    { id: '50kb', label: '50 KB', targetBytes: 50 * 1024, color: 'orange', quality: 0.15, description: 'Very small' },
    { id: '100kb', label: '100 KB', targetBytes: 100 * 1024, color: 'amber', quality: 0.30, description: 'Small file' },
    { id: '200kb', label: '200 KB', targetBytes: 200 * 1024, color: 'yellow', quality: 0.50, description: 'Compact' },
    { id: '500kb', label: '500 KB', targetBytes: 500 * 1024, color: 'green', quality: 0.70, description: 'Balanced', recommended: true },
    { id: '1mb', label: '1 MB', targetBytes: 1024 * 1024, color: 'blue', quality: 0.85, description: 'Good quality' },
    { id: '2mb', label: '2 MB', targetBytes: 2 * 1024 * 1024, color: 'indigo', quality: 0.92, description: 'High quality' },
    { id: '5mb', label: '5 MB', targetBytes: 5 * 1024 * 1024, color: 'purple', quality: 0.97, description: 'Best quality' },
];

const colorClasses = {
    red: { bg: 'bg-red-50', border: 'border-red-300', ring: 'ring-red-200', text: 'text-red-700', badge: 'bg-red-500', bar: 'bg-red-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-300', ring: 'ring-orange-200', text: 'text-orange-700', badge: 'bg-orange-500', bar: 'bg-orange-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-300', ring: 'ring-amber-200', text: 'text-amber-700', badge: 'bg-amber-500', bar: 'bg-amber-500' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', ring: 'ring-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-500', bar: 'bg-yellow-500' },
    green: { bg: 'bg-green-50', border: 'border-green-300', ring: 'ring-green-200', text: 'text-green-700', badge: 'bg-green-500', bar: 'bg-green-500' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-300', ring: 'ring-blue-200', text: 'text-blue-700', badge: 'bg-blue-500', bar: 'bg-blue-500' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-300', ring: 'ring-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-500', bar: 'bg-indigo-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-300', ring: 'ring-purple-200', text: 'text-purple-700', badge: 'bg-purple-500', bar: 'bg-purple-500' },
};

// ─── Main ───────────────────────────────────────────────────────────────────────
const SignatureCompressor = () => {
    const [image, setImage] = useState(null);        // { file, url, width, height }
    const [outputImage, setOutputImage] = useState(null); // { url, blob, width, height }
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('compress'); // 'compress' | 'crop' | 'resize'
    const [selectedTarget, setSelectedTarget] = useState('500kb');
    const [selectedCrop, setSelectedCrop] = useState('free');
    const [customWidth, setCustomWidth] = useState('');
    const [customHeight, setCustomHeight] = useState('');
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [customKB, setCustomKB] = useState(50); // New state for slider

    // Crop state
    const [cropBox, setCropBox] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragMode, setDragMode] = useState('create'); // 'create', 'move', 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
    const canvasRef = useRef(null);
    const previewRef = useRef(null);
    const fileInputRef = useRef(null);

    // ─── Upload ─────────────────────────────────────────────────────────────
    const handleUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, WEBP, etc.)');
            return;
        }
        const url = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => {
            setImage({ file, url, width: img.naturalWidth, height: img.naturalHeight });
            setOutputImage(null);
            setRotation(0);
            setFlipH(false);
            setFlipV(false);
            setCropBox(null);
            setCustomWidth(String(img.naturalWidth));
            setCustomHeight(String(img.naturalHeight));
        };
        img.src = url;
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const dt = new DataTransfer();
            dt.items.add(file);
            if (fileInputRef.current) {
                fileInputRef.current.files = dt.files;
                handleUpload({ target: { files: [file] } });
            }
        }
    }, [handleUpload]);

    const handleRemove = () => {
        setImage(null);
        setOutputImage(null);
        setCropBox(null);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ─── Crop mouse handlers ──────────────────────────────────────────────
    // ─── Crop mouse handlers ──────────────────────────────────────────────
    const getRelativePos = (e, el) => {
        const rect = el.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
            y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
        };
    };

    const handleCropMouseDown = (e, mode = 'create') => {
        if (activeTab !== 'crop' || selectedCrop !== 'free') return;

        e.preventDefault();
        e.stopPropagation();

        const container = previewRef.current.parentElement;
        const pos = getRelativePos(e, container);

        setDragMode(mode);
        setIsDragging(true);
        setDragStart({ x: pos.x, y: pos.y, startBox: { ...cropBox } });

        if (mode === 'create') {
            setCropBox(null);
        }
    };

    const handleCropMouseMove = (e) => {
        if (!isDragging || !dragStart) return;

        const container = previewRef.current.parentElement;
        const pos = getRelativePos(e, container);
        const { x: startX, y: startY, startBox } = dragStart;

        if (dragMode === 'create') {
            setCropBox({
                x: Math.min(startX, pos.x),
                y: Math.min(startY, pos.y),
                width: Math.abs(pos.x - startX),
                height: Math.abs(pos.y - startY),
            });
        } else if (dragMode === 'move' && startBox) {
            const dx = pos.x - startX;
            const dy = pos.y - startY;

            // Clamp movement to container
            const newX = Math.max(0, Math.min(startBox.x + dx, container.clientWidth - startBox.width));
            const newY = Math.max(0, Math.min(startBox.y + dy, container.clientHeight - startBox.height));

            setCropBox({ ...startBox, x: newX, y: newY });
        } else if (startBox) {
            // Resize logic
            let { x, y, width, height } = startBox;
            const dx = pos.x - startX;
            const dy = pos.y - startY;

            if (dragMode.includes('e')) width = Math.max(10, startBox.width + dx);
            if (dragMode.includes('s')) height = Math.max(10, startBox.height + dy);
            if (dragMode.includes('w')) {
                const newWidth = Math.max(10, startBox.width - dx);
                x = startBox.x + (startBox.width - newWidth); // Adjust X to keep right edge fixed
                width = newWidth;
            }
            if (dragMode.includes('n')) {
                const newHeight = Math.max(10, startBox.height - dy);
                y = startBox.y + (startBox.height - newHeight); // Adjust Y to keep bottom edge fixed
                height = newHeight;
            }

            setCropBox({ x, y, width, height });
        }
    };

    const handleCropMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            setDragMode('create');
            processImage();
        }
    };

    // ─── Process image ─────────────────────────────────────────────────────
    const processImage = useCallback(async () => {
        if (!image) return;
        setIsProcessing(true);

        try {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = image.url;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight;

            if (activeTab === 'crop' && cropBox && previewRef.current) {
                // Convert crop box from display coordinates to image coordinates
                const displayEl = previewRef.current;
                const rect = displayEl.getBoundingClientRect();
                const containerRect = displayEl.parentElement.getBoundingClientRect();

                // Calculate scale
                const scaleX = img.naturalWidth / displayEl.clientWidth;
                const scaleY = img.naturalHeight / displayEl.clientHeight;

                // Calculate offset of image within container
                const offsetX = rect.left - containerRect.left;
                const offsetY = rect.top - containerRect.top;

                // Adjust crop box coordinates by removing offset
                const relativeX = cropBox.x - offsetX;
                const relativeY = cropBox.y - offsetY;

                // Calculate source coordinates
                srcX = Math.round(relativeX * scaleX);
                srcY = Math.round(relativeY * scaleY);
                srcW = Math.round(cropBox.width * scaleX);
                srcH = Math.round(cropBox.height * scaleY);

                // Clamp to image bounds
                srcX = Math.max(0, srcX);
                srcY = Math.max(0, srcY);
                srcW = Math.min(srcW, img.naturalWidth - srcX);
                srcH = Math.min(srcH, img.naturalHeight - srcY);
            } else if (activeTab === 'crop' && selectedCrop !== 'free') {
                const preset = cropPresets.find(p => p.id === selectedCrop);
                if (preset && preset.width && preset.height) {
                    // Center crop to preset dimensions
                    const ratio = preset.width / preset.height;
                    const imgRatio = img.naturalWidth / img.naturalHeight;
                    if (imgRatio > ratio) {
                        srcH = img.naturalHeight;
                        srcW = Math.round(srcH * ratio);
                        srcX = Math.round((img.naturalWidth - srcW) / 2);
                    } else {
                        srcW = img.naturalWidth;
                        srcH = Math.round(srcW / ratio);
                        srcY = Math.round((img.naturalHeight - srcH) / 2);
                    }
                }
            }

            let outW = srcW, outH = srcH;

            // Resize
            if (activeTab === 'resize') {
                outW = parseInt(customWidth) || srcW;
                outH = parseInt(customHeight) || srcH;
            } else if (activeTab === 'crop' && selectedCrop !== 'free') {
                const preset = cropPresets.find(p => p.id === selectedCrop);
                if (preset && preset.width) {
                    outW = preset.width;
                    outH = preset.height;
                }
            }

            // Handle rotation
            const isRotated = rotation === 90 || rotation === 270;
            canvas.width = isRotated ? outH : outW;
            canvas.height = isRotated ? outW : outH;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            if (flipH) ctx.scale(-1, 1);
            if (flipV) ctx.scale(1, -1);
            ctx.drawImage(img, srcX, srcY, srcW, srcH, -outW / 2, -outH / 2, outW, outH);
            ctx.restore();

            // Compress
            let targetBytes;
            if (selectedTarget === 'custom') {
                targetBytes = customKB * 1024;
            } else {
                const target = compressionTargets.find(t => t.id === selectedTarget);
                targetBytes = target?.targetBytes || 500 * 1024;
            }

            let quality = 0.95;
            let scale = 1;
            let finalBlob = null;
            let format = 'image/jpeg';

            // Limit iterations/resizing to meet target
            for (let attempt = 0; attempt < 10; attempt++) {
                let currentCanvas = canvas;

                // If we need to resize to meet target
                if (scale < 1) {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = Math.floor(canvas.width * scale);
                    tempCanvas.height = Math.floor(canvas.height * scale);
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
                    currentCanvas = tempCanvas;
                }

                const candidateBlob = await new Promise((resolve) => currentCanvas.toBlob(resolve, format, quality));

                if (attempt === 0) finalBlob = candidateBlob; // Fallback

                if (candidateBlob.size <= targetBytes * 1.05) {
                    finalBlob = candidateBlob;
                    break;
                }

                // If still too big, keep result as best effort so far, but try harder
                finalBlob = candidateBlob;

                if (quality > 0.5) {
                    quality -= 0.15;
                } else if (quality > 0.2) {
                    quality -= 0.1;
                    scale *= 0.9; // Slight scale reduction
                } else {
                    scale *= 0.8; // Aggressive scale reduction
                }
            }

            const url = URL.createObjectURL(finalBlob);
            setOutputImage({ url, blob: finalBlob, width: Math.floor(canvas.width * scale), height: Math.floor(canvas.height * scale) });
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to process image.');
        } finally {
            setIsProcessing(false);
        }
    }, [image, activeTab, selectedCrop, selectedTarget, customWidth, customHeight, rotation, flipH, flipV, cropBox, customKB]);

    // Debounced auto-processing
    useEffect(() => {
        if (!image) return;

        const timer = setTimeout(() => {
            if (activeTab === 'compress' && selectedTarget === 'custom') {
                processImage();
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [customKB, processImage, activeTab, selectedTarget]);

    // Auto-process on crop change (debounced or on interaction end)
    useEffect(() => {
        if (activeTab === 'crop' && cropBox && !isDragging) {
            const timer = setTimeout(() => {
                processImage();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [cropBox, isDragging, activeTab, processImage]);

    const isCustom = selectedTarget === 'custom';
    const targetBytes = isCustom ? customKB * 1024 : compressionTargets.find(t => t.id === selectedTarget)?.targetBytes;
    const selectedCropObj = cropPresets.find(c => c.id === selectedCrop);

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Image className="h-8 w-8 text-purple-500" />
                        Signature Compressor & Crop
                    </h1>
                    <p className="text-gray-600">
                        Compress, crop, and resize your signature images. Target specific file sizes in KB/MB.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {/* Upload area */}
                    {!image ? (
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold text-gray-700 mb-2">Upload Signature Image</p>
                            <p className="text-sm text-gray-500 mb-4">Drag & drop or click to browse · PNG, JPG, WEBP</p>
                            <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium shadow transition-all">
                                Choose File
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* File info */}
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                        <Image className="h-6 w-6 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{image.file.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {image.width} × {image.height} px • {formatSize(image.file.size)}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={handleRemove} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex rounded-lg bg-gray-100 p-1 gap-1">
                                {[
                                    { id: 'compress', label: 'Compress', icon: Minimize2 },
                                    { id: 'crop', label: 'Crop', icon: Crop },
                                    { id: 'resize', label: 'Resize', icon: ZoomIn },
                                ].map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => { setActiveTab(id); setOutputImage(null); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-sm transition-all
                                            ${activeTab === id
                                                ? 'bg-white text-purple-700 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Icon className="h-4 w-4" /> {label}
                                    </button>
                                ))}
                            </div>

                            {/* Image preview with transform controls */}
                            <div className="relative">
                                <div className="flex justify-center gap-2 mb-3">
                                    <button onClick={() => setRotation((r) => (r + 90) % 360)} className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                                        <RotateCw className="h-3.5 w-3.5" /> Rotate
                                    </button>
                                    <button onClick={() => setFlipH(!flipH)} className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${flipH ? 'bg-purple-100 text-purple-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                                        <FlipHorizontal className="h-3.5 w-3.5" /> Flip H
                                    </button>
                                    <button onClick={() => setFlipV(!flipV)} className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${flipV ? 'bg-purple-100 text-purple-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                                        <FlipVertical className="h-3.5 w-3.5" /> Flip V
                                    </button>
                                </div>

                                <div
                                    className="relative bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:20px_20px] rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center"
                                    style={{ maxHeight: '400px' }}
                                    onMouseDown={(e) => handleCropMouseDown(e, 'create')}
                                    onMouseMove={handleCropMouseMove}
                                    onMouseUp={handleCropMouseUp}
                                    onMouseLeave={handleCropMouseUp}
                                >
                                    <img
                                        ref={previewRef}
                                        src={image.url}
                                        alt="Preview"
                                        className="max-w-full max-h-[400px] select-none"
                                        draggable={false}
                                        style={{
                                            transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                            transition: 'transform 0.3s',
                                        }}
                                    />
                                    {/* Crop overlay */}
                                    {activeTab === 'crop' && cropBox && cropBox.width > 2 && cropBox.height > 2 && (
                                        <>
                                            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                                            <div
                                                className="absolute border-2 border-white shadow-lg pointer-events-none"
                                                style={{
                                                    left: cropBox.x, top: cropBox.y,
                                                    width: cropBox.width, height: cropBox.height,
                                                    background: 'transparent',
                                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                                                    cursor: 'move',
                                                }}
                                                onMouseDown={(e) => handleCropMouseDown(e, 'move')}
                                            >
                                                {/* Handles */}
                                                {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map((mode) => (
                                                    <div
                                                        key={mode}
                                                        className={`absolute bg-white border border-purple-500 w-3 h-3 rounded-full pointer-events-auto
                                                            ${mode === 'n' ? '-top-1.5 left-1/2 -ml-1.5 cursor-n-resize' : ''}
                                                            ${mode === 's' ? '-bottom-1.5 left-1/2 -ml-1.5 cursor-s-resize' : ''}
                                                            ${mode === 'e' ? 'top-1/2 -right-1.5 -mt-1.5 cursor-e-resize' : ''}
                                                            ${mode === 'w' ? 'top-1/2 -left-1.5 -mt-1.5 cursor-w-resize' : ''}
                                                            ${mode === 'nw' ? '-top-1.5 -left-1.5 cursor-nw-resize' : ''}
                                                            ${mode === 'ne' ? '-top-1.5 -right-1.5 cursor-ne-resize' : ''}
                                                            ${mode === 'sw' ? '-bottom-1.5 -left-1.5 cursor-sw-resize' : ''}
                                                            ${mode === 'se' ? '-bottom-1.5 -right-1.5 cursor-se-resize' : ''}
                                                        `}
                                                        onMouseDown={(e) => handleCropMouseDown(e, mode)}
                                                    />
                                                ))}

                                                <div className="absolute -top-6 left-0 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                                                    {Math.round(cropBox.width * (image.width / (previewRef.current?.clientWidth || 1)))}
                                                    ×{Math.round(cropBox.height * (image.height / (previewRef.current?.clientHeight || 1)))} px
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'crop' && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                                            {selectedCrop === 'free' ? 'Drag to crop' : `Preset: ${selectedCropObj?.label}`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── COMPRESS TAB ───────────────────────────────────── */}
                            {activeTab === 'compress' && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">⚡ Target File Size</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {compressionTargets.map((t) => {
                                            const isActive = selectedTarget === t.id;
                                            const c = colorClasses[t.color];
                                            return (
                                                <button
                                                    key={t.id}
                                                    onClick={() => { setSelectedTarget(t.id); setOutputImage(null); }}
                                                    className={`relative p-3 rounded-xl border-2 text-center transition-all transform hover:scale-[1.02]
                                                        ${isActive
                                                            ? `${c.bg} ${c.border} ring-2 ${c.ring} shadow-lg`
                                                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                                >
                                                    {t.recommended && (
                                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                                                            ★ BEST
                                                        </span>
                                                    )}
                                                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 text-white font-bold text-xs shadow-md
                                                        ${isActive ? c.badge : 'bg-gray-300'}`}>
                                                        {t.label}
                                                    </div>
                                                    <p className={`font-semibold text-xs ${isActive ? c.text : 'text-gray-700'}`}>{t.description}</p>
                                                    {image && (
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            {image.file.size > t.targetBytes
                                                                ? `${Math.round(((image.file.size - t.targetBytes) / image.file.size) * 100)}% smaller`
                                                                : 'Already smaller'}
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* ── Custom Size Slider ────────────────────────── */}
                                    <div className={`mt-6 p-4 rounded-xl border-2 transition-all ${isCustom ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200' : 'bg-white border-gray-200'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    checked={isCustom}
                                                    onChange={() => setSelectedTarget('custom')}
                                                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className={`font-semibold ${isCustom ? 'text-purple-700' : 'text-gray-700'}`}>
                                                    Custom Size (KB)
                                                </span>
                                            </div>
                                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${isCustom ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {customKB} KB
                                            </span>
                                        </div>

                                        <input
                                            type="range"
                                            min="5"
                                            max="200"
                                            step="1"
                                            value={customKB}
                                            onChange={(e) => {
                                                setCustomKB(Number(e.target.value));
                                                setSelectedTarget('custom');
                                                // setOutputImage(null); // Don't clear immediately to avoid flickering, let effect handle it
                                            }}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                                            <span>5 KB</span>
                                            <span className="cursor-pointer hover:text-purple-600" onClick={() => { setCustomKB(20); setSelectedTarget('custom'); setOutputImage(null); }}>20 KB</span>
                                            <span className="cursor-pointer hover:text-purple-600" onClick={() => { setCustomKB(50); setSelectedTarget('custom'); setOutputImage(null); }}>50 KB</span>
                                            <span className="cursor-pointer hover:text-purple-600" onClick={() => { setCustomKB(100); setSelectedTarget('custom'); setOutputImage(null); }}>100 KB</span>
                                            <span>200 KB</span>
                                        </div>
                                    </div>

                                    {/* Size bar */}
                                    {image && targetBytes && (
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-600">Original: <span className="font-semibold text-gray-800">{formatSize(image.file.size)}</span></span>
                                                <span className={`font-semibold ${isCustom ? 'text-purple-700' : 'text-gray-700'}`}>
                                                    {outputImage
                                                        ? <>Compressed: {formatSize(outputImage.blob.size)} ({Math.round(((image.file.size - outputImage.blob.size) / image.file.size) * 100)}% saved)</>
                                                        : <>Target: ≤ {formatSize(targetBytes)}</>}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isCustom ? 'bg-purple-500' : colorClasses[compressionTargets.find(t => t.id === selectedTarget)?.color || 'blue'].bar}`}
                                                    style={{ width: `${outputImage ? Math.min(100, Math.round((outputImage.blob.size / image.file.size) * 100)) : Math.min(100, Math.round((targetBytes / image.file.size) * 100))}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                <span>0 KB</span>
                                                <span>{formatSize(image.file.size)} (original)</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── CROP TAB ────────────────────────────────────────── */}
                            {activeTab === 'crop' && (
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700">✂️ Crop Presets (Pixels)</h3>
                                        {cropBox && activeTab === 'crop' && (
                                            <div className="flex gap-2 text-xs">
                                                <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                    W: {Math.round(cropBox.width * (image.width / (previewRef.current?.clientWidth || 1)))}px
                                                </div>
                                                <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                    H: {Math.round(cropBox.height * (image.height / (previewRef.current?.clientHeight || 1)))}px
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Manual Crop Inputs */}
                                    {selectedCrop === 'free' && (
                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">X (px)</label>
                                                <input
                                                    type="number"
                                                    value={cropBox && previewRef.current ? Math.round((cropBox.x - ((previewRef.current.parentElement.clientWidth - previewRef.current.clientWidth) / 2)) * (image.width / previewRef.current.clientWidth)) : 0}
                                                    onChange={(e) => {
                                                        const val = Math.max(0, Number(e.target.value));
                                                        const displayEl = previewRef.current;
                                                        if (!displayEl) return;
                                                        const scale = image.width / displayEl.clientWidth;
                                                        const offsetX = (displayEl.parentElement.clientWidth - displayEl.clientWidth) / 2;
                                                        const newX = (val / scale) + offsetX;
                                                        setCropBox(prev => ({ ...prev, x: newX, width: prev?.width || 100, height: prev?.height || 100, y: prev?.y || 0 }));
                                                    }}
                                                    className="w-full p-2 text-xs border rounded bg-gray-50 focus:ring-1 focus:ring-purple-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Y (px)</label>
                                                <input
                                                    type="number"
                                                    value={cropBox && previewRef.current ? Math.round((cropBox.y - ((previewRef.current.parentElement.clientHeight - previewRef.current.clientHeight) / 2)) * (image.height / previewRef.current.clientHeight)) : 0}
                                                    onChange={(e) => {
                                                        const val = Math.max(0, Number(e.target.value));
                                                        const displayEl = previewRef.current;
                                                        if (!displayEl) return;
                                                        const scale = image.height / displayEl.clientHeight;
                                                        const offsetY = (displayEl.parentElement.clientHeight - displayEl.clientHeight) / 2;
                                                        const newY = (val / scale) + offsetY;
                                                        setCropBox(prev => ({ ...prev, y: newY, width: prev?.width || 100, height: prev?.height || 100, x: prev?.x || 0 }));
                                                    }}
                                                    className="w-full p-2 text-xs border rounded bg-gray-50 focus:ring-1 focus:ring-purple-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Width</label>
                                                <input
                                                    type="number"
                                                    value={cropBox ? Math.round(cropBox.width * (image.width / (previewRef.current?.clientWidth || 1))) : 0}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        const scale = (image.width / (previewRef.current?.clientWidth || 1));
                                                        setCropBox(prev => ({ ...prev, width: val / scale, height: prev?.height || 100, x: prev?.x || 0, y: prev?.y || 0 }));
                                                    }}
                                                    className="w-full p-2 text-xs border rounded bg-gray-50 focus:ring-1 focus:ring-purple-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Height</label>
                                                <input
                                                    type="number"
                                                    value={cropBox ? Math.round(cropBox.height * (image.height / (previewRef.current?.clientHeight || 1))) : 0}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        const scale = (image.height / (previewRef.current?.clientHeight || 1));
                                                        setCropBox(prev => ({ ...prev, height: val / scale, width: prev?.width || 100, x: prev?.x || 0, y: prev?.y || 0 }));
                                                    }}
                                                    className="w-full p-2 text-xs border rounded bg-gray-50 focus:ring-1 focus:ring-purple-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {cropPresets.map((preset) => {
                                            const isActive = selectedCrop === preset.id;
                                            return (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => { setSelectedCrop(preset.id); setCropBox(null); setOutputImage(null); }}
                                                    className={`p-3 rounded-xl border-2 text-center transition-all transform hover:scale-[1.02]
                                                        ${isActive
                                                            ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200 shadow-lg'
                                                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                                >
                                                    <span className="text-2xl block mb-1">{preset.icon}</span>
                                                    <p className={`font-bold text-sm ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>{preset.label}</p>
                                                    <p className="text-[10px] text-gray-400">{preset.description}</p>
                                                    {preset.width && (
                                                        <p className="text-[10px] text-gray-400 mt-1">{preset.width}×{preset.height} px</p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedCrop === 'free' && (
                                        <p className="text-sm text-gray-500 mt-3 text-center bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                                            ✏️ Drag on the image above to select your crop area
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── RESIZE TAB ──────────────────────────────────────── */}
                            {activeTab === 'resize' && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">📐 Custom Dimensions (Pixels)</h3>
                                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Width (px)</label>
                                            <input
                                                type="number"
                                                value={customWidth}
                                                onChange={(e) => { setCustomWidth(e.target.value); setOutputImage(null); }}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-center font-semibold"
                                                placeholder="Width"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Height (px)</label>
                                            <input
                                                type="number"
                                                value={customHeight}
                                                onChange={(e) => { setCustomHeight(e.target.value); setOutputImage(null); }}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-center font-semibold"
                                                placeholder="Height"
                                            />
                                        </div>
                                    </div>
                                    {/* Quick resize presets */}
                                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                                        {[
                                            { w: 100, h: 50 }, { w: 200, h: 100 }, { w: 300, h: 150 },
                                            { w: 400, h: 200 }, { w: 500, h: 250 }, { w: 800, h: 400 },
                                        ].map(({ w, h }) => (
                                            <button
                                                key={`${w}x${h}`}
                                                onClick={() => { setCustomWidth(String(w)); setCustomHeight(String(h)); setOutputImage(null); }}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                                                    ${customWidth === String(w) && customHeight === String(h)
                                                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-purple-300'}`}
                                            >
                                                {w}×{h}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 text-center mt-2">
                                        Original: {image.width}×{image.height} px
                                    </p>
                                </div>
                            )}

                            {/* ── Output result ──────────────────────────────────── */}
                            {outputImage && (
                                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                    <div className="text-center mb-3">
                                        <p className="text-green-600 font-semibold text-lg">✅ Processed successfully!</p>
                                        <p className="text-sm text-gray-500">
                                            {outputImage.width}×{outputImage.height} px • {formatSize(outputImage.blob.size)}
                                            {image && (
                                                <span className="ml-2 font-medium text-green-600">
                                                    ({Math.round(((image.file.size - outputImage.blob.size) / image.file.size) * 100)}% reduction)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex justify-center">
                                        <img src={outputImage.url} alt="Output" className="max-w-full max-h-[250px] rounded-lg shadow-md border border-gray-200" />
                                    </div>
                                </div>
                            )}

                            {/* ── Action buttons ────────────────────────────────── */}
                            <div className="flex justify-center gap-3 pt-2">
                                {outputImage ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <a
                                            href={outputImage.url}
                                            download={`signature_${activeTab}_${image.file.name.replace(/\.[^.]+$/, '')}.jpg`}
                                            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Result
                                        </a>
                                        <button onClick={handleRemove} className="text-sm text-gray-500 hover:text-gray-700 underline">
                                            Start over
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={processImage}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                            ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {activeTab === 'compress' && <Minimize2 className="h-5 w-5" />}
                                        {activeTab === 'crop' && <Crop className="h-5 w-5" />}
                                        {activeTab === 'resize' && <ZoomIn className="h-5 w-5" />}
                                        {isProcessing
                                            ? 'Processing...'
                                            : activeTab === 'compress'
                                                ? 'Compress Image'
                                                : activeTab === 'crop'
                                                    ? 'Crop Image'
                                                    : 'Resize Image'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignatureCompressor;
