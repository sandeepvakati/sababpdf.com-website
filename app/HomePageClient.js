'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AdInContent } from '../components/AdBanner';
import ToolIcon from '../components/ToolIcon';
import { TOOL_GROUPS, ALL_TOOLS } from '../lib/toolsList';
import { useState } from 'react';

// Category tab names for filtering
const CATEGORY_TABS = ['All', ...TOOL_GROUPS.map(g => g.name)];

export default function HomePageClient() {
  const [activeTab, setActiveTab] = useState('All');

  const filteredTools = activeTab === 'All'
    ? ALL_TOOLS
    : TOOL_GROUPS.find(g => g.name === activeTab)?.tools || [];

  return (
    <>
      <Navbar />

      <main>
        {/* Hero Section — iLovePDF style */}
        <section className="hero-ilp">
          <div className="hero-ilp-content">
            <h1 className="hero-ilp-title">
              Every tool you need to work with PDFs in one place
            </h1>
            <p className="hero-ilp-subtitle">
              Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge,
              split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
            </p>
          </div>
        </section>

        {/* Filter Tabs + Tool Grid */}
        <section className="tools-ilp-section" id="all-tools">
          {/* Category filter tabs */}
          <div className="tools-ilp-tabs">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                className={`tools-ilp-tab${activeTab === tab ? ' tools-ilp-tab-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tool cards grid */}
          <div className="tools-ilp-grid">
            {filteredTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="tool-ilp-card"
                prefetch
              >
                <div className="tool-ilp-icon">
                  <ToolIcon tool={tool} size="md" />
                </div>
                <h3 className="tool-ilp-name">{tool.title}</h3>
                <p className="tool-ilp-desc">{tool.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <AdInContent />

        {/* No Login Banner */}
        <section className="no-login-banner">
          <div className="no-login-content">
            <div className="no-login-icon">🔓</div>
            <h2 className="no-login-title">No Login. No Signup. Just Get It Done.</h2>
            <p className="no-login-text">
              Unlike other tools, SababPDF lets you work immediately — no account creation, 
              no email verification, no waiting. Just upload, process, and download.
            </p>
            <div className="no-login-stats">
              <div className="stat-item">
                <strong>29+</strong>
                <span>PDF Tools</span>
              </div>
              <div className="stat-item">
                <strong>0</strong>
                <span>Logins Required</span>
              </div>
              <div className="stat-item">
                <strong>100%</strong>
                <span>Free Forever</span>
              </div>
              <div className="stat-item">
                <strong>∞</strong>
                <span>Files Processed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="why-choose-new">
          <h2 className="section-heading-new">Why use SababPDF?</h2>
          <div className="why-choose-new-grid">
            <WhyChooseCard
              icon="🎯"
              title="Easy to Use"
              description="Simple drag and drop interface. No learning curve required."
              color="#e74c3c"
            />
            <WhyChooseCard
              icon="⚡"
              title="Fast Processing"
              description="Process your files quickly right in your browser."
              color="#3b82f6"
            />
            <WhyChooseCard
              icon="🔒"
              title="Secure & Private"
              description="Files stay in your browser. Nothing is uploaded to external servers."
              color="#10b981"
            />
            <WhyChooseCard
              icon="💰"
              title="Completely Free"
              description="All PDF tools are available at no cost with no hidden charges."
              color="#f97316"
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="how-works-new">
          <h2 className="section-heading-new">How it works</h2>
          <div className="how-works-new-steps">
            <HowItWorksStep number="1" title="Select a tool" description="Choose from our wide range of PDF tools based on your needs" />
            <div className="step-connector" />
            <HowItWorksStep number="2" title="Upload your file" description="Drag and drop or click to upload your file" />
            <div className="step-connector" />
            <HowItWorksStep number="3" title="Process" description="Our tool processes your file automatically" />
            <div className="step-connector" />
            <HowItWorksStep number="4" title="Download" description="Download your processed file instantly" />
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        /* ============================================ */
        /* HERO SECTION — iLovePDF-style (light pink)    */
        /* ============================================ */
        .hero-ilp {
          background: var(--home-hero-bg);
          padding: 80px 24px 48px;
          text-align: center;
        }

        .hero-ilp-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-ilp-title {
          font-size: clamp(2rem, 4.5vw, 3rem);
          font-weight: 900;
          color: var(--text-heading);
          margin: 0 0 18px;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .hero-ilp-subtitle {
          font-size: clamp(0.95rem, 1.8vw, 1.1rem);
          color: var(--text-soft);
          margin: 0;
          line-height: 1.7;
          max-width: 750px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ============================================ */
        /* TOOLS SECTION — iLovePDF Flat Grid            */
        /* ============================================ */
        .tools-ilp-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 60px;
        }

        /* Filter tabs */
        .tools-ilp-tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-bottom: 40px;
        }

        .tools-ilp-tab {
          padding: 10px 22px;
          border-radius: 50px;
          border: 1.5px solid var(--surface-border);
          background: var(--surface-solid);
          color: var(--text-soft);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
        }

        .tools-ilp-tab:hover {
          background: var(--nav-hover-bg);
          border-color: var(--tool-hover-border);
          color: var(--text-main);
          box-shadow: 0 0 0 4px var(--tool-hover-ring);
        }

        .tools-ilp-tab-active {
          background: var(--text-main);
          color: var(--surface-solid);
          border-color: var(--text-main);
        }

        .tools-ilp-tab-active:hover {
          background: var(--text-main);
          border-color: var(--tool-hover-border);
          color: var(--surface-solid);
        }

        /* Tool cards grid */
        .tools-ilp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 22px;
        }

        .tool-ilp-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 24px 22px;
          background: var(--surface-solid);
          border-radius: 20px;
          border: 1px solid var(--muted-border);
          text-decoration: none;
          transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
          box-shadow: var(--card-shadow-soft);
          min-height: 228px;
        }

        .tool-ilp-card:hover,
        .tool-ilp-card:focus-visible {
          border-color: var(--tool-hover-border);
          background: var(--surface-solid);
          transform: translateY(-2px);
          box-shadow:
            var(--card-shadow-soft),
            0 0 0 1px var(--tool-hover-border),
            0 0 0 6px var(--tool-hover-ring),
            0 20px 38px var(--tool-hover-glow);
        }

        .tool-ilp-icon {
          margin-bottom: 14px;
        }

        .tool-ilp-card:hover :global(.tool-icon),
        .tool-ilp-card:focus-visible :global(.tool-icon) {
          color: var(--tool-hover-icon-color);
        }

        .tool-ilp-card:hover :global(.tool-icon-framed),
        .tool-ilp-card:focus-visible :global(.tool-icon-framed) {
          background: var(--tool-hover-icon-bg);
          border-color: var(--tool-hover-border);
          box-shadow:
            0 0 0 1px var(--tool-hover-border),
            0 14px 30px var(--tool-hover-glow);
          transform: translateY(-2px);
        }

        .tool-ilp-name {
          font-size: 1.08rem;
          font-weight: 800;
          color: var(--text-heading);
          margin: 0 0 8px;
          line-height: 1.3;
        }

        .tool-ilp-desc {
          font-size: 0.88rem;
          color: var(--text-soft);
          line-height: 1.65;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tool-ilp-card:hover .tool-ilp-name,
        .tool-ilp-card:focus-visible .tool-ilp-name {
          color: var(--text-heading);
        }

        /* ============================================ */
        /* NO LOGIN BANNER                               */
        /* ============================================ */
        .no-login-banner {
          background: var(--home-banner-bg);
          padding: 64px 24px;
          margin: 20px 0 0;
        }

        .no-login-content {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }

        .no-login-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .no-login-title {
          font-size: clamp(1.8rem, 3.5vw, 2.4rem);
          font-weight: 800;
          color: var(--text-contrast);
          margin: 0 0 16px;
        }

        .no-login-text {
          font-size: 1.05rem;
          color: var(--hero-copy);
          margin: 0 0 36px;
          line-height: 1.7;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .no-login-stats {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 32px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-item strong {
          display: block;
          font-size: 2.2rem;
          font-weight: 900;
          color: #e74c3c;
          margin-bottom: 4px;
        }

        .stat-item span {
          color: color-mix(in srgb, var(--text-contrast) 62%, transparent);
          font-size: 0.9rem;
          font-weight: 600;
        }

        /* ============================================ */
        /* WHY CHOOSE SECTION                            */
        /* ============================================ */
        .why-choose-new {
          max-width: 1200px;
          margin: 80px auto;
          padding: 0 24px;
        }

        .section-heading-new {
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 800;
          text-align: center;
          color: var(--text-heading);
          margin: 0 0 48px;
        }

        .why-choose-new-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .why-card-new {
          background: var(--surface-solid);
          padding: 36px 28px;
          border-radius: 20px;
          text-align: center;
          box-shadow: var(--card-shadow-soft);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          border: 1px solid var(--surface-border);
          position: relative;
          overflow: hidden;
        }

        .why-card-new::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--card-color);
        }

        .why-card-new:hover {
          transform: translateY(-8px);
          border-color: var(--tool-hover-border);
          box-shadow:
            var(--card-shadow-soft),
            0 0 0 1px var(--tool-hover-border),
            0 14px 36px var(--tool-hover-glow);
        }

        .why-card-icon-new {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin: 0 auto 18px;
          background: color-mix(in srgb, var(--card-color) 14%, var(--surface-solid));
        }

        .why-card-new h3 {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-heading);
          margin: 0 0 12px;
        }

        .why-card-new p {
          color: var(--text-soft);
          line-height: 1.7;
          margin: 0;
          font-size: 0.95rem;
        }

        /* ============================================ */
        /* HOW IT WORKS                                  */
        /* ============================================ */
        .how-works-new {
          max-width: 1200px;
          margin: 0 auto 80px;
          padding: 0 24px;
        }

        .how-works-new-steps {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
          flex-wrap: wrap;
        }

        .step-connector {
          width: 40px;
          height: 2px;
          background: var(--home-step-gradient);
          margin-top: 40px;
          flex-shrink: 0;
        }

        .how-step-new {
          background: var(--surface-solid);
          padding: 32px 24px;
          border-radius: 20px;
          text-align: center;
          box-shadow: var(--card-shadow-soft);
          position: relative;
          max-width: 220px;
          width: 100%;
          border: 1px solid var(--surface-border);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .how-step-new:hover {
          transform: translateY(-5px);
          border-color: var(--tool-hover-border);
          box-shadow:
            var(--card-shadow-soft),
            0 0 0 1px var(--tool-hover-border),
            0 12px 30px var(--tool-hover-glow);
        }

        .step-number-new {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: var(--text-contrast);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 1.4rem;
          font-weight: 800;
          box-shadow: 0 6px 20px rgba(231, 76, 60, 0.25);
        }

        .how-step-new h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-heading);
          margin: 0 0 8px;
        }

        .how-step-new p {
          color: var(--text-soft);
          line-height: 1.6;
          margin: 0;
          font-size: 0.9rem;
        }

        /* ============================================ */
        /* RESPONSIVE                                    */
        /* ============================================ */
        @media (max-width: 768px) {
          .hero-ilp {
            padding: 50px 16px 32px;
          }

          .tools-ilp-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .tools-ilp-tabs {
            gap: 6px;
          }

          .tools-ilp-tab {
            padding: 8px 14px;
            font-size: 0.8rem;
          }

          .no-login-stats {
            gap: 20px;
          }

          .stat-item strong {
            font-size: 1.8rem;
          }

          .step-connector {
            display: none;
          }

          .how-works-new-steps {
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .how-step-new {
            max-width: 100%;
          }

          .why-choose-new-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .tools-ilp-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

function WhyChooseCard({ icon, title, description, color }) {
  return (
    <div className="why-card-new" style={{ '--card-color': color }}>
      <div className="why-card-icon-new">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function HowItWorksStep({ number, title, description }) {
  return (
    <div className="how-step-new">
      <div className="step-number-new">{number}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
