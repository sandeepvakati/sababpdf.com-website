'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { PDFDocument } from 'pdf-lib';
import { downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('unlock-pdf');

export default function UnlockPDFPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const process = async () => {
    if (!file) return;
    setProcessing(true); setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, {
        password: password || undefined,
        ignoreEncryption: !password,
      });
      const bytes = await pdf.save();
      setResult(new Blob([bytes], { type: 'application/pdf' }));
      toast.success('PDF unlocked successfully!');
    } catch (e) {
      setError('Incorrect password or file could not be unlocked.');
      toast.error('Unlock failed.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); setPassword(''); };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <FileUploader onFiles={f => setFile(f[0])} accept=".pdf" label="Drop password-protected PDF" description="We'll remove the password protection" />
      ) : !result ? (
        <>
          <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🔒</span>
            <div><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p></div>
          </div>

          <div style={{ maxWidth: 420, marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>PDF Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter the PDF password"
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'var(--font-plus-jakarta)' }}
            />
          </div>

          {error && <div style={{ padding: '12px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 14, marginBottom: 16 }}>⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
              {processing ? '⏳ Unlocking...' : '🔓 Unlock PDF'}
            </button>
            <button onClick={reset} className="btn-secondary">Change File</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔓</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>PDF Unlocked!</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, `unlocked_${file.name}`)} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download Unlocked PDF</button>
            <button onClick={reset} className="btn-secondary">Unlock Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
