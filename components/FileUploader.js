'use client';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatBytes, getPdfPreviewData } from '../lib/pdfUtils';

/**
 * FileUploader — iLovePDF-style upload component.
 * Uses react-dropzone for reliable drag-and-drop across all browsers.
 * Shows a big red CTA button as the primary action, with "or drop files here" below.
 */

// Map file extensions to MIME types for react-dropzone
const EXT_TO_MIME = {
  '.pdf': { 'application/pdf': ['.pdf'] },
  '.doc': { 'application/msword': ['.doc'] },
  '.docx': { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
  '.xls': { 'application/vnd.ms-excel': ['.xls'] },
  '.xlsx': { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
  '.csv': { 'text/csv': ['.csv'] },
  '.ods': { 'application/vnd.oasis.opendocument.spreadsheet': ['.ods'] },
  '.ppt': { 'application/vnd.ms-powerpoint': ['.ppt'] },
  '.pptx': { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
  '.html': { 'text/html': ['.html', '.htm'] },
  '.htm': { 'text/html': ['.html', '.htm'] },
  '.jpg': { 'image/jpeg': ['.jpg', '.jpeg'] },
  '.jpeg': { 'image/jpeg': ['.jpg', '.jpeg'] },
  '.jfif': { 'image/jpeg': ['.jpg', '.jpeg', '.jfif'] },
  '.png': { 'image/png': ['.png'] },
  '.webp': { 'image/webp': ['.webp'] },
  '.svg': { 'image/svg+xml': ['.svg'] },
};

function buildAcceptObj(acceptStr) {
  const merged = {};
  const exts = acceptStr.split(',').map(e => e.trim().toLowerCase());
  for (const ext of exts) {
    if (ext === '*') return undefined; // accept everything
    const mimeMap = EXT_TO_MIME[ext];
    if (mimeMap) {
      Object.assign(merged, mimeMap);
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

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
  capture = undefined,
  variant = 'default',
}) {
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
    if (capture) return 'Use Camera';
    return `Select ${fileTypeLabel} file${multiple ? 's' : ''}`;
  })();

  const dropText = (() => {
    if (capture) return 'or drop image files here';
    if (accept.includes('.doc')) return 'or drop Word documents here';
    if (accept.includes('.ppt')) return 'or drop POWERPOINT slideshows here';
    if (accept.includes('.xls')) return 'or drop Excel files here';
    if (accept.includes('.html')) return 'or drop HTML files here';
    if (accept.includes('.svg')) return 'or drop SVG files here';
    if (accept.includes('.jpg') || accept.includes('.png')) return 'or drop images here';
    return multiple ? 'or drop PDF files here' : 'or drop PDF here';
  })();

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    if (rejectedFiles && rejectedFiles.length > 0) {
      const first = rejectedFiles[0];
      const code = first.errors?.[0]?.code;
      if (code === 'too-many-files') {
        setError(multiple ? 'Please add fewer files in one drop.' : 'Please add only one file at a time.');
      } else if (code === 'file-too-large') {
        setError(`${first.file.name} exceeds ${maxSizeMB}MB limit.`);
      } else if (code === 'file-invalid-type') {
        const ext = '.' + (first.file.name || '').split('.').pop().toLowerCase();
        if (ext === '.pdf' && accept.includes('.doc')) {
          setError(`You're trying to convert a PDF to Word. Please use the PDF to Word tool instead! Click "All Tools" → "PDF to Word" under "Convert from PDF" section.`);
        } else {
          setError(`Invalid file type: ${first.file.name}. Accepted: ${accept}`);
        }
      } else {
        setError(`Could not add ${first.file.name}. Please try again.`);
      }
      return;
    }
    if (acceptedFiles.length > 0) {
      onFiles(multiple ? acceptedFiles : [acceptedFiles[0]]);
    }
  }, [accept, maxSizeMB, multiple, onFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: buildAcceptObj(accept),
    multiple,
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles: multiple ? 0 : 1,
    noClick: false,
    noKeyboard: false,
  });
  const inputProps = capture ? getInputProps({ capture }) : getInputProps();

  return (
    <div className="ilp-uploader-wrapper">
      <div
        {...getRootProps()}
        className={`ilp-uploader ilp-uploader-${variant}${isDragActive ? ' ilp-uploader-dragging' : ''}`}
      >
        <input {...inputProps} />

        {/* Big Red CTA Button */}
        <div className="ilp-cta-button">
          {isDragActive ? `Drop ${fileTypeLabel} file here` : buttonText}
        </div>

        {/* Drop text */}
        <p className="ilp-drop-text">
          {isDragActive ? 'Release to upload your file' : dropText}
        </p>

        {/* File info */}
        {multiple && currentCount > 0 && (
          <p className="ilp-added-count">
            {currentCount} file{currentCount === 1 ? '' : 's'} already added
          </p>
        )}
      </div>

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
  previewPosition = null, // e.g. 'bottom-right', 'top-left', 'middle-center'
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
            {previewPosition ? (
              <span className={`preview-page-dot preview-page-dot-${previewPosition}`} aria-hidden="true" />
            ) : null}
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
