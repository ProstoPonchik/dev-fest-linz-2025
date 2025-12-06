'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/students');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="login-container">
      <div className="spinner" />
    </div>
  );
}
