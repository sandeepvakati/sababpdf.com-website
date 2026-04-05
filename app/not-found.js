import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="page-shell legal-shell">
        <div className="legal-stack">
          <section className="article-card">
            <p className="eyebrow">404</p>
            <h1 className="section-heading" style={{ marginBottom: 12 }}>
              This page does not exist
            </h1>
            <p>The requested route was not found. Return to the homepage or open one of the active PDF tool pages.</p>
            <Link href="/" className="primary-link" style={{ width: 'fit-content', marginTop: 10 }}>
              Back to homepage
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
