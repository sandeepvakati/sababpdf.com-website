/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  distDir: isDev ? '.next-dev' : '.next',
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/convert/:path*',
        destination: 'http://127.0.0.1:5000/api/convert/:path*' // proxy to backend
      },
      {
        source: '/api/progress/:id',
        destination: 'http://127.0.0.1:5000/api/progress/:id' // proxy to backend
      }
    ];
  }
};

export default nextConfig;
