'use client';

import { useAuth } from '@/app/_contexts/AuthContext';
import SignUpForm from './SignUpForm';
import Modal from './Modal';

export function SignUpModal() {
  const {
    isSignUpModalOpen,
    closeSignUpModal,
    signUp,
    signUpLoading,
    signUpError,
  } = useAuth();

  return (
    <Modal
      isOpen={isSignUpModalOpen}
      onClose={closeSignUpModal}
      title="Sign Up"
    >
      <SignUpForm
        onSubmit={signUp}
        isLoading={signUpLoading}
        error={signUpError}
      />
    </Modal>
  );
}
