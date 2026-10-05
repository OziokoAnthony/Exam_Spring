export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'BUSINESS_RULE_VIOLATION',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
