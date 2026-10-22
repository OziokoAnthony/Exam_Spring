import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

/**
 * Loaded before anything else (see main.ts). Off unless SENTRY_DSN is set.
 * Most users are minors: no user info, headers, cookies, bodies or query strings.
 */
Sentry.init({
  ...(dsn ? { dsn } : {}),
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  },
  beforeSend(event) {
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.query_string;
    }
    delete event.user;
    return event;
  },
});
