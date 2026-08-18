import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  getAllYuvaksApi, 
  updateYuvakProfileApi, 
  recordAttendanceApi, 
  getAttendanceSessionsApi,
  postContentApi, 
  getContentFeedsApi,
  getEventPhotosApi,
  getEventsApi,
  getRealtimeWebSocketUrl,
  getRealtimeSseUrl,
  getAdminWebSocketUrl,
  getAdminSseUrl
} from '../services/api';

// Modular Workspace Sub-Components
import DashboardOverview from './DashboardOverview';
import AttendanceManager from './AttendanceManager';
import MemberDirectory from './MemberDirectory';
import AnalyticsView from './AnalyticsView';
import ContentManager from './ContentManager';

// BAPS Hero Slideshow & Home Section
import BapsHeroSlideshow from './BapsHeroSlideshow';
import BapsHomeSection from './BapsHomeSection';

// Modals & Navigation Helpers
import HeroSection from './HeroSection';
import ProfileEditorModal from './ProfileEditorModal';
import ContentUploadModal from './ContentUploadModal';
import MobileNav from './MobileNav';
import { LayoutDashboard, CalendarCheck, Users, Sparkles, Megaphone, Zap } from 'lucide-react';

export default function KaryakarDashboard({ 
  activeTab: propsActiveTab, 
  setActiveTab: propsSetActiveTab, 
  onOpenCreateAdminModal, 
  onOpenSearch 
}) {
  const { token, user } = useAuth();
  
  // State management for tab switching (supports controlled props from parent Navbar or local fallback state)
  const [internalTab, setInternalTab] = useState('dashboard');
  const activeTab = propsActiveTab || internalTab;

  const handleTabChange = (tabId) => {
    if (propsSetActiveTab) {
      propsSetActiveTab(tabId);
    }
    setInternalTab(tabId);
  };

  // Data states
  const [yuvaks, setYuvaks] = useState([]);
  const [deletedYuvakIds, setDeletedYuvakIds] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingYuvak, setEditingYuvak] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [publishingContent, setPublishingContent] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const socketRef = useRef(null);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLiveEvent = (message) => {
    const { event: evtType, data: evtData } = message;
    console.log('[REALTIME EVENT]', evtType, evtData);

    if (evtType === 'ATTENDANCE_UPDATED') {
      showNotify(`Live Update: Attendance recorded for Saturday ${evtData.sabha_date} by ${evtData.marked_by || 'an admin'}!`);
      loadData(false);
    } else if (evtType === 'MEMBER_UPDATED') {
      showNotify(`Live Update: Profile for '${evtData.member_name}' updated by ${evtData.admin_name || 'an admin'}!`);
      loadData(false);
    } else if (evtType === 'MEMBER_ADDED') {
      showNotify(`Live Update: New member '${evtData.full_name}' (${evtData.yuvak_id}) registered!`);
      loadData(false);
    } else if (evtType === 'MEMBER_DELETED') {
      showNotify(`Live Update: Member '${evtData.member_name}' removed by ${evtData.admin_name || 'an admin'}.`);
      loadData(false);
    } else if (evtType === 'ADMIN_CREATED') {
      showNotify(`Live Update: New Karyakar Admin '${evtData.admin_name}' (${evtData.yuvak_id}) created!`);
      loadData(false);
    } else if (evtType === 'CONTENT_UPDATED') {
      const typeLabel = evtData?.type === 'photo' ? 'Photo Gallery' : 'Announcements/Niyamas';
      showNotify(`Live Update: ${typeLabel} updated by Mandal Admin!`);
      loadData(false);
    }
  };

  const loadData = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [yuvakRes, feedRes, photoRes, sessionRes] = await Promise.all([
        getAllYuvaksApi(token).catch(() => ({ yuvaks: [] })),
        getContentFeedsApi().catch(() => ({ feeds: [] })),
        getEventPhotosApi().catch(() => ({ photos: [] })),
        getAttendanceSessionsApi(token).catch(() => ({ sessions: [] }))
      ]);

      if (yuvakRes && Array.isArray(yuvakRes.yuvaks)) setYuvaks(yuvakRes.yuvaks);
      if (feedRes && Array.isArray(feedRes.feeds)) setFeeds(feedRes.feeds);
      if (photoRes && Array.isArray(photoRes.photos)) setPhotos(photoRes.photos);
      if (sessionRes && Array.isArray(sessionRes.sessions)) setSessions(sessionRes.sessions);
    } catch (err) {
      console.error('Error loading Karyakar dashboard:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData(true);
  }, [token]);

  // Real-Time Cross-Admin Synchronization via EventSource (SSE) & WebSockets
  useEffect(() => {
    if (!token || user?.role !== 'admin') return;

    let eventSource = null;
    let ws = null;

    // 1. Try EventSource (Server-Sent Events - standard HTTP stream)
    try {
      const sseUrl = getAdminSseUrl();
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setIsLiveConnected(true);
        console.log('[SSE REALTIME] Connected to admin event stream');
      };

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.event && parsed.event !== 'CONNECTED') {
            handleLiveEvent(parsed);
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (e) {
      console.warn('SSE initialization fallback:', e);
    }

    // 2. Try WebSocket as secondary stream fallback
    try {
      const wsUrl = getAdminWebSocketUrl();
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsLiveConnected(true);
        console.log('[WS REALTIME] Connected to admin websocket stream');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message && message.event) {
            handleLiveEvent(message);
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };
    } catch (err) {
      console.warn('WS initialization fallback:', err);
    }

    // Background polling fallback every 5 seconds to guarantee data sync
    const pollInterval = setInterval(() => {
      loadData(false);
    }, 5000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Unmount');
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            try { ws.close(1000, 'Unmount'); } catch (_) {}
          };
          ws.onerror = () => {};
        }
      }
      clearInterval(pollInterval);
    };
  }, [token, user]);


  // Handle saving attendance checkboxes
  const handleSaveAttendance = async (attendancePayload) => {
    try {
      setSavingAttendance(true);
      const res = await recordAttendanceApi(attendancePayload, token);
      if (res.success) {
        showNotify(`✅ Attendance saved for ${res.total_present} Yuvaks on ${res.sabha_date}!`);
        loadData(); // refresh Yuvak list attendance metrics
      }
    } catch (err) {
      showNotify(`❌ Failed to save attendance: ${err.message}`, 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Handle updating Yuvak profile
  const handleSaveProfile = async (yuvakId, updatedFields) => {
    try {
      setUpdatingProfile(true);
      const res = await updateYuvakProfileApi(yuvakId, updatedFields, token);
      if (res.success) {
        showNotify(`✅ Profile for Yuvak ${yuvakId} successfully updated!`);
        setEditingYuvak(null);
        loadData();
      }
    } catch (err) {
      showNotify(`❌ Update failed: ${err.message}`, 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle deleting Yuvak member with persistent state filtering
  const handleDeleteMember = (yuvakId) => {
    setDeletedYuvakIds(prev => [...prev, yuvakId]);
    setYuvaks(prevYuvaks => prevYuvaks.filter(y => y.yuvak_id !== yuvakId));
  };

  // Handle publishing content
  const handlePublishContent = async (contentData) => {
    try {
      setPublishingContent(true);
      const res = await postContentApi(contentData, token);
      if (res.success) {
        showNotify('✅ Announcement published to Yuvak feeds!');
        setShowContentModal(false);
        loadData();
      }
    } catch (err) {
      showNotify(`❌ Publish failed: ${err.message}`, 'error');
    } finally {
      setPublishingContent(false);
    }
  };

  // Filter out any locally deleted member IDs
  const activeYuvaks = yuvaks.filter(y => !deletedYuvakIds.includes(y.yuvak_id || y.username));

  const filteredYuvaks = activeYuvaks.filter(y => {
    const q = searchQuery.toLowerCase();
    const name = (y.full_name || '').toLowerCase();
    const yId = (y.yuvak_id || '').toLowerCase();
    const uname = (y.username || '').toLowerCase();
    const loc = (y.location || '').toLowerCase();
    const mob = (y.mobile_no || '');
    return name.includes(q) || yId.includes(q) || uname.includes(q) || loc.includes(q) || mob.includes(q);
  });

  const avgAttendance = activeYuvaks.length > 0
    ? round(activeYuvaks.reduce((acc, y) => acc + (y.attendance_pct || 100), 0) / activeYuvaks.length, 1)
    : 100;

  function round(val, decimals) {
    return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
  }

  /* 
   * =========================================================================================
   * EDUCATIONAL NOTE FOR DEVELOPERS: State-Driven Component Swapping / Conditional Rendering
   * =========================================================================================
   * 
   * In React, component swapping is achieved by binding the main content area to a state variable 
   * (here `activeTab`). Whenever a navigation button in either the top Navbar or secondary tab bar 
   * is clicked, `handleTabChange('tabName')` updates `activeTab`.
   * 
   * The `renderContent()` function uses a JavaScript `switch` statement to check `activeTab` 
   * and dynamically return ONLY the component corresponding to the active view. This replaces 
   * monolithic single-file views with clean, modular sub-components.
   * =========================================================================================
   */
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            loading={loading}
            yuvaks={activeYuvaks}
            avgAttendance={avgAttendance}
            user={user}
            feeds={feeds}
            setActiveTab={handleTabChange}
            onOpenCreateAdminModal={onOpenCreateAdminModal}
          />
        );

      case 'attendance':
        return (
          <AttendanceManager
            yuvaks={activeYuvaks}
            onSaveAttendance={handleSaveAttendance}
            saving={savingAttendance}
          />
        );

      case 'yuvaks':
        return (
          <MemberDirectory
            filteredYuvaks={filteredYuvaks}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setEditingYuvak={setEditingYuvak}
            onRefreshData={loadData}
            onNotify={showNotify}
            onDeleteYuvakSuccess={handleDeleteMember}
          />
        );

      case 'analytics':
        return (
          <AnalyticsView 
            yuvaks={activeYuvaks} 
            sessions={sessions}
            onRefreshData={() => loadData(false)}
          />
        );

      case 'content':
        return (
          <ContentManager
            feeds={feeds}
            photos={photos}
            onOpenContentModal={() => setShowContentModal(true)}
            onRefreshContent={() => loadData(false)}
          />
        );

      default:
        // Fallback component if activeTab doesn't match any known tab key
        return (
          <DashboardOverview
            loading={loading}
            yuvaks={yuvaks}
            avgAttendance={avgAttendance}
            user={user}
            feeds={feeds}
            setActiveTab={handleTabChange}
            onOpenCreateAdminModal={onOpenCreateAdminModal}
          />
        );
    }
  };

  return (
    <div className="dashboard-layout" style={{ maxWidth: '1440px', margin: '0 auto 5rem', padding: '0 0' }}>
      {/* 1. BAPS Hero Photo Slideshow directly below Navbar on Home/Dashboard tab */}
      {activeTab === 'dashboard' && (
        <div style={{ marginBottom: '2rem' }}>
          <BapsHeroSlideshow onNavigateTab={handleTabChange} isAdmin={true} />
        </div>
      )}

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 clamp(0.75rem, 3vw, 1.5rem)' }}>
        {/* 2. Hero Header Section (Kept directly AFTER the Slideshow) */}
        <HeroSection 
          title="Karyakar Admin Dashboard"
          subtitle="Manage members, attendance, analytics and sabha content from one unified workspace."
          totalYuvaks={yuvaks.length}
          avgAttendance={avgAttendance}
          location={user?.location || 'Bochasan'}
          onOpenCreateAdminModal={onOpenCreateAdminModal}
        />

        {/* 3. BAPS Home Gateway & Live Countdown Section on Dashboard tab */}
        {activeTab === 'dashboard' && (
          <BapsHomeSection 
            onNavigateTab={handleTabChange} 
            feeds={feeds} 
            yuvaksCount={yuvaks.length} 
            isAdmin={true} 
          />
        )}

      {/* Notification Toast */}
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.5rem',
            fontWeight: 600,
            background: notification.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
            border: notification.type === 'error' ? '1px solid var(--danger)' : '1px solid var(--success)',
            color: notification.type === 'error' ? '#f87171' : '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          {notification.msg}
        </motion.div>
      )}



      {/* Main Dynamic Content Area (Dynamically rendered based on activeTab) */}
      <main className="main-content-area">
        {renderContent()}
      </main>
      </div>

      {/* Profile Editor Modal */}
      {editingYuvak && (
        <ProfileEditorModal
          yuvak={editingYuvak}
          onClose={() => setEditingYuvak(null)}
          onSave={handleSaveProfile}
          saving={updatingProfile}
        />
      )}

      {/* Content Upload Modal */}
      {showContentModal && (
        <ContentUploadModal
          onClose={() => setShowContentModal(false)}
          onPublish={handlePublishContent}
          publishing={publishingContent}
        />
      )}

      {/* Mobile-First Bottom Nav Bar & FAB */}
      <MobileNav 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onFabClick={() => handleTabChange('attendance')} 
      />
    </div>
  );
}
