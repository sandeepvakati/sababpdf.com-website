'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ToolLayout from '../../components/ToolLayout';
import FileUploader, { FileList } from '../../components/FileUploader';
import { mergePDFs, downloadBlob, formatBytes } from '../../lib/pdfUtils';
import { getToolById } from '../../lib/toolsList';

const tool = getToolById('merge-pdf');

export default function MergePDFPage() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
    setDone(false);
    setResultBlob(null);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const moveFile = (from, to) => {
    setFiles(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const process = async () => {
    if (files.length < 2) return toast.error('Add at least 2 PDF files to merge.');
    setProcessing(true);
    try {
      const blob = await mergePDFs(files);
      setResultBlob(blob);
      setDone(true);
      toast.success('PDFs merged successfully!');
    } catch (e) {
      toast.error('Failed to merge PDFs. Make sure files are valid PDFs.');
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    downloadBlob(resultBlob, 'merged.pdf');
    toast.success('Downloaded!');
  };

  const reset = () => { setFiles([]); setDone(false); setResultBlob(null); };

  return (
    <ToolLayout tool={tool}>
      {!done ? (
        <>
          <FileUploader
            onFiles={handleFiles}
            accept=".pdf"
            multiple
            label="Drop your PDF files here"
            description="or click to browse — add multiple PDFs"
          />

          {files.length > 0 && (
            <>
              {/* Instructions */}
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 20, marginBottom: 12 }}>
                Drag to reorder files. They'll be merged in this order.
              </p>

              {/* File list with drag handles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'white', border: '1.5px solid #e2e8f0',
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13, minWidth: 24 }}>{idx + 1}</span>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>{formatBytes(file.size)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {idx > 0 && (
                        <button onClick={() => moveFile(idx, idx - 1)} style={arrowBtn}>↑</button>
                      )}
                      {idx < files.length - 1 && (
                        <button onClick={() => moveFile(idx, idx + 1)} style={arrowBtn}>↓</button>
                      )}
                      <button onClick={() => removeFile(idx)} style={{ ...arrowBtn, background: '#fef2f2', color: '#dc2626' }}>×</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={process}
                  disabled={processing || files.length < 2}
                  className="btn-primary"
                  style={{ fontSize: 16, padding: '12px 32px' }}
                >
                  {processing ? '⏳ Merging PDFs...' : `🔗 Merge ${files.length} PDFs`}
                </button>
                <button onClick={reset} className="btn-secondary">Start Over</button>
              </div>

              {processing && (
                <div style={{ marginTop: 20 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '70%', animation: 'progressAnim 2s ease infinite' }} />
                  </div>
                  <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Merging your PDFs...</p>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Success State */
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, marginBottom: 12 }}>
            PDFs Merged Successfully!
          </h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>
            {files.length} files merged → {formatBytes(resultBlob?.size || 0)}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={download} className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
              ⬇️ Download Merged PDF
            </button>
            <button onClick={reset} className="btn-secondary">Merge More Files</button>
          </div>
        </div>
      )}

      {/* How it works */}
      <HowItWorks steps={[
        { icon: '📂', title: 'Upload Files', desc: 'Select or drag multiple PDF files' },
        { icon: '↕️', title: 'Reorder', desc: 'Drag files into the order you want' },
        { icon: '🔗', title: 'Merge', desc: 'Click merge and download your combined PDF' },
      ]} />

      <style>{`
        @keyframes progressAnim {
          0% { width: 20%; }
          50% { width: 80%; }
          100% { width: 95%; }
        }
      `}</style>
    </ToolLayout>
  );
}

const arrowBtn = {
  background: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: 7,
  width: 30,
  height: 30,
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#64748b',
  fontWeight: 600,
};

function HowItWorks({ steps }) {
  return (
    <div style={{ marginTop: 60, padding: '40px', background: '#f8fafc', borderRadius: 16, border: '1.5px solid #e2e8f0' }}>
      <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 18, marginBottom: 28, textAlign: 'center' }}>
        How It Works
      </h3>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ textAlign: 'center', maxWidth: 160 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{step.icon}</div>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{step.title}</p>
            <p style={{ color: '#64748b', fontSize: 13 }}>{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
