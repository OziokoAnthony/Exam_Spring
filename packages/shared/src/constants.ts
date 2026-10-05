export const EXAM_CODES = [
  'FSLC',
  'BECE',
  'NECO',
  'NABTEB',
  'WAEC',
  'JAMB',
  'POST_UTME',
] as const;

export type ExamCode = (typeof EXAM_CODES)[number];

export const ROLES = ['LEARNER', 'PARENT', 'TEACHER', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const CONSENT_TYPES = ['DATA_PROCESSING', 'MARKETING', 'AI_TUTOR', 'PHOTO_USAGE'] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

export const GUARDIAN_RELATIONSHIPS = ['MOTHER', 'FATHER', 'GUARDIAN', 'OTHER'] as const;

export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIPS)[number];

export const GUARDIAN_LINK_STATUSES = ['PENDING', 'ACTIVE', 'REVOKED'] as const;

export type GuardianLinkStatus = (typeof GUARDIAN_LINK_STATUSES)[number];
