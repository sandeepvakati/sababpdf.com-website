'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ALL_TOOLS } from '../lib/toolsList';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredTools = searchQuery.length > 1
    ? ALL_TOOLS.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.keywords || []).some(k => k.includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <header style={{
      background: 'white',
      borderBottom: '1.5px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64, gap: 24 }}>
        
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, background: '#f97316', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: 'white', fontFamily: 'var(--font-syne)',
          }}>S</div>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 18, color: '#0f172a' }}>
            Sabab<span style={{ color: '#f97316' }}>PDF</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
          <Link href="/" className="nav-link" style={navLink}>All Tools</Link>
          <Link href="/merge-pdf" style={navLink}>Merge</Link>
          <Link href="/split-pdf" style={navLink}>Split</Link>
          <Link href="/compress-pdf" style={navLink}>Compress</Link>
          <Link href="/jpg-to-pdf" style={navLink}>JPG to PDF</Link>
          <Link href="/pdf-to-jpg" style={navLink}>PDF to JPG</Link>
        </nav>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🔍 Search tools...
          </button>
          
          {showSearch && (
            <div style={{ position: 'absolute', right: 0, top: '110%', width: 320, background: 'white', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1.5px solid #e2e8f0', padding: 12, zIndex: 200 }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search PDF tools..."
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-plus-jakarta)' }}
              />
              {filteredTools.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredTools.map(tool => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', color: '#0f172a', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 20 }}>{tool.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{tool.title}</span>
                    </Link>
                  ))}
                </div>
              )}
              {searchQuery.length > 1 && filteredTools.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: 13, padding: '8px 4px' }}>No tools found for "{searchQuery}"</p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .nav-link { color: #475569; text-decoration: none; font-size: 14px; font-weight: 500; padding: 6px 12px; border-radius: 8px; transition: all 0.15s; }
        .nav-link:hover { background: #f8fafc; color: #0f172a; }
      `}</style>
    </header>
  );
}

const navLink = {
  color: '#475569',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: 8,
  transition: 'all 0.15s',
};
