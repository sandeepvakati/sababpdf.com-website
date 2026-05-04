'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, X, Loader2, Download, Scissors } from 'lucide-react';
import {
  formatBytes,
  getPdfPagePreviews,
  getPdfPreviewData,
  extractPages as extractPagesUtil,
} from '../../lib/pdfUtils';
import { useRouter } from 'next/navigation';

function parseExtractPageList(input, pageCount) {
  if (!input.trim()) {
    return [];
  }

  const pages = new Set();

  input
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      if (token.includes('-')) {
        const [startRaw, endRaw] = token.split('-').map((part) => Number(part.trim()));

        if (!Number.isInteger(startRaw) || !Number.isInteger(endRaw) || startRaw < 1 || endRaw < startRaw) {
          throw new Error(`Invalid range "${token}".`);
        }

        for (let page = startRaw; page <= endRaw; page += 1) {
          if (pageCount && page > pageCount) {
            throw new Error(`Page ${page} is outside this file.`);
          }
          pages.add(page);
        }
        return;
      }

      const page = Number(token);
      if (!Number.isInteger(page) || page < 1) {
        throw new Error(`Invalid page "${token}".`);
      }
      if (pageCount && page > pageCount) {
        throw new Error(`Page ${page} is outside this file.`);
      }
      pages.add(page);
    });

  return Array.from(pages).sort((left, right) => left - right);
}

function formatExtractPageSequence(pages) {
  if (!pages.length) {
    return '';
  }

  const sorted = Array.from(new Set(pages)).sort((left, right) => left - right);
  const segments = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let index = 1; index <= sorted.length; index += 1) {
    const current = sorted[index];

    if (current === previous + 1) {
      previous = current;
      continue;
    }

    segments.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  return segments.join(', ');
}

export default function ExtractPages({ embedded = false }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [pageRange, setPageRange] = useState('');
  const [pagePreviewItems, setPagePreviewItems] = useState([]);
  const [pagePreviewLoading, setPagePreviewLoading] = useState(false);
  const [pagePreviewError, setPagePreviewError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleGoHome = () => {
    router.push('/');
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setError(null);
    setResult(null);

    if (rejectedFiles.length > 0) {
      const firstError = rejectedFiles[0]?.errors?.[0]?.code;
      if (firstError === 'too-many-files') {
        setError('Please upload one PDF file at a time.');
      } else {
        setError('Please upload a valid PDF file');
      }
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPageRange('');
    setPagePreviewItems([]);
    setPagePreviewError('');
    setProgress(0);

    try {
      const previewData = await getPdfPreviewData(selectedFile);
      setPreviewUrl(previewData.previewUrl);
      setPageCount(previewData.pageCount);
    } catch (err) {
      console.error('Preview error:', err);
      setPageCount(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
  });
  const handleOpenFileDialog = useCallback(() => {
    setError(null);
    open();
  }, [open]);
  const handleDropzoneKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenFileDialog();
    }
  }, [handleOpenFileDialog]);
  const handleSelectButtonClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    handleOpenFileDialog();
  }, [handleOpenFileDialog]);

  const handleExtract = async () => {
    if (!file || !pageRange.trim()) return;

    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      const extractedBlob = await extractPagesUtil(file, pageRange, (progress) => {
        setProgress(progress);
      });

      const url = URL.createObjectURL(extractedBlob);
      const downloadName = file.name.replace('.pdf', '') + '-extracted.pdf';

      setResult({ url, downloadName });
      setIsProcessing(false);
      setProgress(100);
    } catch (err) {
      setError(err.message || 'Failed to extract pages');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setPageCount(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setPageRange('');
    setPagePreviewItems([]);
    setPagePreviewError('');
    setPagePreviewLoading(false);
  };

  const pagePreviewConfig = useMemo(() => {
    if (!file || !pageCount) {
      return {
        title: 'Page preview',
        detail: 'Upload a PDF to preview its pages.',
        pageNumbers: [],
        selectedPages: [],
        warning: '',
      };
    }

    const basePreviewCount = Math.min(pageCount, 24);
    const basePreviewPages = Array.from({ length: basePreviewCount }, (_, index) => index + 1);

    if (!pageRange.trim()) {
      return {
        title: 'Page preview',
        detail:
          pageCount > basePreviewCount
            ? `Showing the first ${basePreviewCount} pages. Click pages to select them for extraction.`
            : 'Showing all pages. Click pages to select them for extraction.',
        pageNumbers: basePreviewPages,
        selectedPages: [],
        warning: '',
      };
    }

    try {
      const selectedPages = parseExtractPageList(pageRange, pageCount);
      const previewPages = [...basePreviewPages];

      selectedPages.forEach((pageNumber) => {
        if (!previewPages.includes(pageNumber) && previewPages.length < 36) {
          previewPages.push(pageNumber);
        }
      });

      return {
        title: 'Pages selected for extraction',
        detail: `${selectedPages.length} page${selectedPages.length === 1 ? '' : 's'} selected: ${formatExtractPageSequence(selectedPages)}.`,
        pageNumbers: previewPages,
        selectedPages,
        warning:
          selectedPages.length > previewPages.filter((pageNumber) => selectedPages.includes(pageNumber)).length
            ? 'Some selected pages are outside the preview limit but will still be extracted.'
            : '',
      };
    } catch (err) {
      return {
        title: 'Page preview',
        detail:
          pageCount > basePreviewCount
            ? `Showing the first ${basePreviewCount} pages until the page rule is valid.`
            : 'Showing all pages until the page rule is valid.',
        pageNumbers: basePreviewPages,
        selectedPages: [],
        warning: err.message || 'Enter a valid page rule to preview selected pages.',
      };
    }
  }, [file, pageCount, pageRange]);

  useEffect(() => {
    let cancelled = false;

    async function loadPagePreviews() {
      if (!file || !pagePreviewConfig.pageNumbers.length) {
        setPagePreviewItems([]);
        setPagePreviewLoading(false);
        setPagePreviewError('');
        return;
      }

      setPagePreviewLoading(true);
      setPagePreviewError('');

      try {
        const preview = await getPdfPagePreviews(file, pagePreviewConfig.pageNumbers, 132);
        if (!cancelled) {
          setPagePreviewItems(preview.pages);
        }
      } catch (err) {
        if (!cancelled) {
          setPagePreviewItems([]);
          setPagePreviewError(err.message || 'Could not load the page preview.');
        }
      } finally {
        if (!cancelled) {
          setPagePreviewLoading(false);
        }
      }
    }

    loadPagePreviews();

    return () => {
      cancelled = true;
    };
  }, [file, pagePreviewConfig.pageNumbers]);

  const toggleExtractPage = useCallback((pageNumber) => {
    setPageRange((current) => {
      let selectedPages = [];

      try {
        selectedPages = current.trim() ? parseExtractPageList(current, pageCount) : [];
      } catch {
        selectedPages = [];
      }

      const nextPages = new Set(selectedPages);
      if (nextPages.has(pageNumber)) {
        nextPages.delete(pageNumber);
      } else {
        nextPages.add(pageNumber);
      }

      return formatExtractPageSequence(Array.from(nextPages));
    });
  }, [pageCount]);

  // ===== Tool Card Internals (shared between embedded and standalone) =====
  const toolContent = (
    <>
      {!file ? (
        <motion.div
          {...getRootProps({
            onClick: handleOpenFileDialog,
            onKeyDown: handleDropzoneKeyDown,
            role: 'button',
            tabIndex: 0,
          })}
          className={`ilovepdf-dropzone ${isDragActive ? 'drag-active' : ''}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <button className="select-file-button" type="button" onClick={handleSelectButtonClick}>
              {isDragActive ? 'Drop PDF here' : 'Select PDF file'}
            </button>
            <p className="dropzone-description">{isDragActive ? 'Release to upload' : 'or drop PDF here'}</p>
          </div>
        </motion.div>
      ) : (
        <motion.div className="file-selected-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="file-info-header">
            <div className="file-preview-section">
              {previewUrl ? (
                <img src={previewUrl} alt="PDF preview" className="file-preview-image" />
              ) : (
                <div className="file-preview-placeholder">
                  <FileText size={40} />
                </div>
              )}
            </div>
            <div className="file-details">
              <h4 className="file-name">{file.name}</h4>
              <p className="file-size">{formatBytes(file.size)}</p>
              {pageCount && <p className="file-pages"><CheckCircle size={14} /> {pageCount} page{pageCount > 1 ? 's' : ''}</p>}
            </div>
            <button className="remove-file-button" onClick={handleReset} type="button">
              <X size={20} />
            </button>
          </div>

          <div className="extract-settings-section">
            <h4 className="section-title">Pages to Extract</h4>
            <div className="page-range-input">
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g., 1-3, 5, 7-9"
                className="page-range-field"
              />
              <p className="input-hint">
                Use commas to separate pages and hyphens for ranges. Example: 1-3, 5, 7-9
              </p>
            </div>
          </div>

          <section className="extract-preview-panel">
            <div className="extract-preview-header">
              <div>
                <strong>{pagePreviewConfig.title}</strong>
                <p>{pagePreviewConfig.detail}</p>
              </div>
            </div>

            {pagePreviewConfig.warning ? (
              <p className="extract-preview-warning">{pagePreviewConfig.warning}</p>
            ) : null}

            {pagePreviewLoading ? (
              <div className="extract-preview-state">
                <Loader2 className="spinner" size={18} />
                <p>Loading page previews...</p>
              </div>
            ) : pagePreviewError ? (
              <div className="extract-preview-state extract-preview-state-error">
                <p>{pagePreviewError}</p>
              </div>
            ) : (
              <div className="extract-preview-grid">
                {pagePreviewItems.map((page) => {
                  const isSelected = pagePreviewConfig.selectedPages.includes(page.pageNumber);

                  return (
                    <button
                      key={page.pageNumber}
                      type="button"
                      className={`extract-preview-card${isSelected ? ' extract-preview-card-selected' : ''}`}
                      onClick={() => toggleExtractPage(page.pageNumber)}
                      aria-pressed={isSelected}
                    >
                      <span className="extract-preview-status">
                        {isSelected ? 'Extract' : 'Skip'}
                      </span>
                      <span className="extract-preview-thumb">
                        <img
                          src={page.previewUrl}
                          alt={`Preview of page ${page.pageNumber}`}
                          className="extract-preview-image"
                        />
                      </span>
                      <span className="extract-preview-caption">Page {page.pageNumber}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <div className="convert-actions">
            {!result ? (
              <>
                <button
                  className="convert-button"
                  onClick={handleExtract}
                  disabled={isProcessing || !pageRange.trim()}
                  type="button"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="spinner" size={20} />
                      Extracting... {progress}%
                    </>
                  ) : (
                    <>
                      <Scissors size={20} />
                      Extract Pages
                    </>
                  )}
                </button>
                {!isProcessing && (
                  <p className="convert-hint">⚡ Fast extraction! Most PDFs process in seconds.</p>
                )}
              </>
            ) : (
              <div className="success-section">
                <div className="success-icon"><CheckCircle size={56} /></div>
                <h4>Extraction Successful!</h4>
                <p>Your extracted pages are ready for download</p>
                <a href={result.url} download={result.downloadName} className="download-button">
                  <Download size={20} />
                  Download PDF File
                </a>
                <button className="convert-another-button" onClick={handleReset} type="button">
                  Extract another file
                </button>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="progress-text">{progress < 100 ? 'Extracting pages...' : 'Complete!'}</p>
            </div>
          )}

          {error && (
            <div className="error-message-wrapper">
              <div className="error-message">
                <X size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </>
  );

  const toolStyles = (
    <style jsx global>{`
      .ilovepdf-container { min-height: 100vh; background: linear-gradient(135deg, var(--page-top) 0%, var(--page-bg) 48%, var(--page-bottom) 100%); }
      .ilovepdf-top-header { background: var(--surface-solid); border-bottom: 1px solid var(--surface-border); padding: 16px 30px; position: sticky; top: 0; z-index: 100; box-shadow: var(--card-shadow-soft); }
      .ilovepdf-header-content { max-width: 1400px; margin: 0 auto; }
      .ilovepdf-header-logo { display: flex; align-items: center; gap: 12px; background: transparent; border: none; cursor: pointer; padding: 8px 12px; margin: -8px -12px; border-radius: 10px; transition: all 0.2s ease; }
      .ilovepdf-header-logo:hover { background: var(--surface); transform: translateX(-4px); }
      .header-logo-image { width: 64px; height: 64px; object-fit: contain; }
      .header-brand-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-heading); }
      .header-brand-accent { color: #e74c3c; }
      .ilovepdf-hero { background: var(--surface-solid); padding: 50px 20px 40px; text-align: center; border-bottom: 1px solid var(--surface-border); }
      .ilovepdf-hero-content { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; }
      .ilovepdf-title { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 900; margin: 0; color: var(--text-heading); letter-spacing: -0.02em; }
      .ilovepdf-title .highlight { color: #e74c3c; }
      .ilovepdf-subtitle { font-size: clamp(1.1rem, 2vw, 1.4rem); color: var(--text-soft); margin: 16px 0 0; font-weight: 400; }
      .ilovepdf-tool-card { max-width: 900px; margin: 40px auto 40px; background: var(--surface-solid); border: 1px solid var(--surface-border); border-radius: 24px; box-shadow: var(--card-shadow-soft); padding: 40px; position: relative; z-index: 2; }
      .ilovepdf-dropzone { border: none; border-radius: 0; padding: 52px 24px 46px; text-align: center; cursor: pointer; transition: background 0.2s ease; background: transparent; position: relative; overflow: visible; }
      .ilovepdf-dropzone:hover, .ilovepdf-dropzone.drag-active { background: transparent; transform: none; box-shadow: none; }
      .dropzone-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; width: 100%; }
      .dropzone-description { font-size: 1.05rem; color: #3b82f6; margin: 0; }
      .select-file-button { min-width: min(460px, 100%); background: #ef312c; color: white; border: none; padding: 24px 56px; border-radius: 12px; font-size: 1.35rem; font-weight: 800; cursor: pointer; transition: all 0.24s ease; box-shadow: 0 10px 26px rgba(239, 49, 44, 0.28); display: inline-flex; align-items: center; justify-content: center; }
      .select-file-button:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(239, 49, 44, 0.36); background: #e92d28; }
      .ilovepdf-dropzone.drag-active .select-file-button { background: #3b82f6; box-shadow: 0 10px 26px rgba(59, 130, 246, 0.28); }
      .file-selected-panel { display: flex; flex-direction: column; gap: 32px; }
      .file-info-header { display: flex; align-items: center; gap: 20px; padding: 24px; background: var(--surface); border-radius: 16px; position: relative; }
      .file-preview-section { width: 100px; height: 140px; border-radius: 12px; overflow: hidden; background: var(--surface-border); flex-shrink: 0; }
      .file-preview-image { width: 100%; height: 100%; object-fit: cover; }
      .file-preview-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #adb5bd; }
      .file-details { flex: 1; min-width: 0; }
      .file-name { font-size: 1.1rem; font-weight: 700; color: var(--text-heading); margin: 0; word-break: break-word; }
      .file-size { font-size: 0.9rem; color: var(--text-soft); margin: 4px 0 0; }
      .file-pages { font-size: 0.85rem; color: #27ae60; margin: 4px 0 0; display: flex; align-items: center; gap: 6px; }
      .remove-file-button { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 8px; color: var(--text-soft); transition: all 0.2s; }
      .remove-file-button:hover { background: #fee; color: #e74c3c; }
      .extract-settings-section { display: grid; gap: 16px; }
      .section-title { font-size: 1.2rem; font-weight: 700; color: var(--text-heading); margin: 0; }
      .page-range-input { display: grid; gap: 8px; }
      .page-range-field { width: 100%; padding: 16px 20px; border: 2px solid var(--surface-border); border-radius: 12px; font-size: 1rem; transition: all 0.2s; box-sizing: border-box; background: var(--surface-solid); color: var(--text-main); }
      .page-range-field:focus { outline: none; border-color: #e74c3c; box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1); }
      .input-hint { font-size: 0.9rem; color: var(--text-soft); margin: 0; }
      .extract-preview-panel { display: grid; gap: 14px; padding: 18px; border-radius: 16px; border: 1px solid var(--surface-border); background: var(--surface-overlay); }
      .extract-preview-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .extract-preview-header strong { display: block; color: var(--text-heading); font-size: 1rem; }
      .extract-preview-header p { margin: 5px 0 0; color: var(--text-soft); line-height: 1.5; }
      .extract-preview-warning { margin: 0; color: #f59e0b; font-size: 0.88rem; }
      .extract-preview-state { display: flex; align-items: center; gap: 10px; color: var(--text-soft); }
      .extract-preview-state p { margin: 0; }
      .extract-preview-state-error { color: #fca5a5; }
      .extract-preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 148px)); gap: 12px; }
      .extract-preview-card { position: relative; display: grid; gap: 8px; padding: 10px; border: 1px solid var(--surface-border); border-radius: 12px; background: var(--surface-solid); color: var(--text-main); cursor: pointer; text-align: left; transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease; }
      .extract-preview-card:hover, .extract-preview-card:focus-visible { border-color: rgba(239, 49, 44, 0.38); box-shadow: 0 12px 28px rgba(239, 49, 44, 0.14); transform: translateY(-1px); outline: none; }
      .extract-preview-card-selected { border-color: rgba(239, 49, 44, 0.72); background: rgba(239, 49, 44, 0.08); box-shadow: 0 0 0 2px rgba(239, 49, 44, 0.12); }
      .extract-preview-status { position: absolute; top: 8px; left: 8px; z-index: 1; padding: 5px 8px; border-radius: 999px; background: rgba(15, 20, 29, 0.82); color: #fff; font-size: 0.7rem; font-weight: 800; }
      .extract-preview-card-selected .extract-preview-status { background: #ef312c; }
      .extract-preview-thumb { aspect-ratio: 0.72; overflow: hidden; border-radius: 10px; border: 1px solid #e2e8f0; background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%); }
      .extract-preview-image { width: 100%; height: 100%; object-fit: cover; display: block; }
      .extract-preview-caption { display: block; color: var(--text-main); font-size: 0.82rem; font-weight: 800; text-align: center; }
      html[data-theme='dark'] .extract-preview-panel,
      html[data-theme='dark'] .extract-preview-card { background: var(--surface-overlay); border-color: var(--surface-border); }
      html[data-theme='dark'] .extract-preview-card-selected { background: rgba(239, 49, 44, 0.13); border-color: rgba(248, 113, 113, 0.72); box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.16); }
      html[data-theme='dark'] .extract-preview-status { background: rgba(0, 0, 0, 0.72); }
      html[data-theme='dark'] .extract-preview-card-selected .extract-preview-status { background: #ef4444; }
      .convert-actions { display: grid; gap: 16px; }
      .convert-button { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; padding: 18px 48px; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3); display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
      .convert-button:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(231, 76, 60, 0.4); }
      .convert-button:disabled { opacity: 0.5; cursor: not-allowed; }
      .spinner { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .convert-hint { font-size: 0.9rem; color: var(--text-soft); margin: 0; text-align: center; }
      .success-section { display: grid; gap: 16px; text-align: center; padding: 32px; background: color-mix(in srgb, #27ae60 10%, var(--surface-solid)); border-radius: 16px; }
      .success-icon { color: #27ae60; }
      .success-section h4 { font-size: 1.5rem; font-weight: 700; color: var(--text-heading); margin: 0; }
      .success-section p { color: var(--text-soft); margin: 0; }
      .download-button { background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%); color: white; border: none; padding: 18px 48px; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(39, 174, 96, 0.3); display: inline-flex; align-items: center; gap: 10px; text-decoration: none; justify-content: center; }
      .download-button:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(39, 174, 96, 0.4); }
      .convert-another-button { background: transparent; border: 2px solid var(--surface-border); color: var(--text-soft); padding: 14px 32px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
      .convert-another-button:hover { border-color: #e74c3c; color: #e74c3c; }
      .progress-section { display: grid; gap: 12px; }
      .progress-bar { width: 100%; height: 8px; background: var(--surface-border); border-radius: 4px; overflow: hidden; }
      .progress-fill { height: 100%; background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%); transition: width 0.3s ease; }
      .progress-text { font-size: 0.95rem; color: var(--text-soft); text-align: center; margin: 0; }
      .error-message-wrapper { display: grid; gap: 12px; }
      .error-message { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; }
      .features-section { max-width: 1200px; margin: 0 auto; padding: 60px 24px; }
      .features-title { font-size: 2rem; font-weight: 800; text-align: center; margin: 0 0 40px; color: #1a1a1a; }
      .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
      @media (max-width: 640px) {
        .extract-preview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .select-file-button { min-width: 0; width: 100%; padding: 20px 24px; }
      }
    `}</style>
  );

  // ===== Embedded mode: only the tool card content, no wrapper =====
  if (embedded) {
    return (
      <>
        {toolContent}
        {toolStyles}
      </>
    );
  }

  // ===== Standalone mode: full page with header/hero/features =====
  return (
    <div className="ilovepdf-container">
      <header className="ilovepdf-top-header">
        <div className="ilovepdf-header-content">
          <button className="ilovepdf-header-logo" onClick={handleGoHome} type="button">
            <img src="/sababpdf-sunpdf-logo.svg" alt="SababPDF" className="header-logo-image" />
            <span className="header-brand-name">Sabab<span className="header-brand-accent">PDF</span></span>
          </button>
        </div>
      </header>

      <section className="ilovepdf-hero">
        <div className="ilovepdf-hero-content">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="ilovepdf-title">
              <span className="highlight">Extract pages</span>
            </h1>
            <p className="ilovepdf-subtitle">
              Extract specific pages from your PDF and save them as a new file
            </p>
          </motion.div>
        </div>
      </section>

      <section className="ilovepdf-tool-card">
        {toolContent}
      </section>

      <section className="features-section">
        <h2 className="features-title">Why use our PDF page extractor?</h2>
        <div className="features-grid">
          <FeatureCard icon="🎯" title="Precise Selection" description="Choose exact pages or ranges to extract from your PDF." color="#e74c3c" />
          <FeatureCard icon="⚡" title="Fast Processing" description="Extract pages instantly in your browser." color="#e74c3c" />
          <FeatureCard icon="🔒" title="Secure" description="Files stay in your browser - nothing is uploaded." color="#e74c3c" />
        </div>
      </section>

      {toolStyles}
    </div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  return (
    <div style={{ padding: '24px', borderRadius: '16px', background: '#fef2f2', border: `1px solid ${color}20` }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ color: '#666', margin: 0, lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}
