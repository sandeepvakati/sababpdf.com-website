'use client';
import { useState, useRef, useCallback } from 'react';

export default function PdfToJpgILovePDF() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]); // { pageNumber, dataUrl, blob }
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((f) => {
    setFile(f);
    setImages([]);
    setProgress(0);
    setError(null);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type === 'application/pdf') handleFile(f);
  }, [handleFile]);

  const onFileInput = useCallback((e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  }, [handleFile]);

  const convert = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setImages([]);
    setProgress(5);
    setError(null);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const total = pdf.numPages;
      const results = [];
      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
        results.push({ pageNumber: i, dataUrl, blob });
        setProgress(Math.round((i / total) * 100));
        page.cleanup();
      }
      if (typeof pdf.destroy === 'function') await pdf.destroy();
      setImages(results);
    } catch (err) {
      setError(err.message || 'Conversion failed. Please try another PDF file.');
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const downloadOne = useCallback((img) => {
    const url = URL.createObjectURL(img.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(file?.name || 'page').replace(/\.[^.]+$/, '')}_page_${img.pageNumber}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [file]);

  const downloadAll = useCallback(async () => {
    if (images.length === 1) { downloadOne(images[0]); return; }
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const base = (file?.name || 'pages').replace(/\.[^.]+$/, '');
    images.forEach(img => zip.file(`${base}_page_${img.pageNumber}.jpg`, img.blob));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}-images.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [images, file, downloadOne]);

  const reset = useCallback(() => {
    setFile(null); setImages([]); setProgress(0); setError(null);
  }, []);

  /* ═══ RESULTS ═══ */
  if (images.length > 0) {
    return (
      <div className="ptj-root">
        <div className="ptj-done-bar">
          <span className="ptj-done-icon">✅</span>
          <div>
            <strong>{images.length} image{images.length > 1 ? 's' : ''} extracted</strong>
            <p>Click any image to download it, or download all at once.</p>
          </div>
        </div>

        <div className="ptj-actions-top">
          <button className="ptj-btn ptj-primary" onClick={downloadAll}>
            ⬇ Download {images.length === 1 ? 'Image' : `All ${images.length} Images`}
          </button>
          <button className="ptj-btn ptj-outline" onClick={reset}>↻ Convert Another PDF</button>
        </div>

        <div className="ptj-grid">
          {images.map(img => (
            <div key={img.pageNumber} className="ptj-img-card" onClick={() => downloadOne(img)}>
              <div className="ptj-img-wrap">
                <img src={img.dataUrl} alt={`Page ${img.pageNumber}`} />
                <div className="ptj-img-overlay">
                  <span>⬇ Download</span>
                </div>
              </div>
              <div className="ptj-img-footer">
                <span>Page {img.pageNumber}</span>
                <button className="ptj-dl-btn" onClick={e => { e.stopPropagation(); downloadOne(img); }}>⬇</button>
              </div>
            </div>
          ))}
        </div>
        <style jsx>{css}</style>
      </div>
    );
  }

  /* ═══ UPLOAD / PROCESSING ═══ */
  return (
    <div className="ptj-root">

      {!file && (
        <div className="ptj-dropzone" onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
          <button className="ptj-btn ptj-primary" type="button">Select PDF file</button>
          <p className="ptj-drop-hint">or drop PDF here</p>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={onFileInput} style={{ display: 'none' }} />
        </div>
      )}

      {file && !processing && images.length === 0 && (
        <div className="ptj-file-ready">
          <div className="ptj-file-info">
            <span className="ptj-file-icon">📄</span>
            <div>
              <strong>{file.name}</strong>
              <p>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button className="ptj-remove" onClick={reset}>✕</button>
          </div>
          <button className="ptj-btn ptj-primary ptj-btn-big" onClick={convert}>
            Convert to JPG
          </button>
        </div>
      )}

      {processing && (
        <div className="ptj-processing">
          <div className="ptj-progress-bar"><div className="ptj-progress-fill" style={{ width: `${progress}%` }} /></div>
          <p>Converting page images… {progress}%</p>
        </div>
      )}

      {error && (
        <div className="ptj-error-box">⚠ {error}</div>
      )}

      <style jsx>{css}</style>
    </div>
  );
}

const css = `
.ptj-root{display:flex;flex-direction:column;gap:20px;width:100%}

/* Dropzone */
.ptj-dropzone{text-align:center;padding:60px 20px;cursor:pointer;transition:background .2s;border-radius:12px}
.ptj-dropzone:hover{background:rgba(231,76,60,.03)}
.ptj-drop-hint{color:var(--text-soft,#6b7280);margin:12px 0 0;font-size:.95rem}

/* Buttons */
.ptj-btn{border:none;border-radius:10px;padding:14px 34px;font-size:1rem;font-weight:700;cursor:pointer;transition:all .25s;display:inline-flex;align-items:center;gap:8px;line-height:1.2}
.ptj-primary{background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;box-shadow:0 4px 16px rgba(231,76,60,.35)}
.ptj-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(231,76,60,.45)}
.ptj-outline{background:var(--surface-solid,#fff);color:var(--text-heading,#1a1a2e);border:1.5px solid var(--surface-border,#d1d5db)}
.ptj-outline:hover{border-color:#e74c3c;color:#e74c3c}
.ptj-btn-big{width:100%;justify-content:center;padding:18px;font-size:1.1rem;border-radius:12px}

/* File ready */
.ptj-file-ready{display:flex;flex-direction:column;gap:16px;align-items:center}
.ptj-file-info{display:flex;align-items:center;gap:14px;padding:16px 20px;background:var(--surface-solid,#fff);border:1px solid var(--surface-border,#e5e7eb);border-radius:12px;width:100%;max-width:500px}
.ptj-file-icon{font-size:2rem}
.ptj-file-info div{flex:1;min-width:0}
.ptj-file-info strong{display:block;font-size:.95rem;color:var(--text-heading,#1a1a2e);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ptj-file-info p{margin:2px 0 0;font-size:.82rem;color:var(--text-soft,#6b7280)}
.ptj-remove{width:32px;height:32px;border-radius:50%;border:none;background:rgba(220,38,38,.1);color:#dc2626;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;transition:background .2s}
.ptj-remove:hover{background:rgba(220,38,38,.2)}

/* Processing */
.ptj-processing{text-align:center;padding:20px}
.ptj-processing p{margin:12px 0 0;color:var(--text-soft,#6b7280);font-size:.95rem}
.ptj-progress-bar{height:8px;border-radius:8px;background:var(--surface-border,#e5e7eb);overflow:hidden}
.ptj-progress-fill{height:100%;border-radius:8px;background:linear-gradient(90deg,#e74c3c,#f97316);transition:width .3s ease}

/* Error */
.ptj-error-box{padding:14px 18px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);border-radius:12px;color:#f87171;font-size:.92rem;text-align:center}

/* Done bar */
.ptj-done-bar{display:flex;align-items:center;gap:14px;padding:16px 20px;background:var(--surface-solid,#fff);border:1px solid var(--surface-border,#e5e7eb);border-radius:14px}
.ptj-done-icon{font-size:2rem}
.ptj-done-bar strong{font-size:1.05rem;color:var(--text-heading,#1a1a2e)}
.ptj-done-bar p{margin:2px 0 0;font-size:.88rem;color:var(--text-soft,#6b7280)}

/* Top actions */
.ptj-actions-top{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

/* Image grid */
.ptj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.ptj-img-card{border-radius:14px;overflow:hidden;border:2px solid var(--surface-border,#e5e7eb);background:var(--surface-solid,#fff);cursor:pointer;transition:all .25s;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.ptj-img-card:hover{border-color:#e74c3c;transform:translateY(-3px);box-shadow:0 8px 24px rgba(231,76,60,.15)}
.ptj-img-wrap{position:relative;aspect-ratio:3/4;overflow:hidden;background:#f0f0f0}
.ptj-img-wrap img{width:100%;height:100%;object-fit:contain;display:block}
.ptj-img-overlay{position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s}
.ptj-img-card:hover .ptj-img-overlay{opacity:1}
.ptj-img-overlay span{color:#fff;font-weight:700;font-size:1rem;padding:10px 24px;background:rgba(231,76,60,.85);border-radius:10px}
.ptj-img-footer{display:flex;align-items:center;justify-content:space-between;padding:10px 14px}
.ptj-img-footer span{font-size:.88rem;font-weight:600;color:var(--text-heading,#1a1a2e)}
.ptj-dl-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid var(--surface-border,#d1d5db);background:transparent;color:var(--text-heading,#1a1a2e);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem;transition:all .2s}
.ptj-dl-btn:hover{border-color:#e74c3c;color:#e74c3c;background:rgba(231,76,60,.05)}

@media(max-width:640px){
  .ptj-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
  .ptj-btn{padding:12px 22px;font-size:.92rem}
  .ptj-btn-big{padding:16px;font-size:1rem}
}
`;
