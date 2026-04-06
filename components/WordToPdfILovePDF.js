'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, X, Loader2, Download, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function WordToPdfILovePDF({ embedded = false }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const CLIENT_CONVERTER_TIMEOUT_MS = 5 * 60 * 1000;

  const handleGoHome = () => {
    router.push('/');
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setError(null);
    setResult(null);

    if (rejectedFiles.length > 0) {
      setError('Please upload a valid Word file (.doc or .docx)');
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
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

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadProgress = Math.round((event.loaded / event.total) * 30);
          setProgress(10 + uploadProgress);
          setStatusMessage('Uploading document...');
        }
      });

      xhr.addEventListener('load', () => {
        setProgress(100);
        setStatusMessage('Conversion complete!');

        if (xhr.status === 200) {
          const blob = new Blob([xhr.response], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const downloadName = file.name.replace(/\.(doc|docx)$/i, '') + '-converted.pdf';

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
        setError('Conversion is taking too long. Please try again with a smaller document.');
        setIsConverting(false);
      });

      xhr.open('POST', '/api/convert/word-to-pdf');
      xhr.responseType = 'blob';
      xhr.timeout = CLIENT_CONVERTER_TIMEOUT_MS;
      xhr.send(formData);

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed < 2000) {
          setStatusMessage('Starting conversion...');
          setProgress(20);
        } else if (elapsed < 5000) {
          setStatusMessage('Converting to PDF...');
          setProgress(45);
        } else if (elapsed < 10000) {
          setStatusMessage('Formatting document...');
          setProgress(70);
        } else {
          setStatusMessage('Finalizing PDF...');
          setProgress(90);
        }
      }, 500);

      setTimeout(() => clearInterval(progressInterval), 60000);
    } catch (err) {
      setError(err.message || 'Conversion failed');
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStatusMessage('');
  };

  // Tool card content (shared between embedded and standalone)
  const toolCardContent = (
    <>
      {!file ? (
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
              {isDragActive ? 'Drop Word file here' : 'Select Word document'}
            </h3>
            <p style={styles.dropzoneDesc}>
              or drop file here
            </p>
            <motion.button 
              style={styles.selectButton} 
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Select Word file
            </motion.button>
            <p style={styles.hint}>
              <span style={styles.hintIcon}>⚡</span>
              Free to use · Max file size: 50 MB · DOC & DOCX supported
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={styles.filePanel}
        >
          <div style={styles.fileInfo}>
            <div style={styles.fileIconWrapper}>
              <FileText size={48} color="white" />
            </div>
            <div style={styles.fileDetails}>
              <h4 style={styles.fileName}>{file.name}</h4>
              <p style={styles.fileSize}>{formatBytes(file.size)}</p>
              <p style={styles.fileStatus}>✓ Ready to convert</p>
            </div>
            <motion.button 
              style={styles.removeButton} 
              onClick={handleReset}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          {!result ? (
            <div style={styles.actions}>
              <motion.button
                style={{
                  ...styles.convertButton,
                  ...(isConverting ? styles.convertButtonDisabled : {}),
                }}
                onClick={handleConvert}
                disabled={isConverting}
                whileHover={!isConverting ? { scale: 1.02 } : {}}
                whileTap={!isConverting ? { scale: 0.98 } : {}}
              >
                {isConverting ? (
                  <>
                    <Loader2 className="spinner" size={20} />
                    Converting... {progress}%
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    Convert to PDF
                  </>
                )}
              </motion.button>
              {!isConverting && (
                <p style={styles.hintText}>
                  <span style={styles.hintIcon}>⚡</span>
                  Super fast! Most documents convert in 3-10 seconds.
                </p>
              )}
            </div>
          ) : (
            <motion.div 
              style={styles.success}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div style={styles.successIcon}>
                <CheckCircle size={64} color="#27ae60" />
              </div>
              <h4 style={styles.successTitle}>Conversion Successful!</h4>
              <p style={styles.successDesc}>Your PDF document is ready for download</p>
              <motion.a
                href={result.url}
                download={result.downloadName}
                style={styles.downloadButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download size={20} />
                Download PDF File
              </motion.a>
              <motion.button 
                style={styles.resetButton} 
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Convert another file
              </motion.button>
            </motion.div>
          )}

          {isConverting && (
            <motion.div 
              style={styles.progressSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div style={styles.progressBar}>
                <motion.div
                  style={styles.progressFill}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p style={styles.progressText}>{statusMessage}</p>
            </motion.div>
          )}

          {error && (
            <motion.div 
              style={styles.errorBox}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <X size={20} color="#e74c3c" />
              <span>{error}</span>
            </motion.div>
          )}
        </motion.div>
      )}

      <style jsx>{`
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
          <a href="/pdf-to-word" style={styles.navLink}>PDF to Word</a>
        </nav>
      </header>

      <section style={styles.hero}>
        <h1 style={styles.title}>
          WORD to <span style={styles.highlight}>PDF</span>
        </h1>
        <p style={styles.subtitle}>
          Convert your Word documents to PDF format instantly
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
    gap: '32px',
    alignItems: 'center',
  },
  navLink: {
    color: 'var(--text-soft)',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'color 0.2s ease',
    padding: '8px 0',
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
    color: '#e74c3c',
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
    borderColor: '#27ae60',
    background: 'color-mix(in srgb, #27ae60 12%, var(--surface-solid))',
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
    background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 35px rgba(39, 174, 96, 0.35)',
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
    background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
    color: 'white',
    border: 'none',
    padding: '18px 48px',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(39, 174, 96, 0.35)',
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
  fileIconWrapper: {
    width: '80px',
    height: '100px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    boxShadow: '0 4px 12px rgba(39, 174, 96, 0.25)',
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
  actions: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  convertButton: {
    background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
    color: 'white',
    border: 'none',
    padding: '20px 64px',
    borderRadius: '50px',
    fontSize: '1.2rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(39, 174, 96, 0.35)',
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
  successIcon: {
    marginBottom: '8px',
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
    background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
    color: 'white',
    textDecoration: 'none',
    padding: '18px 48px',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: '700',
    boxShadow: '0 8px 25px rgba(39, 174, 96, 0.35)',
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
    background: 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)',
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
