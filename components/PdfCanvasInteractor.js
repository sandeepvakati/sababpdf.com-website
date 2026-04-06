'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function PdfCanvasInteractor({ 
  file, 
  mode, // 'edit' or 'redact'
  onComplete,
  onCancel
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [renderTask, setRenderTask] = useState(null);
  const [pageViewport, setPageViewport] = useState(null);

  // Redaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [redactions, setRedactions] = useState([]);
  const [currentRect, setCurrentRect] = useState(null);

  // Edit State (Adding Text)
  const [texts, setTexts] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [textPos, setTextPos] = useState(null);

  // UI state
  const [fontSize, setFontSize] = useState(20);
  const [textColor, setTextColor] = useState('#EF4444'); // Tailwind red-500

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setPageNum(1);
      } catch (err) {
        console.error("Error loading PDF:", err);
      }
    };
    if (file) loadPdf();
  }, [file]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum);
    }
  }, [pdfDoc, pageNum, scale]);

  const renderPage = async (num) => {
    if (renderTask) await renderTask.cancel();

    const page = await pdfDoc.getPage(num);
    // Auto-scale to fit container width, expanding nicely
    const containerWidth = containerRef.current?.clientWidth || 800;
    const defaultViewport = page.getViewport({ scale: 1 });
    const fitScale = Math.min((containerWidth - 60) / defaultViewport.width, 2.0); // Allow higher scale for reading
    const useScale = scale !== 1.0 ? scale : fitScale;
    
    const viewport = page.getViewport({ scale: useScale });
    setPageViewport(viewport);

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    const task = page.render(renderContext);
    setRenderTask(task);
    
    // Attempt render gracefully
    try {
      await task.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Render error:', err);
      }
    }
  };

  // --- Interaction Handlers ---

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e) => {
    const coords = getCanvasCoords(e);
    if (mode === 'redact') {
      setIsDrawing(true);
      setStartPos(coords);
      setCurrentRect({ ...coords, width: 0, height: 0 });
    } else if (mode === 'edit') {
      if (textPos) {
        // Confirm previous text
        if (currentText.trim()) {
          setTexts([...texts, { ...textPos, text: currentText, size: fontSize, color: textColor }]);
        }
        setTextPos(null);
        setCurrentText('');
      } else {
        // Start new text
        setTextPos(coords);
        setCurrentText('');
      }
    }
  };

  const handlePointerMove = (e) => {
    if (mode === 'redact' && isDrawing) {
      const coords = getCanvasCoords(e);
      setCurrentRect({
        x: Math.min(coords.x, startPos.x),
        y: Math.min(coords.y, startPos.y),
        width: Math.abs(coords.x - startPos.x),
        height: Math.abs(coords.y - startPos.y)
      });
    }
  };

  const handlePointerUp = () => {
    if (mode === 'redact' && isDrawing) {
      setIsDrawing(false);
      // Only keep rectangles drawn over 5 pixels wide (avoid accidental clicks)
      if (currentRect && currentRect.width > 5 && currentRect.height > 5) {
        setRedactions([...redactions, currentRect]);
      }
      setCurrentRect(null);
    }
  };

  const handleApply = () => {
    const vp = pageViewport;
    const items = mode === 'redact' 
      ? redactions.map(r => ({
          type: 'rect',
          page: pageNum,
          x: r.x / vp.width,
          y: r.y / vp.height,
          width: r.width / vp.width,
          height: r.height / vp.height
        }))
      : texts.map(t => ({
          type: 'text',
          page: pageNum,
          text: t.text,
          x: t.x / vp.width,
          y: t.y / vp.height,
          size: t.size,
          color: t.color
        }));

    // Add current pending text if exists explicitly before apply
    if (mode === 'edit' && textPos && currentText.trim()) {
      items.push({
        type: 'text',
        page: pageNum,
        text: currentText,
        x: textPos.x / vp.width,
        y: textPos.y / vp.height,
        size: fontSize,
        color: textColor
      });
    }

    onComplete(items);
  };

  return (
    <div className="pdf-interactor-premium" ref={containerRef}>
      
      {/* Sleek Glassmorphic Floating Toolbar */}
      <div className="interactor-top-toolbar">
        <div className="toolbar-section">
          <span className="toolbar-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
              {mode === 'redact' ? (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <path d="M3 9h18"/><path d="M9 21V9"/>
                </>
              ) : (
                <>
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </>
              )}
            </svg>
            {mode === 'redact' ? 'Redact Tool' : 'Text Editor'}
          </span>
          <div className="toolbar-divider" />
          <span className="toolbar-metric">{mode === 'edit' ? `${texts.length + (currentText ? 1 : 0)} text boxes` : `${redactions.length} redactions`}</span>
        </div>

        {mode === 'edit' && (
          <div className="toolbar-section">
            <label className="toolbar-label">Font Size</label>
            <input type="range" min="12" max="60" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="toolbar-slider" />
            <span className="toolbar-value">{fontSize}px</span>
            
            <div className="toolbar-divider" />
            
            <label className="toolbar-label">Color</label>
            <div className="color-swatches">
              {['#EF4444', '#10B981', '#3B82F6', '#000000'].map(c => (
                <button
                  key={c}
                  className={`color-swatch ${textColor === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setTextColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="interactor-canvas-wrapper" style={{ cursor: mode === 'redact' ? 'crosshair' : 'text' }}>
        <div className="canvas-shadow-container"
             onPointerDown={handlePointerDown}
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}>
          
          <canvas ref={canvasRef} className="pdf-canvas" />

          {/* Render applied redactions with crosshatch styling */}
          {mode === 'redact' && redactions.map((r, i) => (
            <div key={i} className="redaction-box applied" style={{
              left: r.x, top: r.y,
              width: r.width, height: r.height,
            }}>
              <span className="redaction-label">REDACTED</span>
            </div>
          ))}

          {/* Render drawing redaction with red border */}
          {mode === 'redact' && isDrawing && currentRect && (
            <div className="redaction-box drawing" style={{
              left: currentRect.x, top: currentRect.y,
              width: currentRect.width, height: currentRect.height,
            }} />
          )}

          {/* Render applied text */}
          {mode === 'edit' && texts.map((t, i) => (
            <div key={i} className="text-box applied" style={{
              left: t.x, top: t.y,
              color: t.color || '#EF4444',
              fontSize: `${t.size || 20}px`,
            }}>
              {t.text}
            </div>
          ))}

          {/* Render current text input */}
          {mode === 'edit' && textPos && (
            <input 
              autoFocus
              type="text" 
              value={currentText}
              onChange={e => setCurrentText(e.target.value)}
              placeholder="Type here..."
              className="text-box input-mode"
              style={{
                left: textPos.x, top: textPos.y,
                color: textColor,
                fontSize: `${fontSize}px`,
              }}
            />
          )}

        </div>
      </div>

      <div className="interactor-bottom-toolbar">
        <div className="pagination">
          <button className="secondary-button" disabled={pageNum <= 1} onClick={() => setPageNum(pageNum - 1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Prev
          </button>
          <span className="page-indicator">Page {pageNum} of {numPages}</span>
          <button className="secondary-button" disabled={pageNum >= numPages} onClick={() => setPageNum(pageNum + 1)}>
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        
        <div className="actions">
          <button className="secondary-button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" onClick={handleApply}>
            {mode === 'redact' ? 'Apply Redaction' : 'Apply Edits'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .pdf-interactor-premium {
          position: relative;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          min-height: 600px;
        }

        /* Top Toolbar Styles */
        .interactor-top-toolbar {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e2e8f0;
        }
        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .toolbar-title {
          font-weight: 600;
          color: #0f172a;
          display: flex;
          align-items: center;
          font-size: 15px;
        }
        .toolbar-metric {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .toolbar-divider {
          width: 1px;
          height: 24px;
          background-color: #cbd5e1;
          margin: 0 4px;
        }
        .toolbar-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .toolbar-slider {
          accent-color: #f97316;
          cursor: pointer;
        }
        .toolbar-value {
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          min-width: 32px;
        }
        .color-swatches {
          display: flex;
          gap: 6px;
        }
        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .color-swatch:hover {
          transform: scale(1.1);
        }
        .color-swatch.active {
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0f172a;
        }

        /* Canvas Arena Styles */
        .interactor-canvas-wrapper {
          flex: 1;
          padding: 32px 24px;
          overflow: auto;
          display: flex;
          justify-content: center;
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: #f1f5f9;
        }
        .canvas-shadow-container {
          position: relative;
          display: inline-block;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background: #fff;
          border-radius: 4px;
        }
        .pdf-canvas {
          display: block;
          border-radius: 4px;
        }

        /* Tool Overlay Styles */
        .redaction-box {
          position: absolute;
          box-sizing: border-box;
          pointer-events: none;
          z-index: 5;
        }
        .redaction-box.drawing {
          background-color: rgba(0, 0, 0, 0.4);
          border: 2px dashed #dc2626;
        }
        .redaction-box.applied {
          background-color: #0f172a;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        .redaction-label {
          color: #ffffff;
          opacity: 0.8;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
        }
        
        .text-box {
          position: absolute;
          font-family: Helvetica, Arial, sans-serif;
          transform: translateY(-100%);
        }
        .text-box.applied {
          pointer-events: none;
        }
        .text-box.input-mode {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          border: 2px solid #3b82f6;
          border-radius: 4px;
          padding: 4px 8px;
          outline: none;
          min-width: 250px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transform: translateY(-100%) translateX(-8px);
          transition: box-shadow 0.2s ease;
        }
        .text-box.input-mode:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        /* Bottom Toolbar Styles */
        .interactor-bottom-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #fff;
          border-top: 1px solid #e2e8f0;
          border-radius: 0 0 12px 12px;
        }
        .pagination { display: flex; gap: 12px; align-items: center; }
        .page-indicator { font-size: 14px; font-weight: 500; color: #475569; }
        .actions { display: flex; gap: 12px; align-items: center; }

        /* Secondary Button Adjustments */
        .secondary-button {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
