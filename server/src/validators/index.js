import { z } from 'zod';

const email = z
  .string()
  .trim()
  .email()
  .max(255)
  .transform((value) => value.toLowerCase());
const name = z
  .string()
  .trim()
  .min(20, 'Name must be at least 20 characters')
  .max(60, 'Name must be at most 60 characters');
const address = z.string().trim().max(400, 'Address must be at most 400 characters');
export const password = z
  .string()
  .min(8)
  .max(16)
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character');
const accountFields = z.object({ name, email, address, password });
export const registerSchema = accountFields
  .extend({ confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export const adminUserSchema = accountFields.extend({
  role: z.enum(['NORMAL_USER', 'SYSTEM_ADMIN', 'STORE_OWNER']),
});
export const storeSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email,
  address,
  ownerId: z.string().uuid().nullable().optional(),
});
export const ratingSchema = z.object({ rating: z.number().int().min(1).max(5) });
export const loginSchema = z.object({ email, password: z.string().min(1) });
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    req[source] = result.data;
    next();
  };
