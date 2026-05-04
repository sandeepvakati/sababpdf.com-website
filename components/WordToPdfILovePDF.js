'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle, AlertCircle, Loader2, Download, RotateCcw, FileText } from 'lucide-react';

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function WordToPdfILovePDF() {
  const [file,          setFile]          = useState(null);
  const [step,          setStep]          = useState('upload');   // upload | converting | result | error
  const [progress,      setProgress]      = useState(0);
  const [statusMsg,     setStatusMsg]     = useState('');
  const [error,         setError]         = useState(null);
  const [resultBlob,    setResultBlob]    = useState(null);
  const [errorIsConfig, setErrorIsConfig] = useState(false);     // true = LibreOffice not installed

  // ── Drop zone ─────────────────────────────────────────────────────
  const onDrop = useCallback((accepted, rejected) => {
    setError(null);
    if (rejected.length) {
      const code = rejected[0]?.errors?.[0]?.code;
      if (code === 'file-invalid-type') setError('Please upload a .doc or .docx Word file.');
      else if (code === 'file-too-large') setError('File exceeds 50 MB limit.');
      else setError('Could not read that file. Please try again.');
      return;
    }
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  // ── Convert ───────────────────────────────────────────────────────
  const handleConvert = () => {
    if (!file) return;
    setStep('converting');
    setProgress(10);
    setStatusMsg('Uploading document…');
    setError(null);
    setErrorIsConfig(false);

    const startTime = Date.now();
    const formData  = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setProgress(10 + Math.round((e.loaded / e.total) * 30));
        setStatusMsg('Uploading document…');
      }
    });

    // Fake conversion progress while waiting for server
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 4000)       { setProgress(45); setStatusMsg('Converting to PDF…'); }
      else if (elapsed < 10000) { setProgress(65); setStatusMsg('Formatting document…'); }
      else if (elapsed < 20000) { setProgress(82); setStatusMsg('Finalizing PDF…'); }
      else                      { setProgress(92); setStatusMsg('Almost done…'); }
    }, 800);

    xhr.addEventListener('load', () => {
      clearInterval(interval);
      setProgress(100);
      setStatusMsg('Done!');

      if (xhr.status === 200) {
        const blob = new Blob([xhr.response], { type: 'application/pdf' });
        setResultBlob(blob);
        setStep('result');
      } else {
        // Parse JSON error
        const reader = new FileReader();
        reader.onload = () => {
          let msg = 'Conversion failed. Please try again.';
          let isConfig = false;
          try {
            const data = JSON.parse(reader.result);
            msg = data.error || msg;
            isConfig = xhr.status === 503 || msg.toLowerCase().includes('libreoffice');
          } catch { /* use default */ }
          setError(msg);
          setErrorIsConfig(isConfig);
          setStep('error');
        };
        reader.readAsText(xhr.response);
      }
    });

    xhr.addEventListener('error', () => {
      clearInterval(interval);
      setError('Network error. Please check your connection and try again.');
      setStep('error');
    });

    xhr.addEventListener('timeout', () => {
      clearInterval(interval);
      setError('Conversion is taking too long. Please try with a smaller document.');
      setStep('error');
    });

    xhr.open('POST', '/api/convert/word-to-pdf');
    xhr.responseType = 'blob';
    xhr.timeout = 5 * 60 * 1000;
    xhr.send(formData);
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url  = URL.createObjectURL(resultBlob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = file.name.replace(/\.(doc|docx)$/i, '') + '-converted.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const reset = () => {
    setFile(null); setStep('upload'); setProgress(0);
    setStatusMsg(''); setError(null); setResultBlob(null);
    setErrorIsConfig(false);
  };

  // ── RESULT ────────────────────────────────────────────────────────
  if (step === 'result') {
    return (
      <>
        <style>{css}</style>
        <div className="wp-center">
          <div className="wp-result-card">
            <CheckCircle size={60} color="#27ae60" />
            <h3 className="wp-result-title">Converted Successfully!</h3>
            <p className="wp-result-desc">Your PDF is ready to download.</p>
            <button className="wp-btn wp-primary wp-big" onClick={handleDownload}>
              <Download size={20} /> Download PDF File
            </button>
            <button className="wp-btn wp-outline" onClick={reset}>
              <RotateCcw size={16} /> Convert another file
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <>
        <style>{css}</style>
        <div className="wp-center">
          <div className="wp-result-card">
            <AlertCircle size={56} color="#e74c3c" />
            <h3 className="wp-result-title" style={{ color: '#e74c3c' }}>Conversion Failed</h3>
            <p className="wp-error-msg">{error}</p>
            {errorIsConfig && (
              <div className="wp-install-hint">
                <strong>🛠 How to fix:</strong> Download &amp; install{' '}
                <a href="https://www.libreoffice.org/download/" target="_blank" rel="noopener noreferrer">
                  LibreOffice (free)
                </a>{' '}
                on this server, then restart <code>npm run dev</code>.
              </div>
            )}
            <button className="wp-btn wp-primary" onClick={reset}>
              <RotateCcw size={16} /> Try again
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── CONVERTING ────────────────────────────────────────────────────
  if (step === 'converting') {
    return (
      <>
        <style>{css}</style>
        <div className="wp-center">
          <div className="wp-converting-card">
            <Loader2 size={52} className="wp-spin" color="#e74c3c" />
            <p className="wp-converting-label">{statusMsg || 'Converting…'}</p>
            <div className="wp-progress-bar">
              <div className="wp-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="wp-progress-pct">{progress}%</p>
          </div>
        </div>
      </>
    );
  }

  // ── UPLOAD ────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="wp-center">
        {/* Drop zone */}
        {!file ? (
          <div
            {...getRootProps()}
            className={`wp-dropzone${isDragActive ? ' wp-drag-active' : ''}`}
          >
            <input {...getInputProps()} />
            <button type="button" className="wp-btn wp-primary wp-big">
              Select WORD file
            </button>
            <p className="wp-drop-text">
              or <span className="wp-drop-link">drop Word document here</span>
            </p>
            <p className="wp-drop-hint">Free to use · Max 50 MB · .doc &amp; .docx</p>
          </div>
        ) : (
          /* File selected panel */
          <div className="wp-file-panel">
            <div className="wp-file-card">
              <div className="wp-file-icon">
                <FileText size={44} color="white" />
              </div>
              <div className="wp-file-details">
                <p className="wp-file-name">{file.name}</p>
                <p className="wp-file-size">{formatBytes(file.size)}</p>
                <span className="wp-file-ready">✓ Ready to convert</span>
              </div>
              <button className="wp-remove-btn" onClick={reset} title="Remove file">✕</button>
            </div>

            <button className="wp-btn wp-primary wp-big wp-convert-btn" onClick={handleConvert}>
              <FileText size={20} /> Convert to PDF
            </button>
            <p className="wp-convert-hint">⚡ Most documents convert in 5–15 seconds</p>
          </div>
        )}

        {error && (
          <p className="wp-error-inline"><AlertCircle size={15} /> {error}</p>
        )}
      </div>
    </>
  );
}

const css = `
* { box-sizing: border-box; }

.wp-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 380px; padding: 40px 20px; gap: 20px; }

/* Buttons */
.wp-btn { border: none; border-radius: 10px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; font-family: inherit; }
.wp-primary { background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; box-shadow: 0 4px 16px rgba(231,76,60,.3); }
.wp-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(231,76,60,.4); }
.wp-outline { background: #fff; color: #374151; border: 1.5px solid #d1d5db; }
.wp-outline:hover { border-color: #e74c3c; color: #e74c3c; }
.wp-big { padding: 18px 56px; font-size: 1.15rem; border-radius: 12px; }

/* Drop zone */
.wp-dropzone { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 48px 60px; cursor: pointer; border-radius: 16px; transition: background 0.2s; }
.wp-drag-active { background: rgba(231,76,60,0.06); }
.wp-drop-text { font-size: 0.95rem; color: #6b7280; margin: 0; }
.wp-drop-link { color: #e74c3c; text-decoration: underline; text-underline-offset: 2px; }
.wp-drop-hint { font-size: 0.82rem; color: #9ca3af; margin: 0; }

/* File panel */
.wp-file-panel { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; max-width: 560px; }
.wp-file-card { display: flex; align-items: center; gap: 20px; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 20px 24px; width: 100%; }
.wp-file-icon { width: 72px; height: 90px; background: linear-gradient(135deg,#e74c3c,#f97316); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(231,76,60,.22); }
.wp-file-details { flex: 1; min-width: 0; }
.wp-file-name { font-size: 1rem; font-weight: 600; color: #1a1a2e; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wp-file-size { font-size: 0.85rem; color: #6b7280; margin: 0 0 6px; }
.wp-file-ready { font-size: 0.82rem; font-weight: 700; color: #27ae60; background: #f0fdf4; padding: 3px 10px; border-radius: 20px; border: 1px solid #bbf7d0; }
.wp-remove-btn { background: #fef2f2; border: none; color: #e74c3c; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s; }
.wp-remove-btn:hover { background: #fee2e2; }
.wp-convert-btn { width: 100%; max-width: 380px; padding: 18px; border-radius: 12px; }
.wp-convert-hint { font-size: 0.87rem; color: #6b7280; margin: 0; }

/* Converting */
.wp-converting-card { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.wp-spin { animation: wpSpin 1s linear infinite; }
@keyframes wpSpin { 100% { transform: rotate(360deg); } }
.wp-converting-label { font-size: 1.05rem; font-weight: 600; color: #374151; margin: 0; }
.wp-progress-bar { width: 320px; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
.wp-progress-fill { height: 100%; background: linear-gradient(90deg,#e74c3c,#f97316); border-radius: 4px; transition: width 0.4s ease; }
.wp-progress-pct { font-size: 0.88rem; color: #9ca3af; margin: 0; font-weight: 600; }

/* Result card */
.wp-result-card { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
.wp-result-title { font-size: 1.8rem; font-weight: 800; color: #1a1a2e; margin: 0; }
.wp-result-desc  { font-size: 1rem; color: #6b7280; margin: 0; }

/* Error */
.wp-error-msg { font-size: 0.95rem; color: #374151; max-width: 420px; text-align: center; margin: 0; line-height: 1.6; }
.wp-install-hint { background: #fef9c3; border: 1px solid #fde047; border-radius: 10px; padding: 14px 18px; font-size: 0.87rem; color: #713f12; max-width: 440px; text-align: left; line-height: 1.6; }
.wp-install-hint a { color: #e74c3c; font-weight: 700; }
.wp-install-hint code { background: #fff; padding: 1px 5px; border-radius: 4px; font-size: 0.83rem; }
.wp-error-inline { display: inline-flex; align-items: center; gap: 6px; color: #dc2626; font-size: 0.9rem; margin: 0; }
`;
