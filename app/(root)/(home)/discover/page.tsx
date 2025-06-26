'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DiscoverRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/discover/all');
  }, [router]);

  return null; // or a loading indicator
}
