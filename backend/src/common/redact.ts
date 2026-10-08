const SENSITIVE_KEY = /email|password|token|secret|authorization|phone/i;

export function redactPii(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactPii(item));
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactPii(item);
    }
    return out;
  }
  return value;
}
