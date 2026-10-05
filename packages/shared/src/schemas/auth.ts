import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  fullName: z.string().min(1).max(120),
  role: z.enum(['LEARNER', 'PARENT', 'TEACHER']),
  dateOfBirth: z.string().date(),
  guardianEmail: z.string().email().max(255).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(72),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email().max(255),
});

export const ResetPasswordConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export type SignupDto = z.infer<typeof SignupSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type ResetPasswordConfirmDto = z.infer<typeof ResetPasswordConfirmSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
