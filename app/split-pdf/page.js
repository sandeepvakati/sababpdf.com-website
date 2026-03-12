'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { splitPDFAllPages, splitPDF, getPDFPageCount, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('split-pdf');

export default function SplitPDFPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState('all'); // 'all' | 'range' | 'custom'
  const [rangeInput, setRangeInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState([]);

  const handleFile = async (files) => {
    const f = files[0];
    setFile(f);
    setDone(false);
    setResults([]);
    try {
      const count = await getPDFPageCount(f);
      setPageCount(count);
      toast.success(`PDF loaded — ${count} pages`);
    } catch {
      toast.error('Could not read PDF. Make sure it is a valid file.');
    }
  };

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      let blobs = [];
      if (mode === 'all') {
        blobs = await splitPDFAllPages(file);
      } else if (mode === 'range' || mode === 'custom') {
        // Parse range like "1-3, 4-6, 7" into arrays of page numbers
        const parts = rangeInput.split(',').map(s => s.trim()).filter(Boolean);
        const ranges = parts.map(part => {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
          }
          return [Number(part)];
        });
        const resultBlobs = await splitPDF(file, ranges);
        blobs = resultBlobs.map((blob, i) => ({ blob, name: `split_part_${i + 1}.pdf` }));
      }
      setResults(blobs);
      setDone(true);
      toast.success(`Split into ${blobs.length} file${blobs.length > 1 ? 's' : ''}!`);
    } catch (e) {
      toast.error('Failed to split PDF. Please try again.');
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (results.length === 1) {
      downloadBlob(results[0].blob, results[0].name);
      return;
    }
    // Download as ZIP
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      results.forEach(r => zip.file(r.name, r.blob));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'split_pages.zip');
      toast.success('Downloaded as ZIP!');
    } catch {
      // Fallback: download individually
      results.forEach(r => downloadBlob(r.blob, r.name));
    }
  };

  const reset = () => { setFile(null); setPageCount(0); setDone(false); setResults([]); setRangeInput(''); };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <FileUploader onFiles={handleFile} accept=".pdf" label="Drop your PDF here" description="Select a PDF to split" />
      ) : !done ? (
        <>
          {/* File info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 28 }}>
            <span style={{ fontSize: 28 }}>📄</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{file.name}</p>
              <p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)} · {pageCount} pages</p>
            </div>
            <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>

          {/* Mode selection */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>How do you want to split?</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: '📄 Split All Pages', desc: `Extract all ${pageCount} pages into separate files` },
                { id: 'range', label: '📑 By Range', desc: 'e.g. "1-3, 4-6" → 2 files' },
                { id: 'custom', label: '🎯 Custom Pages', desc: 'e.g. "1, 3, 5" → 3 single-page files' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    flex: 1, minWidth: 200, padding: '16px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${mode === m.id ? '#f97316' : '#e2e8f0'}`,
                    background: mode === m.id ? '#fff7ed' : 'white',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</p>
                  <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {(mode === 'range' || mode === 'custom') && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                {mode === 'range' ? 'Enter page ranges (e.g. "1-3, 4-6, 7-10")' : 'Enter page numbers (e.g. "1, 3, 5, 7")'}
              </label>
              <input
                value={rangeInput}
                onChange={e => setRangeInput(e.target.value)}
                placeholder={mode === 'range' ? '1-3, 4-6' : '1, 3, 5'}
                style={{
                  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
                  padding: '12px 16px', fontSize: 15, outline: 'none',
                  fontFamily: 'var(--font-plus-jakarta)',
                }}
              />
              <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
                Pages available: 1 to {pageCount}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
              {processing ? '⏳ Splitting...' : '✂️ Split PDF'}
            </button>
            <button onClick={reset} className="btn-secondary">Change File</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>
            Split Successfully!
          </h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>Created {results.length} PDF file{results.length > 1 ? 's' : ''}</p>

          {results.length <= 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10 }}>
                  <span>📄</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, textAlign: 'left' }}>{r.name}</span>
                  <button onClick={() => downloadBlob(r.blob, r.name)} style={{ color: '#f97316', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Download</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={downloadAll} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
              ⬇️ Download All {results.length > 1 ? '(ZIP)' : ''}
            </button>
            <button onClick={reset} className="btn-secondary">Split Another PDF</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
