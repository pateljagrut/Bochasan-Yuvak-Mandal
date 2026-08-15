import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Eye, EyeOff, LogIn, Sparkles, UserCheck, Shield } from 'lucide-react';

export default function LoginPage({ onNavigateRegister }) {
  const { login, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleQuickFillYuvak = () => {
    setIdentifier('ROH3210');
    setPassword('9876543210');
    setError(null);
  };

  const handleQuickFillAdmin = () => {
    setIdentifier('vidur.patel');
    setPassword('Vidur@2026');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem 2rem',
          border: '1px solid rgba(255, 122, 24, 0.3)',
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7), 0 0 30px rgba(255,122,24,0.15)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <Logo size="lg" showSubtitle={false} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.3rem', background: 'linear-gradient(135deg, #FFF, #ff9b42)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Unified Smart Login
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Bochasan Yuvak Mandal Sabha Attendance Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            textAlign: 'center',
            fontWeight: 500
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Yuvak ID / Mobile No / Admin Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. ROH3210, 9876543210, or admin"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
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
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', minHeight: '46px', fontSize: '0.95rem' }}
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>


        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          New Yuvak member?{' '}
          <button
            onClick={onNavigateRegister}
            style={{ background: 'none', border: 'none', color: '#ff9b42', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Register Profile Here
          </button>
        </div>
      </motion.div>
    </div>
  );
}
