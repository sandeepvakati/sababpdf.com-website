import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for using SababPDF and its PDF conversion tools.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="page-shell legal-shell">
        <div className="legal-stack">
          <section className="article-card">
            <p className="eyebrow">Terms Of Service</p>
            <h1 className="section-heading" style={{ marginBottom: 12 }}>
              Terms for using SababPDF
            </h1>
            <p>
              By using SababPDF, you agree to use the website only for lawful purposes and only with files that you
              have permission to process. You remain responsible for the content you upload and the outputs you
              distribute.
            </p>
          </section>

          <section className="article-card">
            <h2>Service availability</h2>
            <p>
              PDF tools and conversion routes may change, be limited, or be removed at any time. Server-side
              conversion routes depend on your own infrastructure and supporting software.
            </p>
          </section>

          <section className="article-card">
            <h2>No guarantee of fitness</h2>
            <p>
              The service is provided on an as-is basis. Before using outputs for legal, financial, or compliance
              work, verify the generated files yourself.
            </p>
          </section>

          <section className="article-card">
            <h2>Abuse prevention</h2>
            <ul className="list-copy">
              <li>Do not upload malicious, unlawful, or unauthorized content.</li>
              <li>Do not attempt to overload, scrape, or disrupt the website or API.</li>
              <li>Do not use the site in a way that violates advertising, copyright, or privacy laws.</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
