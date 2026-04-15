import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from './AuthContext';

type Mode = 'login' | 'signup';

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function AuthForm() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ username: '', displayName: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === 'login' ? 'Sign in with your username' : 'Create a new profile'),
    [mode]
  );

  const updateField = (key: 'username' | 'displayName' | 'password', value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
    setError('');
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const username = normalizeUsername(form.username);

    if (!username) {
      nextErrors.username = 'Username is required.';
    } else if (!/^[a-z0-9_.-]{3,50}$/.test(username)) {
      nextErrors.username = 'Use 3-50 lowercase letters, numbers, dot, underscore, or hyphen.';
    }

    if (mode === 'signup') {
      if (!form.displayName.trim()) {
        nextErrors.displayName = 'Display name is required.';
      } else if (form.displayName.trim().length > 120) {
        nextErrors.displayName = 'Display name must be 120 characters or less.';
      }
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const username = normalizeUsername(form.username);
      if (mode === 'login') {
        await login(username, form.password);
      } else {
        await signup(username, form.displayName.trim(), form.password);
      }
      navigate('/', { replace: true });
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : new ApiError('Unable to continue.');
      setError(apiError.message);
      setFieldErrors(apiError.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <div className="auth-hero">
          <p className="eyebrow">Aura Social</p>
          <h1>Java full-stack social app</h1>
          <p>{title}</p>
        </div>

        <form className="stack-md" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Username</span>
            <input
              value={form.username}
              onChange={(event) => updateField('username', event.target.value)}
              placeholder="username"
              autoComplete="username"
            />
            {fieldErrors.username && <small className="field-error">{fieldErrors.username}</small>}
          </label>

          {mode === 'signup' && (
            <label className="field">
              <span>Display name</span>
              <input
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                placeholder="Your public name"
                autoComplete="name"
              />
              {fieldErrors.displayName && (
                <small className="field-error">{fieldErrors.displayName}</small>
              )}
            </label>
          )}

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
          </label>

          {error && <div className="form-banner error">{error}</div>}

          <button className="button primary" disabled={submitting} type="submit">
            {submitting ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          className="text-button"
          onClick={() => {
            setMode((current) => (current === 'login' ? 'signup' : 'login'));
            setError('');
            setFieldErrors({});
          }}
          type="button"
        >
          {mode === 'login'
            ? 'Need an account? Switch to sign up.'
            : 'Already registered? Switch to sign in.'}
        </button>
      </section>
    </div>
  );
}
