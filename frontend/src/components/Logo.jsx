import React from 'react';

/**
 * Modern Bochasan Yuvak Mandal Emblem Logo Component.
 */
export default function Logo({ size = 'md', showSubtitle = true, className = '' }) {
  return (
    <div className={`brand-logo-container brand-logo-${size} ${className}`}>
      <div className="logo-badge-container">
        <img 
          src="/logo.png" 
          alt="Bochasan Yuvak Mandal Logo" 
          className="logo-badge-img"
        />
      </div>

      <div className="brand-text-wrapper">
        <span className="brand-title">
          Bochasan Yuvak Mandal
        </span>
        {showSubtitle && (
          <span className="brand-subtitle">
            Attendance Portal
          </span>
        )}
      </div>
    </div>
  );
}
