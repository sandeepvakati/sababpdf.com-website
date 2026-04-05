'use client';

import { useEffect, useState } from 'react';

export default function ProgressBar({ conversionId, isVisible }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Starting');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isVisible || !conversionId) return;

    const pollProgress = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/progress/${conversionId}`);
        if (response.ok) {
          const data = await response.json();
          setProgress(Math.min(100, data.progress || 0));
          setStatus(data.status || 'Processing');
          setElapsedTime(Math.floor((data.elapsedTime || 0) / 1000));
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      }
    };

    // Poll every 200ms for smooth updates
    const interval = setInterval(pollProgress, 200);

    // Initial fetch
    pollProgress();

    return () => clearInterval(interval);
  }, [conversionId, isVisible]);

  if (!isVisible || !conversionId) return null;

  const progressPercentage = Math.round(progress);

  return (
    <div className="progress-container">
      <style>{`
        .progress-container {
          margin: 24px 0;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .progress-title {
          font-size: 18px;
          font-weight: 600;
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .progress-time {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .progress-percentage {
          font-size: 32px;
          font-weight: 700;
          color: white;
          text-align: center;
          margin: 20px 0;
          font-family: 'Monaco', 'Courier New', monospace;
          letter-spacing: 2px;
        }

        .progress-bar-container {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
          width: \${progressPercentage}%;
          transition: width 0.3s ease-out;
          border-radius: 6px;
          position: relative;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        }

        .progress-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 2px;
          height: 100%;
          background: rgba(255, 255, 255, 0.5);
          animation: cursor-blink 1s ease-in-out infinite;
        }

        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .progress-status {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.95);
          text-align: center;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .progress-step {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .progress-step::before {
          content: '';
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div className="progress-header">
        <div className="progress-title">
          <div className="progress-spinner"></div>
          Converting Your File
        </div>
        <div className="progress-time">
          {elapsedTime}s
        </div>
      </div>

      <div className="progress-percentage">
        {progressPercentage.toString().padStart(3, '0')}%
      </div>

      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="progress-status">
        <div className="progress-step">
          {status}
        </div>
      </div>
    </div>
  );
}
