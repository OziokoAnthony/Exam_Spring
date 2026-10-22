import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const EnvelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional(),
  meta: z.record(z.unknown()).optional(),
});

const SessionSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(['LEARNER', 'PARENT', 'TEACHER', 'ADMIN']),
    status: z.string(),
    fullName: z.string(),
    isMinor: z.boolean(),
    emailVerified: z.boolean(),
  }),
});

export type SessionUser = z.infer<typeof SessionSchema>['user'];

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let accessToken: string | null = null;
let refreshing: Promise<SessionUser | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

async function parseEnvelope(res: Response): Promise<z.infer<typeof EnvelopeSchema>> {
  const text = await res.text();
  try {
    const parsed = EnvelopeSchema.safeParse(JSON.parse(text));
    if (parsed.success) return parsed.data;
  } catch {
    // Non-JSON body (proxy error page, network interception): fall through.
  }
  return {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'The server is unavailable. Try again shortly.' },
  };
}

/** Uses the httpOnly refresh cookie to restore a session. Concurrent callers share one request. */
export function refreshSession(): Promise<SessionUser | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      const body = await parseEnvelope(res);
      const session = SessionSchema.safeParse(body.data);
      if (!res.ok || !session.success) return null;
      accessToken = session.data.accessToken;
      return session.data.user;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export function parseSession(data: unknown): { accessToken: string; user: SessionUser } {
  return SessionSchema.parse(data);
}

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

/** The only way components talk to the API. Validate `data` at the call site if it matters. */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (MUTATING.has(method) && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', crypto.randomUUID());
  }
  const { body: payload, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    method,
    headers,
    credentials: 'include',
    ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
  };
  const send = async () => {
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, init);
    } catch {
      throw new ApiError('NETWORK_ERROR', 'You appear to be offline.', 0);
    }
    return res;
  };
  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  const body = await parseEnvelope(res);
  if (!res.ok || !body.success) {
    throw new ApiError(
      body.error?.code ?? 'INTERNAL_ERROR',
      body.error?.message ?? 'Request failed',
      res.status,
    );
  }
  return body.data as T;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  return error instanceof Error ? error.message : fallback;
}
