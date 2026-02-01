'use client';

import { useAuth } from '@/app/_contexts/AuthContext';
import LanguageToggle from './LanguageToggle';

export function AppHeader() {
  const { user, logout, openLoginModal, openSignUpModal } = useAuth();

  return (
    <header className="page-header">
      <div className="page-header__auth">
        {user ? (
          <button className="login-button" onClick={logout}>
            Log Out
          </button>
        ) : (
          <>
            <button className="login-button" onClick={openLoginModal}>
              Log In
            </button>
            <button className="signup-button" onClick={openSignUpModal}>
              Sign Up
            </button>
          </>
        )}
      </div>
      <h1>My Simple Blog</h1>
      <LanguageToggle />
    </header>
  );
}
