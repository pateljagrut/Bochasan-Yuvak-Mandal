import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, Megaphone, Calendar } from 'lucide-react';

/**
 * Slide-Over Notification Drawer for announcements & system alerts.
 */
export default function NotificationDrawer({ isOpen, onClose, feeds = [] }) {
  if (!isOpen) return null;

  const sampleNotifications = [
    {
      id: 1,
      title: 'Sabha Attendance Recorded',
      desc: 'Yuvak Sabha attendance has been recorded.',
      time: '10m ago',
      type: 'attendance',
      icon: CalendarCheck,
      color: '#22c55e'
    },
    {
      id: 2,
      title: 'Upcoming Saturday Sabha',
      desc: 'Niyama orientation session starting at 6:00 PM this Saturday.',
      time: '2h ago',
      type: 'sabha',
      icon: Clock,
      color: '#14b8a6'
    },
    ...feeds.map((f, i) => ({
      id: `feed-${i}`,
      title: f.title,
      desc: f.content,
      time: new Date(f.created_at || Date.now()).toLocaleDateString(),
      type: 'feed',
      icon: Megaphone,
      color: '#ff7a18'
    }))
  ];

  return (
    <AnimatePresence>
      <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{ justifyContent: 'flex-end', padding: 0 }}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            width: '100%',
            maxWidth: '380px',
            height: '100vh',
            background: '#0B1120',
            borderLeft: '1px solid var(--border-subtle)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bell size={20} color="#ff7a18" />
              <h3 style={{ fontSize: '1.1rem' }}>Notifications</h3>
              <span className="badge badge-admin">{sampleNotifications.length} New</span>
            </div>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sampleNotifications.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(17, 24, 39, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    gap: '0.85rem'
                  }}
                >
                  <div 
                    style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '8px', 
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={18} color={item.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {item.title}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                      {item.desc}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
