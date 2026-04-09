import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export const AuthForm = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Name is required'); return; }
        await signup(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    border: '0.5px solid #ddd', borderRadius: 8,
    fontSize: 14, background: '#fafafa',
    outline: 'none', transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f9f9f9',
    }}>
      <div style={{
        width: 360, background: '#fff',
        border: '0.5px solid #ececec',
        borderRadius: 16, padding: '48px 36px',
      }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 36, fontWeight: 700,
            letterSpacing: '-0.03em', margin: 0,
          }}>Aura</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            required
          />

          {error && (
            <p style={{ fontSize: 12, color: '#E24B4A', margin: 0, paddingLeft: 4 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8, width: '100%', padding: '12px',
              background: loading ? '#888' : '#000', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14,
              fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => { setIsLogin(l => !l); setError(''); }}
          style={{
            marginTop: 20, width: '100%', background: 'none',
            border: 'none', fontSize: 13, color: '#666',
            cursor: 'pointer', textAlign: 'center',
          }}
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};
