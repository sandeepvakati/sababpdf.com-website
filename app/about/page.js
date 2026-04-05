import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'About',
  description: 'Learn what SababPDF does, how it handles files, and how the site is structured for a public launch.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="page-shell legal-shell">
        <div className="legal-stack">
          <section className="article-card">
            <p className="eyebrow">About SababPDF</p>
            <h1 className="section-heading" style={{ marginBottom: 12 }}>
              A practical PDF toolkit for everyday business files
            </h1>
            <p>
              SababPDF is designed to handle routine document work without the clutter that usually surrounds file
              utilities. The current build focuses on browser-side processing for common tasks such as merging,
              splitting, compressing, rotating, watermarking, and exporting PDFs.
            </p>
            <p>
              The project also includes a separate Express backend for office-document conversion workflows. Those
              routes are available when the server is configured with the required system packages.
            </p>
          </section>

          <section className="article-card">
            <h2>How the site works</h2>
            <ul className="list-copy">
              <li>Client-side tools use browser libraries to process files in the current session.</li>
              <li>Server-side conversions call your API endpoint defined through `NEXT_PUBLIC_API_URL`.</li>
              <li>AdSense code loads only after valid publisher and slot variables are supplied.</li>
            </ul>
          </section>

          <section className="article-card">
            <h2>What this launch includes</h2>
            <p>
              The site now has a homepage, dynamic tool pages, contact and legal pages, metadata for `sababpdf.com`,
              and a safer ad setup that does not render empty ad placeholders across the site.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
