'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <Link href="/students" className="navbar-brand">
        Up<span>tum</span>
      </Link>

      {!loading && user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/students" className="nav-link">
            Students
          </Link>
          <Link href="/meet" className="nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.25rem' }}>
              <path d="M15.5 5H19a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3.5" />
              <path d="M12 5V19M5 12h14" />
            </svg>
            Meet
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
