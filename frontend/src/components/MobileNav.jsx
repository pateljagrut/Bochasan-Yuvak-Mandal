import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CalendarCheck, Users, BarChart3, MessageSquareText } from 'lucide-react';

/**
 * Mobile-First Bottom Navigation Bar & Floating Action Button (FAB).
 * Dynamically displays 5 tabs for Admin and 3 tabs for Yuvak members.
 */
export default function MobileNav({ activeTab, setActiveTab, onFabClick }) {
  const { role } = useAuth();

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'yuvaks', label: 'Members', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content', icon: MessageSquareText }
  ];

  const yuvakNavItems = [
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content', icon: MessageSquareText }
  ];

  const navItems = role === 'admin' ? adminNavItems : yuvakNavItems;

  return (
    <>
      {/* Floating Action Button for Quick Attendance */}
      <button 
        className="mobile-fab-btn"
        onClick={onFabClick || (() => setActiveTab('attendance'))}
        title="Mark Attendance"
        aria-label="Mark Attendance"
      >
        <CalendarCheck size={26} />
      </button>

      {/* Fixed Bottom Glass Navigation */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
