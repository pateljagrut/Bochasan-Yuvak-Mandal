import React from 'react';

/**
 * Circular Attendance Tracker Component.
 * Dynamic SVG circular progress meter featuring animated stroke offsets and theme adaptation.
 */
export default function CircularAttendanceTracker({ attended = 0, total = 0, percentage = 100 }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-tracker-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="orangeTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7a18" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>

          {/* Background Ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--border-hover)"
            strokeWidth="12"
          />

          {/* Animated Progress Ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#orangeTealGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </svg>

        {/* Center Text */}
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {percentage}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
            Attendance Rate
          </div>
        </div>
      </div>

      {/* Metric Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', width: '100%', marginTop: '1.25rem' }}>
        <div style={{ background: 'var(--bg-stat-box)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)', transition: 'background-color 0.25s' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-orange)' }}>{total}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Sabhas</div>
        </div>
        <div style={{ background: 'var(--bg-stat-box)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)', transition: 'background-color 0.25s' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#14b8a6' }}>{attended}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Attended</div>
        </div>
        <div style={{ background: 'var(--bg-stat-box)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)', transition: 'background-color 0.25s' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444' }}>{total - attended}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Absences</div>
        </div>
      </div>
    </div>
  );
}
