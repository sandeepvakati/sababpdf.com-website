import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "../components/Providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SababPDF - Every tool you need to work with PDFs in one place",
  description: "SababPDF offers completely free PDF tools to merge, split, compress, convert, rotate, and unlock PDF files with no limits.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1647209378622119" crossOrigin="anonymous" strategy="lazyOnload" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "SababPDF",
              "url": "https://sababpdf.com",
              "description": "Every tool you need to work with PDFs in one place. Completely free PDF tools to merge, split, compress, convert, rotate and unlock PDF files with no limits.",
              "publisher": {
                "@type": "Organization",
                "name": "SababPDF"
              }
            })
          }}
        />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
