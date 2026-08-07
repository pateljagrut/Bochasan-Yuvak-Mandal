import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, ArrowRight } from 'lucide-react';

export default function SuccessModal({ registrationData, onClose, onGoToLogin }) {
  const [copied, setCopied] = useState(false);

  if (!registrationData) return null;

  const { yuvak_id, full_name, mobile_no, location } = registrationData;

  const handleCopyId = () => {
    navigator.clipboard.writeText(yuvak_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="modal-container" 
        style={{ textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: '64px',
          height: '64px',
          background: 'rgba(34, 197, 94, 0.15)',
          color: '#22c55e',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          border: '2px solid #22c55e'
        }}>
          <Check size={32} strokeWidth={3} />
        </div>

        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Registration Successful!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Jai Swaminarayan, <strong>{full_name}</strong>! Your Yuvak profile has been created.
        </p>

        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 122, 24, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(255, 122, 24, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          margin: '1.25rem 0',
          boxShadow: '0 0 25px rgba(255, 122, 24, 0.2)'
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Your Unique Auto-Generated Yuvak ID
          </span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: '#ff9b42', letterSpacing: '0.08em', margin: '0.4rem 0' }}>
            {yuvak_id}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#ff9b42' }}>
            Formula: Upper(First 3 Letters) + Last 4 Mobile Digits
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.85rem' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            📱 <strong>Mobile:</strong> {mobile_no}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            📍 <strong>Location:</strong> {location} Mandal
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={handleCopyId}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied ID' : 'Copy Yuvak ID'}
          </button>
          <button className="btn btn-primary" onClick={onGoToLogin}>
            Proceed to Login <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
