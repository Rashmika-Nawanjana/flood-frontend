/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  compress: true,
  generateEtags: true,
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
  async rewrites() {
    const backendHost = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://157.245.102.69';
    return [
      // Microservice routes via Kong gateway
      {
        source: '/v1/:path*',
        destination: `${backendHost}/v1/:path*`,
      },
      // Main API routes (admin, auth, webhooks)
      {
        source: '/api/:path*',
        destination: `${backendHost}/api/:path*`,
      },
      // Legacy proxy path kept for backwards compat
      {
        source: '/api-proxy/:path*',
        destination: `${backendHost}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
