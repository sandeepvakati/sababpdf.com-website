'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('html-to-pdf');
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function HtmlToPdfPage() {
  const [mode, setMode] = useState('file'); // 'file' | 'url'
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const processFile = async () => {
    if (!file) return;
    setProcessing(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/convert/html-to-pdf`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setResult(await res.blob());
      toast.success('Converted to PDF!');
    } catch (e) { setError(e.message); toast.error('Conversion failed.'); }
    finally { setProcessing(false); }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); setUrl(''); };

  return (
    <ToolLayout tool={tool}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[['file', '📄 HTML File'], ['url', '🌐 Web URL']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
            border: `2px solid ${mode === m ? '#f97316' : '#e2e8f0'}`,
            background: mode === m ? '#fff7ed' : 'white', color: mode === m ? '#f97316' : '#64748b',
          }}>{label}</button>
        ))}
      </div>

      {!result ? (
        mode === 'file' ? (
          !file ? (
            <FileUploader onFiles={f => setFile(f[0])} accept=".html,.htm" label="Drop HTML file here" description=".HTML and .HTM files" />
          ) : (
            <>
              <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>🌐</span>
                <div><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p></div>
              </div>
              {error && <div style={{ padding: '12px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 14, marginBottom: 16 }}>⚠️ {error}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={processFile} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
                  {processing ? '⏳ Converting...' : '📄 Convert to PDF'}
                </button>
                <button onClick={reset} className="btn-secondary">Change File</button>
              </div>
            </>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 24px', background: '#f8fafc', borderRadius: 16, border: '1.5px solid #e2e8f0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🚧</p>
            <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>URL Conversion Coming Soon</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>URL-to-PDF requires a headless browser. For now, please save the webpage as an HTML file and upload it.</p>
          </div>
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Converted!</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, 'webpage.pdf')} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download PDF</button>
            <button onClick={reset} className="btn-secondary">Convert Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
