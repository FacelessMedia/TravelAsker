/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/post-sitemap:id(\\d+).xml',
        destination: '/api/post-sitemap/:id'
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
