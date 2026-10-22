import { withSentryConfig } from '@sentry/nextjs/config';
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@examspring/shared'],
  experimental: { instrumentationHook: true },
  // Same-origin API: the browser calls /api/*, so the SameSite=strict refresh
  // cookie stays first-party. API_ORIGIN is the Railway API URL (no trailing slash).
  async rewrites() {
    const origin = process.env.API_ORIGIN ?? 'http://localhost:3001';
    return [{ source: '/api/:path*', destination: `${origin}/:path*` }];
  },
};

export default withSentryConfig(
  withPWA({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
  })(nextConfig),
  {
    silent: true,
    telemetry: false,
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  },
);
