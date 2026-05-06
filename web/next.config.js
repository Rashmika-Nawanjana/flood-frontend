/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
    unoptimized: false,
  },
  // Compression for production
  compress: true,
  // Generate ETags for caching
  generateEtags: true,
  // Security headers
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'http://157.245.102.69/:path*' // Proxy to Digital Ocean backend
      }
    ]
  }
};

module.exports = nextConfig;
