'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { rotatePDF, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('rotate-pdf');

export default function RotatePDFPage() {
  const [file, setFile] = useState(null);
  const [rotation, setRotation] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const blob = await rotatePDF(file, rotation);
      setResult(blob);
      toast.success(`PDF rotated ${rotation}° successfully!`);
    } catch {
      toast.error('Failed to rotate PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <FileUploader onFiles={f => { setFile(f[0]); setResult(null); }} accept=".pdf" label="Drop PDF to rotate" />
      ) : !result ? (
        <>
          <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📄</span>
            <div>
              <p style={{ fontWeight: 600 }}>{file.name}</p>
              <p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p>
            </div>
          </div>

          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Select rotation angle:</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            {[
              { deg: 90, label: '90° Right', icon: '↻' },
              { deg: 180, label: '180° Flip', icon: '↕' },
              { deg: 270, label: '90° Left', icon: '↺' },
            ].map(r => (
              <button
                key={r.deg}
                onClick={() => setRotation(r.deg)}
                style={{
                  flex: 1, minWidth: 120, padding: '20px 16px', borderRadius: 12,
                  border: `2px solid ${rotation === r.deg ? '#f97316' : '#e2e8f0'}`,
                  background: rotation === r.deg ? '#fff7ed' : 'white',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{r.icon}</div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</p>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
              {processing ? '⏳ Rotating...' : `🔄 Rotate ${rotation}°`}
            </button>
            <button onClick={reset} className="btn-secondary">Change File</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>PDF Rotated!</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, `rotated_${file.name}`)} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download</button>
            <button onClick={reset} className="btn-secondary">Rotate Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
