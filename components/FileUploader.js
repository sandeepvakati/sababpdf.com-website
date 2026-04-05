'use client';
import { useCallback, useEffect, useState } from 'react';
import { formatBytes, getPdfPreviewData } from '../lib/pdfUtils';

/**
 * FileUploader — iLovePDF-style upload component.
 * Shows a big red CTA button as the primary action, with "or drop files here" below.
 */
export default function FileUploader({
  onFiles,
  accept = '.pdf',
  multiple = false,
  label = 'Drop your PDF here',
  description = 'or click to browse files',
  maxSizeMB = 50,
  currentCount = 0,
  showUploadHint = false,
  uploadHintText = 'Add files here',
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  // Build the file type label for the button
  const fileTypeLabel = (() => {
    const ext = accept.split(',')[0]?.replace('.', '').toUpperCase() || 'PDF';
    if (accept.includes('.pdf')) return 'PDF';
    if (accept.includes('.doc')) return 'WORD';
    if (accept.includes('.ppt')) return 'POWERPOINT';
    if (accept.includes('.xls')) return 'EXCEL';
    if (accept.includes('.html')) return 'HTML';
    if (accept.includes('.jpg') || accept.includes('.png')) return 'IMAGE';
    if (accept.includes('.svg')) return 'SVG';
    return ext;
  })();

  const buttonText = (() => {
    if (multiple && currentCount > 0) return 'Add More Files';
    return `Select ${fileTypeLabel} file${multiple ? 's' : ''}`;
  })();

  const dropText = (() => {
    if (accept.includes('.doc')) return 'or drop Word documents here';
    if (accept.includes('.ppt')) return 'or drop POWERPOINT slideshows here';
    if (accept.includes('.xls')) return 'or drop Excel files here';
    if (accept.includes('.html')) return 'or drop HTML files here';
    if (accept.includes('.svg')) return 'or drop SVG files here';
    if (accept.includes('.jpg') || accept.includes('.png')) return 'or drop images here';
    return 'or drop PDF files here';
  })();

  const validate = useCallback((files) => {
    setError('');
    const filtered = [];
    for (const file of Array.from(files)) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const acceptExts = accept.split(',').map((a) => a.trim().toLowerCase());
      if (!acceptExts.includes(ext) && !acceptExts.includes('*')) {
        if (ext === '.pdf' && acceptExts.includes('.doc')) {
          setError(`You're trying to convert a PDF to Word. Please use the PDF to Word tool instead! Click "All Tools" → "PDF to Word" under "Convert from PDF" section.`);
        } else {
          setError(`Invalid file type: ${file.name}. Accepted: ${accept}`);
        }
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`${file.name} exceeds ${maxSizeMB}MB limit.`);
        continue;
      }
      filtered.push(file);
    }
    if (filtered.length) {
      onFiles(multiple ? filtered : [filtered[0]]);
    }
  }, [accept, maxSizeMB, multiple, onFiles]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    validate(e.dataTransfer.files);
  }, [validate]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onInputChange = (e) => {
    if (e.target.files?.length) validate(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="ilp-uploader-wrapper">
      <label
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`ilp-uploader${dragging ? ' ilp-uploader-dragging' : ''}`}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onInputChange}
          style={{ display: 'none' }}
        />

        {/* Big Red CTA Button */}
        <div className="ilp-cta-button">
          {buttonText}
        </div>

        {/* Drop text */}
        <p className="ilp-drop-text">{dropText}</p>

        {/* File info */}
        {multiple && currentCount > 0 && (
          <p className="ilp-added-count">
            {currentCount} file{currentCount === 1 ? '' : 's'} already added
          </p>
        )}
      </label>

      {error && (
        <div className="ilp-uploader-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export function FileList({ files, onRemove, previewMode = 'list' }) {
  const [previewState, setPreviewState] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviews() {
      if (previewMode !== 'pdf-grid' || !files.length) {
        setPreviewState([]);
        return;
      }

      const results = await Promise.all(
        files.map(async (file) => {
          try {
            const preview = await getPdfPreviewData(file);
            return {
              status: 'ready',
              ...preview,
            };
          } catch {
            return {
              status: 'error',
              previewUrl: '',
              pageCount: null,
            };
          }
        }),
      );

      if (!cancelled) {
        setPreviewState(results);
      }
    }

    loadPreviews();

    return () => {
      cancelled = true;
    };
  }, [files, previewMode]);

  if (previewMode === 'pdf-grid') {
    return (
      <div className="file-preview-section">
        <div className="file-preview-header">
          <div>
            <strong>{files.length} PDF{files.length === 1 ? '' : 's'} added</strong>
            <p>Review the merge order below. The first PDF preview shows the first page of each file.</p>
          </div>
        </div>

        <div className="file-preview-grid">
          {files.map((file, idx) => {
            const preview = previewState[idx];

            return (
              <article key={`${file.name}-${file.size}-${file.lastModified}-${idx}`} className="file-preview-card">
                <div className="file-preview-order">#{idx + 1}</div>
                <div className="file-preview-thumb">
                  {preview?.status === 'ready' && preview.previewUrl ? (
                    <img src={preview.previewUrl} alt={`${file.name} preview`} className="file-preview-image" />
                  ) : (
                    <div className="file-preview-placeholder">PDF</div>
                  )}
                </div>
                <div className="file-preview-copy">
                  <p className="file-preview-name">{file.name}</p>
                  <p className="file-preview-meta">
                    {formatBytes(file.size)}
                    {preview?.pageCount ? ` · ${preview.pageCount} page${preview.pageCount === 1 ? '' : 's'}` : ''}
                  </p>
                </div>
                <div className="file-preview-actions">
                  <span className="file-item-badge">Ready</span>
                  {onRemove ? (
                    <button type="button" onClick={() => onRemove(idx)} className="file-item-remove">
                      ×
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="file-list">
      {files.map((file, idx) => (
        <div key={idx} className="file-item">
          <span className="file-item-icon" aria-hidden="true">📄</span>
          <div className="file-item-copy">
            <p className="file-item-name">
              {file.name}
            </p>
            <p className="file-item-meta">{formatBytes(file.size)}</p>
          </div>
          <span className="file-item-badge">Ready</span>
          {onRemove && (
            <button type="button" onClick={() => onRemove(idx)} className="file-item-remove">
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function SinglePdfPreviewCard({
  file,
  pageCount,
  status = 'Ready',
  title = 'PDF ready',
  description = 'Review this file before continuing.',
  actionLabel,
  onAction,
  onRemove,
  previewRotation = 0,
}) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!file) {
        setPreview(null);
        return;
      }

      try {
        const nextPreview = await getPdfPreviewData(file, 220);
        if (!cancelled) {
          setPreview(nextPreview);
        }
      } catch {
        if (!cancelled) {
          setPreview({
            previewUrl: '',
            pageCount: pageCount || null,
          });
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [file, pageCount]);

  if (!file) {
    return null;
  }

  const resolvedPageCount = pageCount || preview?.pageCount;
  const previewTransform = `rotate(${previewRotation}deg) scale(${Math.abs(previewRotation % 180) === 90 ? 0.8 : 1})`;

  return (
    <section className="single-pdf-preview-section">
      <div className="single-pdf-preview-header">
        <div>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
      </div>

      <article className="single-pdf-preview-card">
        <div className="single-pdf-preview-thumb">
          {preview?.previewUrl ? (
            <img
              src={preview.previewUrl}
              alt={`${file.name} preview`}
              className="single-pdf-preview-image"
              style={{ transform: previewTransform }}
            />
          ) : (
            <div className="single-pdf-preview-placeholder" style={{ transform: previewTransform }}>PDF</div>
          )}
        </div>

        <div className="single-pdf-preview-copy">
          <p className="single-pdf-preview-name">{file.name}</p>
          <p className="single-pdf-preview-meta">
            {formatBytes(file.size)}
            {resolvedPageCount ? ` · ${resolvedPageCount} page${resolvedPageCount === 1 ? '' : 's'}` : ''}
          </p>
          <div className="single-pdf-preview-actions">
            <span className="file-item-badge">{status}</span>
            {actionLabel && onAction ? (
              <button type="button" className="secondary-button" onClick={onAction}>
                {actionLabel}
              </button>
            ) : null}
            {onRemove ? (
              <button type="button" onClick={onRemove} className="file-item-remove">
                ×
              </button>
            ) : null}
          </div>
        </div>
      </article>
    </section>
  );
}
