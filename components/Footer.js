import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { ALL_TOOLS } from '../lib/toolsList';

export default function Footer() {
  const toolLinks = ALL_TOOLS.slice(0, 6);
  const year = new Date().getFullYear();

  return (
    <footer className="page-shell footer-shell">
      <div className="surface-card">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <BrandLogo />
            </div>
            <p className="footer-copy" style={{ maxWidth: 300 }}>
              Practical PDF tools for everyday document workflows with clear navigation and transparent file handling.
            </p>
          </div>

          <div>
            <h4 className="footer-title">Popular tools</h4>
            <ul className="footer-links">
              {toolLinks.map((tool) => (
                <li key={tool.id}>
                  <Link href={tool.href}>{tool.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Company</h4>
            <ul className="footer-links">
              {[
                ['Privacy Policy', '/privacy'],
                ['Terms of Service', '/terms'],
                ['About Us', '/about'],
                ['Contact', '/contact'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© {year} SababPDF. All rights reserved.</p>
          <span className="footer-note">Files stay local for browser-side tools</span>
        </div>
      </div>
    </footer>
  );
}
