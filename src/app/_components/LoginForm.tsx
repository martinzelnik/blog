import { useState } from 'react';
import './LoginForm.css';
import { LoadingButton } from './LoadingButton';

interface LoginFormProps {
  onSubmit?: (username: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password && onSubmit) {
      await onSubmit(username.trim(), password);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {error && <p className="login-form__error">{error}</p>}
      <div>
        <label htmlFor="login-username">Username:</label>
        <input
          type="text"
          id="login-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="login-password">Password:</label>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isLoading}
        />
      </div>
      <LoadingButton
        type="submit"
        className="login-form__submit"
        loading={isLoading}
        loadingText="Logging in…"
      >
        Log In
      </LoadingButton>
    </form>
  );
}

export default LoginForm;
