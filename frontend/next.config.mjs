import { withSentryConfig } from '@sentry/nextjs/config';
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@examspring/shared'],
  experimental: { instrumentationHook: true },
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
