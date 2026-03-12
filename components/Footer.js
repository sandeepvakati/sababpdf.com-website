import Link from 'next/link';
import { ALL_TOOLS } from '../lib/toolsList';

export default function Footer() {
  const toolLinks = ALL_TOOLS.slice(0, 12);

  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '60px 24px 32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, background: '#f97316', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white' }}>S</div>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 18, color: 'white' }}>Sabab<span style={{ color: '#f97316' }}>PDF</span></span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 220 }}>
              Free, fast, and secure online PDF tools. Process your files directly in your browser.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              {['twitter', 'github'].map(s => (
                <a key={s} href="#" style={{ width: 34, height: 34, background: '#1e293b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', textDecoration: 'none', fontSize: 14, transition: 'all 0.2s' }}>
                  {s === 'twitter' ? '𝕏' : '⭐'}
                </a>
              ))}
            </div>
          </div>

          {/* Popular Tools */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Popular Tools</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {toolLinks.slice(0, 6).map(tool => (
                <li key={tool.id}>
                  <Link href={tool.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.target.style.color = '#f97316'}
                    onMouseLeave={e => e.target.style.color = '#94a3b8'}>
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Tools */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 600, marginBottom: 16, fontSize: 15 }}>More Tools</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {toolLinks.slice(6, 12).map(tool => (
                <li key={tool.id}>
                  <Link href={tool.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, transition: 'color 0.15s' }}>
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Company</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['About Us', '/about'], ['Contact', '/contact']].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: 13 }}>© 2025 SababPDF. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13 }}>🔒 Files are processed securely.</span>
            <span style={{ fontSize: 13, color: '#4ade80' }}>● Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
