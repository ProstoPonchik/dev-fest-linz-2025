'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudent } from '@/context/StudentContext';

export default function StudentNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { student } = useStudent();

  const navLinks = [
    { href: '/student', label: 'Dashboard' },
    { href: '/student/lessons', label: 'My Lessons' },
    { href: '/student/homework', label: 'Homework' },
    { href: '/student/progress', label: 'Progress' },
  ];

  return (
    <nav className="navbar student-navbar">
      <div className="navbar-brand">
        <Link href="/student" className="navbar-logo">
          🎓 Uptum
          <span className="student-badge">Student</span>
        </Link>
      </div>

      <div className="navbar-links">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="navbar-user">
        {student && (
          <span className="user-info">
            {student.name} | {student.subject}
          </span>
        )}
        {user && (
          <button onClick={logout} className="btn btn-secondary btn-sm">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
