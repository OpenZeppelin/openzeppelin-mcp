/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@openzeppelin/contracts-mcp"],
  experimental: {
    esmExternals: true,
  },
  turbopack: {
    root: __dirname,
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts"],
      ".jsx": [".jsx", ".tsx"],
    };
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
