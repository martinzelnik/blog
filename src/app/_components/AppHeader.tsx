'use client';

import { useAuth } from '@/app/_contexts/AuthContext';
import LanguageToggle from './LanguageToggle';

export function AppHeader() {
  const { user, logout, openLoginModal, openSignUpModal } = useAuth();

  return (
    <header className="page-header">
      <div className="page-header__auth">
        {user ? (
          <div className="page-header__auth-logged-in">
            <button className="login-button" onClick={logout}>
              Log Out
            </button>
            <span className="page-header__auth-user">
              <span className="page-header__auth-label">Logged in as</span>
              <span className="page-header__auth-username">{user.username}</span>
            </span>
          </div>
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
