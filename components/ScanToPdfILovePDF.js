'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

export default function ScanToPdfILovePDF() {
  const [pages, setPages] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      // Wait for next tick so video element renders
      setTimeout(() => {
        const vid = videoRef.current;
        if (vid && stream.active) {
          vid.srcObject = stream;
          vid.onloadedmetadata = () => {
            vid.play().then(() => setCameraReady(true)).catch(() => {});
          };
        }
      }, 100);
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Allow camera permissions in your browser settings and try again.'
          : 'Could not access camera. Ensure it is connected and not in use by another app.'
      );
      setCameraActive(false);
    }
  }, [facingMode]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const page = { id: Date.now() + Math.random(), dataUrl, file, brightness: 100, contrast: 110, grayscale: 0 };
      setPages(prev => [...prev, page]);
      setSelectedPage(page.id);
    }, 'image/jpeg', 0.92);
  }, []);

  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(() => startCamera(), 200);
  }, [stopCamera, startCamera]);

  const handleFileUpload = useCallback(e => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const page = { id: Date.now() + Math.random(), dataUrl: ev.target.result, file, brightness: 100, contrast: 100, grayscale: 0 };
        setPages(prev => [...prev, page]);
        setSelectedPage(page.id);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, []);

  const updatePage = useCallback((id, key, value) => {
    setPages(prev => prev.map(p => (p.id === id ? { ...p, [key]: value } : p)));
  }, []);

  const removePage = useCallback(id => {
    setPages(prev => {
      const next = prev.filter(p => p.id !== id);
      if (selectedPage === id) setSelectedPage(next[0]?.id || null);
      return next;
    });
  }, [selectedPage]);

  const generatePdf = useCallback(async () => {
    if (!pages.length) return;
    setProcessing(true);
    try {
      const { imagesToPDF } = await import('../lib/pdfUtils');
      const processedFiles = await Promise.all(
        pages.map(page => new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth; c.height = img.naturalHeight;
            const ctx = c.getContext('2d');
            ctx.filter = `brightness(${page.brightness}%) contrast(${page.contrast}%) grayscale(${page.grayscale}%)`;
            ctx.drawImage(img, 0, 0);
            c.toBlob(blob => {
              if (!blob) { reject(new Error('Export failed')); return; }
              resolve(new File([blob], page.file.name, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.92);
          };
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = page.dataUrl;
        }))
      );
      const blob = await imagesToPDF(processedFiles);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert(err.message || 'Failed to generate PDF');
    } finally {
      setProcessing(false);
    }
  }, [pages]);

  const downloadPdf = useCallback(() => {
    if (!resultBlob) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `scanned-document-${Date.now()}.pdf`;
    a.click();
  }, [resultBlob, resultUrl]);

  const resetAll = useCallback(() => {
    stopCamera();
    setPages([]); setSelectedPage(null); setResultBlob(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }, [stopCamera, resultUrl]);

  const activePage = pages.find(p => p.id === selectedPage);

  /* ═══ RESULT ═══ */
  if (resultBlob) {
    return (
      <div className="stp-root">
        <div className="stp-result-card">
          <div className="stp-result-icon">✅</div>
          <h2>PDF Ready!</h2>
          <p className="stp-result-sub">Your scanned document ({pages.length} page{pages.length > 1 ? 's' : ''}) is ready.</p>
          <div className="stp-row-center">
            <button className="stp-btn stp-primary" onClick={downloadPdf}>⬇ Download PDF</button>
            <button className="stp-btn stp-outline" onClick={resetAll}>↻ Scan Again</button>
          </div>
        </div>
        <style jsx>{css}</style>
      </div>
    );
  }

  /* ═══ MAIN ═══ */
  return (
    <div className="stp-root">

      {/* CAMERA */}
      {cameraActive && (
        <div className="stp-camera-box">
          <div className="stp-video-container">
            <video ref={videoRef} className="stp-video" autoPlay playsInline muted />
            {!cameraReady && <div className="stp-video-loading">Connecting camera…</div>}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="stp-cam-bar">
            <button className="stp-cam-btn" onClick={flipCamera} title="Flip">🔄</button>
            <button className="stp-cam-btn stp-shutter-btn" onClick={capturePhoto} title="Capture"><span className="stp-shutter-dot" /></button>
            <button className="stp-cam-btn" onClick={stopCamera} title="Close">✕</button>
          </div>
        </div>
      )}

      {/* UPLOAD / OPEN CAMERA */}
      {!cameraActive && pages.length === 0 && (
        <div className="stp-landing">
          <div className="stp-landing-icon">📷</div>
          <h2>Scan or upload documents</h2>
          <p>Use your camera to scan documents, or upload existing images</p>
          <div className="stp-row-center">
            <button className="stp-btn stp-primary" onClick={startCamera}>📷 Open Camera</button>
            <button className="stp-btn stp-outline" onClick={() => fileInputRef.current?.click()}>📁 Upload Images</button>
          </div>
          {cameraError && <div className="stp-error-box">⚠ {cameraError}</div>}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>
      )}

      {/* ADD MORE BUTTONS (when pages exist but camera closed) */}
      {!cameraActive && pages.length > 0 && (
        <div className="stp-row-center" style={{ paddingTop: 8 }}>
          <button className="stp-btn stp-primary stp-btn-sm" onClick={startCamera}>📷 Add via Camera</button>
          <button className="stp-btn stp-outline stp-btn-sm" onClick={() => fileInputRef.current?.click()}>📁 Add Images</button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>
      )}

      {cameraError && pages.length > 0 && <div className="stp-error-box">⚠ {cameraError}</div>}

      {/* THUMBNAILS */}
      {pages.length > 0 && (
        <div className="stp-card">
          <h3 className="stp-card-title">Scanned Pages ({pages.length})</h3>
          <div className="stp-grid">
            {pages.map((page, idx) => (
              <div key={page.id} className={`stp-thumb${selectedPage === page.id ? ' active' : ''}`} onClick={() => setSelectedPage(page.id)}>
                <div className="stp-thumb-img-box">
                  <img src={page.dataUrl} alt={`Page ${idx + 1}`} style={{ filter: `brightness(${page.brightness}%) contrast(${page.contrast}%) grayscale(${page.grayscale}%)` }} />
                  <button className="stp-thumb-x" onClick={e => { e.stopPropagation(); removePage(page.id); }}>✕</button>
                </div>
                <span className="stp-thumb-num">Page {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ENHANCE */}
      {activePage && (
        <div className="stp-card">
          <h3 className="stp-card-title">Enhance – Page {pages.findIndex(p => p.id === activePage.id) + 1}</h3>
          <div className="stp-preview-box">
            <img src={activePage.dataUrl} alt="Preview" style={{ filter: `brightness(${activePage.brightness}%) contrast(${activePage.contrast}%) grayscale(${activePage.grayscale}%)` }} />
          </div>
          <div className="stp-sliders">
            {[
              ['☀️ Brightness', 'brightness', 50, 200],
              ['◐ Contrast', 'contrast', 50, 200],
              ['🖤 Grayscale', 'grayscale', 0, 100],
            ].map(([label, key, min, max]) => (
              <label key={key} className="stp-slider-row">
                <span className="stp-slider-label">{label}</span>
                <input type="range" min={min} max={max} value={activePage[key]} onChange={e => updatePage(activePage.id, key, +e.target.value)} />
                <span className="stp-slider-val">{activePage[key]}%</span>
              </label>
            ))}
          </div>
          <div className="stp-presets">
            {[
              ['Original', 100, 100, 0],
              ['B&W Scan', 110, 130, 100],
              ['Enhanced', 115, 120, 0],
              ['Document', 105, 115, 50],
            ].map(([name, b, c, g]) => (
              <button key={name} className="stp-preset-btn" onClick={() => { updatePage(activePage.id, 'brightness', b); updatePage(activePage.id, 'contrast', c); updatePage(activePage.id, 'grayscale', g); }}>{name}</button>
            ))}
          </div>
        </div>
      )}

      {/* GENERATE */}
      {pages.length > 0 && (
        <div className="stp-row-center" style={{ padding: '8px 0 16px' }}>
          <button className="stp-btn stp-primary stp-btn-big" onClick={generatePdf} disabled={processing}>
            {processing ? <><span className="stp-spin" /> Generating…</> : `📄 Create PDF (${pages.length} page${pages.length > 1 ? 's' : ''})`}
          </button>
        </div>
      )}

      <style jsx>{css}</style>
    </div>
  );
}

const css = `
.stp-root{display:flex;flex-direction:column;gap:20px;width:100%}

/* Landing */
.stp-landing{text-align:center;padding:48px 20px}
.stp-landing-icon{font-size:3.6rem;margin-bottom:10px}
.stp-landing h2{font-size:1.5rem;font-weight:800;margin:0 0 6px;color:var(--text-heading,#1a1a2e)}
.stp-landing p{color:var(--text-soft,#6b7280);margin:0 0 24px;font-size:1rem}

/* Rows */
.stp-row-center{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

/* Buttons */
.stp-btn{border:none;border-radius:10px;padding:14px 34px;font-size:1rem;font-weight:700;cursor:pointer;transition:all .25s;display:inline-flex;align-items:center;gap:8px;line-height:1.2}
.stp-primary{background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;box-shadow:0 4px 16px rgba(231,76,60,.35)}
.stp-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(231,76,60,.45)}
.stp-outline{background:var(--surface-solid,#fff);color:var(--text-heading,#1a1a2e);border:1.5px solid var(--surface-border,#d1d5db)}
.stp-outline:hover{border-color:#e74c3c;color:#e74c3c}
.stp-btn-sm{padding:10px 22px;font-size:.9rem}
.stp-btn-big{padding:18px 56px;font-size:1.15rem;border-radius:12px;min-width:280px;justify-content:center;background:linear-gradient(135deg,#e74c3c,#f97316);box-shadow:0 6px 24px rgba(231,76,60,.35)}
.stp-btn-big:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 12px 36px rgba(231,76,60,.5)}
.stp-btn-big:disabled{opacity:.65;cursor:not-allowed}

/* Camera */
.stp-camera-box{border-radius:16px;overflow:hidden;background:#111;box-shadow:0 4px 24px rgba(0,0,0,.25)}
.stp-video-container{position:relative;width:100%;aspect-ratio:16/10;background:#000}
.stp-video{width:100%;height:100%;object-fit:cover;display:block}
.stp-video-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1rem;background:rgba(0,0,0,.7)}
.stp-cam-bar{display:flex;justify-content:center;align-items:center;gap:24px;padding:16px;background:rgba(0,0,0,.6)}
.stp-cam-btn{width:52px;height:52px;border-radius:50%;border:none;background:rgba(255,255,255,.15);backdrop-filter:blur(6px);color:#fff;font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s}
.stp-cam-btn:hover{background:rgba(255,255,255,.3)}
.stp-shutter-btn{width:72px;height:72px;border:4px solid #fff;background:rgba(231,76,60,.65)}
.stp-shutter-btn:hover{background:rgba(231,76,60,.9)}
.stp-shutter-dot{display:block;width:28px;height:28px;border-radius:50%;background:#fff}

/* Error */
.stp-error-box{padding:12px 16px;background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.25);border-radius:10px;color:#f87171;font-size:.9rem;text-align:center}

/* Card */
.stp-card{background:var(--surface-solid,#fff);border:1px solid var(--surface-border,#e5e7eb);border-radius:16px;padding:20px 24px;box-shadow:0 2px 12px rgba(0,0,0,.04)}
.stp-card-title{margin:0 0 14px;font-size:1.1rem;font-weight:700;color:var(--text-heading,#1a1a2e)}

/* Thumbnail Grid */
.stp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:14px}
.stp-thumb{cursor:pointer;border-radius:12px;overflow:hidden;border:2.5px solid transparent;transition:all .2s;background:var(--surface,#f9fafb)}
.stp-thumb:hover{border-color:rgba(231,76,60,.3)}
.stp-thumb.active{border-color:#e74c3c;box-shadow:0 0 0 3px rgba(231,76,60,.18)}
.stp-thumb-img-box{position:relative;aspect-ratio:3/4;overflow:hidden;background:#1a1a2e}
.stp-thumb-img-box img{width:100%;height:100%;object-fit:cover;display:block}
.stp-thumb-x{position:absolute;top:5px;right:5px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(0,0,0,.6);color:#fff;font-size:.72rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
.stp-thumb:hover .stp-thumb-x{opacity:1}
.stp-thumb-num{display:block;text-align:center;padding:7px 4px;font-size:.8rem;font-weight:600;color:var(--text-soft,#6b7280)}

/* Enhance */
.stp-preview-box{border-radius:12px;overflow:hidden;background:var(--surface,#f0f0f0);max-height:380px;display:flex;justify-content:center;margin-bottom:20px}
.stp-preview-box img{max-width:100%;max-height:380px;object-fit:contain;display:block}
.stp-sliders{display:flex;flex-direction:column;gap:14px;margin-bottom:16px}
.stp-slider-row{display:grid;grid-template-columns:130px 1fr 52px;align-items:center;gap:12px;font-size:.9rem;font-weight:600;color:var(--text-heading,#333);cursor:pointer}
.stp-slider-label{white-space:nowrap}
.stp-slider-row input[type=range]{width:100%;accent-color:#e74c3c;height:6px;cursor:pointer}
.stp-slider-val{text-align:right;font-size:.82rem;color:var(--text-soft,#6b7280);font-variant-numeric:tabular-nums}
.stp-presets{display:flex;gap:8px;flex-wrap:wrap}
.stp-preset-btn{padding:8px 18px;border-radius:8px;border:1.5px solid var(--surface-border,#d1d5db);background:var(--surface,#f9fafb);color:var(--text-heading,#333);font-size:.84rem;font-weight:600;cursor:pointer;transition:all .2s}
.stp-preset-btn:hover{border-color:#e74c3c;color:#e74c3c;background:rgba(231,76,60,.06)}

/* Result */
.stp-result-card{text-align:center;padding:60px 24px;background:var(--surface-solid,#fff);border:1px solid var(--surface-border,#e5e7eb);border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,.06)}
.stp-result-icon{font-size:3.5rem;margin-bottom:10px}
.stp-result-card h2{font-size:1.8rem;font-weight:800;margin:0 0 8px;color:var(--text-heading,#1a1a2e)}
.stp-result-sub{color:var(--text-soft,#6b7280);margin:0 0 28px;font-size:1.05rem}

/* Spinner */
.stp-spin{display:inline-block;width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:stpspin .7s linear infinite}
@keyframes stpspin{to{transform:rotate(360deg)}}

/* Mobile */
@media(max-width:640px){
  .stp-slider-row{grid-template-columns:100px 1fr 44px;gap:8px}
  .stp-btn{padding:12px 22px;font-size:.92rem}
  .stp-btn-big{padding:16px 32px;font-size:1rem;min-width:unset;width:100%}
  .stp-camera-box{border-radius:12px}
  .stp-grid{grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:10px}
}
`;
