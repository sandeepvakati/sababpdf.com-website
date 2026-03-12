import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AdBanner, AdInContent } from '../components/AdBanner';
import { TOOL_GROUPS } from '../lib/toolsList';

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ===== HERO ===== */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0c1a2e 100%)',
        padding: '80px 24px 100px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, background: 'rgba(249,115,22,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 300, height: 300, background: 'rgba(99,102,241,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)',
            color: '#f97316', borderRadius: 999, padding: '6px 16px',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
            marginBottom: 28,
          }}>
            ✦ Free Online PDF Tools
          </div>

          <h1 style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: 'clamp(36px, 6vw, 64px)',
            color: 'white',
            lineHeight: 1.12,
            marginBottom: 24,
          }}>
            Every PDF Tool You Need,{' '}
            <span style={{ color: '#f97316' }}>Completely Free</span>
          </h1>

          <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.75, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Merge, split, compress, rotate, convert and edit PDFs in seconds.
            No signup required. Files processed in your browser — private and secure.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="#tools" className="btn-primary" style={{ background: '#f97316', color: 'white', padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              🚀 Explore All Tools
            </Link>
            <Link href="/merge-pdf" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1.5px solid rgba(255,255,255,0.12)', padding: '14px 32px', borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              📄 Merge PDF
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }}>
            {[['20+', 'PDF Tools'], ['100%', 'Free Forever'], ['⚡', 'Browser-Based'], ['🔒', 'No Upload Limit']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 26, color: 'white' }}>{val}</div>
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave divider */}
      <div style={{ background: '#0f172a', height: 40, position: 'relative' }}>
        <svg viewBox="0 0 1440 40" style={{ position: 'absolute', bottom: 0, width: '100%', display: 'block' }} preserveAspectRatio="none">
          <path d="M0,0 C480,40 960,40 1440,0 L1440,40 L0,40 Z" fill="#f8fafc" />
        </svg>
      </div>

      {/* ===== TOP AD ===== */}
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', background: '#f8fafc' }}>
        <AdBanner slot="banner" />
      </div>

      {/* ===== TOOLS GRID ===== */}
      <main id="tools" style={{ background: '#f8fafc', padding: '16px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {TOOL_GROUPS.map((group, gi) => (
            <section key={group.name} style={{ marginBottom: 64 }}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <h2 style={{
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                }}>
                  {group.name}
                </h2>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 16,
              }}>
                {group.tools.map(tool => (
                  <Link key={tool.id} href={tool.href} style={{ textDecoration: 'none' }}>
                    <div className="tool-card" style={{ height: '100%' }}>
                      {/* Icon */}
                      <div style={{
                        width: 52, height: 52,
                        background: tool.bg,
                        borderRadius: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24,
                        border: `1.5px solid ${tool.color}22`,
                      }}>
                        {tool.icon}
                      </div>

                      {/* Text */}
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 6, fontFamily: 'var(--font-syne)' }}>
                          {tool.title}
                        </h3>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                          {tool.description}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: tool.color, fontSize: 13, fontWeight: 600 }}>
                        Use Tool →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Insert ad after 2nd group */}
              {gi === 1 && (
                <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
                  <AdBanner slot="banner" />
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      {/* ===== FEATURES SECTION ===== */}
      <section style={{ background: 'white', padding: '80px 24px', borderTop: '1.5px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff7ed', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
              ✦ Why SababPDF
            </div>
            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 36, color: '#0f172a', marginBottom: 16 }}>
              Built for Speed & Security
            </h2>
            <p style={{ color: '#64748b', fontSize: 16 }}>Your files never leave your device for client-side tools.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {[
              { icon: '⚡', title: 'Lightning Fast', desc: 'Most tools process in under 3 seconds directly in your browser.' },
              { icon: '🔒', title: 'Secure & Private', desc: 'Client-side processing means your files never get uploaded to our servers.' },
              { icon: '💰', title: 'Completely Free', desc: 'All core tools are free. No hidden fees, no subscription required.' },
              { icon: '📱', title: 'Works Everywhere', desc: 'Mobile, tablet, or desktop — SababPDF works on any modern browser.' },
            ].map(f => (
              <div key={f.title} style={{ textAlign: 'center', padding: '32px 24px', borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AdInContent />
      <Footer />
    </>
  );
}
