'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { reorderPages, getPDFPageCount, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('reorder-pages');

export default function ReorderPagesPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState([]); // array of original 0-based indices
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (files) => {
    const f = files[0];
    setFile(f); setResult(null);
    const count = await getPDFPageCount(f);
    setPageCount(count);
    setOrder(Array.from({ length: count }, (_, i) => i));
    toast.success(`PDF loaded — ${count} pages`);
  };

  const moveUp = (i) => {
    if (i === 0) return;
    setOrder(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  };
  const moveDown = (i) => {
    if (i === order.length - 1) return;
    setOrder(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
  };

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const blob = await reorderPages(file, order);
      setResult(blob);
      toast.success('Pages reordered!');
    } catch { toast.error('Failed to reorder pages.'); }
    finally { setProcessing(false); }
  };

  const reset = () => { setFile(null); setOrder([]); setResult(null); };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <FileUploader onFiles={handleFile} accept=".pdf" label="Drop PDF to reorder pages" />
      ) : !result ? (
        <>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
            Use the arrows to reorder pages. Page numbers show original position.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {order.map((origIdx, pos) => (
              <div key={pos} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px',
              }}>
                <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13, minWidth: 24 }}>{pos + 1}</span>
                <span style={{ fontSize: 20 }}>📄</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Page {origIdx + 1}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => moveUp(pos)} disabled={pos === 0} style={btnStyle}>↑</button>
                  <button onClick={() => moveDown(pos)} disabled={pos === order.length - 1} style={btnStyle}>↓</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
              {processing ? '⏳ Reordering...' : '↕️ Apply New Order'}
            </button>
            <button onClick={() => setOrder(Array.from({ length: pageCount }, (_, i) => i))} className="btn-secondary">Reset Order</button>
            <button onClick={reset} className="btn-secondary">Change File</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Pages Reordered!</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, `reordered_${file.name}`)} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download PDF</button>
            <button onClick={reset} className="btn-secondary">Reorder Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}

const btnStyle = {
  background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 7, width: 30, height: 30,
  cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#64748b',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
