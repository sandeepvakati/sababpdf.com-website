'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * UnifiedDropzone – iLovePDF-style file upload dropzone component.
 * Matches the design from image 3: big red "Select PDF file" button
 * with "or drop PDF here" text underneath.
 *
 * Props:
 * - onFiles: (files: File[]) => void
 * - accept: string (e.g. '.pdf')
 * - multiple: boolean
 * - label: string (button text, e.g. "Select PDF file")
 * - description: string (subtitle text)
 * - maxSize: number (in bytes, default 100MB)
 * - accentColor: string (default '#e74c3c')
 */
export default function UnifiedDropzone({
  onFiles,
  accept = '.pdf',
  multiple = false,
  label = 'Select PDF file',
  description = 'Reduce file size while optimizing for maximal PDF quality.',
  maxSize = 100 * 1024 * 1024,
  accentColor = '#e74c3c',
}) {
  const [error, setError] = useState(null);

  // Convert accept string to the object format react-dropzone needs
  const acceptObj = {};
  const exts = accept.split(',').map(e => e.trim());
  exts.forEach(ext => {
    if (ext === '.pdf') acceptObj['application/pdf'] = ['.pdf'];
    else if (ext === '.doc' || ext === '.docx') {
      acceptObj['application/msword'] = ['.doc'];
      acceptObj['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = ['.docx'];
    }
    else if (ext === '.xls' || ext === '.xlsx') {
      acceptObj['application/vnd.ms-excel'] = ['.xls'];
      acceptObj['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = ['.xlsx'];
    }
    else if (ext === '.ppt' || ext === '.pptx') {
      acceptObj['application/vnd.ms-powerpoint'] = ['.ppt'];
      acceptObj['application/vnd.openxmlformats-officedocument.presentationml.presentation'] = ['.pptx'];
    }
    else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
      acceptObj['image/*'] = ['.jpg', '.jpeg', '.png', '.webp'];
    }
    else if (ext === '.svg') {
      acceptObj['image/svg+xml'] = ['.svg'];
    }
    else if (ext === '.html' || ext === '.htm') {
      acceptObj['text/html'] = ['.html', '.htm'];
    }
  });

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError('Invalid file type or file too large. Please try again.');
      return;
    }
    if (acceptedFiles.length > 0) {
      onFiles(acceptedFiles);
    }
  }, [onFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.keys(acceptObj).length > 0 ? acceptObj : undefined,
    multiple,
    maxSize,
  });

  return (
    <div className="unified-dropzone-wrapper">
      <div
        {...getRootProps()}
        className={`unified-dropzone ${isDragActive ? 'drag-active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="unified-dropzone-content">
          <button
            className="unified-select-button"
            type="button"
            style={{
              background: accentColor,
            }}
          >
            {isDragActive ? 'Drop file here' : label}
          </button>
          <p className="unified-drop-hint">
            {isDragActive ? 'Release to upload your file' : 'or drop PDF here'}
          </p>
        </div>
      </div>

      {error && (
        <div className="unified-dropzone-error">
          <span>⚠</span> {error}
        </div>
      )}

      <style jsx>{`
        .unified-dropzone-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .unified-dropzone {
          border: none;
          padding: 60px 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: transparent;
          position: relative;
        }

        .unified-dropzone.drag-active {
          background: rgba(231, 76, 60, 0.04);
          border-radius: 16px;
        }

        .unified-dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .unified-select-button {
          color: white;
          border: none;
          padding: 18px 56px;
          border-radius: 8px;
          font-size: 1.15rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 14px rgba(231, 76, 60, 0.3);
          position: relative;
        }

        .unified-select-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(231, 76, 60, 0.4);
          filter: brightness(1.05);
        }

        .unified-select-button:active {
          transform: translateY(0);
        }

        .unified-drop-hint {
          font-size: 0.95rem;
          color: #2980b9;
          margin: 0;
          font-weight: 400;
        }

        .unified-dropzone-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .unified-dropzone {
            padding: 40px 20px;
          }
          .unified-select-button {
            padding: 16px 40px;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
