import Link from 'next/link';
import Navbar from './Navbar';
import Footer from './Footer';
import { AdInContent } from './AdBanner';
import ToolCard from './ToolCard';
import ToolIcon from './ToolIcon';
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

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <ToolIcon tool={tool} size="hero" />
          </div>

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
