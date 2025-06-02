/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Skip prerendering pages that have dynamic route handlers
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
};

module.exports = nextConfig; 