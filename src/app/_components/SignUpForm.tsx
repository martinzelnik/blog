import { useState } from 'react';
import './SignUpForm.css';
import { LoadingButton } from './LoadingButton';

interface SignUpFormProps {
  onSubmit?: (username: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

function SignUpForm({ onSubmit, isLoading = false, error }: SignUpFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !onSubmit) return;
    if (password !== confirmPassword) return;
    await onSubmit(username.trim(), password);
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      {error && <p className="signup-form__error">{error}</p>}
      <div>
        <label htmlFor="signup-username">Username:</label>
        <input
          type="text"
          id="signup-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          autoComplete="username"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="signup-password">Password:</label>
        <input
          type="password"
          id="signup-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="signup-confirm">Confirm password:</label>
        <input
          type="password"
          id="signup-confirm"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          disabled={isLoading}
        />
        {confirmPassword && !passwordsMatch && (
          <p className="signup-form__hint">Passwords do not match</p>
        )}
      </div>
      <LoadingButton
        type="submit"
        className="signup-form__submit"
        loading={isLoading}
        loadingText="Signing up…"
        disabled={!passwordsMatch}
      >
        Sign Up
      </LoadingButton>
    </form>
  );
}

export default SignUpForm;
