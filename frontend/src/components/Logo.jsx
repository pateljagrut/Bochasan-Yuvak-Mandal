import React from 'react';

/**
 * Modern Bochasan Yuvak Mandal Emblem Logo Component.
 */
export default function Logo({ size = 'md', showSubtitle = true, className = '' }) {
  const badgeSizes = {
    sm: '40px',
    md: '52px',
    lg: '76px'
  };

  const currentSize = badgeSizes[size] || badgeSizes.md;

  return (
    <div className={`brand-logo-container ${className}`}>
      <div 
        className="logo-badge-container"
        style={{
          width: currentSize,
          height: currentSize,
          borderRadius: '50%',
          border: '1.5px solid var(--primary-border)',
          boxShadow: '0 0 16px var(--primary-glow)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        <img 
          src="/logo.png" 
          alt="Bochasan Yuvak Mandal Logo" 
          className="logo-badge-img"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }}
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
