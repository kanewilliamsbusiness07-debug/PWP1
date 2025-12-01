import { describe, it, expect, vi } from 'vitest';
import { signIn } from 'next-auth/react';
import { NextResponse } from 'next/server';

type SignInResponse = {
  ok: boolean;
  url?: string;
  error?: string | null;
};

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn()
}));

describe('Authentication', () => {
  it('should handle successful login', async () => {
    const mockResult = {
      ok: true,
      url: '/client-information',
      error: null
    };
    (signIn as any).mockResolvedValue(mockResult);

    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false
    }) as SignInResponse;

    expect(result).toEqual(mockResult);
    expect(result.ok).toBe(true);
    expect(result.url).toBe('/client-information');
  });

  it('should handle failed login', async () => {
    const mockResult = {
      ok: false,
      error: 'Invalid credentials'
    };
    (signIn as any).mockResolvedValue(mockResult);

    const result = await signIn('credentials', {
      email: 'wrong@example.com',
      password: 'wrongpass',
      redirect: false
    }) as SignInResponse;

    expect(result).toEqual(mockResult);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('should handle network errors', async () => {
    (signIn as any).mockRejectedValue(new Error('Network error'));

    try {
      await signIn('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Network error');
    }
  });
});