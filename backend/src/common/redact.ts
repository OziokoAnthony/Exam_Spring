const SENSITIVE_KEY = /email|password|token|secret|authorization|phone|^to$|cookie/i;
const EMAIL_VALUE = /[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+/g;

/** Redacts by key name and also scrubs email addresses embedded in any string value. */
export function redactPii(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(EMAIL_VALUE, '[REDACTED]');
  }
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
