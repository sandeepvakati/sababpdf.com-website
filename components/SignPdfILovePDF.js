// components/SignPdfILovePDF.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
    CheckCircle, X, Loader2, Download, RotateCcw, 
    User, Users, PenTool, Award, GripVertical, 
    AlertCircle, Calendar, Upload 
} from 'lucide-react';
import SignaturePadModal from './SignaturePadModal';
import MultiSignerModal from './MultiSignerModal';
import { PDFDocument, rgb } from 'pdf-lib';
import * as PDFJS from 'pdfjs-dist';

PDFJS.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${PDFJS.version}/build/pdf.worker.min.mjs`;

const PDF_RENDER_SCALE = 1.5;

export default function SignPdfILovePDF() {
    const [file, setFile] = useState(null);
    const [step, setStep] = useState('upload');

    const [signatureImage, setSignatureImage] = useState(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isMultiSignerModalOpen, setIsMultiSignerModalOpen] = useState(false);
    const [signatureType, setSignatureType] = useState('simple');

    // Signature position AND size in CANVAS PIXELS
    const [signPos, setSignPos] = useState({ x: 50, y: 50 });
    const [signSize, setSignSize] = useState({ width: 200, height: 100 });
    
    const [draggingId, setDraggingId] = useState(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const dragStartSizeRef = useRef({ width: 200, height: 100 });
    
    const canvasRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const displayScaleRef = useRef(1);
    const [displayScale, setDisplayScale] = useState(1);

    const [placedFields, setPlacedFields] = useState([]);
    const [pendingField, setPendingField] = useState(null);
    const [fieldInputVal, setFieldInputVal] = useState('');

    const [signedBlob, setSignedBlob] = useState(null);
    const [error, setError] = useState(null);
    const [pdfPageNumber, setPdfPageNumber] = useState(1);
    const [pdfNumPages, setPdfNumPages] = useState(0);

    const [uploadDragOver, setUploadDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setError(null);
        if (rejectedFiles.length > 0) {
            setError('Please upload a valid PDF file');
            return;
        }
        if (acceptedFiles[0]) {
            setFile(acceptedFiles[0]);
            setStep('who-signs');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const updateDisplayScale = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas && canvas.width > 0) {
            const scale = canvas.clientWidth / canvas.width;
            displayScaleRef.current = scale;
            setDisplayScale(scale);
        }
    }, []);

    // ✅ FIXED: Add null check for pdfFile
    const renderPdfPage = async (pdfFile, pageNum) => {
        try {
            if (!pdfFile) {
                console.warn('No PDF file provided to renderPdfPage');
                return;
            }
            
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(Math.min(pageNum, pdf.numPages));
            const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
            
            if (canvasRef.current) {
                canvasRef.current.width = viewport.width;
                canvasRef.current.height = viewport.height;
                
                const context = canvasRef.current.getContext('2d');
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                requestAnimationFrame(updateDisplayScale);
            }
        } catch (err) {
            console.error('Error rendering PDF page:', err);
        }
    };

    // ✅ FIXED: Add null check for pdfFile
    const renderPdfPreview = async (pdfFile) => {
        try {
            if (!pdfFile) {
                console.warn('No PDF file provided to renderPdfPreview');
                return;
            }
            
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
            setPdfNumPages(pdf.numPages);
            await renderPdfPage(pdfFile, 1);
            setPdfPageNumber(1);
        } catch (err) {
            console.error('Error rendering PDF:', err);
        }
    };

    useEffect(() => {
        if (step === 'workspace' && file) {
            renderPdfPreview(file);
        }
    }, [step, file]);

    useEffect(() => {
        window.addEventListener('resize', updateDisplayScale);
        return () => window.removeEventListener('resize', updateDisplayScale);
    }, [updateDisplayScale]);

    // ✅ Convert ANY image format to PNG
    const convertToPng = (imageDataUrl) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const pngDataUrl = canvas.toDataURL('image/png');
                resolve(pngDataUrl);
            };
            img.onerror = reject;
            img.src = imageDataUrl;
        });
    };

    const loadSignatureImage = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Please select a valid image file (PNG, JPG, etc.)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const pngDataUrl = await convertToPng(e.target.result);
                setSignatureImage(pngDataUrl);
                
                const img = new Image();
                img.onload = () => {
                    const aspectRatio = img.height / img.width;
                    setSignSize({ width: 200, height: 200 * aspectRatio });
                };
                img.src = pngDataUrl;
                
                setStep('workspace');
                setError(null);
            } catch (err) {
                setError('Failed to process image');
            }
        };
        reader.onerror = () => {
            setError('Failed to read image file');
        };
        reader.readAsDataURL(file);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            loadSignatureImage(file);
        }
    };

    const handleUploadDrop = (e) => {
        e.preventDefault();
        setUploadDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            loadSignatureImage(file);
        }
    };

    const startDrag = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const ds = displayScaleRef.current;
        
        const isResize = id.startsWith('sig-');
        
        if (isResize) {
            dragStartSizeRef.current = { ...signSize };
            dragOffsetRef.current = {
                startX: (e.clientX - canvasRect.left) / ds,
                startY: (e.clientY - canvasRect.top) / ds,
                startWidth: signSize.width,
                startHeight: signSize.height,
                startXPos: signPos.x,
                startYPos: signPos.y
            };
        } else {
            const currentPos = id === 'sig' 
                ? signPos 
                : (placedFields.find(f => f.id === id) || { x: 0, y: 0 });
            
            const mouseX = (e.clientX - canvasRect.left) / ds;
            const mouseY = (e.clientY - canvasRect.top) / ds;
            
            dragOffsetRef.current = {
                x: mouseX - currentPos.x,
                y: mouseY - currentPos.y
            };
        }
        
        setDraggingId(id);
    };

    const onContainerMouseMove = (e) => {
        if (!draggingId) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const ds = displayScaleRef.current;
        
        const canvasX = (e.clientX - canvasRect.left) / ds;
        const canvasY = (e.clientY - canvasRect.top) / ds;
        
        if (draggingId.startsWith('sig-')) {
            const handle = draggingId.replace('sig-', '');
            const start = dragOffsetRef.current;
            const startSize = dragStartSizeRef.current;
            
            const dx = canvasX - start.startX;
            const dy = canvasY - start.startY;
            
            let newWidth = startSize.width;
            let newHeight = startSize.height;
            let newX = signPos.x;
            let newY = signPos.y;
            
            const minSize = 50;
            
            switch(handle) {
                case 'br':
                    newWidth = Math.max(minSize, startSize.width + dx);
                    newHeight = Math.max(minSize, startSize.height + dy);
                    break;
                case 'bl':
                    newWidth = Math.max(minSize, startSize.width - dx);
                    newHeight = Math.max(minSize, startSize.height + dy);
                    newX = start.startXPos + (startSize.width - newWidth);
                    break;
                case 'tr':
                    newWidth = Math.max(minSize, startSize.width + dx);
                    newHeight = Math.max(minSize, startSize.height - dy);
                    newY = start.startYPos + (startSize.height - newHeight);
                    break;
                case 'tl':
                    newWidth = Math.max(minSize, startSize.width - dx);
                    newHeight = Math.max(minSize, startSize.height - dy);
                    newX = start.startXPos + (startSize.width - newWidth);
                    newY = start.startYPos + (startSize.height - newHeight);
                    break;
                case 'tc':
                    newHeight = Math.max(minSize, startSize.height - dy);
                    newY = start.startYPos + (startSize.height - newHeight);
                    break;
                case 'bc':
                    newHeight = Math.max(minSize, startSize.height + dy);
                    break;
                case 'ml':
                    newWidth = Math.max(minSize, startSize.width - dx);
                    newX = start.startXPos + (startSize.width - newWidth);
                    break;
                case 'mr':
                    newWidth = Math.max(minSize, startSize.width + dx);
                    break;
            }
            
            newX = Math.max(0, Math.min(canvas.width - newWidth, newX));
            newY = Math.max(0, Math.min(canvas.height - newHeight, newY));
            
            setSignSize({ width: newWidth, height: newHeight });
            setSignPos({ x: newX, y: newY });
            return;
        }
        
        if (draggingId === 'sig') {
            const newX = canvasX - dragOffsetRef.current.x;
            const newY = canvasY - dragOffsetRef.current.y;
            
            const boundedX = Math.max(0, Math.min(canvas.width - signSize.width, newX));
            const boundedY = Math.max(0, Math.min(canvas.height - signSize.height, newY));
            
            setSignPos({ x: boundedX, y: boundedY });
        } else {
            const newX = canvasX - dragOffsetRef.current.x;
            const newY = canvasY - dragOffsetRef.current.y;
            
            const boundedX = Math.max(0, Math.min(canvas.width - 100, newX));
            const boundedY = Math.max(0, Math.min(canvas.height - 100, newY));
            
            setPlacedFields(prev => prev.map(f => 
                f.id === draggingId ? { ...f, x: boundedX, y: boundedY } : f
            ));
        }
    };

    const onContainerMouseUp = () => {
        setDraggingId(null);
    };

    const addField = (type, label) => {
        if (type === 'date') {
            const today = new Date().toLocaleDateString();
            setPlacedFields(prev => [...prev, { 
                id: Date.now(), type, label, value: today, x: 60, y: 60 
            }]);
        } else {
            setPendingField({ type, label });
            setFieldInputVal('');
        }
    };

    const confirmField = () => {
        if (!fieldInputVal.trim() || !pendingField) return;
        setPlacedFields(prev => [...prev, { 
            id: Date.now(), ...pendingField, value: fieldInputVal.trim(), x: 60, y: 60 
        }]);
        setPendingField(null);
    };

    const removeField = (id) => {
        setPlacedFields(prev => prev.filter(f => f.id !== id));
    };

    const handleSignPdf = async () => {
        console.log('=== SIGN PDF STARTED ===');
        
        if (!file) {
            setError('No PDF file uploaded');
            return;
        }
        
        if (!signatureImage) {
            setError('Please draw or upload your signature first.');
            return;
        }
        
        setStep('processing');
        setError(null);
        
        try {
            console.log('Loading PDF...');
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const page = pages[pdfPageNumber - 1] || pages[pages.length - 1];
            const { width: pdfWidth, height: pdfHeight } = page.getSize();
            
            console.log('Converting signature to PNG...');
            const pngDataUrl = await convertToPng(signatureImage);
            const base64 = pngDataUrl.split(',')[1];
            
            if (!base64) {
                throw new Error('Invalid signature image format');
            }
            
            const binary = atob(base64);
            const pngBytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                pngBytes[i] = binary.charCodeAt(i);
            }
            
            const img = await pdfDoc.embedPng(pngBytes);
            
            const sigWidthCanvas = signSize.width;
            const sigWidthPdf = sigWidthCanvas / PDF_RENDER_SCALE;
            const sigHeightPdf = (img.height / img.width) * sigWidthPdf;
            
            const toPdfX = (canvasX) => canvasX / PDF_RENDER_SCALE;
            const toPdfY = (canvasY, elementHeight) => {
                return pdfHeight - (canvasY / PDF_RENDER_SCALE) - elementHeight;
            };
            
            const pdfX = toPdfX(signPos.x);
            const pdfY = toPdfY(signPos.y, sigHeightPdf);
            
            console.log('PDF Position:', pdfX, pdfY);
            console.log('Signature PDF Size:', sigWidthPdf, 'x', sigHeightPdf);
            
            page.drawImage(img, {
                x: pdfX,
                y: pdfY,
                width: sigWidthPdf,
                height: sigHeightPdf
            });
            
            for (const field of placedFields) {
                if (!field.value) continue;
                const fontSize = field.type === 'initials' ? 16 : 12;
                const fieldX = toPdfX(field.x);
                const fieldY = toPdfY(field.y, fontSize);
                
                page.drawText(field.value, {
                    x: fieldX,
                    y: fieldY,
                    size: fontSize,
                    color: rgb(0.1, 0.1, 0.1)
                });
            }
            
            console.log('Saving PDF...');
            const pdfBytes = await pdfDoc.save();
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            setSignedBlob(blob);
            console.log('=== SIGN PDF COMPLETED ===');
            setStep('result');
            
        } catch (err) {
            console.error('SIGNING ERROR:', err);
            setError(err.message || 'Failed to sign PDF. Please try again.');
            setStep('workspace');
        }
    };

    const handleDownload = () => {
        if (!signedBlob || !file) return;
        
        const url = window.URL.createObjectURL(signedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `signed_${file.name}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    };

    const reset = () => {
        setFile(null);
        setSignatureImage(null);
        setError(null);
        setSignedBlob(null);
        setSignPos({ x: 50, y: 50 });
        setSignSize({ width: 200, height: 100 });
        setPlacedFields([]);
        setPendingField(null);
        setUploadDragOver(false);
        setStep('upload');
    };

    const toCssPx = (canvasPx) => canvasPx * displayScale;

    // ========== RESULT SCREEN ==========
    if (step === 'result' && signedBlob) {
        return (
            <>
                <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: css }} />
                <div className="sign-success-screen" suppressHydrationWarning>
                    <div className="sign-success-card">
                        <CheckCircle size={56} color="#27ae60" />
                        <h3 className="sign-success-title">PDF Signed Successfully!</h3>
                        <p className="sign-success-desc">Your signature has been securely added to the document.</p>
                        <button className="sign-download-btn" onClick={handleDownload}>
                            <Download size={20} />
                            Download Signed PDF
                        </button>
                        <button className="sign-reset-btn" onClick={reset}>
                            <RotateCcw size={16} />
                            Sign another file
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ========== UPLOAD SCREEN ==========
    if (step === 'upload') {
        return (
            <>
                <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: css }} />
                <div className="sign-upload-screen" suppressHydrationWarning>
                    <div className="sign-upload-center">
                        <div {...getRootProps()} className={`sign-upload-zone ${isDragActive ? 'sign-drag-active' : ''}`}>
                            <input {...getInputProps()} />
                            <button type="button" className="sign-select-btn">
                                Select PDF file
                            </button>
                            <p className="sign-drop-text">
                                or <span className="sign-drop-link">drop PDF here</span>
                            </p>
                        </div>
                        {error && (
                            <div className="sign-error-msg">
                                <X size={16} /> {error}
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }

    // ========== WORKSPACE ==========
    return (
        <div className="sign-workspace-layout" suppressHydrationWarning>
            {/* Left Sidebar */}
            <div className="sign-left-sidebar">
                {pdfNumPages > 0 ? (
                    Array.from({ length: pdfNumPages }).map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`sign-thumb-mock ${pdfPageNumber === idx + 1 ? 'active' : ''}`}
                            onClick={async () => {
                                await renderPdfPage(file, idx + 1);
                                setPdfPageNumber(idx + 1);
                            }}
                        >
                            <div className="sign-thumb-page" />
                            <span>{idx + 1}</span>
                        </div>
                    ))
                ) : (
                    <div className="sign-thumb-mock active">
                        <div className="sign-thumb-page" />
                        <span>1</span>
                    </div>
                )}
            </div>

            {/* Main Area */}
            <div className="sign-main-area">
                <div className="sign-document-preview">
                    <div
                        ref={canvasContainerRef}
                        className="sign-doc-page-container"
                        onMouseMove={onContainerMouseMove}
                        onMouseUp={onContainerMouseUp}
                        onMouseLeave={onContainerMouseUp}
                        style={{ cursor: draggingId ? 'grabbing' : 'default' }}
                    >
                        <canvas ref={canvasRef} className="sign-pdf-canvas" />
                        
                        {/* RESIZABLE Signature Box */}
                        {step === 'workspace' && canvasRef.current && signatureImage && (
                            <div
                                className={`signature-selection-box ${draggingId === 'sig' ? 'dragging' : ''}`}
                                style={{
                                    position: 'absolute',
                                    left: `${toCssPx(signPos.x)}px`,
                                    top: `${toCssPx(signPos.y)}px`,
                                    width: `${toCssPx(signSize.width)}px`,
                                    height: `${toCssPx(signSize.height)}px`,
                                    transform: 'none'
                                }}
                                onMouseDown={(e) => startDrag(e, 'sig')}
                            >
                                <img 
                                    src={signatureImage} 
                                    alt="Signature" 
                                    className="signature-img-resizable"
                                    draggable={false}
                                />
                                {/* 8 resize handles */}
                                <span className="handle tl" onMouseDown={(e) => startDrag(e, 'sig-tl')} />
                                <span className="handle tc" onMouseDown={(e) => startDrag(e, 'sig-tc')} />
                                <span className="handle tr" onMouseDown={(e) => startDrag(e, 'sig-tr')} />
                                <span className="handle ml" onMouseDown={(e) => startDrag(e, 'sig-ml')} />
                                <span className="handle mr" onMouseDown={(e) => startDrag(e, 'sig-mr')} />
                                <span className="handle bl" onMouseDown={(e) => startDrag(e, 'sig-bl')} />
                                <span className="handle bc" onMouseDown={(e) => startDrag(e, 'sig-bc')} />
                                <span className="handle br" onMouseDown={(e) => startDrag(e, 'sig-br')} />
                            </div>
                        )}
                        
                        {/* Field boxes */}
                        {step === 'workspace' && placedFields.map(field => (
                            <div
                                key={field.id}
                                className={`field-selection-box ${draggingId === field.id ? 'dragging' : ''}`}
                                style={{
                                    position: 'absolute',
                                    left: `${toCssPx(field.x)}px`,
                                    top: `${toCssPx(field.y)}px`,
                                    transform: 'none'
                                }}
                                onMouseDown={(e) => startDrag(e, field.id)}
                            >
                                <div className="field-header">
                                    <span>{field.label}</span>
                                    <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}>×</button>
                                </div>
                                <span className="field-value">{field.value}</span>
                                <span className="handle tl green" />
                                <span className="handle tc green" />
                                <span className="handle tr green" />
                                <span className="handle ml green" />
                                <span className="handle mr green" />
                                <span className="handle bl green" />
                                <span className="handle bc green" />
                                <span className="handle br green" />
                            </div>
                        ))}
                        
                        {!pdfNumPages && step === 'workspace' && (
                            <div className="sign-no-preview">
                                <AlertCircle size={32} />
                                <p>Loading PDF...</p>
                            </div>
                        )}
                    </div>
                    
                    {pdfNumPages > 1 && step === 'workspace' && (
                        <div className="sign-page-nav">
                            <button 
                                className="sign-page-btn"
                                onClick={async () => {
                                    if (pdfPageNumber > 1) {
                                        const newPage = pdfPageNumber - 1;
                                        await renderPdfPage(file, newPage);
                                        setPdfPageNumber(newPage);
                                    }
                                }}
                                disabled={pdfPageNumber <= 1}
                            >
                                ← Previous
                            </button>
                            <span className="sign-page-counter">
                                <input 
                                    type="number"
                                    min={1}
                                    max={pdfNumPages}
                                    value={pdfPageNumber}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val)) {
                                            setPdfPageNumber(val);
                                            if (val >= 1 && val <= pdfNumPages) {
                                                renderPdfPage(file, val);
                                            }
                                        }
                                    }}
                                    className="sign-page-input"
                                />
                                <span className="sign-page-total"> / {pdfNumPages}</span>
                            </span>
                            <button 
                                className="sign-page-btn"
                                onClick={async () => {
                                    if (pdfPageNumber < pdfNumPages) {
                                        const newPage = pdfPageNumber + 1;
                                        await renderPdfPage(file, newPage);
                                        setPdfPageNumber(newPage);
                                    }
                                }}
                                disabled={pdfPageNumber >= pdfNumPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>

                {step === 'who-signs' && (
                    <div className="sign-who-modal-overlay">
                        <div className="sign-who-modal">
                            <h2>Who will sign this document?</h2>
                            <div className="sign-who-options">
                                <div className="sign-who-card" onClick={() => setIsSignatureModalOpen(true)}>
                                    <div className="sign-who-icon-wrapper blue">
                                        <User size={48} color="#2980b9" />
                                    </div>
                                    <button className="sign-who-btn red">Only me</button>
                                    <span className="sign-who-desc">Sign this document</span>
                                </div>
                                <div className="sign-who-card" onClick={() => setIsMultiSignerModalOpen(true)}>
                                    <div className="sign-who-icon-wrapper gray">
                                        <Users size={48} color="#7f8c8d" />
                                    </div>
                                    <button className="sign-who-btn red">Several people</button>
                                    <span className="sign-who-desc">Invite others to sign</span>
                                </div>
                            </div>
                            <div className="sign-who-footer">
                                Uploaded: <strong>{file?.name}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar */}
            <div className="sign-right-sidebar">
                <div className="sign-sidebar-header">
                    <h3>Signing options</h3>
                </div>
                
                <div className="sign-sidebar-body">
                    <div className="sign-sidebar-section">
                        <label className="sign-label">Signature</label>
                        
                        <div className="sign-type-grid">
                            <div 
                                className={`sign-type-box ${signatureType === 'simple' ? 'active' : ''}`} 
                                onClick={() => { 
                                    setSignatureType('simple');
                                    setIsSignatureModalOpen(true);
                                }}
                            >
                                <PenTool size={20} color={signatureType === 'simple' ? "#e74c3c" : "#94a3b8"} />
                                <span style={{color: signatureType === 'simple' ? "#e74c3c" : "#94a3b8"}}>Draw</span>
                            </div>
                            <div 
                                className={`sign-type-box ${signatureType === 'digital' ? 'active' : ''}`} 
                                onClick={() => { 
                                    setSignatureType('digital'); 
                                    setIsSignatureModalOpen(true); 
                                }}
                                style={{ position: 'relative' }}
                            >
                                <Award size={20} color={signatureType === 'digital' ? "#e74c3c" : "#94a3b8"} />
                                <span style={{color: signatureType === 'digital' ? "#e74c3c" : "#94a3b8"}}>Digital</span>
                                <div style={{ position: 'absolute', top: -8, right: -8, background: '#f1c40f', borderRadius: '50%', padding: '2px' }}>
                                    <Award size={12} color="#fff" />
                                </div>
                            </div>
                        </div>

                        {signatureImage ? (
                            <div className="sign-sidebar-img-box" style={{marginTop: '12px'}}>
                                <img src={signatureImage} alt="Your signature" />
                                <button className="sign-remove-btn" onClick={() => setSignatureImage(null)}>×</button>
                            </div>
                        ) : (
                            <>
                                <div
                                    className={`sign-upload-image-zone ${uploadDragOver ? 'drag-over' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
                                    onDragLeave={() => setUploadDragOver(false)}
                                    onDrop={handleUploadDrop}
                                >
                                    <Upload size={28} color="#e74c3c" style={{ marginBottom: '8px' }} />
                                    <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                                        Upload Signature Image
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                                        Click or drag PNG/JPG here
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleFileInputChange}
                                    />
                                </div>

                                <button
                                    onClick={() => setIsSignatureModalOpen(true)}
                                    className="sign-draw-btn"
                                >
                                    <PenTool size={16} />
                                    Or Draw Signature
                                </button>
                            </>
                        )}
                    </div>

                    <div className="sign-sidebar-section">
                        <label className="sign-label">Signers</label>
                        <div className="sign-signer-avatar">Z</div>
                    </div>

                    <div className="sign-sidebar-section">
                        <label className="sign-label">Required fields</label>
                        <div className="sign-field-box required">
                            <div className="sign-field-left">
                                <GripVertical size={14} color="#94a3b8" />
                                <PenTool size={16} color="#2980b9" />
                                <span>Signature</span>
                            </div>
                            <div className="sign-field-right">
                                <span className="sign-field-count">1</span>
                            </div>
                        </div>
                    </div>

                    <div className="sign-sidebar-section">
                        <label className="sign-label">Optional fields <small style={{color:'#94a3b8',textTransform:'none',fontWeight:400}}>(click to add)</small></label>
                        <div className="sign-fields-grid">
                            <div className="sign-field-box" onClick={() => addField('initials','Initials')}>
                                <div className="sign-field-icon text">AC</div>
                                <span>Initials</span>
                            </div>
                            <div className="sign-field-box" onClick={() => addField('name','Name')}>
                                <User size={20} color="#64748b" />
                                <span>Name</span>
                            </div>
                            <div className="sign-field-box" onClick={() => addField('date','Date')}>
                                <Calendar size={20} color="#64748b" />
                                <span>Date</span>
                            </div>
                            <div className="sign-field-box" onClick={() => addField('text','Text')}>
                                <div className="sign-field-icon t">T</div>
                                <span>Text</span>
                            </div>
                            <div className="sign-field-box" onClick={() => addField('input','Input')}>
                                <div className="sign-field-icon border">...</div>
                                <span>Input</span>
                            </div>
                            <div className="sign-field-box" onClick={() => addField('stamp','Company Stamp')}>
                                <Award size={20} color="#64748b" />
                                <span>Company Stamp</span>
                            </div>
                        </div>
                        {placedFields.length > 0 && (
                            <p style={{fontSize:'0.78rem',color:'#10b981',marginTop:'8px',fontWeight:600}}>
                                ✓ {placedFields.length} field(s) placed
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="sign-error-banner">
                            <X size={18} />
                            {error}
                        </div>
                    )}
                </div>

                <div className="sign-sidebar-footer">
                    <button 
                        className={`sign-action-btn ${step === 'processing' ? 'disabled' : ''}`}
                        onClick={handleSignPdf}
                        disabled={step === 'processing'}
                        type="button"
                    >
                        {step === 'processing' ? (
                            <><Loader2 className="sign-spin" size={20} /> Processing...</>
                        ) : (
                            <>Send to Sign <span style={{ fontSize: '18px' }}>→</span></>
                        )}
                    </button>
                </div>
            </div>

            {isSignatureModalOpen && (
                <SignaturePadModal
                    onSave={async (dataUrl) => { 
                        try {
                            const pngDataUrl = await convertToPng(dataUrl);
                            setSignatureImage(pngDataUrl);
                        } catch (err) {
                            setSignatureImage(dataUrl);
                        }
                        setIsSignatureModalOpen(false); 
                        setStep('workspace'); 
                    }}
                    onCancel={() => {
                        setIsSignatureModalOpen(false);
                        if (step === 'who-signs') setStep('upload');
                    }}
                />
            )}

            {isMultiSignerModalOpen && (
                <MultiSignerModal
                    onApply={(data) => {
                        console.log("Multi-signer data:", data);
                        setIsMultiSignerModalOpen(false);
                        setStep('workspace');
                    }}
                    onCancel={() => {
                        setIsMultiSignerModalOpen(false);
                        if (step === 'who-signs') setStep('upload');
                    }}
                />
            )}

            {pendingField && (
                <div className="field-input-modal-overlay" onClick={() => setPendingField(null)}>
                    <div className="field-input-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="field-modal-header">
                            <h3>Enter {pendingField.label}</h3>
                            <button className="field-modal-close" onClick={() => setPendingField(null)}>×</button>
                        </div>
                        <div className="field-modal-body">
                            <input
                                autoFocus
                                type="text"
                                placeholder={`Type your ${pendingField.label.toLowerCase()}...`}
                                value={fieldInputVal}
                                onChange={e => setFieldInputVal(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && confirmField()}
                                className="field-modal-input"
                            />
                        </div>
                        <div className="field-modal-footer">
                            <button className="field-btn-cancel" onClick={() => setPendingField(null)}>Cancel</button>
                            <button className="field-btn-add" onClick={confirmField}>Add to Document</button>
                        </div>
                    </div>
                </div>
            )}

            <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: css }} />
        </div>
    );
}

const css = `
* { box-sizing: border-box; }

.sign-upload-screen { display: flex; justify-content: center; align-items: center; min-height: 400px; padding: 40px 20px; }
.sign-upload-center { text-align: center; max-width: 700px; width: 100%; }
.sign-upload-zone { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; cursor: pointer; border-radius: 12px; transition: background 0.2s; }
.sign-upload-zone.sign-drag-active { background: rgba(231, 76, 60, 0.08); }
.sign-select-btn { background: #e74c3c; color: #fff; border: none; padding: 18px 60px; border-radius: 8px; font-size: 1.15rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(231, 76, 60, 0.3); transition: all 0.2s; }
.sign-select-btn:hover { background: #d04437; transform: scale(1.02); }
.sign-drop-text { font-size: 0.95rem; color: #6b7280; margin: 0; }
.sign-drop-link { color: #e74c3c; text-decoration: underline; text-underline-offset: 2px; }
.sign-error-msg { margin-top: 16px; color: #e74c3c; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 6px; }

.sign-success-screen { display: flex; justify-content: center; align-items: center; min-height: 400px; padding: 40px 20px; }
.sign-success-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.sign-success-title { font-size: 1.8rem; font-weight: 800; color: #1a1a2e; margin: 0; }
.sign-success-desc { font-size: 1rem; color: #6b7280; margin: 0; }
.sign-download-btn { display: inline-flex; align-items: center; gap: 10px; background: #27ae60; color: #fff; border: none; padding: 16px 48px; border-radius: 8px; font-size: 1.1rem; font-weight: 700; box-shadow: 0 4px 16px rgba(39, 174, 96, 0.3); transition: all 0.2s; margin-top: 8px; cursor: pointer; }
.sign-download-btn:hover { background: #219a52; }
.sign-reset-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: #6b7280; border: 2px solid #e5e7eb; padding: 12px 32px; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.sign-reset-btn:hover { border-color: #e74c3c; color: #e74c3c; }

.sign-workspace-layout { display: flex; width: 100%; min-height: 700px; border: 1px solid #e5e7eb; background: #f3f4f6; overflow: hidden; }

.sign-left-sidebar { width: 120px; background: #e5e7eb; border-right: 1px solid #d1d5db; padding: 20px 0; display: flex; flex-direction: column; align-items: center; overflow-y: auto; }
.sign-thumb-mock { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; opacity: 0.7; transition: opacity 0.2s; margin-bottom: 16px; }
.sign-thumb-mock.active { opacity: 1; }
.sign-thumb-page { width: 70px; height: 95px; background: #fff; border: 2px solid transparent; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.sign-thumb-mock.active .sign-thumb-page { border-color: #e74c3c; }
.sign-thumb-mock span { font-size: 12px; font-weight: 600; color: #4b5563; }

.sign-main-area { flex: 1; position: relative; display: flex; justify-content: center; align-items: center; padding: 20px; overflow: auto; flex-direction: column; }
.sign-document-preview { width: 100%; max-width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; flex-direction: column; }

.sign-doc-page-container { 
    position: relative; 
    background: #fff; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.1); 
    display: inline-block;
    border-radius: 4px;
    overflow: visible;
    user-select: none;
}

.sign-pdf-canvas { 
    display: block;
    max-width: 100%;
    height: auto;
}

.signature-selection-box,
.field-selection-box {
    position: absolute;
    border: 2px solid #1a73e8;
    background: rgba(255, 255, 255, 0.9);
    user-select: none;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.2);
}

.signature-selection-box {
    cursor: grab;
}

.signature-selection-box.dragging {
    cursor: grabbing;
    border-color: #0d47a1;
    box-shadow: 0 4px 16px rgba(26, 115, 232, 0.4);
}

.signature-selection-box:hover {
    border-color: #0d47a1;
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
}

.signature-img-resizable {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    pointer-events: none;
}

.field-selection-box {
    border-color: #10b981;
    min-width: 120px;
    cursor: grab;
}

.field-selection-box:hover {
    border-color: #059669;
}

.field-selection-box.dragging {
    cursor: grabbing;
    border-color: #059669;
}

.field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #10b981;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    text-transform: uppercase;
}

.field-header button {
    background: none;
    border: none;
    color: rgba(255,255,255,0.8);
    cursor: pointer;
    font-size: 12px;
    padding: 0;
    line-height: 1;
}

.field-header button:hover {
    color: #fff;
}

.field-value {
    display: block;
    padding: 4px 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1a1a2e;
    white-space: nowrap;
}

.handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #1a73e8;
    border: 2px solid #fff;
    z-index: 11;
    pointer-events: auto;
    cursor: pointer;
}

.signature-selection-box .handle {
    cursor: nwse-resize;
}

.field-selection-box .handle {
    background: #10b981;
}

.handle.tl { top: -6px; left: -6px; cursor: nwse-resize; }
.handle.tr { top: -6px; right: -6px; cursor: nesw-resize; }
.handle.bl { bottom: -6px; left: -6px; cursor: nesw-resize; }
.handle.br { bottom: -6px; right: -6px; cursor: nwse-resize; }
.handle.tc { top: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.handle.bc { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.handle.ml { top: 50%; left: -6px; transform: translateY(-50%); cursor: ew-resize; }
.handle.mr { top: 50%; right: -6px; transform: translateY(-50%); cursor: ew-resize; }

.sign-no-preview {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #94a3b8;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.sign-page-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    justify-content: center;
}

.sign-page-btn {
    background: #e74c3c;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.sign-page-btn:hover:not(:disabled) { background: #c0392b; }
.sign-page-btn:disabled { background: #fca5a5; cursor: not-allowed; opacity: 0.6; }

.sign-page-counter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #4b5563;
    min-width: 90px;
}

.sign-page-input {
    width: 46px;
    padding: 4px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    text-align: center;
    font-size: 0.95rem;
    font-weight: 600;
    color: #1a1a2e;
    -moz-appearance: textfield;
}

.sign-page-input::-webkit-outer-spin-button,
.sign-page-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.sign-page-input:focus {
    outline: none;
    border-color: #e74c3c;
    box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.1);
}

.sign-page-total { color: #64748b; }

.sign-who-modal-overlay { 
    position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.4); display: flex; justify-content: center; 
    align-items: center; z-index: 50; 
}
.sign-who-modal { 
    background: #fff; border-radius: 8px; width: 600px; max-width: 95%; 
    box-shadow: 0 20px 40px rgba(0,0,0,0.2); text-align: center; 
    overflow: hidden; animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
}
.sign-who-modal h2 { margin: 30px 0 20px; font-size: 1.4rem; color: #333; font-weight: 700; }
.sign-who-options { display: flex; padding: 0 40px 30px; gap: 20px; }
.sign-who-card { 
    flex: 1; background: #f8f9fa; border-radius: 8px; padding: 30px 20px; 
    display: flex; flex-direction: column; align-items: center; cursor: pointer; 
    transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #f1f3f5; 
}
.sign-who-card:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0,0,0,0.06); border-color: #e2e8f0; }
.sign-who-icon-wrapper { width: 120px; height: 120px; border-radius: 16px; display: flex; justify-content: center; align-items: center; margin-bottom: 24px; }
.sign-who-icon-wrapper.blue { background: #e3f2fd; }
.sign-who-icon-wrapper.gray { background: #f1f5f9; }
.sign-who-btn { 
    background: #e74c3c; color: #fff; border: none; padding: 10px 24px; 
    border-radius: 6px; font-weight: 700; font-size: 1rem; width: 80%; 
    cursor: pointer; margin-bottom: 8px; transition: background 0.2s; 
}
.sign-who-card:hover .sign-who-btn { background: #c0392b; }
.sign-who-desc { font-size: 0.85rem; color: #7f8c8d; }
.sign-who-footer { padding: 15px; font-size: 0.85rem; color: #7f8c8d; border-top: 1px solid #eee; background: #fff; }

.sign-right-sidebar { width: 320px; background: #fff; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; }
.sign-sidebar-header { padding: 24px 20px; border-bottom: 1px solid #e5e7eb; }
.sign-sidebar-header h3 { margin: 0; font-size: 1.3rem; font-weight: 700; color: #1a1a2e; }
.sign-sidebar-body { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
.sign-label { font-size: 0.85rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: block; }
.sign-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sign-type-box { 
    border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px 8px; 
    display: flex; flex-direction: column; align-items: center; gap: 8px; 
    text-align: center; cursor: pointer; position: relative; transition: all 0.2s; 
}
.sign-type-box span { font-size: 0.85rem; font-weight: 600; color: #4b5563; }
.sign-type-box.active { border-color: #e74c3c; background: rgba(231, 76, 60, 0.04); }
.sign-type-box.active span { color: #e74c3c; }

.sign-upload-image-zone {
    margin-top: 12px;
    border: 2px dashed #e2e8f0;
    border-radius: 8px;
    padding: 20px 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #fafbfc;
}

.sign-upload-image-zone:hover,
.sign-upload-image-zone.drag-over {
    border-color: #e74c3c;
    background: #fff5f5;
}

.sign-upload-image-zone.drag-over {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15);
}

.sign-sidebar-img-box {
    position: relative;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: #f9fafb;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 12px;
    min-height: 80px;
}

.sign-sidebar-img-box img {
    max-width: 100%;
    max-height: 100px;
    object-fit: contain;
}

.sign-remove-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    background: #e74c3c;
    border: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: #fff;
    font-size: 16px;
    line-height: 1;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.sign-remove-btn:hover {
    background: #c0392b;
    transform: scale(1.1);
}

.sign-draw-btn {
    width: 100%;
    margin-top: 10px;
    padding: 10px;
    background: #fff5f5;
    border: 1.5px dashed #e74c3c;
    border-radius: 7px;
    color: #e74c3c;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s;
}

.sign-draw-btn:hover {
    background: #ffe4e4;
    border-color: #c0392b;
}

.sign-sidebar-section { margin-top: 20px; }
.sign-signer-avatar { 
    width: 36px; height: 36px; border-radius: 50%; background: #ffcccb; 
    color: #333; display: flex; justify-content: center; align-items: center; 
    font-weight: 600; font-size: 1rem; border: 1px solid rgba(0,0,0,0.1); margin-top: 8px; 
}

.sign-field-box { 
    display: flex; align-items: center; background: #fff; border: 1px solid #cbd5e1; 
    border-radius: 6px; padding: 10px; gap: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; 
}
.sign-field-box:hover { border-color: #3b82f6; box-shadow: 0 2px 4px rgba(59,130,246,0.1); background: #eff6ff; }
.sign-field-box.required { background: #f0f7ff; border-color: #bae6fd; justify-content: space-between; cursor: default; }
.sign-field-box.required:hover { border-color: #bae6fd; background: #f0f7ff; box-shadow: none; }
.sign-field-left { display: flex; align-items: center; gap: 8px; }
.sign-field-box span { font-size: 0.85rem; font-weight: 600; color: #475569; line-height: 1.2; text-align: center; }
.sign-field-count { 
    background: #3b82f6; color: #fff; border-radius: 50%; width: 20px; height: 20px; 
    display: flex; justify-content: center; align-items: center; font-size: 0.75rem; font-weight: 600; 
}

.sign-fields-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }
.sign-fields-grid .sign-field-box { 
    flex-direction: column; justify-content: center; padding: 12px 6px; gap: 6px; 
    margin-bottom: 0; background: #f8fafc; border-color: #e2e8f0; 
}
.sign-fields-grid .sign-field-box:hover { border-color: #3b82f6; background: #eff6ff; }

.sign-field-icon { 
    width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; 
    font-size: 0.75rem; font-weight: 700; color: #fff; background: #94a3b8; border-radius: 4px; 
}
.sign-field-icon.text { background: #3b82f6; }
.sign-field-icon.t { background: #3b82f6; font-family: serif; font-size: 1rem; }
.sign-field-icon.border { background: transparent; color: #64748b; border: 2px dashed #cbd5e1; }

.sign-action-btn { 
    background: #e74c3c; color: #fff; border: none; padding: 16px; border-radius: 8px; 
    font-size: 1.1rem; font-weight: 700; width: 100%; display: flex; justify-content: center; 
    align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; 
}
.sign-action-btn:hover:not(.disabled) { background: #c0392b; }
.sign-action-btn.disabled { opacity: 0.6; cursor: not-allowed; }
.sign-spin { animation: spin 1s linear infinite; }

.sign-sidebar-footer { padding: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; }

.sign-error-banner {
    background: #fee2e2;
    border: 1px solid #ef4444;
    color: #dc2626;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}

.field-input-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center; z-index: 9999;
    backdrop-filter: blur(4px); animation: fadeIn 0.2s;
}
.field-input-modal {
    background: #ffffff; border-radius: 16px; width: 400px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden;
}
.field-modal-header {
    display: flex; justify-content: space-between; align-items: center; padding: 24px 24px 0;
}
.field-modal-header h3 { margin: 0; font-size: 1.2rem; color: #0f172a; font-weight: 600; }
.field-modal-close {
    background: #f1f5f9; color: #64748b; border: none; width: 28px; height: 28px;
    border-radius: 50%; font-size: 20px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; transition: 0.2s;
}
.field-modal-close:hover { background: #e2e8f0; color: #0f172a; }
.field-modal-body { padding: 20px 24px; }
.field-modal-input {
    width: 100%; padding: 12px 16px; border: 1.5px solid #cbd5e1; border-radius: 10px;
    font-size: 1rem; outline: none; transition: border-color 0.2s;
}
.field-modal-input:focus { border-color: #e74c3c; box-shadow: 0 0 0 3px rgba(231,76,60,0.1); }
.field-modal-footer { padding: 0 24px 24px; display: flex; justify-content: flex-end; gap: 12px; }
.field-btn-cancel {
    background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
    padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;
}
.field-btn-cancel:hover { background: #e2e8f0; }
.field-btn-add {
    background: #e74c3c; color: #fff; border: none; padding: 10px 24px;
    border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s;
}
.field-btn-add:hover { background: #c0392b; }

@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes popIn { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

export {};