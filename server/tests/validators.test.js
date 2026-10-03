import { describe, expect, it } from '@jest/globals';
import { adminUserSchema, ratingSchema, registerSchema } from '../src/validators/index.js';

describe('request validation', () => {
  it('normalizes email and does not permit public role selection', () => {
    const result = registerSchema.parse({
      name: 'A Properly Long User Name',
      email: 'USER@EXAMPLE.COM',
      address: '',
      password: 'UserPass@123',
      confirmPassword: 'UserPass@123',
      role: 'SYSTEM_ADMIN',
    });
    expect(result.email).toBe('user@example.com');
    expect(result).not.toHaveProperty('role');
  });

  it('requires a valid rating integer from one through five', () => {
    expect(ratingSchema.safeParse({ rating: 5 }).success).toBe(true);
    expect(ratingSchema.safeParse({ rating: 1.5 }).success).toBe(false);
    expect(ratingSchema.safeParse({ rating: 6 }).success).toBe(false);
  });

  it('permits privileged roles only on the admin account schema', () => {
    const account = {
      name: 'System Administrator Account',
      email: 'admin@example.com',
      address: '',
      password: 'AdminPass@123',
      role: 'SYSTEM_ADMIN',
    };
    expect(adminUserSchema.safeParse(account).success).toBe(true);
    expect(
      registerSchema.safeParse({ ...account, confirmPassword: account.password }).data
    ).not.toHaveProperty('role');
  });
});
