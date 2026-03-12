'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('word-to-pdf');

// ============================================================
// BACKEND API ENDPOINT
// Set your backend URL here. The backend should accept:
// POST /api/convert/word-to-pdf
// FormData with field "file"
// Returns: PDF binary
// ============================================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function WordToPdfPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const process = async () => {
    if (!file) return;
    setProcessing(true); setError(''); setProgress(20);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(40);
      const res = await fetch(`${API_BASE}/api/convert/word-to-pdf`, {
        method: 'POST',
        body: formData,
      });

      setProgress(80);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error: ${res.status}`);
      }

      const blob = await res.blob();
      setProgress(100);
      setResult(blob);
      toast.success('Converted to PDF successfully!');
    } catch (e) {
      setError(e.message || 'Conversion failed. Please try again.');
      toast.error('Conversion failed.');
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); setProgress(0); };

  return (
    <ToolLayout tool={tool}>
      {!result ? (
        <>
          {!file ? (
            <>
              <FileUploader
                onFiles={f => setFile(f[0])}
                accept=".doc,.docx"
                label="Drop your Word document here"
                description=".DOC and .DOCX files supported"
              />
              <div style={{ marginTop: 24, padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>ℹ️</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#166534', marginBottom: 4 }}>Server-side conversion</p>
                  <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                    Word to PDF conversion runs on our secure server. Your file is deleted immediately after conversion.
                    The backend uses LibreOffice for high-quality, layout-accurate conversions.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>📝</span>
                <div>
                  <p style={{ fontWeight: 600 }}>{file.name}</p>
                  <p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p>
                </div>
                <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
              </div>

              {error && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
                  {processing ? '⏳ Converting...' : '📄 Convert to PDF'}
                </button>
                <button onClick={reset} className="btn-secondary">Change File</button>
              </div>

              {processing && (
                <div style={{ marginTop: 20 }}>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.5s' }} /></div>
                  <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Converting to PDF... {progress}%</p>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Conversion Complete!</h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>{file.name} → PDF ({formatBytes(result.size)})</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, file.name.replace(/\.docx?$/i, '.pdf'))} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
              ⬇️ Download PDF
            </button>
            <button onClick={reset} className="btn-secondary">Convert Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
