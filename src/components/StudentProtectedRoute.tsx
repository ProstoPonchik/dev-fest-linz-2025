'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudent } from '@/context/StudentContext';

interface StudentProtectedRouteProps {
  children: React.ReactNode;
}

export default function StudentProtectedRoute({ children }: StudentProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { student, loading: studentLoading, error } = useStudent();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/portal/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || studentLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>Access Denied</h2>
          <p>{error}</p>
          <p className="error-hint">
            If you believe this is a mistake, please contact your tutor and ask them to add your email ({user.email}) to your student profile.
          </p>
          <button onClick={() => router.push('/portal/login')} className="btn btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>Student Not Found</h2>
          <p>Your account is not linked to any student profile.</p>
          <button onClick={() => router.push('/portal/login')} className="btn btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
