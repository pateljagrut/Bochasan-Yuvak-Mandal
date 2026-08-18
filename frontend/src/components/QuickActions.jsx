import React from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Users, Megaphone, ShieldPlus, ArrowRight } from 'lucide-react';

/**
 * Quick Action Cards for core administrative tasks.
 */
export default function QuickActions({ setActiveTab, onOpenCreateAdminModal }) {
  const actions = [
    {
      id: 'attendance',
      title: 'Sabha Attendance',
      description: 'Record Sunday Sabha presence with interactive checkboxes.',
      icon: CalendarCheck,
      onClick: () => setActiveTab('attendance')
    },
    {
      id: 'yuvaks',
      title: 'Yuvak Directory',
      description: 'Search & edit member profiles, contact info, and metrics.',
      icon: Users,
      onClick: () => setActiveTab('yuvaks')
    },
    {
      id: 'content',
      title: 'Content & Niyama',
      description: 'Publish announcements and spiritual niyama feeds.',
      icon: Megaphone,
      onClick: () => setActiveTab('content')
    },
    {
      id: 'create-admin',
      title: 'Create Karyakar Admin',
      description: 'Grant role-based administrative access to new karyakars.',
      icon: ShieldPlus,
      onClick: onOpenCreateAdminModal
    }
  ];

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
        Quick Actions
      </h3>

      <div className="quick-actions-grid">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="action-card"
              onClick={action.onClick}
            >
              <div className="action-icon">
                <Icon size={24} />
              </div>
              <div className="action-info">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <ArrowRight className="action-arrow" size={18} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
