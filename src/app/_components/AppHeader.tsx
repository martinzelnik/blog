'use client';

import { useAuth } from '@/app/_contexts/AuthContext';
import LanguageToggle from './LanguageToggle';

export function AppHeader() {
  const { user, logout, openLoginModal } = useAuth();

  return (
    <header className="page-header">
      <button
        className="login-button"
        onClick={user ? logout : openLoginModal}
      >
        {user ? 'Log Out' : 'Log In'}
      </button>
      <h1>My Simple Blog</h1>
      <LanguageToggle />
    </header>
  );
}
