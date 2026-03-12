'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { addWatermark, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('watermark-pdf');

export default function WatermarkPDFPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.25);
  const [color, setColor] = useState('#808080');
  const [fontSize, setFontSize] = useState(60);
  const [rotation, setRotation] = useState(-45);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const process = async () => {
    if (!file || !text.trim()) return toast.error('Enter watermark text.');
    setProcessing(true);
    try {
      const blob = await addWatermark(file, { text, opacity, color, fontSize, rotation });
      setResult(blob);
      toast.success('Watermark added!');
    } catch {
      toast.error('Failed to add watermark.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <FileUploader onFiles={f => setFile(f[0])} accept=".pdf" label="Drop PDF to watermark" />
      ) : !result ? (
        <>
          <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📄</span>
            <div><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p></div>
          </div>

          {/* Watermark text preview */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <p style={{ color: '#e2e8f0', fontSize: 12, position: 'absolute', top: 8, left: 12 }}>Preview</p>
            <p style={{
              fontSize: Math.min(fontSize * 0.5, 48),
              color: color,
              opacity,
              transform: `rotate(${rotation}deg)`,
              fontWeight: 800,
              userSelect: 'none',
              letterSpacing: 4,
            }}>
              {text || 'WATERMARK'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>Watermark Text</label>
              <input value={text} onChange={e => setText(e.target.value)} style={inputStyle} placeholder="Enter text..." />
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ ...inputStyle, padding: 4, height: 42 }} />
            </div>
            <div>
              <label style={labelStyle}>Opacity: {Math.round(opacity * 100)}%</label>
              <input type="range" min="0.05" max="0.8" step="0.05" value={opacity} onChange={e => setOpacity(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Font Size: {fontSize}px</label>
              <input type="range" min="20" max="120" step="5" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Rotation: {rotation}°</label>
              <input type="range" min="-90" max="90" step="5" value={rotation} onChange={e => setRotation(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
              {processing ? '⏳ Adding Watermark...' : '💧 Add Watermark'}
            </button>
            <button onClick={reset} className="btn-secondary">Change File</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Watermark Added!</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => downloadBlob(result, `watermarked_${file.name}`)} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download</button>
            <button onClick={reset} className="btn-secondary">Watermark Another</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}

const labelStyle = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#374151' };
const inputStyle = { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-plus-jakarta)' };
