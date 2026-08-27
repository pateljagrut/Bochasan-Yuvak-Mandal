import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CalendarCheck, Users, BarChart3, MessageSquareText, MessageSquare } from 'lucide-react';

/**
 * Mobile-First Bottom Navigation Bar & Floating Action Button (FAB).
 * Dynamically displays 5 tabs for Admin (including SMS Broadcast) and 4 tabs for Yuvak members.
 */
export default function MobileNav({ activeTab, setActiveTab, onFabClick, onOpenSmsModal }) {
  const { role } = useAuth();

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'yuvaks', label: 'Members', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content', icon: MessageSquareText }
  ];

  const yuvakNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content', icon: MessageSquareText }
  ];

  const navItems = role === 'admin' ? adminNavItems : yuvakNavItems;

  return (
    <>
      {/* Floating Action Button for Quick Attendance (Admin only, hidden on attendance tab to prevent button overlap) */}
      {role === 'admin' && activeTab !== 'attendance' && (
        <button 
          className="mobile-fab-btn"
          onClick={onFabClick || (() => setActiveTab('attendance'))}
          title="Mark Attendance"
          aria-label="Mark Attendance"
        >
          <CalendarCheck size={24} />
        </button>
      )}

      {/* Fixed Bottom Glass Navigation */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isBroadcastAction = item.id === 'sms';

          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${isActive ? 'active' : ''} ${isBroadcastAction ? 'mobile-nav-broadcast-btn' : ''}`}
              onClick={() => {
                if (item.isAction) {
                  if (item.onClick) item.onClick();
                  else if (onOpenSmsModal) onOpenSmsModal();
                } else {
                  setActiveTab(item.id);
                }
              }}
            >
              <Icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 1.8} 
                color={isBroadcastAction ? '#ff7a18' : undefined} 
              />
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: isActive || isBroadcastAction ? 700 : 500, 
                lineHeight: 1.1,
                color: isBroadcastAction ? 'var(--text-orange)' : undefined
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

