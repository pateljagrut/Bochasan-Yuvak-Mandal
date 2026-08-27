import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../context/ThemeContext';
import Logo from '../components/Logo';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage({ onNavigateRegister }) {
  const { login, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const msg = sessionStorage.getItem('Bochasan_session_expired_notice');
      sessionStorage.removeItem('Bochasan_session_expired_notice');
      if (
        msg &&
        typeof msg === 'string' &&
        msg.trim().length > 0 &&
        msg !== '[object Object]' &&
        !msg.startsWith('[object')
      ) {
        return msg;
      }
    }
    return null;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1rem, 3vw, 1.5rem)',
        position: 'relative'
      }}
    >
      {/* Floating Theme Switcher */}
      <ThemeToggle variant="floating" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'clamp(1.5rem, 4vw, 2.25rem) clamp(1.1rem, 3.5vw, 2rem)',
          border: '1px solid var(--primary-border)',
          boxShadow: 'var(--shadow-card), 0 0 30px var(--primary-glow)',
          borderRadius: '20px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <Logo size="lg" showSubtitle={false} />
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.35rem, 4vw, 1.75rem)',
              fontWeight: 800,
              marginBottom: '0.35rem',
              color: 'var(--text-primary)'
            }}
          >
            Portal Sign In
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Enter your Yuvak ID, Mobile No, or Admin Username
          </p>
        </div>

        {notice && typeof notice === 'string' && notice !== '[object Object]' && !notice.startsWith('[object') && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: 'var(--accent, #f59e0b)',
              padding: '0.75rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            ℹ️ {notice}
          </div>
        )}

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              color: '#ef4444',
              padding: '0.75rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Yuvak ID / Mobile No / Username
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. DHE2712, 7096617464, or vidur.patel"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingRight: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem'
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              minHeight: '46px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          New Yuvak member?{' '}
          <button
            onClick={onNavigateRegister}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-orange)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Register Profile Here
          </button>
        </div>
      </motion.div>
    </div>
  );
}
