import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignaturePadModal({ onSave, onCancel }) {
  const sigCanvas = useRef({});
  const [penColor, setPenColor] = useState('black');

  const clear = () => {
    sigCanvas.current.clear();
  };

  const save = () => {
    if (sigCanvas.current.isEmpty()) {
      return alert('Please provide a signature first.');
    }
    // Get transparent PNG base64 string
    const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="signature-modal-overlay">
      <div className="signature-modal">
        <div className="signature-modal-header">
          <h3>Draw Your Signature</h3>
          <button className="close-button" onClick={onCancel}>&times;</button>
        </div>
        
        <div className="signature-controls">
          <label>Color: </label>
          <button className={`color-swatch ${penColor === 'black' ? 'active' : ''}`} style={{backgroundColor: 'black'}} onClick={() => setPenColor('black')}></button>
          <button className={`color-swatch ${penColor === 'blue' ? 'active' : ''}`} style={{backgroundColor: 'blue'}} onClick={() => setPenColor('blue')}></button>
          <button className={`color-swatch ${penColor === 'red' ? 'active' : ''}`} style={{backgroundColor: 'red'}} onClick={() => setPenColor('red')}></button>
        </div>

        <div className="signature-canvas-container">
          <SignatureCanvas
            ref={sigCanvas}
            penColor={penColor}
            canvasProps={{ className: 'signature-canvas' }}
          />
        </div>

        <div className="signature-modal-footer">
          <button className="secondary-button" onClick={clear}>Clear</button>
          <button className="primary-button" onClick={save}>Insert Signature</button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .signature-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: rgba(15, 23, 42, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out forwards;
        }
        .signature-modal {
          background: #ffffff;
          border-radius: 16px;
          width: 90%;
          max-width: 540px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .signature-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .signature-modal-header h3 {
          margin: 0;
          font-size: 20px;
          color: #0f172a;
          font-weight: 600;
        }
        .close-button {
          background: #f1f5f9;
          color: #64748b;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .close-button:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .signature-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }
        .signature-controls label {
          font-size: 14px;
          font-weight: 500;
          color: #475569;
        }
        .color-swatch {
          width: 28px;
          height: 28px;
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
        .signature-canvas-container {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          margin-bottom: 24px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        .signature-canvas-container:hover {
          border-color: #94a3b8;
        }
        :global(.signature-canvas) {
          width: 100%;
          height: 240px;
          touch-action: none;
        }
        .signature-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
