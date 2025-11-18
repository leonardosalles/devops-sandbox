/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
