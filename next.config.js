/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the package external so its runtime __dirname stays inside
  // node_modules; it reads MCP App HTML from disk at registration time.
  serverExternalPackages: ["@openzeppelin/contracts-mcp"],
  experimental: {
    esmExternals: true,
  },
  turbopack: {
    root: __dirname,
  },
  // The App HTML is read at runtime, so tracing can't discover it statically.
  outputFileTracingIncludes: {
    "/contracts/**": ["./node_modules/@openzeppelin/contracts-mcp/apps/**"],
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
