const { withContentlayer } = require("next-contentlayer2");

import("./env.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      }
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@crawlee/cheerio", "crawlee", "@apify/ps-tree"],
    esmExternals: true,
  },
  transpilePackages: ["shiki"],
};

module.exports = withContentlayer(nextConfig);
