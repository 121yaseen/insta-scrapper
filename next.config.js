/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  images: {
    domains: [
      "instagram.fcok7-1.fna.fbcdn.net",
      "instagram.com",
      "www.instagram.com",
      "scontent.cdninstagram.com",
      "scontent-iad3-1.cdninstagram.com",
      "graph.instagram.com",
      "ui-avatars.com",
    ],
  },
};

module.exports = nextConfig;
