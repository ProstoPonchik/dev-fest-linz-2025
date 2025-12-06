'use client';

import { StudentProvider } from '@/context/StudentContext';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentProvider>
      {children}
    </StudentProvider>
  );
}
