import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for SababPDF, including file handling, analytics, advertising, and contact details.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="page-shell legal-shell">
        <div className="legal-stack">
          <section className="article-card">
            <p className="eyebrow">Privacy Policy</p>
            <h1 className="section-heading" style={{ marginBottom: 12 }}>
              Privacy and file-handling policy
            </h1>
            <p>
              SababPDF is built to minimize unnecessary file transfer. For browser-side tools, uploaded files are
              processed in the user’s browser session. For server-side tools, files are sent to the configured
              conversion API only for the purpose of completing the requested conversion.
            </p>
          </section>

          <section className="article-card">
            <h2>Information we may process</h2>
            <ul className="list-copy">
              <li>Basic technical logs needed to operate and secure the website and conversion API.</li>
              <li>Uploaded documents only when a server-side conversion route is used.</li>
              <li>Advertising and analytics signals if you enable third-party services such as Google AdSense.</li>
            </ul>
          </section>

          <section className="article-card">
            <h2>Advertising and cookies</h2>
            <p>
              If advertising is enabled, third-party vendors including Google may use cookies to serve ads based on a
              user’s visit to this site or other sites. You are responsible for publishing any region-specific consent
              notices that apply to your visitors before launching ads.
            </p>
          </section>

          <section className="article-card">
            <h2>Contact</h2>
            <p>
              Questions about this policy can be sent to{' '}
              <a className="simple-link" href="mailto:support@sababpdf.com">
                support@sababpdf.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
