'use client';

import Navbar from './Navbar';
import Footer from './Footer';

/**
 * UnifiedToolWrapper - iLovePDF-style wrapper for ALL tools.
 * Provides consistent UI: uses the main Navbar, hero section with tool title,
 * and a clean white card area for tool content.
 *
 * Props:
 * - tool: { id, title, description, color } from toolsList
 * - children: the actual tool content (dropzone, settings, etc.)
 */
export default function UnifiedToolWrapper({ tool, children }) {
  // Pick accent color based on tool color, fallback to red
  const accentColor = tool?.color || '#e74c3c';

  return (
    <div className="unified-wrapper-container">
      {/* Use the main Navbar instead of a duplicate header */}
      <Navbar />

      {/* Hero Section */}
      <section className="unified-hero">
        <div className="unified-hero-content">
          <h1 className="unified-title">
            <span className="unified-highlight">{tool?.title || 'PDF Tool'}</span>
          </h1>
          <p className="unified-subtitle">
            {tool?.description || 'Process your PDF files with ease'}
          </p>
          <div className="unified-hero-badges">
            <span className="unified-badge">🚫 No Login</span>
            <span className="unified-badge">⚡ Instant</span>
            <span className="unified-badge">🔒 Secure</span>
          </div>
        </div>
      </section>

      {/* Main Tool Card */}
      <section className="unified-tool-card">
        {children}
      </section>

      {/* Features Section */}
      <section className="unified-features-section">
        <h2 className="unified-features-title">Why use SababPDF?</h2>
        <div className="unified-features-grid">
          <div className="unified-feature-card">
            <div className="unified-feature-icon">🎯</div>
            <h3>Easy to Use</h3>
            <p>Simple drag and drop interface. No learning curve required.</p>
          </div>
          <div className="unified-feature-card">
            <div className="unified-feature-icon">⚡</div>
            <h3>Fast Processing</h3>
            <p>Process your files quickly right in your browser.</p>
          </div>
          <div className="unified-feature-card">
            <div className="unified-feature-icon">🔒</div>
            <h3>Secure &amp; Private</h3>
            <p>
              {tool?.processing === 'client' 
                ? 'Files stay in your browser. Nothing is uploaded to external servers.'
                : 'Processed on our secure servers. Files are automatically deleted after conversion.'}
            </p>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .unified-wrapper-container {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--page-top) 0%, var(--page-bg) 48%, var(--page-bottom) 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* ===== Hero ===== */
        .unified-hero {
          background: var(--hero-deep-bg);
          padding: 48px 20px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .unified-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -20%;
          width: 140%;
          height: 200%;
          background: radial-gradient(ellipse at 30% 20%, var(--hero-deep-glow-a) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, var(--hero-deep-glow-b) 0%, transparent 50%);
          pointer-events: none;
        }
        .unified-hero-content {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
        }
        .unified-title {
          font-size: clamp(2.2rem, 5vw, 3.2rem);
          font-weight: 900;
          margin: 0;
          color: var(--text-contrast);
          letter-spacing: -0.02em;
        }
        .unified-highlight {
          background: linear-gradient(135deg, #e74c3c 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .unified-subtitle {
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: var(--hero-copy);
          margin: 12px 0 20px;
          font-weight: 400;
          line-height: 1.6;
        }
        .unified-hero-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }
        .unified-badge {
          padding: 6px 16px;
          background: var(--hero-badge-bg);
          border: 1px solid var(--hero-badge-border);
          border-radius: 50px;
          color: var(--hero-badge-text);
          font-size: 0.82rem;
          font-weight: 600;
        }

        /* ===== Tool Card ===== */
        .unified-tool-card {
          max-width: 960px;
          margin: -20px auto 32px;
          background: var(--surface-solid);
          border: 1px solid var(--surface-border);
          border-radius: 20px;
          box-shadow: var(--card-shadow-soft);
          padding: 32px;
          position: relative;
          z-index: 2;
        }

        /* ===== Features ===== */
        .unified-features-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px;
        }
        .unified-features-title {
          font-size: 1.8rem;
          font-weight: 800;
          text-align: center;
          margin: 0 0 32px;
          color: var(--text-heading);
        }
        .unified-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .unified-feature-card {
          padding: 28px 20px;
          border-radius: 16px;
          background: var(--surface-solid);
          border: 1px solid var(--surface-border);
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          box-shadow: var(--card-shadow-soft);
        }
        .unified-feature-card:hover {
          transform: translateY(-4px);
          border-color: var(--tool-hover-border);
          box-shadow:
            var(--card-shadow-soft),
            0 0 0 1px var(--tool-hover-border),
            0 14px 32px var(--tool-hover-glow);
        }
        .unified-feature-icon {
          font-size: 2.2rem;
          margin-bottom: 12px;
        }
        .unified-feature-card h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-heading);
          margin: 0 0 6px;
        }
        .unified-feature-card p {
          color: var(--text-soft);
          margin: 0;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        /* ===== Mobile ===== */
        @media (max-width: 768px) {
          .unified-tool-card {
            margin: -10px 12px 24px;
            padding: 20px;
          }
          .unified-hero {
            padding: 32px 16px 28px;
          }
          .unified-hero-badges {
            gap: 6px;
          }
          .unified-badge {
            font-size: 0.75rem;
            padding: 5px 12px;
          }
        }
      `}</style>

      {/* Override ToolWorkspace styles when embedded inside UnifiedToolWrapper */}
      <style jsx global>{`
        .unified-tool-card .tool-workspace {
          gap: 16px;
        }
        .unified-tool-card .surface-card {
          padding: 0;
          background: transparent;
          border-radius: 0;
          border: none;
          box-shadow: none;
        }
        .unified-tool-card .surface-header {
          display: none;
        }
        .unified-tool-card .workflow-guide {
          display: none;
        }
        .unified-tool-card .action-row {
          text-align: center;
        }
        .unified-tool-card .action-row .primary-button {
          background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%);
          color: var(--text-contrast);
          border: none;
          padding: 18px 56px;
          border-radius: 12px;
          font-size: 1.15rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px ${accentColor}44;
          transition: all 0.3s ease;
          min-width: 280px;
        }
        .unified-tool-card .action-row .primary-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px ${accentColor}55;
        }
        .unified-tool-card .process-banner {
          border-radius: 12px;
          margin-top: 16px;
        }
        .unified-tool-card .processing-progress-card {
          border-radius: 12px;
        }
        .unified-tool-card .content-grid {
          grid-template-columns: 1fr;
        }

        /* Style the new iLovePDF uploader inside the tool card */
        .unified-tool-card .ilp-uploader {
          background: var(--surface);
          border-radius: 16px;
        }
      `}</style>
    </div>
  );
}
