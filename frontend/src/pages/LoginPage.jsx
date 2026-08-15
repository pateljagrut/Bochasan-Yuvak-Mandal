import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../context/ThemeContext';
import Logo from '../components/Logo';
import BapsHeroSlideshow from '../components/BapsHeroSlideshow';
import BapsHomeSection from '../components/BapsHomeSection';
import { getContentFeedsApi } from '../services/api';
import { Eye, EyeOff, LogIn, Sparkles, UserCheck, Shield, UserPlus } from 'lucide-react';

export default function LoginPage({ onNavigateRegister }) {
  const { login, loading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [feeds, setFeeds] = useState([]);

  // Fetch real feeds if available
  useEffect(() => {
    getContentFeedsApi().then(res => {
      if (res?.feeds) setFeeds(res.feeds);
    }).catch(() => {});
  }, []);

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
    setIdentifier('DHE2712');
    setPassword('7096617464');
    setError(null);
  };

  const handleQuickFillAdmin = () => {
    setIdentifier('vidur.patel');
    setPassword('Vidur@2026');
    setError(null);
  };

  const scrollToLogin = () => {
    const el = document.getElementById('login-form-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* =========================================================================
          TOP BAPS PORTAL NAVBAR
          ========================================================================= */}
      <header className="app-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="cursor-pointer shrink-0">
            <Logo size="md" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={onNavigateRegister}
              className="btn btn-secondary hidden sm:inline-flex"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', alignItems: 'center', gap: '0.35rem' }}
            >
              <UserPlus size={15} />
              <span>Register Profile</span>
            </button>

            <button
              onClick={scrollToLogin}
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>

            {/* Theme Toggle Button (Light / Night Mode) */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO PHOTO SLIDESHOW (Directly Below Navbar)
          ========================================================================= */}
      <BapsHeroSlideshow 
        onCtaClick={scrollToLogin} 
        onNavigateTab={scrollToLogin}
      />

      {/* =========================================================================
          MAIN PORTAL CONTENT: LOGIN CARD + BAPS HOME SECTIONS
          ========================================================================= */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem', width: '100%' }}>
        
        {/* Top Grid: Smart Login Card + Welcome Intro */}
        <div 
          id="login-form-section" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '2rem', 
            alignItems: 'center', 
            marginBottom: '3.5rem',
            paddingTop: '1rem'
          }}
        >
          {/* Left Column: Welcome & Portal Introduction */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-admin">Bochasan Yuvak Mandal</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-orange)', fontWeight: 700 }}>
                ● Official Attendance & Satsang Portal
              </span>
            </div>

            <h1 style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.6rem)', 
              fontWeight: 800, 
              lineHeight: 1.2, 
              margin: '0 0 1rem 0',
              color: 'var(--text-primary)'
            }}>
              Welcome to <span style={{ color: 'var(--text-orange)' }}>Bochasan Yuvak Mandal</span> Portal
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 1.5rem 0', maxWidth: '560px' }}>
              A dedicated digital portal for Saturday Shanivariya Sabha attendance marking, youth member profiles, spiritual niyama feeds, and mandal announcements.
            </p>

            {/* Quick Demo Fill Pills */}
            <div style={{ background: 'var(--bg-stat-box)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '1rem', maxWidth: '480px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ⚡ Fast 1-Click Demo Credentials
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleQuickFillAdmin}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Shield size={14} color="#ff7a18" /> Fill Admin (Vidur Patel)
                </button>
                <button
                  type="button"
                  onClick={handleQuickFillYuvak}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <UserCheck size={14} color="#14b8a6" /> Fill Yuvak (DHE2712)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Unified Smart Login Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              margin: '0 auto',
              padding: '2.25rem 2rem',
              borderRadius: '22px',
              border: '1px solid var(--primary-border)',
              boxShadow: 'var(--shadow-card), 0 0 30px var(--primary-glow)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ 
                fontSize: '1.55rem', 
                fontWeight: 800,
                marginBottom: '0.25rem', 
                color: 'var(--text-primary)'
              }}>
                Unified Smart Sign In
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Sign in with Yuvak ID, Mobile No, or Admin Username
              </p>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                color: '#ef4444',
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
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Yuvak ID / Mobile No / Admin Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. DHE2712, 7096617464, or vidur.patel"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
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
                style={{ width: '100%', padding: '0.85rem', minHeight: '46px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
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
                style={{ background: 'none', border: 'none', color: 'var(--text-orange)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Register Profile Here
              </button>
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            BAPS HOME SECTIONS (Gateway, Live Saturday Countdown, News & Announcements)
            ========================================================================= */}
        <BapsHomeSection 
          onNavigateTab={scrollToLogin} 
          feeds={feeds} 
          yuvaksCount={0} 
          isAdmin={false} 
        />
      </div>
    </div>
  );
}
