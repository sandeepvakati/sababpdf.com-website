import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Contact',
  description: 'Contact SababPDF for support, business questions, or launch setup help.',
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="page-shell legal-shell">
        <div className="legal-stack">
          <section className="article-card">
            <p className="eyebrow">Contact</p>
            <h1 className="section-heading" style={{ marginBottom: 12 }}>
              Reach the SababPDF team
            </h1>
            <p>
              Use this page for support questions, business inquiries, launch preparation, or deployment help related
              to `sababpdf.com`.
            </p>
          </section>

          <section className="article-card">
            <h2>Primary contact</h2>
            <p>
              Email:{' '}
              <a className="simple-link" href="mailto:support@sababpdf.com">
                support@sababpdf.com
              </a>
            </p>
            <p>
              Response topics: PDF tool issues, deployment questions, AdSense configuration, and domain launch checks.
            </p>
          </section>

          <section className="article-card">
            <h2>Before requesting AdSense review</h2>
            <ul className="list-copy">
              <li>Verify that the domain resolves to the final public site.</li>
              <li>Make sure legal pages and tool pages are accessible without broken links.</li>
              <li>Add your real publisher ID, slot IDs, and final `ads.txt` values only after approval setup is ready.</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
