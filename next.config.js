/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */ webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

module.exports = nextConfig;
