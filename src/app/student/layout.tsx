'use client';

import { usePathname } from 'next/navigation';
import StudentProtectedRoute from '@/components/StudentProtectedRoute';
import StudentNavbar from '@/components/StudentNavbar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Login page doesn't need protection or navbar
  if (pathname === '/student/login') {
    return <>{children}</>;
  }

  return (
    <StudentProtectedRoute>
      <StudentNavbar />
      {children}
    </StudentProtectedRoute>
  );
}
