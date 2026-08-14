import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { registerYuvakApi, createKaryakarAdminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, X, User, Phone, Calendar, MapPin, Loader2, Sparkles, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

/**
 * AddMemberModal Component
 * 
 * Supports adding both Yuvak Members and Karyakar Admin accounts.
 */
export default function AddMemberModal({ onClose, onSuccess }) {
  const { token } = useAuth();
  const [memberRole, setMemberRole] = useState('yuvak'); // 'yuvak' or 'admin'
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_no: '',
    dob: '',
    location: 'Bochasan',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (memberRole === 'admin') {
        const usernameToUse = formData.username.trim() || `karyakar_${formData.mobile_no.slice(-4)}`;
        const passwordToUse = formData.password.trim() || formData.mobile_no;
        const res = await createKaryakarAdminApi({
          username: usernameToUse,
          password: passwordToUse,
          full_name: formData.full_name,
          dob: formData.dob,
          mobile_no: formData.mobile_no,
          location: formData.location
        }, token);

        if (res && res.success) {
          if (onSuccess) {
            onSuccess(`✅ Admin Member '${formData.full_name}' (${res.yuvak_id || usernameToUse}) created successfully!`);
          }
          onClose();
        } else {
          throw new Error(res?.message || 'Failed to create Admin account');
        }
      } else {
        const res = await registerYuvakApi({
          full_name: formData.full_name,
          mobile_no: formData.mobile_no,
          dob: formData.dob,
          location: formData.location
        });

        if (res && res.success) {
          if (onSuccess) {
            onSuccess(`✅ Yuvak Member '${res.full_name || formData.full_name}' (${res.yuvak_id}) registered successfully!`);
          }
          onClose();
        } else {
          throw new Error(res?.message || 'Failed to register member');
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.5rem',
          overflowY: 'auto'
        }}
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#0f172a',
            borderRadius: '20px',
            padding: '2rem',
            border: memberRole === 'admin' ? '1px solid rgba(255, 122, 24, 0.6)' : '1px solid rgba(20, 184, 166, 0.4)',
            boxShadow: memberRole === 'admin' ? '0 25px 60px -10px rgba(0,0,0,0.9), 0 0 40px rgba(255,122,24,0.3)' : '0 25px 60px -10px rgba(0,0,0,0.9), 0 0 40px rgba(20,184,166,0.2)',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: memberRole === 'admin' ? 'rgba(255, 122, 24, 0.15)' : 'rgba(20, 184, 166, 0.15)',
                border: memberRole === 'admin' ? '1px solid rgba(255, 122, 24, 0.35)' : '1px solid rgba(20, 184, 166, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: memberRole === 'admin' ? '#ff9b42' : '#14b8a6',
                flexShrink: 0
              }}>
                {memberRole === 'admin' ? <ShieldCheck size={22} /> : <UserPlus size={22} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  {memberRole === 'admin' ? 'Add New Karyakar Admin' : 'Add New Yuvak Member'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Select role and enter details to register into Members DB.
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="icon-btn-ghost"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                padding: '0.5rem', 
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              color: '#f87171',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Member Role Toggle Buttons */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '9px',
                border: 'none',
                background: memberRole === 'yuvak' ? 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' : 'transparent',
                color: memberRole === 'yuvak' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setMemberRole('yuvak')}
            >
              👤 Yuvak Member
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '9px',
                border: 'none',
                background: memberRole === 'admin' ? 'linear-gradient(135deg, #ff7a18 0%, #f59e0b 100%)' : 'transparent',
                color: memberRole === 'admin' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setMemberRole('admin')}
            >
              👑 Karyakar Admin
            </button>
          </div>

          {/* Member Registration Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <User size={15} color={memberRole === 'admin' ? '#ff9b42' : '#14b8a6'} /> Full Name
              </label>
              <input
                type="text"
                name="full_name"
                className="form-control"
                style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}
                placeholder="e.g. Patel Vidur / Amit Shah"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            {memberRole === 'admin' && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <ShieldCheck size={15} color="#ff9b42" /> Admin Username (for Login)
                  </label>
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}
                    placeholder="e.g. vidur.patel"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Lock size={15} color="#ff9b42" /> Admin Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control"
                      style={{ padding: '0.7rem 2.5rem 0.7rem 1rem', fontSize: '0.9rem' }}
                      placeholder="Secure Admin Password"
                      value={formData.password}
                      onChange={handleChange}
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
              </>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Phone size={15} color={memberRole === 'admin' ? '#ff9b42' : '#14b8a6'} /> Mobile Number
              </label>
              <input
                type="tel"
                name="mobile_no"
                className="form-control"
                style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}
                placeholder="e.g. 9876543210"
                value={formData.mobile_no}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Calendar size={15} color={memberRole === 'admin' ? '#ff9b42' : '#14b8a6'} /> Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                className="form-control"
                style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <MapPin size={15} color={memberRole === 'admin' ? '#ff9b42' : '#14b8a6'} /> Mandal Location / Center
              </label>
              <select
                name="location"
                className="form-control"
                style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}
                value={formData.location}
                onChange={handleChange}
              >
                <option value="Bochasan">Bochasan</option>
                <option value="Atladara">Atladara</option>
                <option value="Gadhada">Gadhada</option>
                <option value="Anand">Anand</option>
                <option value="Vadodara">Vadodara</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Surat">Surat</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>

            {/* Modal Action Buttons */}
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem', height: '44px' }}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  height: '44px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  background: memberRole === 'admin' ? 'linear-gradient(135deg, #ff7a18 0%, #f59e0b 100%)' : undefined 
                }}
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (memberRole === 'admin' ? <ShieldCheck size={18} /> : <Sparkles size={18} />)}
                {loading ? 'Adding Member...' : (memberRole === 'admin' ? 'Create Admin Member' : 'Register Yuvak')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
