'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader from '../../components/FileUploader';
import { pdfToImages, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('pdf-to-jpg');

export default function PdfToJpgPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [images, setImages] = useState([]);
  const [quality, setQuality] = useState(2.0); // scale

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    toast.loading('Converting pages to images...', { id: 'convert' });
    try {
      const result = await pdfToImages(file, quality);
      setImages(result);
      toast.success(`Converted ${result.length} pages!`, { id: 'convert' });
    } catch (e) {
      toast.error('Conversion failed. Please try again.', { id: 'convert' });
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (images.length === 1) {
      downloadBlob(images[0].blob, images[0].name);
      return;
    }
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    images.forEach(img => zip.file(img.name, img.blob));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'pdf_images.zip');
    toast.success('Downloaded as ZIP!');
  };

  const reset = () => { setFile(null); setImages([]); };

  return (
    <ToolLayout tool={tool}>
      {images.length === 0 ? (
        <>
          {!file ? (
            <FileUploader onFiles={f => setFile(f[0])} accept=".pdf" label="Drop PDF to convert" />
          ) : (
            <>
              <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <div>
                  <p style={{ fontWeight: 600 }}>{file.name}</p>
                  <p style={{ color: '#64748b', fontSize: 13 }}>{formatBytes(file.size)}</p>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Image Quality</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { val: 1.0, label: 'Standard', desc: '72 DPI' },
                    { val: 2.0, label: 'High', desc: '144 DPI' },
                    { val: 3.0, label: 'Max', desc: '216 DPI' },
                  ].map(q => (
                    <button
                      key={q.val}
                      onClick={() => setQuality(q.val)}
                      style={{
                        flex: 1, padding: '14px', borderRadius: 10,
                        border: `2px solid ${quality === q.val ? '#f97316' : '#e2e8f0'}`,
                        background: quality === q.val ? '#fff7ed' : 'white',
                        cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{q.label}</p>
                      <p style={{ color: '#64748b', fontSize: 12 }}>{q.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={process} disabled={processing} className="btn-primary" style={{ fontSize: 16, padding: '12px 32px' }}>
                  {processing ? '⏳ Converting...' : '🖼️ Convert to JPG'}
                </button>
                <button onClick={reset} className="btn-secondary">Change File</button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 18 }}>{images.length} pages converted</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={downloadAll} className="btn-primary">⬇️ Download All {images.length > 1 ? '(ZIP)' : ''}</button>
              <button onClick={reset} className="btn-secondary">Convert Another</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {images.map((img, i) => {
              const url = URL.createObjectURL(img.blob);
              return (
                <div key={i} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={url} alt={`Page ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                  <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Page {i + 1}</span>
                    <button onClick={() => downloadBlob(img.blob, img.name)} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Download</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </ToolLayout>
  );
}
