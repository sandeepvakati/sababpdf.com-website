'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, X, Loader2, Download, Home, Type, Image as ImageIcon, Plus, RotateCcw } from 'lucide-react';
import { getPdfPagePreviews, addWatermark } from '../lib/pdfUtils';
import { useRouter } from 'next/navigation';

export default function AddWatermarkILovePDF({ embedded = false }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Watermark Options State
  const [watermarkText, setWatermarkText] = useState('SababPDF.com');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  
  const [position, setPosition] = useState('center');
  const [mosaic, setMosaic] = useState(false);
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(0);

  // Watermark mode: 'text' or 'image'
  const [watermarkMode, setWatermarkMode] = useState('text');
  const [watermarkImage, setWatermarkImage] = useState(null); // { file, previewUrl }
  const [imageScale, setImageScale] = useState(1);
  const imageInputRef = useRef(null);

  const POSITIONS = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  const handleGoHome = () => {
    router.push('/');
  };

  const loadPreviews = async (selectedFile) => {
    setIsLoadingThumbnails(true);
    try {
      const previewData = await getPdfPagePreviews(selectedFile, Array.from({ length: 12 }, (_, i) => i + 1), 180);
      setThumbnails(previewData.pages);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsLoadingThumbnails(false);
    }
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
    loadPreviews(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
  });

  const handleImageUpload = (e) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;
    const url = URL.createObjectURL(imgFile);
    setWatermarkImage({ file: imgFile, previewUrl: url });
  };

  const handleRemoveImage = () => {
    if (watermarkImage?.previewUrl) {
      URL.revokeObjectURL(watermarkImage.previewUrl);
    }
    setWatermarkImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleImageScaleChange = (nextValue) => {
    const value = Number(nextValue);
    const safe = Number.isFinite(value) ? Math.max(0.2, Math.min(2, value)) : 1;
    setImageScale(safe);
  };

  const handleAddWatermark = async () => {
    if (!file) return;
    if (watermarkMode === 'image' && !watermarkImage) {
      setError('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      setTimeout(async () => {
        try {
          const opts = {
            mode: watermarkMode,
            opacity: opacity,
            rotation: rotation,
            position: position,
            mosaic: mosaic,
          };

          if (watermarkMode === 'text') {
            opts.text = watermarkText;
            opts.color = textColor;
            opts.fontSize = 60;
            opts.fontFamily = fontFamily;
            opts.isBold = isBold;
            opts.isItalic = isItalic;
          } else {
            opts.imageFile = watermarkImage.file;
            opts.imageScale = imageScale;
          }

          const processedBlob = await addWatermark(file, opts);
          
          const url = URL.createObjectURL(processedBlob);
          const downloadName = file.name.replace(/\.pdf$/i, '') + '-watermarked.pdf';
          
          setResult({ url, downloadName });
          setIsProcessing(false);
        } catch (err) {
          setError(err.message || 'Watermarking failed');
          setIsProcessing(false);
        }
      }, 50);
    } catch (err) {
      setError(err.message || 'Watermarking failed');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setResult(null);
    setError(null);
  };

  const getFlexPosition = (pos) => {
    let alignItems = 'center';
    let justifyContent = 'center';
    
    if (pos.includes('top')) alignItems = 'flex-start';
    if (pos.includes('bottom')) alignItems = 'flex-end';
    
    if (pos.includes('left')) justifyContent = 'flex-start';
    if (pos.includes('right')) justifyContent = 'flex-end';
    
    return { alignItems, justifyContent };
  };

  // ========== UPLOAD SCREEN (iLovePDF style) ==========
  if (!file) {
    return (
      <div className="wm-upload-screen">
        <div className="wm-upload-center">
          <h2 className="wm-upload-heading">Add watermark into a PDF</h2>
          <p className="wm-upload-desc">
            Stamp an image or text over your PDF in seconds. Choose the typography,
            transparency and position.
          </p>

          <div {...getRootProps()} className={`wm-upload-zone ${isDragActive ? 'wm-drag-active' : ''}`}>
            <input {...getInputProps()} />
            <button
              type="button"
              style={{
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                padding: '18px 60px',
                borderRadius: '8px',
                fontSize: '1.15rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(231, 76, 60, 0.3)',
                transition: 'box-shadow 0.3s, background 0.2s, transform 0.15s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#d04437';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(231, 76, 60, 0.4)';
                e.currentTarget.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#e74c3c';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(231, 76, 60, 0.3)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Select PDF file
            </button>
            <p className="wm-drop-text">
              or <span className="wm-drop-link">drop PDF here</span>
            </p>
          </div>

          {error && (
            <div className="wm-error-msg">
              <X size={16} /> {error}
            </div>
          )}
        </div>

        <style jsx>{`
          .wm-upload-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 340px;
            padding: 40px 20px;
          }
          .wm-upload-center {
            text-align: center;
            max-width: 700px;
            width: 100%;
          }
          .wm-upload-heading {
            font-size: clamp(1.8rem, 4vw, 2.6rem);
            font-weight: 800;
            color: var(--text-heading);
            margin: 0 0 12px;
            letter-spacing: -0.02em;
            line-height: 1.2;
          }
          .wm-upload-desc {
            font-size: 1.05rem;
            color: var(--text-soft);
            margin: 0 auto 32px;
            max-width: 520px;
            line-height: 1.6;
          }
          .wm-upload-zone {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 20px;
            cursor: pointer;
            border-radius: 12px;
            transition: background 0.2s;
          }
          .wm-upload-zone.wm-drag-active {
            background: color-mix(in srgb, #e74c3c 8%, transparent);
          }
          .wm-select-btn {
            background: #e74c3c;
            color: #fff;
            border: none;
            padding: 18px 60px;
            border-radius: 8px;
            font-size: 1.15rem;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(231, 76, 60, 0.3);
            transition: box-shadow 0.3s, background 0.2s;
            letter-spacing: 0.01em;
          }
          .wm-select-btn:hover {
            background: #d04437;
            box-shadow: 0 6px 24px rgba(231, 76, 60, 0.4);
          }
          .wm-drop-text {
            font-size: 0.92rem;
            color: var(--text-soft);
            margin: 0;
          }
          .wm-drop-link {
            color: #e74c3c;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          .wm-error-msg {
            margin-top: 16px;
            color: #e74c3c;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          @media (max-width: 600px) {
            .wm-select-btn {
              padding: 16px 40px;
              font-size: 1rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // ========== RESULT / SUCCESS SCREEN ==========
  if (result) {
    return (
      <div className="wm-success-screen">
        <div className="wm-success-card">
          <div className="wm-success-icon">
            <CheckCircle size={56} color="#27ae60" />
          </div>
          <h3 className="wm-success-title">Watermark Added!</h3>
          <p className="wm-success-desc">Your PDF has been watermarked successfully.</p>
          <a
            href={result.url}
            download={result.downloadName}
            className="wm-download-btn"
          >
            <Download size={20} />
            Download Watermarked PDF
          </a>
          <button className="wm-reset-btn" onClick={handleReset}>
            <RotateCcw size={16} />
            Watermark another file
          </button>
        </div>

        <style jsx>{`
          .wm-success-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            padding: 40px 20px;
          }
          .wm-success-card {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .wm-success-icon {
            margin-bottom: 8px;
          }
          .wm-success-title {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--text-heading);
            margin: 0;
          }
          .wm-success-desc {
            font-size: 1rem;
            color: var(--text-soft);
            margin: 0;
          }
          .wm-download-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: #27ae60;
            color: #fff;
            text-decoration: none;
            padding: 16px 48px;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 700;
            box-shadow: 0 4px 16px rgba(39, 174, 96, 0.3);
            transition: all 0.2s;
            margin-top: 8px;
          }
          .wm-download-btn:hover {
            background: #219a52;
            box-shadow: 0 6px 24px rgba(39, 174, 96, 0.4);
          }
          .wm-reset-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: transparent;
            color: var(--text-soft);
            border: 2px solid var(--surface-border);
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .wm-reset-btn:hover {
            border-color: #e74c3c;
            color: #e74c3c;
          }
        `}</style>
      </div>
    );
  }

  // ========== WORKSPACE (split layout with sidebar) ==========
  return (
    <div className="wm-workspace">
      {/* Left: Page previews with watermark overlay */}
      <div className="wm-preview-area">
        {isLoadingThumbnails ? (
          <div className="wm-loader">
            <Loader2 className="wm-spin" size={40} color="#e74c3c" />
            <p>Loading pages...</p>
          </div>
        ) : (
          <div className="wm-pages-grid">
            {thumbnails.map((t, idx) => (
              <div key={idx} className="wm-page-card">
                <div className="wm-page-img-wrapper">
                  <img src={t.previewUrl} alt={`Page ${idx + 1}`} className="wm-page-img" />
                  {/* Live watermark preview overlay */}
                  <div
                    className="wm-overlay"
                    style={{
                      ...getFlexPosition(position),
                      display: 'flex',
                    }}
                  >
                    {watermarkMode === 'text' ? (
                      <>
                        {mosaic ? (
                          <div className="wm-mosaic-grid" style={{ opacity }}>
                            {Array.from({ length: 9 }).map((_, i) => (
                              <div key={i} style={{
                                fontFamily,
                                fontWeight: isBold ? 'bold' : 'normal',
                                fontStyle: isItalic ? 'italic' : 'normal',
                                textDecoration: isUnderline ? 'underline' : 'none',
                                color: textColor,
                                transform: `rotate(${rotation}deg)`,
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                textAlign: 'center'
                              }}>{watermarkText}</div>
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            fontFamily,
                            fontWeight: isBold ? 'bold' : 'normal',
                            fontStyle: isItalic ? 'italic' : 'normal',
                            textDecoration: isUnderline ? 'underline' : 'none',
                            color: textColor,
                            opacity,
                            transform: `rotate(${rotation}deg)`,
                            fontSize: '18px',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                            textShadow: '0 0 3px rgba(255,255,255,0.6)'
                          }}>{watermarkText}</div>
                        )}
                      </>
                    ) : watermarkImage ? (
                      <>
                        {mosaic ? (
                          <div className="wm-mosaic-grid" style={{ opacity }}>
                            {Array.from({ length: 9 }).map((_, i) => (
                              <img key={i} src={watermarkImage.previewUrl} alt="watermark" style={{
                                width: '40px',
                                height: 'auto',
                                transform: `rotate(${rotation}deg)`,
                                objectFit: 'contain'
                              }} />
                            ))}
                          </div>
                        ) : (
                          <img src={watermarkImage.previewUrl} alt="watermark" style={{
                            maxWidth: `${Math.min(90, 60 * imageScale)}%`,
                            maxHeight: `${Math.min(90, 60 * imageScale)}%`,
                            opacity,
                            transform: `rotate(${rotation}deg)`,
                            objectFit: 'contain'
                          }} />
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
                <span className="wm-page-num">{idx + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Settings sidebar */}
      <div className="wm-sidebar">
        <div className="wm-sidebar-head">
          <h3>Watermark options</h3>
          <CheckCircle color="#27ae60" size={18} />
        </div>

        <div className="wm-sidebar-body">
          {/* Tabs */}
          <div className="wm-tabs">
            <button 
              className={`wm-tab ${watermarkMode === 'text' ? 'wm-tab-active' : ''}`}
              onClick={() => setWatermarkMode('text')}
            >
              <Type size={18} />
              <span>Place text</span>
            </button>
            <button 
              className={`wm-tab ${watermarkMode === 'image' ? 'wm-tab-active' : ''}`}
              onClick={() => setWatermarkMode('image')}
            >
              <ImageIcon size={18} />
              <span>Place image</span>
            </button>
          </div>

          {watermarkMode === 'text' ? (
            <>
          {/* Text Input */}
          <div className="wm-field">
            <label className="wm-label">Text</label>
            <input 
              type="text" 
              value={watermarkText} 
              onChange={(e) => setWatermarkText(e.target.value)}
              className="wm-input"
              placeholder="Enter watermark text..."
            />
          </div>

          {/* Text Format */}
          <div className="wm-field">
            <label className="wm-label">Text format</label>
            <div className="wm-format-bar">
              <select 
                value={fontFamily} 
                onChange={e => setFontFamily(e.target.value)}
                className="wm-font-select"
              >
                <option value="Arial">Arial</option>
                <option value="Times">Times New Roman</option>
                <option value="Courier">Courier</option>
              </select>

              <div className="wm-format-btns">
                <button 
                  className={`wm-fmt-btn ${isBold ? 'wm-fmt-active' : ''}`}
                  onClick={() => setIsBold(!isBold)}
                >
                  <b>B</b>
                </button>
                <button 
                  className={`wm-fmt-btn ${isItalic ? 'wm-fmt-active' : ''}`}
                  onClick={() => setIsItalic(!isItalic)}
                >
                  <i>I</i>
                </button>
                <button 
                  className={`wm-fmt-btn ${isUnderline ? 'wm-fmt-active' : ''}`}
                  onClick={() => setIsUnderline(!isUnderline)}
                >
                  <u>U</u>
                </button>
                <div className="wm-color-wrap">
                  <input 
                    type="color" 
                    value={textColor} 
                    onChange={e => setTextColor(e.target.value)}
                    className="wm-color-input"
                  />
                </div>
              </div>
            </div>
          </div>
            </>
          ) : (
            <>
              {/* ===== IMAGE MODE ===== */}
              <div className="wm-field">
                <label className="wm-label">Image</label>
                {watermarkImage ? (
                  <div className="wm-img-preview-box">
                    <img 
                      src={watermarkImage.previewUrl} 
                      alt="Watermark" 
                      className="wm-img-preview-thumb" 
                    />
                    <div className="wm-img-info">
                      <span className="wm-img-name">{watermarkImage.file.name}</span>
                      <button className="wm-img-remove-btn" onClick={handleRemoveImage}>
                        <X size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="wm-img-upload-zone"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload size={24} color="#e74c3c" />
                    <span>Click to select an image</span>
                    <span className="wm-img-formats">PNG, JPG, WebP supported</span>
                  </div>
                )}
                <input 
                  ref={imageInputRef}
                  type="file" 
                  accept="image/png,image/jpeg,image/webp,image/gif" 
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {watermarkImage ? (
                <div className="wm-field">
                  <label className="wm-label">Image size</label>
                  <div className="wm-size-row">
                    <button
                      type="button"
                      className="wm-size-btn"
                      onClick={() => handleImageScaleChange(imageScale - 0.1)}
                      title="Minimize image"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0.2"
                      max="2"
                      step="0.1"
                      value={imageScale}
                      onChange={(e) => handleImageScaleChange(e.target.value)}
                      className="wm-size-range"
                    />
                    <button
                      type="button"
                      className="wm-size-btn"
                      onClick={() => handleImageScaleChange(imageScale + 0.1)}
                      title="Maximize image"
                    >
                      +
                    </button>
                    <span className="wm-size-value">{Math.round(imageScale * 100)}%</span>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Position */}
          <div className="wm-field">
            <label className="wm-label">Position</label>
            <div className="wm-pos-section">
              <div className={`wm-pos-grid ${mosaic ? 'wm-pos-disabled' : ''}`}>
                {POSITIONS.map(pos => (
                  <button 
                    key={pos} 
                    className={`wm-pos-cell ${position === pos ? 'wm-pos-active' : ''}`}
                    onClick={() => setPosition(pos)}
                    disabled={mosaic}
                  >
                    {position === pos && <div className="wm-pos-dot"></div>}
                  </button>
                ))}
              </div>
              
              <label className="wm-mosaic-label">
                <input 
                  type="checkbox" 
                  checked={mosaic} 
                  onChange={(e) => setMosaic(e.target.checked)} 
                />
                <span>Mosaic</span>
              </label>
            </div>
          </div>

          {/* Transparency & Rotation */}
          <div className="wm-row">
            <div className="wm-field wm-flex1">
              <label className="wm-label">Transparency</label>
              <select 
                value={opacity} 
                onChange={e => setOpacity(Number(e.target.value))}
                className="wm-select"
              >
                <option value={1}>No transparency</option>
                <option value={0.90}>10% transparent</option>
                <option value={0.85}>15% transparent</option>
                <option value={0.75}>25% transparent</option>
                <option value={0.5}>50% transparent</option>
                <option value={0.25}>75% transparent</option>
              </select>
            </div>

            <div className="wm-field wm-flex1">
              <label className="wm-label">Rotation</label>
              <select 
                value={rotation} 
                onChange={e => setRotation(Number(e.target.value))}
                className="wm-select"
              >
                <option value={0}>Do not rotate</option>
                <option value={45}>45 degrees</option>
                <option value={90}>90 degrees</option>
                <option value={180}>180 degrees</option>
                <option value={270}>270 degrees</option>
                <option value={-45}>-45 degrees</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer action */}
        <div className="wm-sidebar-foot">
          {error && (
            <div className="wm-sidebar-error">
              <X size={14} /> {error}
            </div>
          )}
          <button 
            className={`wm-action-btn ${isProcessing ? 'wm-action-disabled' : ''}`}
            onClick={handleAddWatermark}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="wm-spin" size={20} /> Processing...
              </>
            ) : (
              <>
                Add watermark <span style={{fontSize: '18px'}}>→</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .wm-workspace {
          display: flex;
          width: 100%;
          min-height: 520px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--surface-border);
        }

        /* ===== Left Preview ===== */
        .wm-preview-area {
          flex: 1;
          overflow-y: auto;
          background: var(--surface);
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .wm-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: #e74c3c;
          gap: 16px;
          font-weight: 500;
        }
        .wm-pages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 24px;
          width: 100%;
        }
        .wm-page-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--surface-solid);
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: box-shadow 0.2s;
        }
        .wm-page-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .wm-page-img-wrapper {
          position: relative;
          width: 100%;
        }
        .wm-page-img {
          width: 100%;
          height: auto;
          object-fit: contain;
          border: 1px solid var(--surface-border);
          border-radius: 4px;
        }
        .wm-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          overflow: hidden;
          padding: 8px;
        }
        .wm-mosaic-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          width: 200%;
          height: 200%;
          align-items: center;
          justify-content: center;
        }
        .wm-page-num {
          margin-top: 10px;
          font-size: 13px;
          color: var(--text-soft);
          font-weight: 500;
        }

        /* ===== Right Sidebar ===== */
        .wm-sidebar {
          width: 340px;
          background: var(--surface-solid);
          border-left: 1px solid var(--surface-border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .wm-sidebar-head {
          padding: 18px 22px;
          border-bottom: 1px solid var(--surface-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface);
        }
        .wm-sidebar-head h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--text-heading);
        }
        .wm-sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Tabs */
        .wm-tabs {
          display: flex;
          border-bottom: 2px solid var(--surface-border);
          margin-bottom: 4px;
        }
        .wm-tab {
          flex: 1;
          padding: 10px;
          background: transparent;
          border: none;
          font-weight: 600;
          font-size: 13px;
          color: var(--text-soft);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .wm-tab-active {
          color: #e74c3c;
          border-bottom: 2px solid #e74c3c;
          margin-bottom: -2px;
        }

        /* Fields */
        .wm-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .wm-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-heading);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .wm-input {
          padding: 10px 14px;
          border: 1px solid var(--surface-border);
          border-radius: 6px;
          font-size: 14px;
          width: 100%;
          font-family: inherit;
          background: var(--surface);
          color: var(--text-heading);
          transition: border-color 0.2s;
        }
        .wm-input:focus {
          border-color: #e74c3c;
          outline: none;
          box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
        }

        /* Format bar */
        .wm-format-bar {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .wm-font-select {
          flex: 1;
          padding: 8px 10px;
          border: 1px solid var(--surface-border);
          border-radius: 6px;
          font-size: 13px;
          background: var(--surface);
          color: var(--text-heading);
        }
        .wm-format-btns {
          display: flex;
          gap: 3px;
          align-items: center;
        }
        .wm-fmt-btn {
          width: 30px;
          height: 30px;
          background: var(--surface);
          border: 1px solid var(--surface-border);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-heading);
          transition: all 0.15s;
        }
        .wm-fmt-btn:hover {
          border-color: #e74c3c;
        }
        .wm-fmt-active {
          background: #e74c3c;
          color: #fff;
          border-color: #e74c3c;
        }
        .wm-color-wrap {
          width: 30px;
          height: 30px;
          border: 1px solid var(--surface-border);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        .wm-color-input {
          position: absolute;
          top: -4px;
          left: -4px;
          width: 38px;
          height: 38px;
          cursor: pointer;
          border: none;
        }

        /* Image upload zone */
        .wm-img-upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 32px 16px;
          border: 2px dashed var(--surface-border);
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          color: var(--text-soft);
          font-size: 14px;
          font-weight: 500;
        }
        .wm-img-upload-zone:hover {
          border-color: #e74c3c;
          background: color-mix(in srgb, #e74c3c 5%, transparent);
        }
        .wm-img-formats {
          font-size: 11px;
          color: var(--text-soft);
          opacity: 0.6;
        }
        .wm-img-preview-box {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border: 1px solid var(--surface-border);
          border-radius: 8px;
          background: var(--surface);
        }
        .wm-img-preview-thumb {
          width: 56px;
          height: 56px;
          object-fit: contain;
          border-radius: 6px;
          border: 1px solid var(--surface-border);
          background: #fff;
        }
        .wm-img-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }
        .wm-img-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-heading);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wm-img-remove-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid var(--surface-border);
          border-radius: 4px;
          padding: 4px 10px;
          font-size: 12px;
          color: #e74c3c;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.15s;
          width: fit-content;
        }
        .wm-img-remove-btn:hover {
          background: #e74c3c;
          color: #fff;
          border-color: #e74c3c;
        }

        .wm-size-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wm-size-range {
          flex: 1;
          accent-color: #e74c3c;
        }
        .wm-size-btn {
          width: 30px;
          height: 30px;
          border: 1px solid var(--surface-border);
          border-radius: 6px;
          background: var(--surface);
          color: var(--text-heading);
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
        }
        .wm-size-value {
          min-width: 48px;
          text-align: right;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-soft);
        }

        /* Position */
        .wm-pos-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .wm-pos-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          width: 72px;
          height: 72px;
          background: var(--surface-border);
          border: 1px solid var(--surface-border);
          border-radius: 4px;
          overflow: hidden;
          transition: opacity 0.2s;
        }
        .wm-pos-disabled {
          opacity: 0.3;
          pointer-events: none;
        }
        .wm-pos-cell {
          background: var(--surface);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: background 0.15s;
        }
        .wm-pos-cell:hover {
          background: var(--surface-solid);
        }
        .wm-pos-active {
          background: var(--surface-solid);
        }
        .wm-pos-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e74c3c;
        }
        .wm-mosaic-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-soft);
          cursor: pointer;
          font-weight: 500;
        }

        /* Row */
        .wm-row {
          display: flex;
          gap: 14px;
        }
        .wm-flex1 {
          flex: 1;
        }
        .wm-select {
          padding: 8px 10px;
          border: 1px solid var(--surface-border);
          border-radius: 6px;
          font-size: 13px;
          background: var(--surface);
          width: 100%;
          color: var(--text-heading);
        }

        /* Footer */
        .wm-sidebar-foot {
          padding: 18px 22px;
          border-top: 1px solid var(--surface-border);
          background: var(--surface);
        }
        .wm-sidebar-error {
          color: #e74c3c;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 10px;
        }
        .wm-action-btn {
          width: 100%;
          background: #e74c3c;
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.25);
        }
        .wm-action-btn:hover {
          background: #d04437;
          box-shadow: 0 6px 20px rgba(231, 76, 60, 0.35);
        }
        .wm-action-disabled {
          background: #f1948a;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Spinner */
        @keyframes wm-spin-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        :global(.wm-spin) {
          animation: wm-spin-anim 1s linear infinite;
        }

        /* ===== Mobile ===== */
        @media (max-width: 768px) {
          .wm-workspace {
            flex-direction: column;
          }
          .wm-sidebar {
            width: 100%;
            border-left: none;
            border-top: 1px solid var(--surface-border);
          }
          .wm-pages-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
