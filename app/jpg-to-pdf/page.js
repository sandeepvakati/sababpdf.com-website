'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { imagesToPDF, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('jpg-to-pdf');

export default function JpgToPdfPage() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
    setResult(null);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const process = async () => {
    if (!files.length) return;
    setProcessing(true);
    try {
      const blob = await imagesToPDF(files);
      setResult(blob);
      toast.success('Images converted to PDF!');
    } catch (e) {
      toast.error('Conversion failed. Make sure images are valid JPG/PNG files.');
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFiles([]); setResult(null); };

  return (
    <ToolLayout tool={tool}>
      {!result ? (
        <>
          <FileUploader
            onFiles={handleFiles}
            accept=".jpg,.jpeg,.png,.webp,.bmp"
            multiple
            label="Drop images here"
            description="JPG, PNG, WebP supported"
          />

          {files.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginTop: 20 }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{ position: 'relative', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', aspectRatio: '1' }}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => removeFile(idx)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '4px 6px' }}>
                      <p style={{ color: 'white', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
                  {processing ? '⏳ Converting...' : `🖼️ Convert ${files.length} Image${files.length > 1 ? 's' : ''} to PDF`}
                </button>
                <button onClick={reset} className="btn-secondary">Clear All</button>
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Conversion Complete!</h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>{files.length} image{files.length > 1 ? 's' : ''} → {formatBytes(result.size)}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => downloadBlob(result, 'images.pdf')} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>⬇️ Download PDF</button>
            <button onClick={reset} className="btn-secondary">Convert More</button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
