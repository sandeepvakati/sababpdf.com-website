'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, X, Loader2, Download, Home } from 'lucide-react';
import { formatBytes, getPdfPreviewData } from '../lib/pdfUtils';
import { useRouter } from 'next/navigation';

const MODE_OPTIONS = [
  {
    value: 'no-ocr',
    label: 'No OCR',
    description: 'Best for PDFs with selectable text. Extracts text, images, and tables for editing.',
    icon: '📝',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
  {
    value: 'layout',
    label: 'Keep Layout',
    description: 'Preserves the exact visual appearance of each PDF page. Best for complex layouts.',
    icon: '📐',
    color: '#2196F3',
    bgColor: '#E3F2FD',
  },
  {
    value: 'ocr',
    label: 'OCR Mode',
    description: 'For scanned PDFs. Uses OCR to recognize text from images.',
    icon: '🔍',
    color: '#FF9800',
    bgColor: '#FFF3E0',
  },
];

export default function PdfToWordConverter({ embedded = false }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [mode, setMode] = useState('no-ocr');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const CLIENT_CONVERTER_TIMEOUT_MS = 10 * 60 * 1000;

  const handleGoHome = () => {
    router.push('/');
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setError(null);
    setResult(null);

    if (rejectedFiles.length > 0) {
      setError('Please upload a valid PDF file');
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    try {
      const previewData = await getPdfPreviewData(selectedFile);
      setPreviewUrl(previewData.previewUrl);
      setPageCount(previewData.pageCount);
    } catch (err) {
      console.error('Preview error:', err);
      setPageCount(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
  });

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setProgress(10);
    setStatusMessage('Starting conversion...');
    setError(null);
    setResult(null);

    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadProgress = Math.round((event.loaded / event.total) * 30);
          setProgress(10 + uploadProgress);
          setStatusMessage('Uploading PDF...');
        }
      });

      xhr.addEventListener('load', () => {
        setProgress(100);
        setStatusMessage('Conversion complete!');

        if (xhr.status === 200) {
          const blob = new Blob([xhr.response], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const url = URL.createObjectURL(blob);
          const downloadName = file.name.replace(/\.pdf$/i, '') + '-converted.docx';

          setResult({ url, downloadName });
          setIsConverting(false);
        } else {
          let errorMsg = 'Conversion failed. Please try again.';
          try {
            const reader = new FileReader();
            reader.onload = function() {
              try {
                const errorData = JSON.parse(reader.result);
                setError(errorData.error || errorMsg);
              } catch {
                setError(errorMsg);
              }
              setIsConverting(false);
            };
            reader.readAsText(xhr.response);
            return;
          } catch {
            errorMsg = `Conversion failed with status ${xhr.status}`;
          }
          setError(errorMsg);
          setIsConverting(false);
        }
      });

      xhr.addEventListener('error', () => {
        setError('Network error. Please check your connection and try again.');
        setIsConverting(false);
      });

      xhr.addEventListener('timeout', () => {
        setError('Conversion is taking too long. Please try again with a smaller file.');
        setIsConverting(false);
      });

      xhr.open('POST', '/api/convert/pdf-to-word');
      xhr.responseType = 'blob';
      xhr.timeout = CLIENT_CONVERTER_TIMEOUT_MS;
      xhr.send(formData);

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed < 3000) {
          setStatusMessage('Analyzing PDF...');
          setProgress(20);
        } else if (elapsed < 8000) {
          setStatusMessage('Extracting content...');
          setProgress(45);
        } else if (elapsed < 15000) {
          setStatusMessage('Converting to Word...');
          setProgress(70);
        } else {
          setStatusMessage('Finalizing document...');
          setProgress(90);
        }
      }, 500);

      setTimeout(() => clearInterval(progressInterval), 120000);
    } catch (err) {
      setError(err.message || 'Conversion failed');
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setPageCount(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStatusMessage('');
  };

  // Tool card content (shared between embedded and standalone)
  const toolCardContent = (
    <>
      {!file ? (
        /* Upload Zone */
        <motion.div
          {...getRootProps()}
          style={{
            ...styles.dropzone,
            ...(isDragActive ? styles.dropzoneActive : {}),
          }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <input {...getInputProps()} />
          <div style={styles.dropzoneContent}>
            <motion.div 
              style={styles.iconWrapper}
              animate={isDragActive ? { scale: 1.1 } : {}}
              transition={{ duration: 0.2 }}
            >
              <div style={styles.iconCircle}>
                <FileText size={56} color="white" strokeWidth={1.5} />
              </div>
            </motion.div>
            <h3 style={styles.dropzoneTitle}>
              {isDragActive ? 'Drop PDF file here' : 'Select PDF file'}
            </h3>
            <p style={styles.dropzoneDesc}>
              or drop PDF here
            </p>
            <motion.button 
              style={styles.selectButton} 
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Select PDF file
            </motion.button>
            <p style={styles.hint}>
              <span style={styles.hintIcon}>⚡</span>
              Free to use · Max file size: 100 MB · PDF supported
            </p>
          </div>
        </motion.div>
      ) : (
        /* File Selected */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.filePanel}
        >
          {/* File Info */}
          <div style={styles.fileInfo}>
            {previewUrl ? (
              <img src={previewUrl} alt="PDF Preview" style={styles.previewImage} />
            ) : (
              <div style={styles.fileIcon}>
                <FileText size={40} color="white" />
              </div>
            )}
            <div style={styles.fileDetails}>
              <h4 style={styles.fileName}>{file.name}</h4>
              <p style={styles.fileSize}>{formatBytes(file.size)}</p>
              {pageCount && <p style={styles.filePages}>{pageCount} page{pageCount > 1 ? 's' : ''}</p>}
              <p style={styles.fileStatus}>✓ Ready to convert</p>
            </div>
            <button style={styles.removeButton} onClick={handleReset}>
              <X size={20} />
            </button>
          </div>

          {/* Mode Selection */}
          <div style={styles.modeSection}>
            <p style={styles.modeLabel}>Conversion Mode:</p>
            <div style={styles.modeOptions}>
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  style={{
                    ...styles.modeOption,
                    ...(mode === option.value ? {
                      borderColor: option.color,
                      background: option.bgColor,
                    } : {}),
                  }}
                  onClick={() => setMode(option.value)}
                >
                  <span style={styles.modeIcon}>{option.icon}</span>
                  <div style={styles.modeText}>
                    <strong>{option.label}</strong>
                    <span style={styles.modeDesc}>{option.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          {!result ? (
            <div style={styles.actions}>
              <button
                style={{
                  ...styles.convertButton,
                  ...(isConverting ? styles.convertButtonDisabled : {}),
                }}
                onClick={handleConvert}
                disabled={isConverting}
              >
                {isConverting ? (
                  <>
                    <Loader2 className="spinner" size={20} />
                    Converting... {progress}%
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    Convert to Word
                  </>
                )}
              </button>
              {!isConverting && (
                <p style={styles.hintText}>
                  ⚡ Conversion may take 1-3 minutes depending on file size.
                </p>
              )}
            </div>
          ) : (
            /* Success */
            <div style={styles.success}>
              <CheckCircle size={56} color="#27ae60" />
              <h4 style={styles.successTitle}>Conversion Successful!</h4>
              <p style={styles.successDesc}>Your Word document is ready</p>
              <a
                href={result.url}
                download={result.downloadName}
                style={styles.downloadButton}
              >
                <Download size={20} />
                Download Word File
              </a>
              <button style={styles.resetButton} onClick={handleReset}>
                Convert another file
              </button>
            </div>
          )}

          {/* Progress */}
          {isConverting && (
            <div style={styles.progressSection}>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progress}%`,
                  }}
                />
              </div>
              <p style={styles.progressText}>{statusMessage}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <X size={20} color="#e74c3c" />
              <span>{error}</span>
            </div>
          )}
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );

  // Embedded mode: just the tool card content, no wrapper
  if (embedded) {
    return toolCardContent;
  }

  // Standalone mode: full page with own header/hero
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button 
          style={styles.logoButton} 
          onClick={handleGoHome}
          title="Go to Home"
        >
          <img src="/sababpdf-sunpdf-logo.svg" alt="SababPDF" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          <span style={styles.logo}>Sabab<span style={{ color: '#e74c3c' }}>PDF</span></span>
        </button>
        <nav style={styles.nav}>
          <a href="/merge-pdf" style={styles.navLink}>Merge PDF</a>
          <a href="/split-pdf" style={styles.navLink}>Split PDF</a>
          <a href="/compress-pdf" style={styles.navLink}>Compress</a>
          <a href="/word-to-pdf" style={styles.navLink}>Word to PDF</a>
        </nav>
      </header>

      <section style={styles.hero}>
        <h1 style={styles.title}>
          PDF to <span style={styles.highlight}>WORD</span>
        </h1>
        <p style={styles.subtitle}>
          Convert your PDF files to editable Word documents
        </p>
      </section>

      <section style={styles.mainSection}>
        <div style={styles.uploadCard}>
          {toolCardContent}
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--page-bg)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    background: 'var(--surface-solid)',
    borderBottom: '1px solid var(--surface-border)',
    padding: '0 40px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: 'var(--card-shadow-soft)',
  },
  logoButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '12px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  homeIcon: {
    color: '#666',
    transition: 'color 0.2s ease',
  },
  logo: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-heading)',
    letterSpacing: '-0.5px',
  },
  nav: {
    display: 'flex',
    gap: '24px',
  },
  navLink: {
    color: 'var(--text-soft)',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'color 0.2s ease',
  },
  hero: {
    background: 'var(--surface-solid)',
    padding: '60px 20px 50px',
    textAlign: 'center',
    borderBottom: '1px solid var(--surface-border)',
  },
  title: {
    fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
    fontWeight: '900',
    margin: '0',
    color: 'var(--text-heading)',
    letterSpacing: '-0.03em',
    lineHeight: '1.1',
  },
  highlight: {
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
    color: 'var(--text-soft)',
    margin: '20px 0 0',
    fontWeight: '400',
  },
  badges: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    marginTop: '32px',
    flexWrap: 'wrap',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-soft)',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  badgeIcon: {
    fontSize: '1.1rem',
  },
  mainSection: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '50px 20px',
  },
  uploadCard: {
    background: 'var(--surface-solid)',
    borderRadius: '16px',
    boxShadow: 'var(--card-shadow-soft)',
    overflow: 'hidden',
  },
  dropzone: {
    border: '2px dashed #d0d5dd',
    borderRadius: '16px',
    padding: '80px 40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'var(--surface)',
    margin: '20px',
  },
  dropzoneActive: {
    borderColor: '#2196F3',
    background: 'color-mix(in srgb, #2196F3 12%, var(--surface-solid))',
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  iconWrapper: {
    marginBottom: '8px',
  },
  iconCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 35px rgba(33, 150, 243, 0.35)',
  },
  dropzoneTitle: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: 'var(--text-heading)',
    margin: '0',
  },
  dropzoneDesc: {
    fontSize: '1rem',
    color: 'var(--text-soft)',
    margin: '0',
  },
  selectButton: {
    background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
    color: 'white',
    border: 'none',
    padding: '18px 48px',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(33, 150, 243, 0.35)',
    marginTop: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
  },
  hint: {
    fontSize: '0.9rem',
    color: 'var(--text-soft)',
    margin: '8px 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  hintIcon: {
    color: '#e74c3c',
  },
  filePanel: {
    padding: '30px',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '24px',
    background: 'var(--surface)',
    borderRadius: '12px',
    marginBottom: '30px',
  },
  previewImage: {
    width: '80px',
    height: '100px',
    borderRadius: '12px',
    objectFit: 'cover',
    flexShrink: '0',
  },
  fileIcon: {
    width: '80px',
    height: '100px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.25)',
  },
  fileDetails: {
    flex: '1',
    minWidth: '0',
  },
  fileName: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--text-heading)',
    margin: '0 0 8px 0',
    wordBreak: 'break-word',
  },
  fileSize: {
    fontSize: '0.95rem',
    color: 'var(--text-soft)',
    margin: '0 0 4px 0',
  },
  filePages: {
    fontSize: '0.9rem',
    color: '#2196F3',
    margin: '0 0 4px 0',
    fontWeight: '600',
  },
  fileStatus: {
    fontSize: '0.9rem',
    color: '#27ae60',
    margin: '0',
    fontWeight: '600',
  },
  removeButton: {
    background: '#fee',
    color: '#e74c3c',
    border: 'none',
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  modeSection: {
    padding: '24px',
    background: 'var(--surface)',
    borderRadius: '12px',
    marginBottom: '30px',
  },
  modeLabel: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-heading)',
    margin: '0 0 16px 0',
  },
  modeOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  modeOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    border: '2px solid var(--surface-border)',
    borderRadius: '12px',
    background: 'var(--surface-solid)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  modeIcon: {
    fontSize: '1.5rem',
  },
  modeText: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  modeDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-soft)',
  },
  actions: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  convertButton: {
    background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
    color: 'white',
    border: 'none',
    padding: '20px 64px',
    borderRadius: '50px',
    fontSize: '1.2rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(33, 150, 243, 0.35)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
  },
  convertButtonDisabled: {
    opacity: '0.7',
    cursor: 'not-allowed',
  },
  hintText: {
    fontSize: '0.9rem',
    color: 'var(--text-soft)',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  success: {
    textAlign: 'center',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  successTitle: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: 'var(--text-heading)',
    margin: '0',
  },
  successDesc: {
    fontSize: '1rem',
    color: 'var(--text-soft)',
    margin: '0',
  },
  downloadButton: {
    background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
    color: 'white',
    textDecoration: 'none',
    padding: '18px 48px',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: '700',
    boxShadow: '0 8px 25px rgba(33, 150, 243, 0.35)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px',
    transition: 'all 0.3s ease',
  },
  resetButton: {
    background: 'transparent',
    color: 'var(--text-soft)',
    border: '2px solid var(--surface-border)',
    padding: '14px 36px',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.3s ease',
  },
  progressSection: {
    marginTop: '30px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'var(--surface-border)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2196F3 0%, #64B5F6 100%)',
    borderRadius: '4px',
  },
  progressText: {
    textAlign: 'center',
    fontSize: '0.95rem',
    color: 'var(--text-soft)',
    marginTop: '12px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'color-mix(in srgb, #ef4444 12%, var(--surface-solid))',
    border: '1px solid #fcc',
    borderRadius: '10px',
    color: '#e74c3c',
    fontSize: '0.95rem',
    marginTop: '20px',
  },
};
