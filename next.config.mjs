/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  distDir: isDev ? '.next-dev' : '.next',
  reactStrictMode: false,
  // Allow larger request bodies for server actions (App Router)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  webpack: (config) => {
    // pdfjs-dist references optional Node canvas packages that are not needed in the browser build.
    config.resolve.alias.canvas = false;
    config.resolve.alias['@napi-rs/canvas'] = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  async rewrites() {
    return [
      // ✅ Proxy ONLY routes NOT handled by Next.js API routes
      {
        source: '/api/convert/ppt-to-pdf',
        destination: 'http://127.0.0.1:5000/api/convert/ppt-to-pdf'
      },
      {
        source: '/api/convert/html-to-pdf',
        destination: 'http://127.0.0.1:5000/api/convert/html-to-pdf'
      },
      {
        source: '/api/convert/pdf-to-excel',
        destination: 'http://127.0.0.1:5000/api/convert/pdf-to-excel'
      },
      {
        source: '/api/progress/:id',
        destination: 'http://127.0.0.1:5000/api/progress/:id'
      }
      // ❌ Removed catch-all '/api/convert/:path*' to let Next.js API routes work
    ];
  }
};

export default nextConfig;
