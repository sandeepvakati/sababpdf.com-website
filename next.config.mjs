/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      fs: false,
      path: false,
      http: false,
      https: false,
      "node:fs": false,
      "node:path": false,
      "node:http": false,
      "node:https": false,
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      path: false,
      http: false,
      https: false,
      "node:fs": false,
      "node:http": false,
      "node:https": false,
      "node:path": false
    };

    return config;
  },
};

export default nextConfig;
