import type { BrowserOptions } from '@sentry/nextjs';

/**
 * Most users are minors: no user info, headers, cookies, bodies or query strings,
 * and no session replay. Off unless a DSN is configured.
 */
export function sentryOptions(dsn: string | undefined): BrowserOptions {
  return {
    ...(dsn ? { dsn } : {}),
    enabled: Boolean(dsn),
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
  };
}
