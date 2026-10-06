import type { ErrorCode } from '@examspring/shared';

export type EnvelopeMeta = Record<string, unknown>;

export function ok<T>(data: T, meta: EnvelopeMeta = {}) {
  return { success: true as const, data, meta };
}

export function fail(code: ErrorCode, message: string, meta: EnvelopeMeta = {}) {
  return { success: false as const, error: { code, message }, meta };
}
