import Link from 'next/link';
import Navbar from './Navbar';
import Footer from './Footer';
import { AdInContent } from './AdBanner';
import { ALL_TOOLS } from '../lib/toolsList';

export default function ToolLayout({ tool, children }) {
  const related = ALL_TOOLS.filter(t => t.id !== tool.id).slice(0, 6);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '48px 24px 56px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
            <span style={{ color: '#475569' }}>›</span>
            <span style={{ color: '#f97316' }}>{tool.title}</span>
          </div>

          {/* Tool Icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 18, background: tool.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            {tool.icon}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: 36,
            color: 'white',
            marginBottom: 14,
            lineHeight: 1.15,
          }}>
            {tool.title}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7 }}>
            {tool.description}
          </p>

          {/* Features row */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            {['⚡ Fast Processing', '🔒 Secure & Private', '💯 Free to Use'].map(feat => (
              <span key={feat} style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>
        {children}
      </main>

      {/* Ad */}
      <AdInContent />

      {/* Related Tools */}
      <section style={{ background: 'white', borderTop: '1.5px solid #e2e8f0', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 22, marginBottom: 32, textAlign: 'center' }}>
            More PDF Tools
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {related.map(t => (
              <Link key={t.id} href={t.href} style={{ textDecoration: 'none' }}>
                <div className="tool-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{t.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
