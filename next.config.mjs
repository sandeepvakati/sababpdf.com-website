/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config to allow both Turbopack and webpack to work
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Fix for pdfjs-dist in Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;
