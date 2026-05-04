'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Upload, Clipboard, PenTool, X } from 'lucide-react';

const TABS = [
    { id: 'draw',   label: 'Draw',         icon: PenTool  },
    { id: 'upload', label: 'Upload Image',  icon: Upload   },
    { id: 'paste',  label: 'Paste',         icon: Clipboard },
];

export default function SignaturePadModal({ onSave, onCancel }) {
    const [activeTab, setActiveTab] = useState('draw');
    const [penColor, setPenColor]   = useState('black');

    // Upload / paste state
    const [uploadedImg, setUploadedImg]   = useState(null); // dataURL
    const [pasteStatus, setPasteStatus]   = useState('idle'); // idle | success | error
    const [uploadDragOver, setUploadDragOver] = useState(false);

    const sigCanvas   = useRef(null);
    const fileInputRef = useRef(null);

    // ── Draw helpers ──────────────────────────────────────────────────────
    const clearDraw = () => sigCanvas.current?.clear();

    const trimAndSave = () => {
        if (activeTab === 'draw') {
            if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
                alert('Please draw your signature first.');
                return;
            }
            const c   = sigCanvas.current.getCanvas();
            const ctx = c.getContext('2d', { willReadFrequently: true });
            const px  = ctx.getImageData(0, 0, c.width, c.height);
            const l   = px.data.length;
            let b = { top: null, left: null, right: null, bottom: null };

            for (let i = 0; i < l; i += 4) {
                if (px.data[i + 3] !== 0) {
                    const x = (i / 4) % c.width;
                    const y = ~~((i / 4) / c.width);
                    if (b.top === null) b.top = y;
                    if (b.left  === null || x < b.left)  b.left  = x;
                    if (b.right === null || b.right < x)  b.right = x;
                    if (b.bottom === null || b.bottom < y) b.bottom = y;
                }
            }

            let dataUrl;
            if (b.top !== null) {
                const tw = b.right - b.left + 1;
                const th = b.bottom - b.top + 1;
                const tc = document.createElement('canvas');
                tc.width = tw; tc.height = th;
                tc.getContext('2d').putImageData(ctx.getImageData(b.left, b.top, tw, th), 0, 0);
                dataUrl = tc.toDataURL('image/png');
            } else {
                dataUrl = c.toDataURL('image/png');
            }
            onSave(dataUrl);
            return;
        }

        // Upload / paste
        if (!uploadedImg) {
            alert('Please provide a signature image first.');
            return;
        }
        onSave(uploadedImg);
    };

    // ── Image file → dataURL ──────────────────────────────────────────────
    const loadImageFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file (PNG, JPG, etc.).');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setUploadedImg(e.target.result);
        reader.readAsDataURL(file);
    };

    const onFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) loadImageFile(file);
    };

    // ── Upload drop zone ──────────────────────────────────────────────────
    const onUploadDrop = (e) => {
        e.preventDefault();
        setUploadDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadImageFile(file);
    };

    // ── Clipboard paste ───────────────────────────────────────────────────
    const pasteFromClipboard = async () => {
        setPasteStatus('idle');
        try {
            const items = await navigator.clipboard.read();
            let found = false;
            for (const item of items) {
                const imgType = item.types.find(t => t.startsWith('image/'));
                if (imgType) {
                    const blob = await item.getType(imgType);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setUploadedImg(e.target.result);
                        setPasteStatus('success');
                    };
                    reader.readAsDataURL(blob);
                    found = true;
                    break;
                }
            }
            if (!found) {
                setPasteStatus('error');
            }
        } catch {
            setPasteStatus('error');
        }
    };

    // Listen for Ctrl+V / Cmd+V anywhere on paste tab
    useEffect(() => {
        if (activeTab !== 'paste') return;
        const handler = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const blob = item.getAsFile();
                    if (blob) {
                        loadImageFile(blob);
                        setPasteStatus('success');
                    }
                    break;
                }
            }
        };
        window.addEventListener('paste', handler);
        return () => window.removeEventListener('paste', handler);
    }, [activeTab]);

    // Reset uploaded image when switching tabs
    useEffect(() => { setUploadedImg(null); setPasteStatus('idle'); }, [activeTab]);

    return (
        <div className="spm-overlay">
            <div className="spm-modal">
                {/* Header */}
                <div className="spm-header">
                    <h3>Add Signature</h3>
                    <button className="spm-close" onClick={onCancel}><X size={18} /></button>
                </div>

                {/* Tabs */}
                <div className="spm-tabs">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            className={`spm-tab ${activeTab === id ? 'active' : ''}`}
                            onClick={() => setActiveTab(id)}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tab body */}
                <div className="spm-body">

                    {/* ── DRAW ── */}
                    {activeTab === 'draw' && (
                        <>
                            <div className="spm-color-row">
                                <span className="spm-color-label">Pen color</span>
                                {['black', '#1a237e', '#c62828'].map(c => (
                                    <button
                                        key={c}
                                        className={`spm-swatch ${penColor === c ? 'active' : ''}`}
                                        style={{ background: c }}
                                        onClick={() => setPenColor(c)}
                                        title={c}
                                    />
                                ))}
                            </div>
                            <div className="spm-canvas-wrap">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor={penColor}
                                    canvasProps={{ className: 'spm-canvas' }}
                                />
                                <span className="spm-canvas-hint">Draw your signature above</span>
                            </div>
                            <div className="spm-footer">
                                <button className="spm-btn-secondary" onClick={clearDraw}>Clear</button>
                                <button className="spm-btn-primary" onClick={trimAndSave}>Insert Signature</button>
                            </div>
                        </>
                    )}

                    {/* ── UPLOAD IMAGE ── */}
                    {activeTab === 'upload' && (
                        <>
                            {uploadedImg ? (
                                <div className="spm-preview-wrap">
                                    <img src={uploadedImg} alt="Signature preview" className="spm-preview-img" />
                                    <button className="spm-preview-remove" onClick={() => setUploadedImg(null)}>
                                        <X size={14} /> Remove
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className={`spm-upload-zone ${uploadDragOver ? 'drag-over' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
                                    onDragLeave={() => setUploadDragOver(false)}
                                    onDrop={onUploadDrop}
                                >
                                    <Upload size={36} color="#e74c3c" />
                                    <p className="spm-upload-title">Click or drag image here</p>
                                    <p className="spm-upload-sub">PNG, JPG, WebP — transparent PNG works best</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={onFileInputChange}
                                    />
                                </div>
                            )}
                            <div className="spm-footer">
                                <button className="spm-btn-secondary" onClick={onCancel}>Cancel</button>
                                <button className="spm-btn-primary" onClick={trimAndSave} disabled={!uploadedImg}>
                                    Use This Signature
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── PASTE ── */}
                    {activeTab === 'paste' && (
                        <>
                            {uploadedImg ? (
                                <div className="spm-preview-wrap">
                                    <img src={uploadedImg} alt="Pasted signature" className="spm-preview-img" />
                                    <button className="spm-preview-remove" onClick={() => { setUploadedImg(null); setPasteStatus('idle'); }}>
                                        <X size={14} /> Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="spm-paste-zone">
                                    <Clipboard size={40} color="#e74c3c" strokeWidth={1.5} />
                                    <p className="spm-paste-title">Paste your signature image</p>
                                    <p className="spm-paste-sub">
                                        Copy an image to your clipboard, then press{' '}
                                        <kbd>Ctrl+V</kbd> / <kbd>⌘V</kbd> anywhere in this dialog,
                                        or click the button below.
                                    </p>
                                    <button className="spm-paste-btn" onClick={pasteFromClipboard}>
                                        <Clipboard size={16} /> Paste from Clipboard
                                    </button>
                                    {pasteStatus === 'error' && (
                                        <p className="spm-paste-error">
                                            No image found in clipboard. Copy an image first, then paste.
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="spm-footer">
                                <button className="spm-btn-secondary" onClick={onCancel}>Cancel</button>
                                <button className="spm-btn-primary" onClick={trimAndSave} disabled={!uploadedImg}>
                                    Use This Signature
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spmFadeIn  { from { opacity:0; }                    to { opacity:1; } }
                @keyframes spmSlideUp { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:none; } }

                .spm-overlay {
                    position: fixed; inset: 0;
                    background: rgba(15,23,42,.45);
                    backdrop-filter: blur(6px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 9999;
                    animation: spmFadeIn .2s ease;
                }
                .spm-modal {
                    background: #fff;
                    border-radius: 18px;
                    width: 92%; max-width: 540px;
                    box-shadow: 0 24px 60px rgba(0,0,0,.18);
                    overflow: hidden;
                    animation: spmSlideUp .28s cubic-bezier(.16,1,.3,1);
                    display: flex; flex-direction: column;
                }

                /* Header */
                .spm-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 24px 16px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .spm-header h3 { margin:0; font-size:1.15rem; font-weight:700; color:#0f172a; }
                .spm-close {
                    background:#f1f5f9; color:#64748b; border:none;
                    width:32px; height:32px; border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                    cursor:pointer; transition:.2s;
                }
                .spm-close:hover { background:#fee2e2; color:#e74c3c; }

                /* Tabs */
                .spm-tabs {
                    display: flex; gap: 4px;
                    padding: 12px 24px 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                .spm-tab {
                    display: flex; align-items: center; gap: 6px;
                    padding: 8px 14px;
                    border: none; border-bottom: 2px solid transparent;
                    background: transparent; cursor: pointer;
                    font-size: .875rem; font-weight: 600; color: #64748b;
                    border-radius: 6px 6px 0 0;
                    transition: color .2s, border-color .2s, background .2s;
                    font-family: inherit;
                }
                .spm-tab:hover { color: #e74c3c; background: #fff5f5; }
                .spm-tab.active {
                    color: #e74c3c;
                    border-bottom-color: #e74c3c;
                    background: #fff5f5;
                }

                /* Body */
                .spm-body { padding: 20px 24px 0; display:flex; flex-direction:column; }

                /* Color row */
                .spm-color-row {
                    display: flex; align-items: center; gap: 10px;
                    margin-bottom: 12px;
                }
                .spm-color-label { font-size:.8rem; font-weight:600; color:#64748b; }
                .spm-swatch {
                    width:26px; height:26px; border-radius:50%;
                    border: 2px solid transparent; cursor:pointer;
                    transition: transform .15s, box-shadow .15s;
                }
                .spm-swatch:hover { transform:scale(1.1); }
                .spm-swatch.active {
                    box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0f172a;
                }

                /* Draw canvas */
                .spm-canvas-wrap {
                    border: 2px dashed #cbd5e1; border-radius:12px;
                    background:#f8fafc; overflow:hidden; position:relative;
                    transition:border-color .2s;
                }
                .spm-canvas-wrap:hover { border-color:#94a3b8; }
                .spm-canvas {
                    width:100% !important; height:220px !important;
                    touch-action:none; display:block;
                }
                .spm-canvas-hint {
                    position:absolute; bottom:8px; left:50%; transform:translateX(-50%);
                    font-size:.75rem; color:#cbd5e1; pointer-events:none; white-space:nowrap;
                }

                /* Upload zone */
                .spm-upload-zone {
                    border: 2px dashed #e2e8f0; border-radius:14px;
                    background: #fafcff;
                    padding: 36px 24px;
                    display: flex; flex-direction:column; align-items:center; gap:10px;
                    cursor: pointer; transition: all .2s;
                    min-height: 220px; justify-content:center;
                }
                .spm-upload-zone:hover,
                .spm-upload-zone.drag-over {
                    border-color:#e74c3c; background:#fff5f5;
                }
                .spm-upload-title { margin:0; font-size:1rem; font-weight:700; color:#1e293b; }
                .spm-upload-sub   { margin:0; font-size:.82rem; color:#94a3b8; text-align:center; }

                /* Paste zone */
                .spm-paste-zone {
                    border: 2px dashed #e2e8f0; border-radius:14px;
                    background:#fafcff;
                    padding: 32px 24px;
                    display:flex; flex-direction:column; align-items:center; gap:12px;
                    min-height:220px; justify-content:center;
                }
                .spm-paste-title { margin:0; font-size:1rem; font-weight:700; color:#1e293b; }
                .spm-paste-sub   { margin:0; font-size:.83rem; color:#64748b; text-align:center; line-height:1.55; max-width:300px; }
                .spm-paste-sub kbd {
                    background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px;
                    padding:1px 6px; font-size:.8rem; font-family:monospace; color:#334155;
                }
                .spm-paste-btn {
                    display:flex; align-items:center; gap:8px;
                    background:#e74c3c; color:#fff; border:none;
                    padding:10px 22px; border-radius:8px; font-weight:700;
                    font-size:.9rem; cursor:pointer; transition:background .2s;
                    font-family:inherit;
                }
                .spm-paste-btn:hover { background:#c0392b; }
                .spm-paste-error { margin:0; font-size:.82rem; color:#e74c3c; font-weight:600; text-align:center; }

                /* Preview (upload / paste) */
                .spm-preview-wrap {
                    border: 2px solid #e2e8f0; border-radius:12px;
                    background:#f8fafc; padding:16px;
                    display:flex; flex-direction:column; align-items:center; gap:12px;
                    min-height:220px; justify-content:center;
                }
                .spm-preview-img {
                    max-width:100%; max-height:160px;
                    object-fit:contain;
                    border-radius:6px;
                    box-shadow:0 2px 8px rgba(0,0,0,.08);
                }
                .spm-preview-remove {
                    display:flex; align-items:center; gap:5px;
                    background:#fee2e2; color:#e74c3c; border:none;
                    padding:6px 16px; border-radius:6px; font-weight:600;
                    font-size:.82rem; cursor:pointer; transition:.2s;
                    font-family:inherit;
                }
                .spm-preview-remove:hover { background:#fca5a5; }

                /* Footer */
                .spm-footer {
                    display:flex; justify-content:flex-end; gap:10px;
                    padding: 18px 0 22px;
                    margin-top: 16px;
                }
                .spm-btn-secondary {
                    background:#fff; color:#e74c3c; border:2px solid #e74c3c;
                    padding:10px 24px; border-radius:8px; font-weight:700;
                    font-size:.95rem; cursor:pointer; transition:.2s; font-family:inherit;
                }
                .spm-btn-secondary:hover { background:#fff5f5; border-color:#c0392b; color:#c0392b; }
                .spm-btn-primary {
                    background:#e74c3c; color:#fff; border:none;
                    padding:10px 24px; border-radius:8px; font-weight:700;
                    font-size:.95rem; cursor:pointer; transition:.2s; font-family:inherit;
                }
                .spm-btn-primary:hover:not(:disabled) { background:#c0392b; }
                .spm-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
            `}</style>
        </div>
    );
}