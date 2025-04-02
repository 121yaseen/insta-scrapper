/** @type {import('next').NextConfig} */

import path from "path";

const nextConfig = {
  /* config options here */ webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

export default nextConfig;
