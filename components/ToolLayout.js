import Link from 'next/link';
import Navbar from './Navbar';
import Footer from './Footer';
import { AdInContent } from './AdBanner';
import ToolCard from './ToolCard';
import { ALL_TOOLS } from '../lib/toolsList';

export default function ToolLayout({ tool, children }) {
  const related = ALL_TOOLS.filter((item) => item.id !== tool.id).slice(0, 6);

  return (
    <>
      <Navbar />

      <div className="page-hero-band">
        <div className="page-shell page-summary">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <span className="accent-line">{tool.title}</span>
          </div>

          <div
            className="tool-hero-icon"
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: tool.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid rgba(90, 55, 20, 0.08)',
              color: tool.color,
            }}
          >
            {typeof tool.icon === 'string' && tool.icon.includes('<svg') ? (
              <span
                dangerouslySetInnerHTML={{ __html: tool.icon }}
                style={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            ) : (
              <span style={{ fontWeight: 800, fontSize: 34 }}>{tool.glyph || tool.icon}</span>
            )}
          </div>

          <style jsx>{`
            .tool-hero-icon svg {
              width: 48px;
              height: 48px;
              max-width: 100%;
              max-height: 100%;
            }
          `}</style>

          <h1 className="section-heading" style={{ marginBottom: 12 }}>
            {tool.title}
          </h1>
          <p>{tool.description}</p>

          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
            {['Fast processing', 'Secure workflow notes', 'Free browser-side tools'].map((feature) => (
              <span key={feature} className="pill">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="page-shell" style={{ paddingBottom: 12 }}>
        {children}
      </main>

      <AdInContent />

      <section className="page-shell section-block">
        <div className="surface-card">
          <h2 className="section-heading" style={{ textAlign: 'center', marginBottom: 20, fontSize: '2rem' }}>
            More PDF Tools
          </h2>
          <div className="tool-grid">
            {related.map((relatedTool) => (
              <ToolCard key={relatedTool.id} tool={relatedTool} compact />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
