'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AdInContent } from '../components/AdBanner';
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
            {filteredTools.map((tool) => {
              const isSvgIcon = typeof tool.icon === 'string' && tool.icon.includes('<svg');
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="tool-ilp-card"
                  prefetch
                >
                  <div
                    className="tool-ilp-icon"
                    style={{ color: tool.color }}
                  >
                    {isSvgIcon ? (
                      <span
                        dangerouslySetInnerHTML={{ __html: tool.icon }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    ) : (
                      <span className="tool-ilp-glyph">{tool.glyph || tool.icon}</span>
                    )}
                  </div>
                  <h3 className="tool-ilp-name">{tool.title}</h3>
                  <p className="tool-ilp-desc">{tool.description}</p>
                </Link>
              );
            })}
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
          background: linear-gradient(180deg, #fce4ec 0%, #fff5f5 60%, #ffffff 100%);
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
          color: #1a1a2e;
          margin: 0 0 18px;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .hero-ilp-subtitle {
          font-size: clamp(0.95rem, 1.8vw, 1.1rem);
          color: #555;
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
          border: 1.5px solid #e0e0e0;
          background: white;
          color: #555;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .tools-ilp-tab:hover {
          background: #f5f5f5;
          border-color: #ccc;
        }

        .tools-ilp-tab-active {
          background: #1a1a2e;
          color: white;
          border-color: #1a1a2e;
        }

        .tools-ilp-tab-active:hover {
          background: #2a2a3e;
          border-color: #2a2a3e;
        }

        /* Tool cards grid */
        .tools-ilp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }

        .tool-ilp-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 24px 20px;
          background: white;
          border-radius: 16px;
          border: 1.5px solid #f0f0f0;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }

        .tool-ilp-card:hover {
          border-color: #ddd;
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
        }

        .tool-ilp-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          flex-shrink: 0;
        }

        .tool-ilp-icon svg {
          width: 44px;
          height: 44px;
          stroke: currentColor;
          fill: none;
        }

        .tool-ilp-glyph {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
        }

        .tool-ilp-name {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 8px;
          line-height: 1.3;
        }

        .tool-ilp-desc {
          font-size: 0.82rem;
          color: #888;
          line-height: 1.5;
          margin: 0;
        }

        .tool-ilp-card:hover .tool-ilp-name {
          color: #e74c3c;
        }

        /* ============================================ */
        /* NO LOGIN BANNER                               */
        /* ============================================ */
        .no-login-banner {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
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
          color: white;
          margin: 0 0 16px;
        }

        .no-login-text {
          font-size: 1.05rem;
          color: rgba(255, 255, 255, 0.7);
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
          color: rgba(255, 255, 255, 0.6);
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
          color: #1a1a1a;
          margin: 0 0 48px;
        }

        .why-choose-new-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .why-card-new {
          background: white;
          padding: 36px 28px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          border: 1px solid #f0f0f0;
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
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
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
          background: var(--card-bg);
        }

        .why-card-new h3 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 12px;
        }

        .why-card-new p {
          color: #666;
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
          background: linear-gradient(90deg, #e74c3c, #f97316);
          margin-top: 40px;
          flex-shrink: 0;
        }

        .how-step-new {
          background: white;
          padding: 32px 24px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          position: relative;
          max-width: 220px;
          width: 100%;
          border: 1px solid #f0f0f0;
          transition: all 0.3s ease;
        }

        .how-step-new:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
        }

        .step-number-new {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
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
          color: #1a1a1a;
          margin: 0 0 8px;
        }

        .how-step-new p {
          color: #666;
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
  const bgMap = {
    '#e74c3c': '#fef2f2',
    '#3b82f6': '#eff6ff',
    '#10b981': '#ecfdf5',
    '#f97316': '#fff7ed',
  };
  return (
    <div className="why-card-new" style={{ '--card-color': color, '--card-bg': bgMap[color] || '#f5f5f5' }}>
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
