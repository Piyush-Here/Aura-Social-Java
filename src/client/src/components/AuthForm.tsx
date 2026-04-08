import React, { useState } from 'react';

interface AuthFormProps {
  onLogin: (email: string, pass: string) => void;
  onSignup: (email: string, pass: string, name: string) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(email, password);
    } else {
      onSignup(email, password, name);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ marginBottom: '48px' }}>
          <h1 className="auth-title serif">Aura</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            {!isLogin && (
              <input 
                type="text"
                placeholder="Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
              />
            )}
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>
          
          <div style={{ marginTop: '32px' }}>
            <button type="submit" className="primary-btn">
              {isLogin ? 'Enter' : 'Join'}
            </button>
            
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="secondary-btn"
            >
              {isLogin ? "New here? Create Account" : "Have an account? Log In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
