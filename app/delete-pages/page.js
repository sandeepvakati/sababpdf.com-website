'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { deletePages, getPDFPageCount, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('delete-pages');

export default function DeletePagesPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (files) => {
    const f = files[0];
    setFile(f); setSelected(new Set()); setResult(null);
    const count = await getPDFPageCount(f);
    setPageCount(count);
  };

  const togglePage = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const process = async () => {
    if (!file || !selected.size) return toast.error('Select at least one page to delete.');
    if (selected.size >= pageCount) return toast.error('Cannot delete all pages.');
    setProcessing(true);
    try {
      const blob = await deletePages(file, Array.from(selected));
      setResult(blob);
      toast.success(`Deleted ${selected.size} page${selected.size > 1 ? 's' : ''}!`);
    } catch {
      toast.error('Failed to delete pages.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setPageCount(0); setSelected(new Set()); setResult(null); };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <FileUploader onFiles={handleFile} accept=".pdf" label="Drop PDF to delete pages" />
      ) : !result ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontWeight: 600 }}>{file.name}</p>
              <p style={{ color: '#64748b', fontSize: 13 }}>{pageCount} pages · Click pages to mark for deletion</p>
            </div>
            {selected.size > 0 && (
              <div style={{ padding: '6px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                🗑️ {selected.size} page{selected.size > 1 ? 's' : ''} selected for deletion
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, marginBottom: 28 }}>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => togglePage(i)}
                style={{
                  padding: '14px 8px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${selected.has(i) ? '#ef4444' : '#e2e8f0'}`,
                  background: selected.has(i) ? '#fef2f2' : 'white',
                  transition: 'all 0.15s', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{selected.has(i) ? '🗑️' : '📄'}</div>
                <p style={{ fontSize: 11, fontWeight: 600, color: selected.has(i) ? '#ef4444' : '#64748b' }}>Page {i + 1}</p>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={process}
              disabled={processing || !selected.size}
              className="btn-primary"
              style={{ background: selected.size ? '#ef4444' : undefined, fontSize: 16, padding: '12px 32px' }}
            >
              {processing ? '⏳ Deleting...' : `🗑️ Delete ${selected.size || 0} Page${selected.size !== 1 ? 's' : ''}`}
            </button>
            <button onClick={() => setSelected(new Set())} className="btn-secondary">Clear Selection</button>
            <button onClick={reset} className="btn-secondary">Change File</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Pages Deleted!</h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>Removed {selected.size} pages · {pageCount - selected.size} pages remaining</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, `edited_${file.name}`)} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download PDF</button>
            <button onClick={reset} className="btn-secondary">Edit Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
