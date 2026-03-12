'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { compressPDF, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('compress-pdf');

export default function CompressPDFPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (files) => { setFile(files[0]); setResult(null); };

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const blob = await compressPDF(file);
      const savings = Math.round((1 - blob.size / file.size) * 100);
      setResult({ blob, savings, size: blob.size });
      if (savings > 0) toast.success(`Compressed! Saved ${savings}% space.`);
      else toast.success('File optimized (already well-compressed).');
    } catch (e) {
      toast.error('Compression failed. Please try a different PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <FileUploader onFiles={handleFile} accept=".pdf" label="Drop your PDF to compress" />
      ) : !result ? (
        <>
          <div style={{ padding: '20px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <div>
                <p style={{ fontWeight: 600 }}>{file.name}</p>
                <p style={{ color: '#64748b', fontSize: 13 }}>Original size: {formatBytes(file.size)}</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: 12, border: '1.5px solid #e2e8f0', marginBottom: 24 }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>ℹ️ About Compression</p>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
              Our browser-based compression optimizes PDF structure and removes redundant data.
              For best results with image-heavy PDFs, compression typically achieves 10-40% reduction.
              Scanned documents or already-optimized PDFs may see smaller savings.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
              {processing ? '⏳ Compressing...' : '🗜️ Compress PDF'}
            </button>
            <button onClick={reset} className="btn-secondary">Change File</button>
          </div>

          {processing && (
            <div style={{ marginTop: 20 }}>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '60%' }} /></div>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Optimizing your PDF...</p>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{result.savings > 5 ? '🎉' : '✅'}</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>
            Compression Complete!
          </h2>
          
          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '28px 0', flexWrap: 'wrap' }}>
            {[
              ['Original', formatBytes(file.size), '#64748b'],
              ['Compressed', formatBytes(result.size), '#f97316'],
              ['Saved', `${result.savings > 0 ? result.savings : 0}%`, '#10b981'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ padding: '20px 32px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12 }}>
                <p style={{ fontSize: 24, fontWeight: 800, color }}>{val}</p>
                <p style={{ color: '#94a3b8', fontSize: 13 }}>{label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => downloadBlob(result.blob, `compressed_${file.name}`)} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
              ⬇️ Download Compressed PDF
            </button>
            <button onClick={reset} className="btn-secondary">Compress Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
