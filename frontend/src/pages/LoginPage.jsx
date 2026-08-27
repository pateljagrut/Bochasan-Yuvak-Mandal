import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../context/ThemeContext';
import Logo from '../components/Logo';
import { Eye, EyeOff, LogIn, Clock, X, AlertCircle } from 'lucide-react';

export default function LoginPage({ onNavigateRegister }) {
  const { login, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const msg = sessionStorage.getItem('Bochasan_session_expired_notice');
      if (msg) {
        sessionStorage.removeItem('Bochasan_session_expired_notice');
        return msg;
      }
    }
    return null;
  });

  // Auto-dismiss the toast message after 6 seconds
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => {
        setNotice(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

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

      {/* Floating Inactivity / Session Expired Toast Notification */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.1rem',
              borderRadius: '14px',
              background: 'rgba(23, 23, 23, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35), 0 0 20px rgba(245, 158, 11, 0.25)',
              color: '#fef3c7',
              maxWidth: '92vw',
              width: 'max-content'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#f59e0b'
              }}
            >
              <Clock size={17} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fbbf24', lineHeight: 1.25 }}>
                Session Inactivity
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(254, 243, 199, 0.9)', lineHeight: 1.3 }}>
                {notice}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(254, 243, 199, 0.6)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '0.5rem',
                borderRadius: '6px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(254, 243, 199, 0.6)')}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: 700
            }}
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}
        >
          New to Bochasan Yuvak Mandal?{' '}
          <button
            type="button"
            onClick={onNavigateRegister}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Register Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}
