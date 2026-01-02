'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function ClientRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve all query parameters when redirecting
    const queryString = searchParams?.toString();
    const redirectUrl = queryString
      ? `/client-information/personal?${queryString}`
      : '/client-information/personal';

    router.replace(redirectUrl);
  }, [router, searchParams]);

  return null; // This component doesn't render anything
}