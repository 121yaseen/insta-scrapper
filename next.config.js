/** @type {import('next').NextConfig} */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default nextConfig;
