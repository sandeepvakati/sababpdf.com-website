'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';
import { ALL_TOOLS, TOOL_GROUPS } from '../lib/toolsList';

export default function Navbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const filteredTools =
    searchQuery.length > 1
      ? ALL_TOOLS.filter(
          (tool) =>
            tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tool.keywords || []).some((keyword) => keyword.toLowerCase().includes(searchQuery.toLowerCase())),
        )
      : [];

  const mainLinks = [
    ['Merge PDF', '/merge-pdf'],
    ['Split PDF', '/split-pdf'],
    ['Compress PDF', '/compress-pdf'],
    ['JPG to PDF', '/jpg-to-pdf'],
    ['Privacy', '/privacy'],
  ];

  useEffect(() => {
    setShowSearch(false);
    setShowToolsMenu(false);
  }, [pathname]);

  function openToolsMenu() {
    setShowToolsMenu(true);
    setShowSearch(false);
  }

  return (
    <header
      className="nav-shell"
      onMouseLeave={() => {
        setShowToolsMenu(false);
        setShowSearch(false);
      }}
    >
      <div className="page-shell nav-inner">
        <Link href="/" className="brand-link" onClick={() => setShowToolsMenu(false)}>
          <BrandLogo />
        </Link>

        <nav className="nav-links">
          <div
            className="nav-tools-trigger"
            onMouseEnter={openToolsMenu}
          >
            <button
              type="button"
              className={`nav-link nav-link-button ${showToolsMenu || pathname === '/' ? 'nav-link-active' : ''}`}
              onClick={() => setShowToolsMenu((open) => !open)}
            >
              All Tools
            </button>
          </div>

          {mainLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'nav-link-active' : ''}`}
              onMouseEnter={() => setShowToolsMenu(false)}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="search-box">
          <button
            type="button"
            className="search-toggle"
            onMouseEnter={() => setShowToolsMenu(false)}
            onClick={() => {
              setShowToolsMenu(false);
              setShowSearch((open) => !open);
            }}
          >
            Search tools
          </button>

          {showSearch ? (
            <div className="search-panel">
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search PDF tools..."
              />
              {filteredTools.length > 0 ? (
                <div className="result-list">
                  {filteredTools.map((tool) => {
                    const isSvgIcon = typeof tool.icon === 'string' && tool.icon.includes('<svg');
                    return (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        className="result-link"
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                      >
                        <span style={{ fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSvgIcon ? (
                            <span 
                              dangerouslySetInnerHTML={{ __html: tool.icon }}
                              style={{ width: 24, height: 24 }}
                            />
                          ) : (
                            tool.icon
                          )}
                        </span>
                        <span>{tool.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              {searchQuery.length > 1 && !filteredTools.length ? (
                <p className="helper-text" style={{ padding: '8px 4px 0' }}>
                  No tools found for "{searchQuery}".
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {showToolsMenu ? (
        <div
          className="page-shell mega-shell"
          onMouseEnter={() => setShowToolsMenu(true)}
        >
          <div className="mega-panel">
            <div className="mega-panel-header">
              <div>
                <p className="eyebrow">All Tools</p>
                <h3>Browse every PDF tool in one place</h3>
              </div>
              <Link href="/" className="simple-link" onClick={() => setShowToolsMenu(false)}>
                Open full tools page
              </Link>
            </div>

            <div className="mega-grid">
              {TOOL_GROUPS.map((group) => (
                <section key={group.name} className="mega-column">
                  <p className="mega-title">{group.name}</p>
                  <div className="mega-list">
                    {group.tools.map((tool) => {
                      const isSvgIcon = typeof tool.icon === 'string' && tool.icon.includes('<svg');
                      return (
                        <Link
                          key={tool.id}
                          href={tool.href}
                          className="mega-link"
                          onClick={() => {
                            setShowToolsMenu(false);
                            setShowSearch(false);
                          }}
                        >
                          <span className="mega-icon" style={{ background: tool.bg, color: tool.color }}>
                            {isSvgIcon ? (
                              <span 
                                dangerouslySetInnerHTML={{ __html: tool.icon }}
                                style={{ width: 28, height: 28 }}
                              />
                            ) : (
                              tool.icon
                            )}
                          </span>
                          <span>{tool.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
