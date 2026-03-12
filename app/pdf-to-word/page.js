'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('pdf-to-word');
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function PdfToWordPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const process = async () => {
    if (!file) return;
    setProcessing(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/convert/pdf-to-word`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error ${res.status}`);
      setResult(await res.blob());
      toast.success('Converted to Word!');
    } catch (e) { setError(e.message); toast.error('Conversion failed.'); }
    finally { setProcessing(false); }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); };

  return (
    <ToolLayout tool={tool}>
      {!result ? (
        !file ? (
          <FileUploader onFiles={f => setFile(f[0])} accept=".pdf" label="Drop PDF to convert to Word" description="Converts to editable .DOCX format" />
        ) : (
          <>
            <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <div><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p></div>
              <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            {error && <div style={{ padding: '12px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 14, marginBottom: 16 }}>⚠️ {error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
                {processing ? '⏳ Converting...' : '📝 Convert to Word'}
              </button>
              <button onClick={reset} className="btn-secondary">Change File</button>
            </div>
          </>
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Converted to Word!</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, file.name.replace('.pdf', '.docx'))} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download DOCX</button>
            <button onClick={reset} className="btn-secondary">Convert Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
