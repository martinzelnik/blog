'use client';

import { AuthProvider } from '@/app/_contexts/AuthContext';
import { LanguageProvider } from '@/app/_contexts/LanguageContext';
import { AppHeader } from './AppHeader';
import { AuthModal } from './AuthModal';
import { SignUpModal } from './SignUpModal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <div className="app-wrapper">
          <AppHeader />
          {children}
        </div>
        <AuthModal />
        <SignUpModal />
      </LanguageProvider>
    </AuthProvider>
  );
}
