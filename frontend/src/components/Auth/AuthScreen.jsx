import { useState } from 'react';
import { loginUser, registerUser } from '../../services/api';

export default function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validation
    if (!form.email || !form.password || (!isLogin && !form.name)) {
      setError('Please fill in all fields');
      return;
    }

    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await loginUser(form.email, form.password);
      } else {
        data = await registerUser(form.name, form.email, form.password);
      }
      
      // Pass token and user to App
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">🛡️</div>
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>Sign in to access secure night navigation</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <div className="spinner" /> : (isLogin ? 'Sign In' : 'Register')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }}>
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>

      <style>{`
        .auth-container {
          position: absolute;
          inset: 0;
          background: var(--bg-primary);
          background-image: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: var(--glass-bg);
          backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-panel);
          padding: 40px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }
        
        .auth-logo .logo-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--brand-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        }

        .auth-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .auth-header p {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .auth-error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          margin-bottom: 24px;
          text-align: center;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-left: 4px;
        }

        .input-group input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 14px 16px;
          border-radius: 12px;
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: 0.95rem;
          transition: all var(--transition-fast);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .input-group input:focus {
          outline: none;
          background: rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 4px rgba(139, 92, 246, 0.15);
        }

        .btn-auth {
          margin-top: 16px;
          padding: 16px;
          background: var(--text-primary);
          color: #000;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 4px 14px rgba(255, 255, 255, 0.2);
        }

        .btn-auth:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3);
        }
        
        .btn-auth:active {
          transform: translateY(0);
        }

        .auth-toggle {
          margin-top: 24px;
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .auth-toggle button {
          background: none;
          border: none;
          color: var(--brand-solid);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
          transition: color 0.2s;
        }

        .auth-toggle button:hover {
          color: #a855f7;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
