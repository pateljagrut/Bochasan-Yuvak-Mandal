import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../context/ThemeContext';
import Logo from './Logo';
import NotificationDrawer from './NotificationDrawer';
import { 
  Search, 
  LogOut, 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  BarChart3, 
  MessageSquareText,
  Bell,
  MessageSquare
} from 'lucide-react';
import { getRealtimeSseUrl, getRealtimeWebSocketUrl } from '../services/api';

/**
 * Modern Header Navigation Bar with Light and Night mode support,
 * Top-Bar Notification Bell Drawer & Admin-only SMS Broadcast Center.
 */
export default function Navbar({ 
  activeTab = 'dashboard', 
  setActiveTab = () => {}, 
  onOpenCreateAdminModal,
  onOpenSearch = () => {},
  onOpenSmsModal = () => {},
  feeds = []
}) {
  const { user, role, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync unread notification count from localStorage and live events
  useEffect(() => {
    const updateCountFromStorage = () => {
      try {
        const stored = localStorage.getItem('bym_notifications');
        if (stored) {
          const list = JSON.parse(stored);
          const count = (list || []).filter(n => !n.isRead).length;
          setUnreadCount(count);
        } else if (feeds && feeds.length > 0) {
          setUnreadCount(Math.min(feeds.length, 3));
        }
      } catch (_) {}
    };

    updateCountFromStorage();
    window.addEventListener('storage', updateCountFromStorage);

    // Live stream listeners to increment unread count immediately
    let eventSource = null;
    let ws = null;

    try {
      eventSource = new EventSource(getRealtimeSseUrl());
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.event && parsed.event !== 'CONNECTED') {
            setUnreadCount(prev => prev + 1);
          }
        } catch (_) {}
      };
    } catch (_) {}

    try {
      ws = new WebSocket(getRealtimeWebSocketUrl());
      ws.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.event) {
            setUnreadCount(prev => prev + 1);
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      window.removeEventListener('storage', updateCountFromStorage);
      if (eventSource) eventSource.close();
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [feeds]);

  // When notification drawer opens, unread count can be updated after user marks read
  useEffect(() => {
    if (!showNotifications) {
      try {
        const stored = localStorage.getItem('bym_notifications');
        if (stored) {
          const list = JSON.parse(stored);
          setUnreadCount((list || []).filter(n => !n.isRead).length);
        }
      } catch (_) {}
    }
  }, [showNotifications]);

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

  const currentNavItems = role === 'admin' ? adminNavItems : yuvakNavItems;

  return (
    <header className="app-header">
      <div className="header-container">
        
        {/* Left: Brand Logo */}
        <div 
          className="cursor-pointer shrink-0" 
          onClick={() => setActiveTab(role === 'admin' ? 'dashboard' : 'attendance')}
        >
          <Logo size="md" />
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="desktop-nav-tabs">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right-Side Action Group */}
        <div className="user-nav-actions">
          
          {/* Quick Search Shortcut Trigger */}
          <button 
            className="search-trigger-btn hidden xl:flex"
            onClick={onOpenSearch} 
            title="Search Workspace (Ctrl+K)"
          >
            <Search size={14} />
            <span className="whitespace-nowrap">Search</span>
            <span className="search-kbd">⌘K</span>
          </button>

          {/* Admin-Only SMS Broadcast Trigger Button (Desktop Only) */}
          {role === 'admin' && (
            <button
              className="sms-header-trigger-btn hidden lg:inline-flex"
              onClick={onOpenSmsModal}
              title="SMS Broadcast Center (Admin Only)"
            >
              <MessageSquare size={14} color="#ff7a18" />
              <span>SMS Broadcast</span>
            </button>
          )}

          {/* Top-Bar Notification Bell & Interactive Drawer */}
          <div className="relative">
            <button 
              className={`navbar-icon-btn notif-bell-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => setShowNotifications(prev => !prev)}
              title="Notifications & Alerts"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="notification-badge-dot" title={`${unreadCount} unread`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Bell Dropdown Drawer */}
            <NotificationDrawer
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                setShowNotifications(false);
              }}
              feeds={feeds}
            />
          </div>

          {/* Theme Toggle Button (Light / Night) */}
          <ThemeToggle />

          {user && (
            <>
              {/* User Profile Pill Container */}
              <div className="user-info-chip">
                {/* Circular Avatar Badge */}
                <div className="avatar-circle">
                  {(user.full_name === 'Lead Admin Karyakar' ? 'P' : (user.full_name || user.username || 'P')[0]).toUpperCase()}
                </div>

                {/* Text Wrapper (Vertical Flex Column Stack) */}
                <div className="user-info-chip-text">
                  <span className="user-name">
                    {user.full_name === 'Lead Admin Karyakar' ? 'Patel Vidur' : (user.full_name || user.username)}
                  </span>
                  <span className={`badge ${role === 'admin' ? 'badge-admin' : 'badge-yuvak'}`}>
                    {role === 'admin' ? 'Karyakar Admin' : 'Yuvak'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                className="navbar-icon-btn logout-btn"
                onClick={logout}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
