'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { getStudentByEmail } from '@/lib/firestore';
import type { Student } from '@/types';

interface StudentContextType {
  student: Student | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = async (user: User) => {
    if (!user.email) {
      setError('No email found in your Google account');
      setLoading(false);
      return;
    }

    try {
      const studentData = await getStudentByEmail(user.email);
      if (studentData) {
        setStudent(studentData);
        setError(null);
      } else {
        setError('Your email is not registered as a student. Please contact your tutor.');
        setStudent(null);
      }
    } catch (err) {
      console.error('Error fetching student:', err);
      setError('Failed to load student data');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    if (user) {
      setLoading(true);
      await fetchStudent(user);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      fetchStudent(user);
    } else {
      setStudent(null);
      setLoading(false);
    }
  }, [user, authLoading]);

  return (
    <StudentContext.Provider value={{ student, loading, error, refetch }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
