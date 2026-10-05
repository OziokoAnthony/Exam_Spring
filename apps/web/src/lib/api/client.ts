export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: Record<string, unknown>;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

let accessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}

async function refreshAccessToken(): Promise<boolean> {
  const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!res.ok) return false;
  const body = (await res.json()) as Envelope<{ accessToken: string }>;
  if (body.success && body.data) {
    accessToken = body.data.accessToken;
    return true;
  }
  return false;
}

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });
  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return api<T>(path, options, false);
  }
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success || body.data === undefined) {
    throw new ApiError(
      body.error?.code ?? 'INTERNAL_ERROR',
      body.error?.message ?? 'Request failed',
    );
  }
  return body.data;
}
