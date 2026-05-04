'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, X, Loader2, Download, Plus, FilePlus, RotateCcw } from 'lucide-react';
import { formatBytes, getPdfPreviewData, getPdfPagePreviews, insertPages, downloadBlob } from '../../lib/pdfUtils';
import { useRouter } from 'next/navigation';

export default function AddPages({ embedded = false }) {
  const router = useRouter();
  const [baseFile, setBaseFile] = useState(null);
  const [basePreview, setBasePreview] = useState(null);
  const [basePageCount, setBasePageCount] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const [insertFiles, setInsertFiles] = useState([]);
  const [insertPosition, setInsertPosition] = useState('end');
  const [customPosition, setCustomPosition] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const loadPreviews = async (selectedFile) => {
    setIsLoadingThumbnails(true);
    try {
      const previewData = await getPdfPagePreviews(selectedFile, Array.from({ length: 50 }, (_, i) => i + 1), 160);
      setThumbnails(previewData.pages);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsLoadingThumbnails(false);
    }
  };

  // Base file drop
  const onDropBase = useCallback(async (accepted, rejected) => {
    setError(null); setResult(null);
    if (rejected.length > 0) { setError('Please upload a valid PDF file'); return; }
    const f = accepted[0];
    if (!f) return;
    setBaseFile(f);
    try {
      const preview = await getPdfPreviewData(f);
      setBasePreview(preview.previewUrl);
      setBasePageCount(preview.pageCount);
    } catch (err) { console.error(err); }
    loadPreviews(f);
  }, []);

  const baseDropzone = useDropzone({
    onDrop: onDropBase,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1, maxSize: 100 * 1024 * 1024,
    noClick: true, noKeyboard: true,
  });

  // Insert files drop
  const onDropInsert = useCallback((accepted, rejected) => {
    setError(null);
    if (rejected.length > 0) { setError('Please upload valid PDF files'); return; }
    setInsertFiles(prev => [...prev, ...accepted]);
  }, []);

  const insertDropzone = useDropzone({
    onDrop: onDropInsert,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 100 * 1024 * 1024,
    noClick: true, noKeyboard: true,
  });

  const removeInsertFile = (idx) => {
    setInsertFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleProcess = async () => {
    if (!baseFile || insertFiles.length === 0) return;
    setIsProcessing(true); setError(null);

    try {
      let afterPage = -1;
      if (insertPosition === 'beginning') afterPage = 0;
      else if (insertPosition === 'custom') {
        afterPage = parseInt(customPosition, 10);
        if (isNaN(afterPage) || afterPage < 0 || afterPage > basePageCount) {
          setError(`Enter a page number between 0 and ${basePageCount}`);
          setIsProcessing(false);
          return;
        }
      }

      const blob = await insertPages(baseFile, insertFiles, afterPage);
      const downloadName = baseFile.name.replace(/\.pdf$/i, '') + '-with-pages.pdf';

      // Use the proven downloadBlob utility
      downloadBlob(blob, downloadName, 'application/pdf');

      setResult({ downloadName });
    } catch (err) {
      setError(err.message || 'Failed to add pages');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setBaseFile(null); setBasePreview(null); setBasePageCount(null);
    setThumbnails([]); setInsertFiles([]); setResult(null); setError(null);
  };

  // ========== UPLOAD SCREEN ==========
  if (!baseFile) {
    return (
      <>
        <div className="ap-upload-screen">
          <div className="ap-upload-center">
            <div {...baseDropzone.getRootProps()} className={`ap-upload-zone ${baseDropzone.isDragActive ? 'ap-drag-active' : ''}`}>
              <input {...baseDropzone.getInputProps()} />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); baseDropzone.open(); }}
                className="ap-select-btn"
              >
                Select PDF file
              </button>
              <p className="ap-drop-text">
                or <span className="ap-drop-link">drop PDF here</span>
              </p>
            </div>
            {error && (
              <div className="ap-error-inline"><X size={16} /> {error}</div>
            )}
          </div>
        </div>
        <style jsx>{`
          .ap-upload-screen { display: flex; justify-content: center; align-items: center; min-height: 280px; padding: 40px 20px; }
          .ap-upload-center { text-align: center; max-width: 700px; width: 100%; }
          .ap-upload-zone { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px; cursor: pointer; border-radius: 12px; transition: background 0.2s; }
          .ap-upload-zone.ap-drag-active { background: color-mix(in srgb, #e74c3c 8%, transparent); }
          .ap-select-btn { background: #e74c3c; color: #fff; border: none; padding: 18px 60px; border-radius: 8px; font-size: 1.15rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(231, 76, 60, 0.3); transition: box-shadow 0.3s, background 0.2s, transform 0.15s; letter-spacing: 0.01em; }
          .ap-select-btn:hover { background: #d04437; box-shadow: 0 6px 24px rgba(231, 76, 60, 0.4); transform: scale(1.03); }
          .ap-drop-text { font-size: 0.92rem; color: var(--text-soft); margin: 0; }
          .ap-drop-link { color: #e74c3c; text-decoration: underline; text-underline-offset: 2px; }
          .ap-error-inline { margin-top: 16px; color: #e74c3c; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 6px; }
        `}</style>
      </>
    );
  }

  // ========== RESULT SCREEN ==========
  if (result) {
    return (
      <>
        <div className="ap-success-screen">
          <div className="ap-success-card">
            <CheckCircle size={56} color="#27ae60" />
            <h3 className="ap-success-title">Pages Added Successfully!</h3>
            <p className="ap-success-desc">Your file <strong>{result.downloadName}</strong> has been downloaded.</p>
            <button className="ap-reset-btn" onClick={handleReset}>
              <RotateCcw size={16} /> Process another file
            </button>
          </div>
        </div>
        <style jsx>{`
          .ap-success-screen { display: flex; justify-content: center; align-items: center; min-height: 400px; padding: 40px 20px; }
          .ap-success-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
          .ap-success-title { font-size: 1.8rem; font-weight: 800; color: var(--text-heading); margin: 0; }
          .ap-success-desc { font-size: 1rem; color: var(--text-soft); margin: 0; }
          .ap-download-btn { display: inline-flex; align-items: center; gap: 10px; background: #27ae60; color: #fff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 1.1rem; font-weight: 700; box-shadow: 0 4px 16px rgba(39, 174, 96, 0.3); transition: all 0.2s; margin-top: 8px; }
          .ap-download-btn:hover { background: #219a52; box-shadow: 0 6px 24px rgba(39, 174, 96, 0.4); }
          .ap-reset-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: var(--text-soft); border: 2px solid var(--surface-border); padding: 12px 32px; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
          .ap-reset-btn:hover { border-color: #e74c3c; color: #e74c3c; }
        `}</style>
      </>
    );
  }

  // ========== WORKSPACE (split layout) ==========
  return (
    <>
      <div className="ap-workspace">
        {/* Left: Page thumbnails */}
        <div className="ap-preview-area">
          {isLoadingThumbnails ? (
            <div className="ap-loader">
              <Loader2 className="ap-spin" size={40} color="#e74c3c" />
              <p>Loading pages...</p>
            </div>
          ) : (
            <div className="ap-pages-grid">
              {thumbnails.map((t, idx) => (
                <div key={idx} className="ap-page-card">
                  <div className="ap-page-img-wrapper">
                    <img src={t.previewUrl} alt={`Page ${idx + 1}`} className="ap-page-img" />
                  </div>
                  <span className="ap-page-num">{idx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="ap-sidebar">
          <div className="ap-sidebar-head">
            <h3>Add pages options</h3>
            <CheckCircle color="#27ae60" size={18} />
          </div>

          <div className="ap-sidebar-body">
            {/* Base file info */}
            <div className="ap-base-info">
              <div className="ap-base-icon"><FileText size={20} /></div>
              <div className="ap-base-details">
                <span className="ap-base-name">{baseFile.name}</span>
                <span className="ap-base-meta">{formatBytes(baseFile.size)} · {basePageCount} page{basePageCount > 1 ? 's' : ''}</span>
              </div>
              <button className="ap-base-remove" onClick={handleReset}><X size={16} /></button>
            </div>

            {/* Insert files */}
            <div className="ap-section">
              <label className="ap-label">Pages to insert</label>
              {insertFiles.length > 0 && (
                <div className="ap-insert-list">
                  {insertFiles.map((f, idx) => (
                    <div key={idx} className="ap-insert-item">
                      <FileText size={16} />
                      <span className="ap-insert-name">{f.name}</span>
                      <button className="ap-remove-btn" onClick={() => removeInsertFile(idx)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div
                {...insertDropzone.getRootProps({ onClick: () => insertDropzone.open() })}
                className={`ap-add-zone ${insertDropzone.isDragActive ? 'ap-add-zone-active' : ''}`}
              >
                <input {...insertDropzone.getInputProps()} />
                <Plus size={18} />
                <span>Add PDF files</span>
              </div>
            </div>

            {/* Position */}
            {insertFiles.length > 0 && (
              <div className="ap-section">
                <label className="ap-label">Insert position</label>
                <div className="ap-pos-options">
                  {[
                    { val: 'end', label: 'At the end' },
                    { val: 'beginning', label: 'At the beginning' },
                    { val: 'custom', label: 'After page' },
                  ].map(opt => (
                    <label key={opt.val} className={`ap-pos-radio ${insertPosition === opt.val ? 'active' : ''}`}>
                      <input type="radio" name="pos" value={opt.val} checked={insertPosition === opt.val} onChange={() => setInsertPosition(opt.val)} />
                      <span>{opt.label}</span>
                      {opt.val === 'custom' && insertPosition === 'custom' && (
                        <input
                          type="number" min="0" max={basePageCount || 999}
                          value={customPosition} onChange={(e) => setCustomPosition(e.target.value)}
                          className="ap-custom-input" placeholder={`0-${basePageCount}`}
                          onClick={e => e.stopPropagation()}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer action */}
          <div className="ap-sidebar-foot">
            {error && (
              <div className="ap-sidebar-error"><X size={14} /> {error}</div>
            )}
            <button
              className={`ap-action-btn ${isProcessing || insertFiles.length === 0 ? 'ap-action-disabled' : ''}`}
              onClick={handleProcess}
              disabled={isProcessing || insertFiles.length === 0}
            >
              {isProcessing ? (
                <><Loader2 className="ap-spin" size={20} /> Processing...</>
              ) : (
                <>Add pages <span style={{fontSize: '18px'}}>→</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ap-workspace {
          display: flex;
          width: 100%;
          min-height: 520px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--surface-border);
        }

        /* ===== Left Preview ===== */
        .ap-preview-area {
          flex: 1;
          overflow-y: auto;
          background: var(--surface);
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ap-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: #e74c3c;
          gap: 16px;
          font-weight: 500;
        }
        .ap-pages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 20px;
          width: 100%;
        }
        .ap-page-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--surface-solid);
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: box-shadow 0.2s;
        }
        .ap-page-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .ap-page-img-wrapper {
          position: relative;
          width: 100%;
        }
        .ap-page-img {
          width: 100%;
          height: auto;
          object-fit: contain;
          border: 1px solid var(--surface-border);
          border-radius: 4px;
        }
        .ap-page-num {
          margin-top: 8px;
          font-size: 13px;
          color: var(--text-soft);
          font-weight: 500;
        }

        /* ===== Right Sidebar ===== */
        .ap-sidebar {
          width: 340px;
          background: var(--surface-solid);
          border-left: 1px solid var(--surface-border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .ap-sidebar-head {
          padding: 18px 22px;
          border-bottom: 1px solid var(--surface-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface);
        }
        .ap-sidebar-head h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--text-heading);
        }
        .ap-sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Base file info */
        .ap-base-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--surface);
          border: 1px solid var(--surface-border);
          border-radius: 10px;
        }
        .ap-base-icon {
          color: #e74c3c;
          flex-shrink: 0;
        }
        .ap-base-details {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ap-base-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-heading);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ap-base-meta {
          font-size: 11px;
          color: var(--text-soft);
        }
        .ap-base-remove {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: var(--text-soft);
          transition: all 0.15s;
          display: flex;
        }
        .ap-base-remove:hover { color: #e74c3c; background: #fee; }

        /* Sections */
        .ap-section { display: flex; flex-direction: column; gap: 8px; }
        .ap-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-heading);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Insert list */
        .ap-insert-list { display: flex; flex-direction: column; gap: 6px; }
        .ap-insert-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--surface);
          border: 1px solid var(--surface-border);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-heading);
        }
        .ap-insert-name {
          flex: 1;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ap-remove-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: var(--text-soft);
          display: flex;
          transition: all 0.15s;
        }
        .ap-remove-btn:hover { color: #e74c3c; background: #fee; }

        /* Add zone */
        .ap-add-zone {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border: 2px dashed var(--surface-border);
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-soft);
          transition: all 0.2s;
        }
        .ap-add-zone:hover, .ap-add-zone.ap-add-zone-active {
          border-color: #e74c3c;
          color: #e74c3c;
          background: color-mix(in srgb, #e74c3c 5%, transparent);
        }

        /* Position */
        .ap-pos-options { display: flex; flex-direction: column; gap: 6px; }
        .ap-pos-radio {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--surface);
          border: 2px solid var(--surface-border);
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-heading);
          transition: all 0.2s;
        }
        .ap-pos-radio:hover { border-color: #e74c3c60; }
        .ap-pos-radio.active { border-color: #e74c3c; background: color-mix(in srgb, #e74c3c 6%, var(--surface-solid)); }
        .ap-pos-radio input[type="radio"] { accent-color: #e74c3c; width: 15px; height: 15px; }
        .ap-custom-input {
          width: 70px;
          padding: 6px 10px;
          border: 1px solid var(--surface-border);
          border-radius: 6px;
          font-size: 13px;
          margin-left: auto;
          background: var(--surface-solid);
          color: var(--text-heading);
        }
        .ap-custom-input:focus { outline: none; border-color: #e74c3c; box-shadow: 0 0 0 3px rgba(231,76,60,0.1); }

        /* Footer */
        .ap-sidebar-foot {
          padding: 18px 22px;
          border-top: 1px solid var(--surface-border);
          background: var(--surface);
        }
        .ap-sidebar-error {
          color: #e74c3c;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 10px;
        }
        .ap-action-btn {
          width: 100%;
          background: #e74c3c;
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.25);
        }
        .ap-action-btn:hover {
          background: #d04437;
          box-shadow: 0 6px 20px rgba(231, 76, 60, 0.35);
        }
        .ap-action-disabled {
          background: #f1948a;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Spinner */
        @keyframes ap-spin-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        :global(.ap-spin) {
          animation: ap-spin-anim 1s linear infinite;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .ap-workspace { flex-direction: column; }
          .ap-sidebar { width: 100%; border-left: none; border-top: 1px solid var(--surface-border); }
          .ap-pages-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
        }
      `}</style>
    </>
  );
}
