'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, X, Loader2, Download, ArrowUpDown, GripVertical } from 'lucide-react';
import { formatBytes, getPdfPreviewData, reorderPages as reorderPagesUtil } from '../../lib/pdfUtils';
import { useRouter } from 'next/navigation';

/* ──────────────────────────────────────────────
   Helper: render a single PDF page as a data-URL
   ────────────────────────────────────────────── */
let pdfjsModulePromise;
async function loadPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import('pdfjs-dist').then((pdfjsLib) => {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }
      return pdfjsLib;
    });
  }
  return pdfjsModulePromise;
}

async function renderPageThumbnails(file) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const thumbs = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const baseVP = page.getViewport({ scale: 1 });
    const scale = 160 / baseVP.width;
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    thumbs.push({
      pageNumber: i,
      url: canvas.toDataURL('image/jpeg', 0.82),
    });
    page.cleanup();
  }

  if (typeof pdf.destroy === 'function') await pdf.destroy();
  return thumbs;
}

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
export default function ReorderPages({ embedded = false }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [thumbs, setThumbs] = useState([]);           // [{pageNumber, url}]
  const [order, setOrder] = useState([]);              // current ordering (array of pageNumbers)
  const [isLoadingThumbs, setIsLoadingThumbs] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Drag state
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const handleGoHome = () => router.push('/');

  /* ── file upload ── */
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setError(null);
    setResult(null);

    if (rejectedFiles.length > 0) {
      setError(rejectedFiles[0]?.errors?.[0]?.code === 'too-many-files'
        ? 'Please upload one PDF at a time.'
        : 'Please upload a valid PDF file.');
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    try {
      const prevData = await getPdfPreviewData(selectedFile);
      setPreviewUrl(prevData.previewUrl);
      setPageCount(prevData.pageCount);
    } catch (err) {
      console.error('Preview error:', err);
      setPageCount(null);
    }

    // render thumbnails
    setIsLoadingThumbs(true);
    try {
      const thumbnails = await renderPageThumbnails(selectedFile);
      setThumbs(thumbnails);
      setOrder(thumbnails.map(t => t.pageNumber));
    } catch (err) {
      console.error('Thumbnail error:', err);
      setError('Could not render page thumbnails. The file may be very large — try a smaller PDF.');
    } finally {
      setIsLoadingThumbs(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
  });

  const handleOpenFileDialog = useCallback(() => { setError(null); open(); }, [open]);
  const handleDropzoneKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenFileDialog(); }
  }, [handleOpenFileDialog]);
  const handleSelectButtonClick = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); handleOpenFileDialog();
  }, [handleOpenFileDialog]);

  /* ── drag and drop reorder ── */
  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); setOverIdx(idx); };
  const handleDragEnd = () => {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      setOrder((prev) => {
        const copy = [...prev];
        const [moved] = copy.splice(dragIdx, 1);
        copy.splice(overIdx, 0, moved);
        return copy;
      });
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  /* ── touch drag ── */
  const touchRef = useRef({ startIdx: null, startY: 0, clone: null });

  /* ── quick reorder helpers ── */
  const moveUp = (idx) => {
    if (idx <= 0) return;
    setOrder((prev) => {
      const copy = [...prev];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy;
    });
  };

  const moveDown = (idx) => {
    setOrder((prev) => {
      if (idx >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      return copy;
    });
  };

  const resetOrder = () => setOrder(thumbs.map(t => t.pageNumber));
  const reverseOrder = () => setOrder((prev) => [...prev].reverse());

  /* ── process ── */
  const handleReorder = async () => {
    if (!file || order.length === 0) return;
    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      const zeroIndexed = order.map(p => p - 1);
      const blob = await reorderPagesUtil(file, zeroIndexed);
      const url = URL.createObjectURL(blob);
      const downloadName = file.name.replace('.pdf', '') + '-reordered.pdf';
      setResult({ url, downloadName });
      setProgress(100);
    } catch (err) {
      setError(err.message || 'Failed to reorder pages');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null); setPreviewUrl(null); setPageCount(null);
    setThumbs([]); setOrder([]); setResult(null);
    setError(null); setProgress(0);
  };

  /* ── thumbnail lookup ── */
  const thumbMap = {};
  thumbs.forEach(t => { thumbMap[t.pageNumber] = t.url; });

  /* check if order was changed */
  const isOriginal = order.length > 0 && order.every((p, i) => p === i + 1);

  // ═══════════════════════════════════════════════════════════════════════
  //  TOOL CONTENT
  // ═══════════════════════════════════════════════════════════════════════
  const toolContent = (
    <>
      {!file ? (
        <motion.div
          {...getRootProps({
            onKeyDown: handleDropzoneKeyDown,
            role: 'button',
            tabIndex: 0,
          })}
          className={`rp-dropzone ${isDragActive ? 'rp-dropzone-active' : ''}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <input {...getInputProps()} />
          <h3 className="rp-dropzone-heading">
            {isDragActive ? 'Drop your PDF here' : 'Organize PDF'}
          </h3>
          <p className="rp-dropzone-sub">
            {isDragActive
              ? 'Release to upload your file'
              : 'Rearrange pages in your PDF with the easiest organizer available.'}
          </p>
          <button className="rp-cta-button" type="button" onClick={handleSelectButtonClick}>
            Select PDF file
          </button>
          <p className="rp-drop-hint">or drop PDF here</p>
        </motion.div>
      ) : (
        <motion.div className="file-selected-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* file info header */}
          <div className="file-info-header">
            <div className="file-preview-section">
              {previewUrl ? (
                <img src={previewUrl} alt="PDF preview" className="file-preview-image" />
              ) : (
                <div className="file-preview-placeholder"><FileText size={40} /></div>
              )}
            </div>
            <div className="file-details">
              <h4 className="file-name">{file.name}</h4>
              <p className="file-size">{formatBytes(file.size)}</p>
              {pageCount && <p className="file-pages"><CheckCircle size={14} /> {pageCount} page{pageCount > 1 ? 's' : ''}</p>}
            </div>
            <button className="remove-file-button" onClick={handleReset} type="button"><X size={20} /></button>
          </div>

          {/* page thumbnails grid */}
          {isLoadingThumbs ? (
            <div className="reorder-loading">
              <Loader2 className="spinner" size={32} />
              <p>Rendering page thumbnails…</p>
            </div>
          ) : thumbs.length > 0 && !result ? (
            <div className="reorder-workspace">
              <div className="reorder-toolbar">
                <h4 className="section-title">
                  <ArrowUpDown size={18} /> Drag pages to reorder
                </h4>
                <div className="reorder-toolbar-actions">
                  <button type="button" className="reorder-small-btn" onClick={reverseOrder} title="Reverse order">
                    Reverse
                  </button>
                  <button type="button" className="reorder-small-btn" onClick={resetOrder} title="Reset to original order" disabled={isOriginal}>
                    Reset
                  </button>
                </div>
              </div>

              <div className="reorder-grid">
                {order.map((pageNum, idx) => (
                  <div
                    key={`page-${pageNum}`}
                    className={`reorder-thumb${dragIdx === idx ? ' dragging' : ''}${overIdx === idx ? ' drag-over' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="thumb-grip"><GripVertical size={16} /></div>
                    <img src={thumbMap[pageNum]} alt={`Page ${pageNum}`} className="thumb-image" />
                    <div className="thumb-label">
                      <span className="thumb-number">{pageNum}</span>
                    </div>
                    <div className="thumb-arrows">
                      <button type="button" className="thumb-arrow-btn" onClick={() => moveUp(idx)} disabled={idx === 0} title="Move up">↑</button>
                      <button type="button" className="thumb-arrow-btn" onClick={() => moveDown(idx)} disabled={idx === order.length - 1} title="Move down">↓</button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="reorder-hint">
                New order: <strong>{order.join(', ')}</strong>
              </p>
            </div>
          ) : null}

          {/* actions */}
          <div className="convert-actions">
            {!result ? (
              <>
                <button
                  className="convert-button"
                  onClick={handleReorder}
                  disabled={isProcessing || order.length === 0 || isOriginal}
                  type="button"
                >
                  {isProcessing ? (
                    <><Loader2 className="spinner" size={20} /> Reordering… {progress}%</>
                  ) : (
                    <><ArrowUpDown size={20} /> Reorder Pages</>
                  )}
                </button>
                {!isProcessing && isOriginal && order.length > 0 && (
                  <p className="convert-hint">🔄 Drag pages above to change the order before reordering.</p>
                )}
                {!isProcessing && !isOriginal && order.length > 0 && (
                  <p className="convert-hint">⚡ Ready to reorder! Click the button above.</p>
                )}
              </>
            ) : (
              <div className="success-section">
                <div className="success-icon"><CheckCircle size={56} /></div>
                <h4>Reorder Successful!</h4>
                <p>Your reordered PDF is ready for download</p>
                <a href={result.url} download={result.downloadName} className="download-button">
                  <Download size={20} /> Download PDF File
                </a>
                <button className="convert-another-button" onClick={handleReset} type="button">
                  Reorder another file
                </button>
              </div>
            )}
          </div>

          {/* progress */}
          {isProcessing && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="progress-text">{progress < 100 ? 'Reordering pages…' : 'Complete!'}</p>
            </div>
          )}

          {/* error */}
          {error && (
            <div className="error-message-wrapper">
              <div className="error-message">
                <X size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════
  //  STYLES
  // ═══════════════════════════════════════════════════════════════════════
  const toolStyles = (
    <style jsx global>{`
      /* ── dropzone: iLovePDF merge-style ── */
      .rp-dropzone {
        text-align: center;
        padding: 48px 32px 40px;
        border-radius: 16px;
        cursor: default;
        transition: background 0.3s ease;
      }
      .rp-dropzone-active {
        background: color-mix(in srgb, #e74c3c 6%, var(--surface-solid));
      }

      .rp-dropzone-heading {
        font-size: clamp(1.5rem, 3.5vw, 2rem);
        font-weight: 900;
        color: var(--text-heading);
        margin: 0 0 10px;
        letter-spacing: -0.01em;
      }
      .rp-dropzone-sub {
        font-size: 1rem;
        color: var(--text-soft);
        margin: 0 0 28px;
        line-height: 1.6;
        max-width: 520px;
        margin-left: auto;
        margin-right: auto;
      }

      .rp-cta-button {
        display: block;
        width: 100%;
        max-width: 440px;
        margin: 0 auto 16px;
        padding: 22px 48px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1.25rem;
        font-weight: 800;
        cursor: pointer;
        transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
        box-shadow: 0 6px 20px rgba(231, 76, 60, 0.25);
        letter-spacing: 0.01em;
      }
      .rp-cta-button:hover {
        background: #c0392b;
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(231, 76, 60, 0.35);
      }

      .rp-drop-hint {
        font-size: 0.95rem;
        color: var(--text-soft);
        margin: 0;
      }
      .file-selected-panel { display: flex; flex-direction: column; gap: 32px; }
      .file-info-header { display: flex; align-items: center; gap: 20px; padding: 24px; background: var(--surface); border-radius: 16px; position: relative; }
      .file-preview-section { width: 100px; height: 140px; border-radius: 12px; overflow: hidden; background: var(--surface-border); flex-shrink: 0; }
      .file-preview-image { width: 100%; height: 100%; object-fit: cover; }
      .file-preview-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #adb5bd; }
      .file-details { flex: 1; min-width: 0; }
      .file-name { font-size: 1.1rem; font-weight: 700; color: var(--text-heading); margin: 0; word-break: break-word; }
      .file-size { font-size: 0.9rem; color: var(--text-soft); margin: 4px 0 0; }
      .file-pages { font-size: 0.85rem; color: #27ae60; margin: 4px 0 0; display: flex; align-items: center; gap: 6px; }
      .remove-file-button { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 8px; color: var(--text-soft); transition: all 0.2s; }
      .remove-file-button:hover { background: #fee; color: #e74c3c; }
      .convert-actions { display: grid; gap: 16px; }
      .convert-button { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; padding: 18px 48px; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3); display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
      .convert-button:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(231, 76, 60, 0.4); }
      .convert-button:disabled { opacity: 0.5; cursor: not-allowed; }
      .spinner { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .convert-hint { font-size: 0.9rem; color: var(--text-soft); margin: 0; text-align: center; }
      .success-section { display: grid; gap: 16px; text-align: center; padding: 32px; background: color-mix(in srgb, #27ae60 10%, var(--surface-solid)); border-radius: 16px; }
      .success-icon { color: #27ae60; }
      .success-section h4 { font-size: 1.5rem; font-weight: 700; color: var(--text-heading); margin: 0; }
      .success-section p { color: var(--text-soft); margin: 0; }
      .download-button { background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%); color: white; border: none; padding: 18px 48px; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(39, 174, 96, 0.3); display: inline-flex; align-items: center; gap: 10px; text-decoration: none; justify-content: center; }
      .download-button:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(39, 174, 96, 0.4); }
      .convert-another-button { background: transparent; border: 2px solid var(--surface-border); color: var(--text-soft); padding: 14px 32px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
      .convert-another-button:hover { border-color: #e74c3c; color: #e74c3c; }
      .progress-section { display: grid; gap: 12px; }
      .progress-bar { width: 100%; height: 8px; background: var(--surface-border); border-radius: 4px; overflow: hidden; }
      .progress-fill { height: 100%; background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%); transition: width 0.3s ease; }
      .progress-text { font-size: 0.95rem; color: var(--text-soft); text-align: center; margin: 0; }
      .error-message-wrapper { display: grid; gap: 12px; }
      .error-message { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; }
      .features-section { max-width: 1200px; margin: 0 auto; padding: 60px 24px; }
      .features-title { font-size: 2rem; font-weight: 800; text-align: center; margin: 0 0 40px; color: var(--text-heading); }
      .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }

      /* ── reorder-specific styles ── */
      .reorder-loading {
        display: flex; flex-direction: column; align-items: center; gap: 12px;
        padding: 40px 20px; color: var(--text-soft);
      }

      .reorder-workspace { display: grid; gap: 16px; }

      .reorder-toolbar {
        display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      }

      .section-title {
        font-size: 1.15rem; font-weight: 700; color: var(--text-heading); margin: 0;
        display: flex; align-items: center; gap: 8px;
      }

      .reorder-toolbar-actions { display: flex; gap: 8px; }

      .reorder-small-btn {
        padding: 8px 16px; border-radius: 8px; border: 1.5px solid var(--surface-border);
        background: var(--surface-solid); color: var(--text-soft);
        font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
      }
      .reorder-small-btn:hover:not(:disabled) { border-color: #e74c3c; color: #e74c3c; background: #fef2f2; }
      .reorder-small-btn:disabled { opacity: 0.4; cursor: not-allowed; }

      .reorder-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 16px;
      }

      .reorder-thumb {
        position: relative;
        border: 2px solid var(--surface-border);
        border-radius: 14px;
        overflow: hidden;
        background: var(--surface-solid);
        cursor: grab;
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        user-select: none;
      }
      .reorder-thumb:hover {
        border-color: var(--tool-hover-border);
        box-shadow: 0 8px 24px var(--tool-hover-glow);
        transform: translateY(-3px);
      }
      .reorder-thumb.dragging {
        opacity: 0.45;
        transform: scale(0.92);
      }
      .reorder-thumb.drag-over {
        border-color: #e74c3c;
        box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.25), 0 8px 24px var(--tool-hover-glow);
        transform: translateY(-4px);
      }

      .thumb-grip {
        position: absolute; top: 6px; right: 6px; z-index: 2;
        width: 28px; height: 28px; border-radius: 8px;
        background: rgba(0,0,0,0.45); color: white;
        display: flex; align-items: center; justify-content: center;
        opacity: 0.6; transition: opacity 0.2s;
      }
      .reorder-thumb:hover .thumb-grip { opacity: 1; }

      .thumb-image {
        width: 100%; aspect-ratio: 3/4; object-fit: cover;
        display: block; pointer-events: none;
        background: #f5f5f5;
      }

      .thumb-label {
        position: absolute; bottom: 0; left: 0; right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.65));
        padding: 18px 8px 8px; text-align: center;
      }
      .thumb-number {
        font-size: 0.85rem; font-weight: 800; color: white;
        background: rgba(231,76,60,0.85); padding: 2px 10px;
        border-radius: 8px;
      }

      .thumb-arrows {
        position: absolute; top: 6px; left: 6px; z-index: 2;
        display: flex; flex-direction: column; gap: 3px;
      }
      .thumb-arrow-btn {
        width: 26px; height: 26px; border-radius: 7px;
        background: rgba(0,0,0,0.45); color: white;
        border: none; cursor: pointer; font-size: 0.75rem; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.2s, background 0.2s;
      }
      .reorder-thumb:hover .thumb-arrow-btn { opacity: 0.8; }
      .thumb-arrow-btn:hover { opacity: 1 !important; background: rgba(231,76,60,0.85); }
      .thumb-arrow-btn:disabled { opacity: 0 !important; cursor: default; }

      .reorder-hint {
        font-size: 0.9rem; color: var(--text-soft); margin: 0; text-align: center;
        padding: 10px 16px; background: var(--surface); border-radius: 10px;
      }
      .reorder-hint strong { color: var(--text-heading); }

      /* ── responsive ── */
      @media (max-width: 640px) {
        .reorder-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
        .thumb-arrows { display: none; }
      }

      /* ── standalone mode (not embedded) ── */
      .ilovepdf-container { min-height: 100vh; background: linear-gradient(135deg, var(--page-top) 0%, var(--page-bg) 48%, var(--page-bottom) 100%); }
      .ilovepdf-top-header { background: var(--surface-solid); border-bottom: 1px solid var(--surface-border); padding: 16px 30px; position: sticky; top: 0; z-index: 100; box-shadow: var(--card-shadow-soft); }
      .ilovepdf-header-content { max-width: 1400px; margin: 0 auto; }
      .ilovepdf-header-logo { display: flex; align-items: center; gap: 12px; background: transparent; border: none; cursor: pointer; padding: 8px 12px; margin: -8px -12px; border-radius: 10px; transition: all 0.2s ease; }
      .ilovepdf-header-logo:hover { background: var(--surface); transform: translateX(-4px); }
      .header-logo-image { width: 64px; height: 64px; object-fit: contain; }
      .header-brand-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-heading); }
      .header-brand-accent { color: #e74c3c; }
      .ilovepdf-hero { background: var(--surface-solid); padding: 50px 20px 40px; text-align: center; border-bottom: 1px solid var(--surface-border); }
      .ilovepdf-hero-content { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; }
      .ilovepdf-title { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 900; margin: 0; color: var(--text-heading); letter-spacing: -0.02em; }
      .ilovepdf-title .highlight { color: #e74c3c; }
      .ilovepdf-subtitle { font-size: clamp(1.1rem, 2vw, 1.4rem); color: var(--text-soft); margin: 16px 0 0; font-weight: 400; }
      .ilovepdf-tool-card { max-width: 900px; margin: 40px auto 40px; background: var(--surface-solid); border: 1px solid var(--surface-border); border-radius: 24px; box-shadow: var(--card-shadow-soft); padding: 40px; position: relative; z-index: 2; }
      .features-section { max-width: 1200px; margin: 0 auto; padding: 60px 24px; }
      .features-title { font-size: 2rem; font-weight: 800; text-align: center; margin: 0 0 40px; color: var(--text-heading); }
      .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
    `}</style>
  );

  // ═══════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════
  if (embedded) {
    return (
      <>
        {toolContent}
        {toolStyles}
      </>
    );
  }

  return (
    <div className="ilovepdf-container">
      <header className="ilovepdf-top-header">
        <div className="ilovepdf-header-content">
          <button className="ilovepdf-header-logo" onClick={handleGoHome} type="button">
            <img src="/sababpdf-sunpdf-logo.svg" alt="SababPDF" className="header-logo-image" />
            <span className="header-brand-name">Sabab<span className="header-brand-accent">PDF</span></span>
          </button>
        </div>
      </header>

      <section className="ilovepdf-hero">
        <div className="ilovepdf-hero-content">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="ilovepdf-title"><span className="highlight">Reorder pages</span></h1>
            <p className="ilovepdf-subtitle">Drag and drop to rearrange the order of pages in your PDF</p>
          </motion.div>
        </div>
      </section>

      <section className="ilovepdf-tool-card">
        {toolContent}
      </section>

      <section className="features-section">
        <h2 className="features-title">Why use our PDF page reorder tool?</h2>
        <div className="features-grid">
          <FeatureCard icon="🖱️" title="Drag & Drop" description="Visually rearrange pages with intuitive drag and drop." color="#e74c3c" />
          <FeatureCard icon="⚡" title="Instant Processing" description="Pages are reordered instantly in your browser." color="#e74c3c" />
          <FeatureCard icon="🔒" title="100% Secure" description="Your files stay in your browser — nothing is uploaded." color="#e74c3c" />
        </div>
      </section>

      {toolStyles}
    </div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  return (
    <div style={{ padding: '24px', borderRadius: '16px', background: 'color-mix(in srgb, var(--surface-solid) 90%, transparent)', border: `1px solid ${color}20` }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-heading)', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-soft)', margin: 0, lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}
