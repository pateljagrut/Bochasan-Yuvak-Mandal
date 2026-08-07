import React from 'react';
import { motion } from 'framer-motion';

/**
 * Responsive Hero Banner with animated counters.
 */
export default function HeroSection({ 
  title = "Karyakar Admin Dashboard", 
  subtitle = "Manage members, attendance, analytics and sabha content from one beautiful workspace.",
  totalYuvaks = 0,
  avgAttendance = 100,
  location = "Bochasan",
  onOpenCreateAdminModal
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="hero-banner"
    >
      <div className="hero-content">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-admin">Bochasan Yuvak Mandal</span>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            color: '#4ade80', 
            background: 'rgba(34, 197, 94, 0.15)', 
            padding: '0.2rem 0.55rem', 
            borderRadius: '12px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></span>
            ⚡ Real-Time Admin Sync Active
          </span>
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(1.35rem, 4vw, 2rem)', 
          fontWeight: 800, 
          margin: '0 0 0.35rem 0', 
          lineHeight: 1.25, 
          color: '#FF9B42', 
          WebkitTextFillColor: '#FF9B42' 
        }}>
          {title.startsWith('Karyakar Admin') ? (
            <>Karyakar Admin <span style={{ color: '#FF9B42', WebkitTextFillColor: '#FF9B42' }}>Dashboard</span></>
          ) : title}
        </h1>

        <p style={{ fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', margin: 0, lineHeight: 1.45 }}>
          {subtitle}
        </p>
        
        {onOpenCreateAdminModal && (
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOpenCreateAdminModal} style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
              + Create Karyakar Admin
            </button>
          </div>
        )}
      </div>

      <div className="hero-stats-grid">
        <div className="hero-stat-box">
          <motion.div 
            className="hero-stat-value"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {totalYuvaks}
          </motion.div>
          <div className="hero-stat-label">Registered Members</div>
        </div>

        <div className="hero-stat-box">
          <motion.div 
            className="hero-stat-value"
            style={{ color: '#14b8a6' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {avgAttendance}%
          </motion.div>
          <div className="hero-stat-label">Avg Attendance</div>
        </div>

        <div className="hero-stat-box">
          <div className="hero-stat-value hero-stat-value-location" style={{ color: '#22c55e' }}>
            {location}
          </div>
          <div className="hero-stat-label">Active Center</div>
        </div>
      </div>
    </motion.div>
  );
}
