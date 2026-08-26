import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  CalendarCheck, 
  Megaphone, 
  Users, 
  Image, 
  Sparkles, 
  MessageSquare, 
  Clock, 
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRealtimeSseUrl, getRealtimeWebSocketUrl } from '../services/api';

/**
 * Format relative time (e.g. 'Just now', '5m ago', '2h ago', 'Yesterday')
 */
function getRelativeTime(timestamp) {
  if (!timestamp) return 'Recently';
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSec = Math.floor((now - date) / 1000);

  if (isNaN(diffInSec) || diffInSec < 10) return 'Just now';
  if (diffInSec < 60) return `${diffInSec}s ago`;
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHour = Math.floor(diffInMin / 60);
  if (diffInHour < 24) return `${diffInHour}h ago`;
  const diffInDays = Math.floor(diffInHour / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/**
 * Modern Glassmorphic Top-Bar Notification Bell Drawer
 */
export default function NotificationDrawer({ 
  isOpen, 
  onClose, 
  onNavigateTab,
  feeds = [] 
}) {
  const { role, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'sabha' | 'announcements' | 'updates'
  const drawerRef = useRef(null);

  // Load initial notifications from LocalStorage + active content feeds
  useEffect(() => {
    const stored = localStorage.getItem('bym_notifications');
    let localList = [];
    if (stored) {
      try {
        localList = JSON.parse(stored);
      } catch (_) {}
    }

    // Convert feeds into notifications if not already present
    const feedNotifications = (feeds || []).slice(0, 5).map(f => ({
      id: `feed_${f.id || f.title}`,
      title: f.title || 'Satsang Announcement',
      body: f.content ? f.content.substring(0, 100) + (f.content.length > 100 ? '...' : '') : 'New announcement posted.',
      category: f.category === 'niyama' ? 'announcements' : 'announcements',
      tab: 'content',
      timestamp: f.created_at || new Date().toISOString(),
      isRead: false,
      iconType: f.category === 'niyama' ? 'niyama' : 'announcement'
    }));

    // Merge and deduplicate by ID
    const mergedMap = new Map();
    [...localList, ...feedNotifications].forEach(item => {
      if (item && item.id && !mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    });

    const initialList = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    setNotifications(initialList);
  }, [feeds]);

  // Persist notifications on change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('bym_notifications', JSON.stringify(notifications.slice(0, 40)));
    }
  }, [notifications]);

  // Real-time listener for incoming events
  useEffect(() => {
    let eventSource = null;
    let ws = null;

    const addNewNotification = (newNotif) => {
      setNotifications(prev => {
        // Prevent duplicate IDs
        if (prev.some(n => n.id === newNotif.id)) return prev;
        const updated = [newNotif, ...prev].slice(0, 40);
        return updated;
      });
    };

    const processIncomingEvent = (payload) => {
      if (!payload || !payload.event || payload.event === 'CONNECTED') return;
      const { event: evtType, data: evtData } = payload;
      const nowIso = new Date().toISOString();

      if (evtType === 'ATTENDANCE_UPDATED') {
        addNewNotification({
          id: `att_${Date.now()}`,
          title: 'Sabha Attendance Recorded',
          body: `Attendance marked for Saturday ${evtData?.sabha_date || 'Session'} by ${evtData?.marked_by || 'Admin'}.`,
          category: 'sabha',
          tab: 'attendance',
          timestamp: nowIso,
          isRead: false,
          iconType: 'attendance'
        });
      } else if (evtType === 'CONTENT_UPDATED') {
        const isPhoto = evtData?.type === 'photo';
        addNewNotification({
          id: `content_${Date.now()}`,
          title: isPhoto ? 'New Event Photos Uploaded' : 'New Satsang Announcement',
          body: isPhoto ? 'Photo Gallery updated with new Utsav memories.' : 'New spiritual post published on Mandal feed.',
          category: 'announcements',
          tab: 'content',
          timestamp: nowIso,
          isRead: false,
          iconType: isPhoto ? 'photo' : 'announcement'
        });
      } else if (evtType === 'SMS_BROADCAST_SENT') {
        addNewNotification({
          id: `sms_${Date.now()}`,
          title: 'SMS Broadcast Dispatched',
          body: `Sent to ${evtData?.recipient_count || 0} members: "${evtData?.preview || ''}"`,
          category: 'updates',
          tab: role === 'admin' ? 'yuvaks' : 'dashboard',
          timestamp: nowIso,
          isRead: false,
          iconType: 'sms'
        });
      } else if (evtType === 'SABHA_SCHEDULE_UPDATED') {
        addNewNotification({
          id: `sabha_sched_${Date.now()}`,
          title: 'Sabha Schedule Updated',
          body: 'Upcoming Saturday Sabha timing & details have been revised.',
          category: 'sabha',
          tab: 'dashboard',
          timestamp: nowIso,
          isRead: false,
          iconType: 'sabha'
        });
      } else if (evtType === 'MEMBER_ADDED' || evtType === 'MEMBER_UPDATED') {
        addNewNotification({
          id: `member_${Date.now()}`,
          title: evtType === 'MEMBER_ADDED' ? 'New Yuvak Registered' : 'Member Profile Updated',
          body: evtType === 'MEMBER_ADDED' 
            ? `Welcome ${evtData?.full_name || 'Member'} (${evtData?.yuvak_id || ''}) to Bochasan Mandal!`
            : `Profile details for ${evtData?.member_name || 'Member'} were updated.`,
          category: 'updates',
          tab: role === 'admin' ? 'yuvaks' : 'attendance',
          timestamp: nowIso,
          isRead: false,
          iconType: 'member'
        });
      }
    };

    // 1. Connect SSE
    try {
      eventSource = new EventSource(getRealtimeSseUrl());
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          processIncomingEvent(parsed);
        } catch (_) {}
      };
    } catch (_) {}

    // 2. Connect WS fallback
    try {
      ws = new WebSocket(getRealtimeWebSocketUrl());
      ws.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          processIncomingEvent(parsed);
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (eventSource) eventSource.close();
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [role]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Mark single as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('bym_notifications');
  };

  // Handle click on a notification card
  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    if (item.tab && onNavigateTab) {
      onNavigateTab(item.tab);
    }
    onClose();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const getCategoryIcon = (iconType) => {
    switch (iconType) {
      case 'attendance':
      case 'sabha':
        return <CalendarCheck size={16} color="#14b8a6" />;
      case 'announcement':
        return <Megaphone size={16} color="#ff7a18" />;
      case 'photo':
        return <Image size={16} color="#3b82f6" />;
      case 'sms':
        return <MessageSquare size={16} color="#a855f7" />;
      case 'member':
        return <Users size={16} color="#22c55e" />;
      default:
        return <Sparkles size={16} color="#ff7a18" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={drawerRef}
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="notification-drawer-dropdown"
      >
        {/* Drawer Header */}
        <div className="notif-header">
          <div className="notif-header-title">
            <div className="notif-bell-badge-icon">
              <Bell size={17} color="#ff7a18" />
            </div>
            <div>
              <h3 className="notif-title-text">Notifications</h3>
              <p className="notif-subtitle-text">
                {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button 
                className="notif-action-btn" 
                onClick={markAllAsRead} 
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span>Read all</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button 
                className="notif-action-btn notif-clear-btn" 
                onClick={clearAll} 
                title="Clear notifications"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button 
              className="notif-action-btn notif-close-btn" 
              onClick={onClose} 
              title="Close drawer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="notif-filter-tabs">
          {[
            { id: 'all', label: 'All' },
            { id: 'sabha', label: 'Sabha' },
            { id: 'announcements', label: 'Feeds' },
            { id: 'updates', label: 'Updates' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`notif-filter-btn ${filter === tab.id ? 'active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="notif-list-container">
          {filteredNotifications.length === 0 ? (
            <div className="notif-empty-state">
              <div className="notif-empty-icon">
                <Bell size={28} color="var(--text-secondary)" />
              </div>
              <p className="notif-empty-title">No notifications yet</p>
              <p className="notif-empty-sub">
                Live updates for Sabha attendance, announcements, and SMS will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <motion.div
                key={item.id}
                layout
                className={`notif-card-item ${!item.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(item)}
              >
                <div className="notif-icon-col">
                  <div className="notif-icon-wrapper">
                    {getCategoryIcon(item.iconType)}
                  </div>
                </div>

                <div className="notif-content-col">
                  <div className="notif-card-top">
                    <span className="notif-item-title">{item.title}</span>
                    <span className="notif-time-ago">
                      <Clock size={11} />
                      {getRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="notif-item-body">{item.body}</p>

                  <div className="notif-card-footer">
                    <span className="notif-category-chip">
                      {item.category.toUpperCase()}
                    </span>
                    {!item.isRead && (
                      <span className="notif-unread-indicator">NEW</span>
                    )}
                    <ChevronRight size={13} className="notif-chevron" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Drawer Footer Status Bar */}
        <div className="notif-drawer-footer">
          <div className="notif-live-status">
            <span className="live-status-dot" />
            <span>Live Real-Time Sync Active</span>
          </div>
          <span className="notif-mandal-tag">Bochasan Yuvak Mandal</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
