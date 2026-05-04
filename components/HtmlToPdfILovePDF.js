'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, FileText, Download, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HtmlToPdfILovePDF({ embedded = false }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const CLIENT_CONVERTER_TIMEOUT_MS = 5 * 60 * 1000;

  const handleGoHome = () => {
    router.push('/');
  };

  const resetState = () => {
    setUrl('');
    setError(null);
    setResult(null);
    setProgress(0);
    setStatusMessage('');
  };

  const handleAddUrl = async () => {
    if (!url.trim()) return;

    setIsModalOpen(false);
    setIsConverting(true);
    setProgress(10);
    setStatusMessage('Starting conversion...');
    setError(null);
    setResult(null);

    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('url', url.trim());

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadProgress = Math.round((event.loaded / event.total) * 20);
          setProgress(10 + uploadProgress);
          setStatusMessage('Processing URL...');
        }
      });

      xhr.addEventListener('load', () => {
        setProgress(100);
        setStatusMessage('Conversion complete!');

        if (xhr.status === 200) {
          const blob = new Blob([xhr.response], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          const domain = new URL(url).hostname.replace('www.', '');
          const downloadName = `${domain}-converted.pdf`;

          setResult({ url: blobUrl, downloadName });
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
        setError('Conversion is taking too long. Please try again with a simpler webpage.');
        setIsConverting(false);
      });

      xhr.open('POST', '/api/convert/html-to-pdf');
      xhr.responseType = 'blob';
      xhr.timeout = CLIENT_CONVERTER_TIMEOUT_MS;
      xhr.send(formData);

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 2000) {
          setStatusMessage('Fetching webpage...');
          setProgress(30);
        } else if (elapsed < 5000) {
          setStatusMessage('Rendering HTML...');
          setProgress(50);
        } else if (elapsed < 10000) {
          setStatusMessage('Converting to PDF...');
          setProgress(75);
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

  const toolCardContent = (
    <>
      {!isConverting && !result && !error ? (
        <div style={styles.centerFlow}>
          <button style={styles.hugeAddButton} onClick={() => setIsModalOpen(true)}>
            Add HTML
          </button>
          <p style={styles.supportText}>Convert web pages to PDF documents with high accuracy.</p>
        </div>
      ) : (
        <div style={styles.conversionPanel}>
          {error ? (
            <motion.div style={styles.errorBox} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <X size={20} color="#e74c3c" />
              <span>{error}</span>
              <button style={styles.tryAgainButton} onClick={resetState}>Try Again</button>
            </motion.div>
          ) : isConverting ? (
            <motion.div style={styles.progressSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Loader2 className="spinner" size={48} color="#e74c3c" style={{ marginBottom: 20 }} />
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
          ) : result ? (
            <motion.div style={styles.success} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <h4 style={styles.successTitle}>HTML to PDF complete!</h4>
              <p style={styles.successDesc}>Your PDF document has been created</p>
              
              <div style={styles.previewContainer}>
                <iframe src={`${result.url}#toolbar=0&navpanes=0&scrollbar=0`} style={styles.previewFrame} title="PDF Preview" />
              </div>

              <div style={styles.successActions}>
                <a href={result.url} download={result.downloadName} style={styles.downloadButton}>
                  <Download size={20} />
                  Download PDF
                </a>
                <button style={styles.resetButton} onClick={resetState}>Convert another URL</button>
              </div>
            </motion.div>
          ) : null}
        </div>
      )}

      {/* The URL Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <motion.div 
              style={styles.modalContent}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Add HTML to convert from</h2>
                <button style={styles.closeModalButton} onClick={() => setIsModalOpen(false)}>
                  <X size={24} color="#666" />
                </button>
              </div>
              
              <div style={styles.modalBody}>
                <div style={styles.tabsContainer}>
                  <div style={styles.tabActive}>Url</div>
                </div>
                <div style={styles.inputSection}>
                  <label style={styles.inputLabel}>Write the website URL</label>
                  <div style={styles.inputWrapper}>
                    <Globe size={20} color="#999" style={styles.inputIcon} />
                    <input 
                      type="url" 
                      style={styles.urlInput} 
                      placeholder="Example: https://ilovepdf.com" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddUrl();
                      }}
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button 
                  style={{...styles.submitModalButton, opacity: url.trim() ? 1 : 0.6}} 
                  onClick={handleAddUrl}
                  disabled={!url.trim()}
                >
                  Add
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

  if (embedded) {
    return toolCardContent;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.logoButton} onClick={handleGoHome}>
          <img src="/sababpdf-sunpdf-logo.svg" alt="SababPDF" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          <span style={styles.logo}>Sabab<span style={{ color: '#e74c3c' }}>PDF</span></span>
        </button>
      </header>

      <section style={styles.hero}>
        <h1 style={styles.title}>HTML to <span style={styles.highlight}>PDF</span></h1>
        <p style={styles.subtitle}>Convert web pages to PDF documents with high accuracy.</p>
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
  },
  logo: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-heading)',
    letterSpacing: '-0.5px',
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
    padding: '60px 20px',
    minHeight: '300px',
  },
  centerFlow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
  },
  hugeAddButton: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '24px 64px',
    borderRadius: '12px',
    fontSize: '1.5rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(231, 76, 60, 0.35)',
    transition: 'all 0.3s ease',
  },
  supportText: {
    color: 'var(--text-soft)',
    fontSize: '0.95rem',
    marginTop: '10px',
  },
  conversionPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
  },
  progressSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: '10px',
    background: 'var(--surface-border)',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#e74c3c',
    borderRadius: '5px',
  },
  progressText: {
    marginTop: '12px',
    color: 'var(--text-soft)',
    fontWeight: '500',
  },
  success: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
  },
  successTitle: {
    fontSize: '1.8rem',
    margin: '0',
    color: 'var(--text-heading)',
  },
  successDesc: {
    color: 'var(--text-soft)',
    margin: '0',
  },
  previewContainer: {
    width: '100%',
    height: '400px',
    margin: '20px 0',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--surface-border)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    backgroundColor: '#f5f5f5',
  },
  previewFrame: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  successActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
  },
  downloadButton: {
    background: '#e74c3c',
    color: 'white',
    padding: '16px 40px',
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '600',
    fontSize: '1.1rem',
    marginTop: '10px',
  },
  resetButton: {
    background: 'transparent',
    border: '2px solid #ddd',
    padding: '12px 30px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    marginTop: '10px',
  },
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '30px',
    background: '#fee',
    borderRadius: '12px',
    color: '#e74c3c',
    width: '100%',
  },
  tryAgainButton: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  // Modal Styles exactly matching iLovePDF UX
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'white',
    width: '100%',
    maxWidth: '600px',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    position: 'relative',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#333',
  },
  closeModalButton: {
    position: 'absolute',
    right: '20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '0 40px 10px',
  },
  tabsContainer: {
    borderBottom: '1px solid #eee',
    display: 'flex',
    marginBottom: '24px',
  },
  tabActive: {
    padding: '12px 30px',
    color: '#e74c3c',
    fontWeight: '600',
    borderBottom: '2px solid #e74c3c',
    marginBottom: '-1px',
    fontSize: '1rem',
  },
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  inputLabel: {
    fontWeight: '600',
    color: '#444',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
  },
  urlInput: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  modalFooter: {
    borderTop: '1px solid #eee',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitModalButton: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '12px 32px',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  }
};
