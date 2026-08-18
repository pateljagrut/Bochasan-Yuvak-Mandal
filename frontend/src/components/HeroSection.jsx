import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

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
        <div style={{ marginBottom: '0.5rem' }}>
          <span className="badge badge-admin">Bochasan Yuvak Mandal</span>
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(1.35rem, 4vw, 2rem)', 
          fontWeight: 800, 
          margin: '0 0 0.35rem 0', 
          lineHeight: 1.25, 
          color: 'var(--text-orange)', 
          WebkitTextFillColor: 'var(--text-orange)' 
        }}>
          {title.startsWith('Karyakar Admin') ? (
            <>Karyakar Admin <span style={{ color: 'var(--text-orange)', WebkitTextFillColor: 'var(--text-orange)' }}>Dashboard</span></>
          ) : title}
        </h1>

        <p style={{ fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', margin: 0, lineHeight: 1.45 }}>
          {subtitle}
        </p>
        
        {onOpenCreateAdminModal && (
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOpenCreateAdminModal}>
              <UserPlus size={16} />
              <span>Create Karyakar Admin</span>
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
            style={{ color: 'var(--text-orange)' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {avgAttendance}%
          </motion.div>
          <div className="hero-stat-label">Avg Attendance</div>
        </div>

        <div className="hero-stat-box">
          <div className="hero-stat-value hero-stat-value-location" style={{ color: 'var(--text-orange)' }}>
            {location}
          </div>
          <div className="hero-stat-label">Active Center</div>
        </div>
      </div>
    </motion.div>
  );
}
