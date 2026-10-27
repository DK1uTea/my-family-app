import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOST ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  experimental: {
    authInterrupts: true,
  },
  cacheComponents: false,
  reactCompiler: true,
  images: {
    remotePatterns: imageHosts.map((host) => ({
      protocol: 'https' as const,
      hostname: host,
    })),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      }
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
