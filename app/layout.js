import Script from 'next/script';
import './globals.css';

const siteUrl = 'https://sababpdf.com';
const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID || '';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SababPDF | Practical PDF Tools For Everyday Work',
    template: '%s | SababPDF',
  },
  description:
    'SababPDF offers browser-based PDF tools for merging, splitting, compressing, converting, and organizing documents with a clear privacy-first workflow.',
  applicationName: 'SababPDF',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'SababPDF',
    description:
      'A clean PDF toolkit with browser-side processing, clear policies, and public pages suitable for a real production site.',
    url: siteUrl,
    siteName: 'SababPDF',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SababPDF',
    description:
      'A clean PDF toolkit with browser-side processing, clear policies, and public pages suitable for a real production site.',
  },
  icons: {
    icon: '/sababpdf-sunpdf-logo.svg',
    apple: '/sababpdf-sunpdf-logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/sababpdf-sunpdf-logo.svg" type="image/svg+xml" />
      </head>
      <body>
        {children}
        {adsenseId ? (
          <Script
            id="adsense-script"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          />
        ) : null}
      </body>
    </html>
  );
}
