'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('excel-to-pdf');
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ExcelToPdfPage() {
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
      const res = await fetch(`${API_BASE}/api/convert/excel-to-pdf`, { method: 'POST', body: formData });
      setProgress(80);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Error ${res.status}`);
      const blob = await res.blob();
      setProgress(100);
      setResult(blob);
      toast.success('Converted to PDF!');
    } catch (e) {
      setError(e.message);
      toast.error('Conversion failed.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); setProgress(0); };

  return (
    <ToolLayout tool={tool}>
      {!result ? (
        !file ? (
          <FileUploader onFiles={f => setFile(f[0])} accept=".xls,.xlsx" label="Drop your Excel file here" description=".XLS and .XLSX files supported" />
        ) : (
          <>
            <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>📊</span>
              <div><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p></div>
              <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            {error && <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 14, marginBottom: 16 }}>⚠️ {error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
                {processing ? '⏳ Converting...' : '📄 Convert to PDF'}
              </button>
              <button onClick={reset} className="btn-secondary">Change File</button>
            </div>
            {processing && (<div style={{ marginTop: 20 }}><div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div>)}
          </>
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Conversion Complete!</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, file.name.replace(/\.xlsx?$/i, '.pdf'))} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download PDF</button>
            <button onClick={reset} className="btn-secondary">Convert Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
