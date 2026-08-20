import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { registerYuvakApi } from '../services/api';
import { ThemeToggle } from '../context/ThemeContext';
import SuccessModal from '../components/SuccessModal';
import Logo from '../components/Logo';
import { UserPlus, Sparkles } from 'lucide-react';

export default function RegisterPage({ onNavigateLogin }) {
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_no: '',
    dob: '',
    location: 'Bochasan'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await registerYuvakApi(formData);
      if (res.success) {
        setRegistrationResult(res);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      position: 'relative'
    }}>
      {/* Top Floating Theme Switcher */}
      <ThemeToggle variant="floating" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="glass-card" 
        style={{ 
          width: '100%', 
          maxWidth: '480px', 
          padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3.5vw, 2rem)',
          border: '1px solid var(--primary-border)',
          boxShadow: 'var(--shadow-card), 0 0 30px var(--primary-glow)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <Logo size="lg" showSubtitle={false} />
          </div>
          <h2 style={{ 
            fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', 
            marginBottom: '0.3rem', 
            background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--text-orange) 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Yuvak Member Registration
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Fill details below to generate your unique Yuvak ID.
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
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              className="form-control"
              placeholder="e.g. Rohan Patel"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>10-Digit Mobile Number</label>
            <input
              type="tel"
              name="mobile_no"
              className="form-control"
              placeholder="e.g. 9876543210"
              value={formData.mobile_no}
              onChange={handleChange}
              maxLength="10"
              pattern="[0-9]{10}"
              required
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-orange)', marginTop: '0.25rem', display: 'block' }}>
              Used as your default initial login password.
            </span>
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              className="form-control"
              value={formData.dob}
              onChange={handleChange}
              required
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-orange)', marginTop: '0.25rem', display: 'block' }}>
              Used to generate ID suffix (DDMM e.g. 2712).
            </span>
          </div>

          <div className="form-group">
            <label>Mandal Center / Location</label>
            <input
              type="text"
              name="location"
              className="form-control"
              placeholder="e.g. Bochasan"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', minHeight: '46px', fontSize: '0.95rem' }}
            disabled={loading}
          >
            <UserPlus size={18} />
            {loading ? 'Creating Yuvak Profile...' : 'Register & Generate Yuvak ID ✨'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <button
            onClick={onNavigateLogin}
            style={{ background: 'none', border: 'none', color: 'var(--text-orange)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Back to Smart Login
          </button>
        </div>
      </motion.div>

      {/* Success Modal displaying generated Yuvak ID */}
      {registrationResult && (
        <SuccessModal
          registrationData={registrationResult}
          onClose={() => setRegistrationResult(null)}
          onGoToLogin={onNavigateLogin}
        />
      )}
    </div>
  );
}
