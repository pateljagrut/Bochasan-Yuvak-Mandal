import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { createKaryakarAdminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, X, User, Phone, Calendar } from 'lucide-react';

export default function AdminKaryakarCreationModal({ onClose, onSuccess }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    dob: '',
    mobile_no: '',
    location: 'Bochasan'
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
      const res = await createKaryakarAdminApi(formData, token);
      if (res.success) {
        onSuccess(res.message);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create Karyakar Admin account.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="modal-container"
        style={{
          maxWidth: '540px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-modal)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 122, 24, 0.4)',
          boxShadow: 'var(--shadow-card)',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={24} color="#ff7a18" />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Create Karyakar Admin</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Grant full administrative privileges to a team member.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="admin-username">Admin Username (for Login)</label>
            <input
              id="admin-username"
              type="text"
              name="username"
              className="form-control"
              placeholder="e.g. karyakar.bochasan"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-control"
                style={{ paddingRight: '2.5rem' }}
                placeholder="Secure Admin Password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="admin-fullname">Full Name</label>
            <input
              id="admin-fullname"
              type="text"
              name="full_name"
              className="form-control"
              placeholder="e.g. Harshad Karyakar"
              value={formData.full_name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-dob" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} color="#ff7a18" /> Date of Birth
            </label>
            <input
              id="admin-dob"
              type="date"
              name="dob"
              className="form-control"
              value={formData.dob}
              onChange={handleChange}
              autoComplete="bday"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="admin-mobile">Mobile Number</label>
              <input
                id="admin-mobile"
                type="tel"
                name="mobile_no"
                className="form-control"
                placeholder="Mobile"
                value={formData.mobile_no}
                onChange={handleChange}
                autoComplete="tel"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-location">Mandal Center</label>
              <input
                id="admin-location"
                type="text"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                autoComplete="address-level2"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-teal" disabled={loading}>
              {loading ? 'Creating...' : '🛡️ Create Admin Account'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
