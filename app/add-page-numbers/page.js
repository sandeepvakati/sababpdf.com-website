'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { addPageNumbers, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('add-page-numbers');
const POSITIONS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

export default function AddPageNumbersPage() {
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState('bottom-center');
  const [startFrom, setStartFrom] = useState(1);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [fontSize, setFontSize] = useState(11);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const blob = await addPageNumbers(file, { position, startFrom, prefix, suffix, fontSize });
      setResult(blob);
      toast.success('Page numbers added!');
    } catch {
      toast.error('Failed to add page numbers.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <FileUploader onFiles={f => setFile(f[0])} accept=".pdf" label="Drop PDF to add page numbers" />
      ) : !result ? (
        <>
          <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📄</span>
            <div><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p></div>
          </div>

          {/* Position grid */}
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Number Position</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24, maxWidth: 320 }}>
            {POSITIONS.map(pos => (
              <button
                key={pos}
                onClick={() => setPosition(pos)}
                style={{
                  padding: '10px 4px', borderRadius: 8, fontSize: 11,
                  border: `2px solid ${position === pos ? '#f97316' : '#e2e8f0'}`,
                  background: position === pos ? '#fff7ed' : 'white',
                  cursor: 'pointer', fontWeight: 600, color: position === pos ? '#f97316' : '#64748b',
                  textTransform: 'capitalize',
                }}
              >
                {pos.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>Start From</label>
              <input type="number" value={startFrom} onChange={e => setStartFrom(Number(e.target.value))} min="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prefix (e.g. "Page ")</label>
              <input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder='Page ' style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Suffix (e.g. " of 10")</label>
              <input value={suffix} onChange={e => setSuffix(e.target.value)} placeholder=' of N' style={inputStyle} />
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 20px', marginBottom: 24 }}>
            <p style={{ color: '#64748b', fontSize: 13 }}>Preview: <strong style={{ color: '#0f172a' }}>{prefix}{startFrom}{suffix}</strong>, {prefix}{startFrom + 1}{suffix}, {prefix}{startFrom + 2}{suffix}...</p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
              {processing ? '⏳ Adding...' : '🔢 Add Page Numbers'}
            </button>
            <button onClick={reset} className="btn-secondary">Change File</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Page Numbers Added!</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, `numbered_${file.name}`)} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download</button>
            <button onClick={reset} className="btn-secondary">Add to Another PDF</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}

const labelStyle = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 };
const inputStyle = { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-plus-jakarta)' };
