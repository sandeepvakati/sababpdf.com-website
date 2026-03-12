'use client';
import { useCallback, useState } from 'react';
import { formatBytes } from '../lib/pdfUtils';

export default function FileUploader({
  onFiles,
  accept = '.pdf',
  multiple = false,
  label = 'Drop your PDF here',
  description = 'or click to browse files',
  maxSizeMB = 50,
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const validate = (files) => {
    setError('');
    const filtered = [];
    for (const file of Array.from(files)) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const acceptExts = accept.split(',').map(a => a.trim().toLowerCase());
      if (!acceptExts.includes(ext) && !acceptExts.includes('*')) {
        setError(`Invalid file type: ${file.name}. Accepted: ${accept}`);
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`${file.name} exceeds ${maxSizeMB}MB limit.`);
        continue;
      }
      filtered.push(file);
    }
    if (filtered.length) onFiles(multiple ? filtered : [filtered[0]]);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    validate(e.dataTransfer.files);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onInputChange = (e) => {
    if (e.target.files?.length) validate(e.target.files);
  };

  return (
    <div>
      <label
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '60px 40px',
          border: `2.5px dashed ${dragging ? '#f97316' : '#e2e8f0'}`,
          borderRadius: 16,
          background: dragging ? '#fff7ed' : '#fafbfc',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onInputChange}
          style={{ display: 'none' }}
        />

        {/* Upload Icon */}
        <div style={{
          width: 72, height: 72, background: dragging ? '#fff7ed' : '#f1f5f9',
          borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, transition: 'all 0.2s',
          border: `2px solid ${dragging ? '#f97316' : '#e2e8f0'}`,
        }}>
          {dragging ? '📂' : '📁'}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 6, fontFamily: 'var(--font-syne)' }}>
            {label}
          </p>
          <p style={{ color: '#64748b', fontSize: 14 }}>{description}</p>
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>
            Max {maxSizeMB}MB · {accept.toUpperCase().replace(/\./g, '').replace(/,/g, ', ')}
          </p>
        </div>

        <div style={{
          background: '#f97316',
          color: 'white',
          padding: '10px 28px',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 15,
          display: 'inline-block',
          marginTop: 4,
        }}>
          Select File{multiple ? 's' : ''}
        </div>
      </label>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export function FileList({ files, onRemove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
      {files.map((file, idx) => (
        <div key={idx} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'white', border: '1.5px solid #e2e8f0',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>{formatBytes(file.size)}</p>
          </div>
          {onRemove && (
            <button onClick={() => onRemove(idx)} style={{
              background: '#fef2f2', border: 'none', color: '#dc2626',
              width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
            }}>×</button>
          )}
        </div>
      ))}
    </div>
  );
}
