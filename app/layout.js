import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'SababPDF – Free Online PDF Tools',
  description: 'Merge, split, compress, rotate, convert PDF files and much more. Fast, free, and secure PDF tools online.',
  keywords: 'PDF tools, merge PDF, split PDF, compress PDF, convert PDF, PDF to Word, Word to PDF, JPG to PDF, free online PDF',
  openGraph: {
    title: 'SababPDF – Free Online PDF Tools',
    description: 'Merge, split, compress, rotate, convert PDF files. Fast, free, and secure.',
    url: 'https://sababpdf.com',
    siteName: 'SababPDF',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ========== REPLACE WITH YOUR ADSENSE PUBLISHER ID ========== */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX" crossOrigin="anonymous" /> */}
        {/* ============================================================ */}
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f97316" />
        
        {/* Verify domain for Google Search Console */}
        {/* <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" /> */}
      </head>
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#f97316', secondary: '#fff' },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
