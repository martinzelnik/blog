'use client';

import { useAuth } from '@/app/_contexts/AuthContext';
import LoginForm from './LoginForm';
import Modal from './Modal';

export function AuthModal() {
  const {
    isLoginModalOpen,
    closeLoginModal,
    login,
    loginLoading,
    loginError,
  } = useAuth();

  return (
    <Modal
      isOpen={isLoginModalOpen}
      onClose={closeLoginModal}
      title="Log In"
    >
      <LoginForm
        onSubmit={login}
        isLoading={loginLoading}
        error={loginError}
      />
    </Modal>
  );
}
