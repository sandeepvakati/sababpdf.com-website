'use client';

import { formatBytes } from '../lib/pdfUtils';

function getTimingCopy(pageCount, mode) {
  if (!pageCount) {
    return {
      title: mode === 'layout' ? 'Keep PDF layout mode' : mode === 'ocr' ? 'OCR mode' : 'No OCR mode',
      detail:
        mode === 'layout'
          ? 'This mode keeps each PDF page looking much closer to the original page.'
          : mode === 'ocr'
            ? 'This mode reads scanned or image-based PDFs with OCR so non-selectable text can become editable in Word.'
            : 'This mode uses an enhanced layout-aware converter for PDFs that already have selectable text, so the Word file usually keeps structure, tables, and image positions much better.',
    };
  }

  if (pageCount > 1000) {
    return {
      title: 'Large document detected',
      detail:
        mode === 'layout'
          ? `This PDF has ${pageCount} pages. Keeping the original page layout can take several minutes for a file this large.`
          : mode === 'ocr'
            ? `This PDF has ${pageCount} pages. OCR mode can take several minutes for a file this large because every page image must be read before the DOCX is built.`
            : `This PDF has ${pageCount} pages. The enhanced editable converter can take several minutes for a file this large, but it should keep page structure more faithfully than a plain text extractor.`,
    };
  }

  if (pageCount > 250) {
    return {
      title: 'Medium to large document',
      detail:
        mode === 'layout'
          ? `This PDF has ${pageCount} pages. The DOCX is being built page-by-page so formulas, images, and page positions stay closer to the PDF.`
          : mode === 'ocr'
            ? `This PDF has ${pageCount} pages. OCR mode is best for scanned PDFs, but recognition quality still depends on the scan clarity.`
            : `This PDF has ${pageCount} pages. The enhanced converter will try to keep text editable, tables structured, and images closer to their original PDF positions.`,
    };
  }

  return {
    title: mode === 'layout' ? 'Ready to preserve layout' : mode === 'ocr' ? 'Ready for OCR conversion' : 'Ready for editing',
      detail:
        mode === 'layout'
          ? `This PDF has ${pageCount} pages. The Word file will keep each page visually aligned with the original PDF.`
        : mode === 'ocr'
          ? `This PDF has ${pageCount} pages. OCR mode will try to turn scanned page text into editable Word text.`
          : `This PDF has ${pageCount} pages. The enhanced converter keeps simple text editable, and visually complex pages can fall back to a preserved page look when that gives a better result.`,
  };
}

function getModeSummary(mode) {
  if (mode === 'layout') {
    return {
      title: 'What the Word file will keep',
      stats: [
        { label: 'Layout', value: 'Preserved page by page' },
        { label: 'Text', value: 'Not freely editable' },
        { label: 'Images', value: 'Locked in page look' },
        { label: 'Formulas', value: 'Kept in page position' },
      ],
      features: [
        'Each PDF page added to the DOCX as one matching Word page.',
        'Images stay in the same visual position they have in the PDF.',
        'Mathematical formulas stay visible in the same page layout.',
        'Complex tables, colors, and spacing stay much closer to the source page.',
      ],
    };
  }

  if (mode === 'ocr') {
    return {
      title: 'What the OCR Word file will try to keep',
      stats: [
        { label: 'Source', value: 'Scanned or image PDF' },
        { label: 'Text', value: 'OCR into editable Word text' },
        { label: 'Images', value: 'Best-effort extraction' },
        { label: 'Accuracy', value: 'Depends on scan quality' },
      ],
      features: [
        'Scanned page text is read with OCR so it can become editable in Word.',
        'Clean scans give better OCR results than blurry or low-contrast scans.',
        'Images may still be inserted when the converter can extract them safely.',
        'Complex formulas and unusual symbols may need manual correction after OCR.',
      ],
    };
  }

  return {
    title: 'What the enhanced editable Word file will try to keep',
    stats: [
      { label: 'Source', value: 'Selectable-text PDF' },
      { label: 'Engine', value: 'Enhanced layout-aware DOCX' },
      { label: 'Layout', value: 'Stronger page match' },
      { label: 'Text', value: 'Editable in Word' },
      { label: 'Images', value: 'Movable and replaceable' },
      { label: 'Formulas', value: 'Visual when needed' },
    ],
      features: [
        'A stronger PDF-to-DOCX engine is used first for digital PDFs with selectable text.',
        'Text stays editable in Word while page structure, tables, and spacing are preserved more faithfully.',
        'Images are inserted into the DOCX so you can move or replace them later.',
        'If a page is too visually complex, the converter can preserve that page as a faithful visual layout instead of rebuilding it poorly.',
      ],
  };
}

export default function PdfToWordPreview({
  file,
  pageCount,
  mode = 'no-ocr',
  modeOptions = [],
  onModeChange,
  onRemove,
}) {
  if (!file) {
    return null;
  }

  const timingCopy = getTimingCopy(pageCount, mode);
  const modeSummary = getModeSummary(mode);

  return (
    <section className="pdf-preview-card">
      <div className="pdf-preview-header">
        <div className="pdf-preview-icon" aria-hidden="true">
          DOCX
        </div>
        <div className="pdf-preview-info">
          <h3>Preview: what will be converted</h3>
          <p className="pdf-preview-filename">{file.name}</p>
          <p className="pdf-preview-size">{formatBytes(file.size)}</p>
        </div>
      </div>

      <div className="pdf-preview-content">
        <div className="pdf-preview-actions">
          <span className="file-item-badge">Ready</span>
          {onRemove ? (
            <button type="button" onClick={onRemove} className="file-item-remove" aria-label="Clear selected PDF">
              ×
            </button>
          ) : null}
        </div>

        <div className="pdf-preview-mode-panel">
          <div className="pdf-preview-mode-copy">
            <h4>Word output mode</h4>
            <p>
              Choose <strong>No OCR</strong> for PDFs with selectable text, <strong>OCR</strong> for scanned PDFs with
              non-selectable text, or <strong>Keep PDF layout</strong> when you want the page look closest to the
              original PDF. No OCR now uses the stronger editable converter first and can preserve visually complex
              pages when that gives a better Word result.
            </p>
          </div>

          <div className="mode-option-row" role="group" aria-label="Choose PDF to Word output mode">
            {modeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`mode-option-button${mode === option.value ? ' mode-option-button-active' : ''}`}
                onClick={() => onModeChange?.(option.value)}
                aria-pressed={mode === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="pdf-preview-mode-notes">
            {modeOptions.map((option) => (
              <div
                key={option.value}
                className={`pdf-preview-mode-note${mode === option.value ? ' pdf-preview-mode-note-active' : ''}`}
              >
                <strong>{option.label}</strong>
                <p>{option.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pdf-preview-stats">
          <div className="stat-item">
            <div className="stat-detail">
              <span className="stat-label">Pages</span>
              <span className="stat-value">{pageCount || '?'}</span>
            </div>
          </div>
          {modeSummary.stats.map((item) => (
            <div key={item.label} className="stat-item">
              <div className="stat-detail">
                <span className="stat-label">{item.label}</span>
                <span className="stat-value">{item.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pdf-preview-features">
          <h4>{modeSummary.title}</h4>
          <ul>
            {modeSummary.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>

        <div className="pdf-preview-info-box">
          <strong>{timingCopy.title}</strong>
          <p>{timingCopy.detail}</p>
        </div>
      </div>

      <style jsx>{`
        .pdf-preview-card {
          margin-top: 1.25rem;
          border-radius: 1.25rem;
          border: 1px solid rgba(95, 119, 173, 0.2);
          background: linear-gradient(180deg, rgba(243, 246, 255, 0.95) 0%, rgba(245, 241, 255, 0.95) 100%);
          padding: 1.5rem;
          box-shadow: 0 18px 40px rgba(102, 111, 153, 0.08);
        }

        .pdf-preview-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .pdf-preview-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 3.25rem;
          height: 3.25rem;
          border-radius: 1rem;
          background: #e7ecff;
          color: #4966d1;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .pdf-preview-info {
          min-width: 0;
        }

        .pdf-preview-info h3 {
          margin: 0;
          font-size: 1.55rem;
          line-height: 1.1;
          color: #1f2633;
        }

        .pdf-preview-filename {
          margin: 0.35rem 0 0;
          color: #354055;
          font-size: 1rem;
          font-weight: 600;
          word-break: break-word;
        }

        .pdf-preview-size {
          margin: 0.25rem 0 0;
          color: #70819a;
          font-size: 0.95rem;
        }

        .pdf-preview-content {
          display: grid;
          gap: 1rem;
        }

        .pdf-preview-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.85rem;
        }

        .pdf-preview-mode-panel {
          display: grid;
          gap: 0.9rem;
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(107, 122, 164, 0.14);
          padding: 1rem 1.1rem;
        }

        .pdf-preview-mode-copy h4 {
          margin: 0;
          font-size: 1rem;
          color: #1f2633;
        }

        .pdf-preview-mode-copy p {
          margin: 0.45rem 0 0;
          color: #404c62;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .pdf-preview-mode-notes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.8rem;
        }

        .pdf-preview-mode-note {
          border-radius: 0.95rem;
          border: 1px solid rgba(107, 122, 164, 0.12);
          background: rgba(243, 246, 255, 0.56);
          padding: 0.85rem 0.95rem;
        }

        .pdf-preview-mode-note strong {
          display: block;
          color: #1f2633;
          font-size: 0.94rem;
        }

        .pdf-preview-mode-note p {
          margin: 0.35rem 0 0;
          color: #556277;
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .pdf-preview-mode-note-active {
          border-color: rgba(73, 102, 209, 0.24);
          background: rgba(231, 236, 255, 0.72);
        }

        .pdf-preview-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.85rem;
        }

        .stat-item {
          border-radius: 0.95rem;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(107, 122, 164, 0.16);
          padding: 0.9rem 1rem;
        }

        .stat-detail {
          display: grid;
          gap: 0.2rem;
        }

        .stat-label {
          font-size: 0.72rem;
          color: #74819a;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .stat-value {
          font-size: 0.98rem;
          font-weight: 700;
          color: #1f2633;
        }

        .pdf-preview-features {
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(107, 122, 164, 0.14);
          padding: 1rem 1.1rem;
        }

        .pdf-preview-features h4 {
          margin: 0 0 0.7rem;
          font-size: 0.98rem;
          color: #1f2633;
        }

        .pdf-preview-features ul {
          margin: 0;
          padding-left: 1.1rem;
          display: grid;
          gap: 0.5rem;
          color: #404c62;
          font-size: 0.95rem;
        }

        .pdf-preview-info-box {
          border-radius: 1rem;
          background: #fff4d9;
          border: 1px solid #f3cd7a;
          padding: 0.95rem 1rem;
        }

        .pdf-preview-info-box strong {
          display: block;
          color: #9a5a08;
          font-size: 0.98rem;
          margin-bottom: 0.25rem;
        }

        .pdf-preview-info-box p {
          margin: 0;
          color: #9a5a08;
          font-size: 0.92rem;
          line-height: 1.55;
        }
      `}</style>
    </section>
  );
}
