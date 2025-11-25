'use client';

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    loading: status === 'loading',
    login: async (email: string, password: string) => {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        callbackUrl: '/client-information',
        redirect: true,
      });
      return { success: !!result?.ok };
    },
    logout: async () => {
      await nextAuthSignOut();
      window.location.href = '/auth/login';
    },
    refreshToken: async () => {}
  };
}