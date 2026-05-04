'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument, rgb } from 'pdf-lib';
import * as PDFJS from 'pdfjs-dist';
import { Download, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

PDFJS.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${PDFJS.version}/build/pdf.worker.min.mjs`;

const PDF_SCALE = 1.5;

export default function RedactPdfILovePDF() {
    const [file, setFile]             = useState(null);
    const [step, setStep]             = useState('upload'); // upload | workspace | processing | result
    const [error, setError]           = useState(null);
    const [redactedBlob, setRedactedBlob] = useState(null);

    // PDF rendering
    const canvasRef      = useRef(null);
    const containerRef   = useRef(null);
    const [numPages, setNumPages]     = useState(0);
    const [pageNum, setPageNum]       = useState(1);
    const [pageSize, setPageSize]     = useState({ w: 0, h: 0 }); // PDF points

    // Drawing redaction boxes
    const [boxes, setBoxes]   = useState([]);       // [{page, x, y, w, h}] — canvas pixels
    const [drawing, setDrawing] = useState(null);   // {startX, startY, x, y, w, h}
    const isDrawing = useRef(false);

    // ── Drop zone ──────────────────────────────────────────────
    const onDrop = useCallback((accepted, rejected) => {
        setError(null);
        if (rejected.length) { setError('Please upload a valid PDF file.'); return; }
        if (accepted[0]) { setFile(accepted[0]); setStep('workspace'); }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
    });

    // ── Render PDF page ────────────────────────────────────────
    const renderPage = useCallback(async (pdfFile, pNum) => {
        try {
            const ab  = await pdfFile.arrayBuffer();
            const pdf = await PDFJS.getDocument({ data: ab }).promise;
            setNumPages(pdf.numPages);
            const page     = await pdf.getPage(Math.min(pNum, pdf.numPages));
            const viewport = page.getViewport({ scale: PDF_SCALE });
            setPageSize({ w: viewport.width / PDF_SCALE, h: viewport.height / PDF_SCALE });
            if (canvasRef.current) {
                canvasRef.current.width  = viewport.width;
                canvasRef.current.height = viewport.height;
                await page.render({ canvasContext: canvasRef.current.getContext('2d'), viewport }).promise;
            }
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        if (step === 'workspace' && file) renderPage(file, pageNum);
    }, [step, file, pageNum, renderPage]);

    // ── Draw handlers ──────────────────────────────────────────
    const getRelPos = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseDown = (e) => {
        const pos = getRelPos(e);
        isDrawing.current = true;
        setDrawing({ startX: pos.x, startY: pos.y, x: pos.x, y: pos.y, w: 0, h: 0 });
    };

    const onMouseMove = (e) => {
        if (!isDrawing.current || !drawing) return;
        const pos = getRelPos(e);
        const x = Math.min(pos.x, drawing.startX);
        const y = Math.min(pos.y, drawing.startY);
        const w = Math.abs(pos.x - drawing.startX);
        const h = Math.abs(pos.y - drawing.startY);
        setDrawing(d => ({ ...d, x, y, w, h }));
    };

    const onMouseUp = () => {
        if (!isDrawing.current || !drawing) return;
        isDrawing.current = false;
        if (drawing.w > 5 && drawing.h > 5) {
            setBoxes(prev => [...prev, { page: pageNum, x: drawing.x, y: drawing.y, w: drawing.w, h: drawing.h }]);
        }
        setDrawing(null);
    };

    const removeBox = (idx) => setBoxes(prev => prev.filter((_, i) => i !== idx));

    // ── Apply redactions ───────────────────────────────────────
    const applyRedactions = async () => {
        if (!file || boxes.length === 0) {
            setError('Please draw at least one redaction box on the document.');
            return;
        }
        setStep('processing');
        setError(null);
        try {
            const ab     = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(ab);
            const pages  = pdfDoc.getPages();

            for (const box of boxes) {
                const page = pages[box.page - 1];
                if (!page) continue;
                const { width: pW, height: pH } = page.getSize();
                // canvas px → PDF points
                const pdfX = (box.x / PDF_SCALE);
                const pdfW = (box.w / PDF_SCALE);
                const pdfH = (box.h / PDF_SCALE);
                const pdfY = pH - (box.y / PDF_SCALE) - pdfH;
                page.drawRectangle({
                    x: Math.max(0, pdfX),
                    y: Math.max(0, pdfY),
                    width:  Math.min(pdfW, pW),
                    height: Math.min(pdfH, pH),
                    color: rgb(0, 0, 0),
                    opacity: 1,
                });
            }

            const bytes = await pdfDoc.save();
            setRedactedBlob(new Blob([bytes], { type: 'application/pdf' }));
            setStep('result');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to apply redactions.');
            setStep('workspace');
        }
    };

    const handleDownload = () => {
        if (!redactedBlob || !file) return;
        const url  = URL.createObjectURL(redactedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `redacted_${file.name}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const reset = () => {
        setFile(null); setBoxes([]); setDrawing(null);
        setRedactedBlob(null); setError(null);
        setPageNum(1); setNumPages(0);
        setStep('upload');
    };

    const currentPageBoxes = boxes.filter(b => b.page === pageNum);

    // ── RESULT ──────────────────────────────────────────────────
    if (step === 'result') {
        return (
            <>
                <style>{css}</style>
                <div className="rp-center">
                    <div className="rp-result-card">
                        <CheckCircle size={56} color="#27ae60" />
                        <h3 className="rp-result-title">PDF Redacted Successfully!</h3>
                        <p className="rp-result-desc">{boxes.length} redaction{boxes.length !== 1 ? 's' : ''} applied permanently.</p>
                        <button className="rp-btn rp-primary rp-big" onClick={handleDownload}>
                            <Download size={20} /> Download Redacted PDF
                        </button>
                        <button className="rp-btn rp-outline" onClick={reset}>
                            <RotateCcw size={16} /> Redact another file
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ── UPLOAD ───────────────────────────────────────────────────
    if (step === 'upload') {
        return (
            <>
                <style>{css}</style>
                <div className="rp-center">
                    <div {...getRootProps()} className={`rp-dropzone ${isDragActive ? 'rp-drag-active' : ''}`}>
                        <input {...getInputProps()} />
                        <button type="button" className="rp-btn rp-primary rp-big">
                            Select PDF file
                        </button>
                        <p className="rp-drop-text">or <span className="rp-drop-link">drop PDF here</span></p>
                    </div>
                    {error && <p className="rp-error"><AlertCircle size={16} /> {error}</p>}
                </div>
            </>
        );
    }

    // ── PROCESSING ───────────────────────────────────────────────
    if (step === 'processing') {
        return (
            <>
                <style>{css}</style>
                <div className="rp-center">
                    <Loader2 size={48} className="rp-spin" color="#e74c3c" />
                    <p className="rp-processing-text">Applying redactions…</p>
                </div>
            </>
        );
    }

    // ── WORKSPACE ────────────────────────────────────────────────
    return (
        <>
            <style>{css}</style>
            <div className="rp-workspace">

                {/* Toolbar */}
                <div className="rp-toolbar">
                    <div className="rp-toolbar-left">
                        <span className="rp-file-name">📄 {file?.name}</span>
                        <span className="rp-box-count">{boxes.length} redaction{boxes.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="rp-toolbar-right">
                        <div className="rp-hint">🖱 Draw boxes over text to redact</div>
                        {boxes.length > 0 && (
                            <button className="rp-btn rp-outline rp-sm" onClick={() => setBoxes([])}>Clear all</button>
                        )}
                        <button
                            className="rp-btn rp-primary rp-sm"
                            onClick={applyRedactions}
                            disabled={boxes.length === 0}
                            style={{ opacity: boxes.length === 0 ? 0.5 : 1 }}
                        >
                            Apply Redactions →
                        </button>
                        <button className="rp-btn rp-ghost rp-sm" onClick={reset}>✕ Cancel</button>
                    </div>
                </div>

                <div className="rp-body">
                    {/* Thumbnail sidebar */}
                    {numPages > 1 && (
                        <div className="rp-sidebar">
                            {Array.from({ length: numPages }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`rp-thumb ${pageNum === i + 1 ? 'rp-thumb-active' : ''}`}
                                    onClick={() => setPageNum(i + 1)}
                                >
                                    <div className="rp-thumb-page" />
                                    <span>{i + 1}</span>
                                    {boxes.filter(b => b.page === i + 1).length > 0 && (
                                        <span className="rp-thumb-badge">{boxes.filter(b => b.page === i + 1).length}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Canvas area */}
                    <div className="rp-main">
                        <div
                            ref={containerRef}
                            className="rp-canvas-wrap"
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp}
                            onMouseLeave={onMouseUp}
                        >
                            <canvas ref={canvasRef} className="rp-canvas" />

                            {/* Existing redaction boxes on this page */}
                            {currentPageBoxes.map((box, i) => {
                                const absIdx = boxes.indexOf(box);
                                return (
                                    <div
                                        key={i}
                                        className="rp-box"
                                        style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
                                    >
                                        <button className="rp-box-remove" onClick={() => removeBox(absIdx)}>✕</button>
                                    </div>
                                );
                            })}

                            {/* Live drawing box */}
                            {drawing && drawing.w > 2 && drawing.h > 2 && (
                                <div
                                    className="rp-box rp-box-drawing"
                                    style={{ left: drawing.x, top: drawing.y, width: drawing.w, height: drawing.h }}
                                />
                            )}
                        </div>

                        {/* Page navigation */}
                        {numPages > 1 && (
                            <div className="rp-page-nav">
                                <button className="rp-page-btn" onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1}>← Prev</button>
                                <span className="rp-page-counter">Page {pageNum} / {numPages}</span>
                                <button className="rp-page-btn" onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages}>Next →</button>
                            </div>
                        )}
                    </div>

                    {/* Right panel */}
                    <div className="rp-panel">
                        <h4 className="rp-panel-title">Redaction Tool</h4>
                        <p className="rp-panel-desc">
                            Draw black boxes over any sensitive content — names, numbers, addresses, signatures.
                        </p>
                        <div className="rp-panel-tip">
                            <strong>How to use:</strong>
                            <ol>
                                <li>Click and drag on the PDF to draw a redaction box</li>
                                <li>Cover all sensitive text or images</li>
                                <li>Click <strong>Apply Redactions</strong> to permanently remove the content</li>
                            </ol>
                        </div>
                        {boxes.length > 0 && (
                            <div className="rp-box-list">
                                <p className="rp-box-list-title">Marked areas ({boxes.length})</p>
                                {boxes.map((b, i) => (
                                    <div key={i} className="rp-box-item">
                                        <span>Page {b.page} — {Math.round(b.w)}×{Math.round(b.h)}px</span>
                                        <button className="rp-box-item-remove" onClick={() => removeBox(i)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            className="rp-btn rp-primary rp-full"
                            onClick={applyRedactions}
                            disabled={boxes.length === 0}
                            style={{ marginTop: 'auto', opacity: boxes.length === 0 ? 0.5 : 1 }}
                        >
                            Apply Redactions →
                        </button>
                        {error && <p className="rp-error" style={{ marginTop: '12px' }}><AlertCircle size={14} /> {error}</p>}
                    </div>
                </div>
            </div>
        </>
    );
}

const css = `
* { box-sizing: border-box; }

/* Upload / Result centered */
.rp-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 20px; padding: 40px 20px; }

/* Drop zone */
.rp-dropzone { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 48px 60px; cursor: pointer; border-radius: 14px; transition: background 0.2s; }
.rp-dropzone.rp-drag-active { background: rgba(231,76,60,0.06); }
.rp-drop-text { font-size: 0.95rem; color: #6b7280; margin: 0; }
.rp-drop-link { color: #e74c3c; text-decoration: underline; text-underline-offset: 2px; }

/* Buttons */
.rp-btn { border: none; border-radius: 10px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
.rp-primary { background: linear-gradient(135deg,#e74c3c,#c0392b); color: #fff; box-shadow: 0 4px 16px rgba(231,76,60,.3); }
.rp-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(231,76,60,.4); }
.rp-outline { background: #fff; color: #374151; border: 1.5px solid #d1d5db; }
.rp-outline:hover { border-color: #e74c3c; color: #e74c3c; }
.rp-ghost { background: transparent; color: #6b7280; border: 1.5px solid #e5e7eb; }
.rp-ghost:hover { background: #f9fafb; color: #374151; }
.rp-big { padding: 18px 56px; font-size: 1.15rem; border-radius: 12px; }
.rp-sm  { padding: 9px 18px; font-size: 0.9rem; border-radius: 8px; }
.rp-full { width: 100%; padding: 14px; font-size: 1rem; border-radius: 10px; }

/* Result card */
.rp-result-card { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
.rp-result-title { font-size: 1.8rem; font-weight: 800; color: #1a1a2e; margin: 0; }
.rp-result-desc  { font-size: 1rem; color: #6b7280; margin: 0; }

/* Processing */
.rp-spin { animation: rpSpin 1s linear infinite; }
@keyframes rpSpin { 100% { transform: rotate(360deg); } }
.rp-processing-text { font-size: 1.1rem; color: #6b7280; font-weight: 500; margin: 0; }

/* Error */
.rp-error { display: inline-flex; align-items: center; gap: 6px; color: #dc2626; font-size: 0.9rem; }

/* ── WORKSPACE ────────────────────────────────── */
.rp-workspace { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 700px; }

/* Toolbar */
.rp-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; gap: 12px; flex-wrap: wrap; }
.rp-toolbar-left  { display: flex; align-items: center; gap: 12px; }
.rp-toolbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rp-file-name { font-size: 0.92rem; font-weight: 600; color: #374151; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rp-box-count { background: #fef2f2; color: #e74c3c; font-size: 0.8rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid #fecaca; }
.rp-hint { font-size: 0.82rem; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; padding: 6px 12px; border-radius: 20px; }

/* Body layout */
.rp-body { display: flex; flex: 1; overflow: hidden; }

/* Thumbnail sidebar */
.rp-sidebar { width: 100px; background: #f3f4f6; border-right: 1px solid #e5e7eb; padding: 16px 8px; display: flex; flex-direction: column; align-items: center; gap: 12px; overflow-y: auto; }
.rp-thumb { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; opacity: 0.65; transition: opacity 0.2s; }
.rp-thumb-active { opacity: 1; }
.rp-thumb-page { width: 64px; height: 86px; background: #fff; border: 2px solid #e5e7eb; box-shadow: 0 2px 6px rgba(0,0,0,0.08); border-radius: 2px; }
.rp-thumb-active .rp-thumb-page { border-color: #e74c3c; }
.rp-thumb span { font-size: 11px; font-weight: 600; color: #6b7280; }
.rp-thumb-badge { position: absolute; top: -6px; right: 0; background: #e74c3c; color: #fff; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

/* Main canvas area */
.rp-main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 24px; background: #f3f4f6; overflow: auto; gap: 16px; }
.rp-canvas-wrap { position: relative; background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.12); cursor: crosshair; user-select: none; display: inline-block; border-radius: 2px; }
.rp-canvas { display: block; max-width: 100%; }

/* Redaction boxes */
.rp-box { position: absolute; background: rgba(0,0,0,0.75); border: 2px solid #000; display: flex; align-items: flex-start; justify-content: flex-end; }
.rp-box-drawing { background: rgba(0,0,0,0.5); border: 2px dashed #e74c3c; pointer-events: none; }
.rp-box-remove { background: #e74c3c; color: #fff; border: none; width: 20px; height: 20px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700; opacity: 0; transition: opacity 0.15s; border-radius: 0 0 0 4px; }
.rp-box:hover .rp-box-remove { opacity: 1; }

/* Page nav */
.rp-page-nav { display: flex; align-items: center; gap: 14px; }
.rp-page-btn { background: #e74c3c; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; }
.rp-page-btn:hover:not(:disabled) { background: #c0392b; }
.rp-page-btn:disabled { background: #fca5a5; cursor: not-allowed; }
.rp-page-counter { font-size: 0.95rem; font-weight: 600; color: #374151; }

/* Right panel */
.rp-panel { width: 280px; background: #fff; border-left: 1px solid #e5e7eb; padding: 24px 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.rp-panel-title { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; margin: 0; }
.rp-panel-desc  { font-size: 0.87rem; color: #6b7280; margin: 0; line-height: 1.5; }
.rp-panel-tip { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px; font-size: 0.83rem; color: #7f1d1d; line-height: 1.6; }
.rp-panel-tip ol { margin: 8px 0 0 16px; padding: 0; }
.rp-panel-tip li { margin-bottom: 6px; }

/* Box list */
.rp-box-list { display: flex; flex-direction: column; gap: 6px; }
.rp-box-list-title { font-size: 0.8rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
.rp-box-item { display: flex; align-items: center; justify-content: space-between; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; font-size: 0.82rem; color: #374151; }
.rp-box-item-remove { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 12px; padding: 0 2px; }
.rp-box-item-remove:hover { color: #e74c3c; }
`;
