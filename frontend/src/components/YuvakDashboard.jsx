import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  getYuvakProfileApi, 
  getYuvakAttendanceApi, 
  getContentFeedsApi, 
  getEventPhotosApi, 
  getEventsApi,
  getRealtimeWebSocketUrl,
  getRealtimeSseUrl
} from '../services/api';
import CircularAttendanceTracker from './CircularAttendanceTracker';
import MobileNav from './MobileNav';
import BapsHeroSlideshow from './BapsHeroSlideshow';
import BapsHomeSection from './BapsHomeSection';
import { formatDob } from '../utils/formatDate';
import { 
  User, 
  Calendar, 
  Megaphone, 
  CheckCircle2, 
  XCircle, 
  Image as ImageIcon,
  Award,
  TrendingUp,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

/* =========================================================================================
 * SUB-COMPONENT 1: <SabhaAttendanceTracker />
 * Renders user's personal profile card, circular attendance meter, and attendance history table.
 * ========================================================================================= */
function SabhaAttendanceTracker({ metrics, p }) {
  return (
    <div className="yuvak-dashboard-grid">
      {/* Sidebar: Profile Details & Circular Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card"
          style={{ borderRadius: '20px', padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <User size={20} color="#ff7a18" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Member Profile
              </h3>
            </div>
            <span className="yuvak-id-highlight" style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '8px', background: 'rgba(255, 122, 24, 0.15)', color: '#ff9b42' }}>
              {p.yuvak_id || 'DHE2712'}
            </span>
          </div>

          <div className="profile-details-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="profile-detail-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Full Name</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.full_name || 'N/A'}</span>
            </div>
            <div className="profile-detail-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mobile Number</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.mobile_no || 'N/A'}</span>
            </div>
            <div className="profile-detail-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date of Birth</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>{formatDob(p.dob)}</span>
            </div>
            <div className="profile-detail-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mandal Location</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.location || 'Bochasan'}</span>
            </div>
            <div className="profile-detail-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Member Status</span>
              <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>Active Yuvak</span>
            </div>
          </div>
        </motion.div>

        {/* Circular Meter Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="glass-card"
          style={{ borderRadius: '20px', padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <BarChart3 size={20} color="#ff7a18" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Attendance Tracker
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Real-time circular progress of your Saturday Sabha participation rate.
          </p>

          <CircularAttendanceTracker
            attended={metrics.attended_sabhas}
            total={metrics.total_sabhas}
            percentage={metrics.attendance_percentage}
          />
        </motion.div>
      </div>

      {/* Main Panel: Personal Sabha Attendance History */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.15 }}
        className="glass-card"
        style={{ borderRadius: '20px', padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <Calendar size={20} color="#ff7a18" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Personal Saturday Sabha Attendance History
          </h3>
        </div>

        {metrics.attendance_history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No attendance sessions recorded yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Saturday Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Sabha Topic</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.attendance_history.map((record, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, padding: '0.85rem 1rem', color: 'var(--text-primary)' }}>{record.sabha_date} (Sat)</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{record.sabha_title || 'Shanivariya Yuvak Sabha'}</td>
                    <td style={{ textAlign: 'right', padding: '0.85rem 1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: record.status === 'Present' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: record.status === 'Present' ? '#4ade80' : '#f87171',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        {record.status === 'Present' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* =========================================================================================
 * SUB-COMPONENT 2: <YuvakAnalytics />
 * Renders personal participation charts, monthly attendance progress, and achievement badges.
 * ========================================================================================= */
function YuvakAnalytics({ metrics }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div className="glass-card" style={{ borderRadius: '20px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <BarChart3 size={22} color="#ff7a18" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Personal Attendance Analytics & Consistency
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-stat-box)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Overall Rate</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-orange)', margin: '0.2rem 0' }}>{metrics.attendance_percentage}%</div>
            <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>↑ Consistent Attendance</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Sabhas Attended</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-orange)', margin: '0.2rem 0' }}>{metrics.attended_sabhas} Sessions</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Out of {metrics.total_sabhas} Saturday Sabhas</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Niyama Commitment</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', margin: '0.2rem 0' }}>100%</div>
            <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Active Niyama Record</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-stat-box)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#ff7a18" /> Participation Milestone Status
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span>Monthly Shanivariya Goal</span>
                <span style={{ fontWeight: 700, color: 'var(--text-orange)' }}>{metrics.attendance_percentage}% Achieved</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${metrics.attendance_percentage}%`, height: '100%', background: 'linear-gradient(90deg, #ff7a18, #ff9b42)', borderRadius: '999px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================================================
 * SUB-COMPONENT 3: <SatsangContentFeed />
 * Renders mandal announcements, Niyama updates, and Utsav photo gallery.
 * ========================================================================================= */
function SatsangContentFeed({ feeds, photos }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
    >
      {/* Announcements Card */}
      <div className="glass-card" style={{ borderRadius: '20px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <Megaphone size={20} color="#ff7a18" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Mandal Announcements & Niyama Feeds
          </h3>
        </div>

        {feeds.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No announcement feeds available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {feeds.map((feed, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-stat-box)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-orange)', margin: 0 }}>{feed.title}</h4>
                  <span className="badge badge-yuvak" style={{ fontSize: '0.7rem' }}>{feed.category}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', lineHeight: 1.55 }}>
                  {feed.content}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Published by: {feed.author} • {new Date(feed.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Utsav Photo Gallery */}
      <div className="glass-card" style={{ borderRadius: '20px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <ImageIcon size={20} color="#ff7a18" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Utsav & Prasang Photo Gallery
          </h3>
        </div>

        {photos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No event photos available in gallery.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {photos.map((photo, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-stat-box)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src={photo.image_url} 
                    alt={photo.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <span className="badge badge-admin" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.65rem' }}>
                    {photo.category || 'Event'}
                  </span>
                </div>
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.3rem 0', lineHeight: 1.3 }}>
                    {photo.title}
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                    {photo.event_date || 'Recent Event'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* =========================================================================================
 * MAIN COMPONENT: <YuvakDashboard />
 * 
 * Manages bottom navigation activeTab state and conditionally renders matching sub-views:
 * 1. 'attendance' -> <SabhaAttendanceTracker />
 * 2. 'analytics'  -> <YuvakAnalytics />
 * 3. 'content'    -> <SatsangContentFeed />
 * ========================================================================================= */
export default function YuvakDashboard({ activeTab: propActiveTab, setActiveTab: propSetActiveTab }) {
  const { token, user } = useAuth();
  
  // Active Navigation Tab key ('attendance' | 'analytics' | 'content')
  const [localActiveTab, setLocalActiveTab] = useState('attendance');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

  // State 2: Personal Profile & Attendance Metrics
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({ total_sabhas: 0, attended_sabhas: 0, attendance_percentage: 100, attendance_history: [] });
  const [feeds, setFeeds] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const socketRef = useRef(null);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadYuvakData = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [profRes, attRes, feedRes, photoRes] = await Promise.all([
        getYuvakProfileApi(token).catch(() => ({ profile: user })),
        getYuvakAttendanceApi(token).catch(() => null),
        getContentFeedsApi().catch(() => ({ feeds: [] })),
        getEventPhotosApi().catch(() => ({ photos: [] }))
      ]);

      if (profRes && profRes.profile) setProfile(profRes.profile);
      if (attRes && attRes.metrics) setMetrics(attRes.metrics);
      if (feedRes && Array.isArray(feedRes.feeds)) setFeeds(feedRes.feeds);
      if (photoRes && Array.isArray(photoRes.photos)) setPhotos(photoRes.photos);
    } catch (err) {
      console.error('Failed loading Yuvak dashboard:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleLiveEvent = (message) => {
    const { event: evtType, data: evtData } = message;
    console.log('[YUVAK REALTIME EVENT]', evtType, evtData);

    if (evtType === 'CONTENT_UPDATED') {
      const typeLabel = evtData?.type === 'photo' ? 'Photo Gallery' : 'Announcements & Niyamas';
      showNotify(`Live Update: ${typeLabel} updated by Mandal Admin!`);
      loadYuvakData(false);
    } else if (evtType === 'ATTENDANCE_UPDATED') {
      showNotify(`Live Update: Sabha attendance for ${evtData?.sabha_date || 'recent session'} updated!`);
      loadYuvakData(false);
    } else if (evtType === 'MEMBER_UPDATED') {
      const currentYuvakId = profile?.yuvak_id || user?.yuvak_id;
      if (evtData?.yuvak_id === currentYuvakId) {
        showNotify(`Live Update: Your member profile information has been updated!`);
        loadYuvakData(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    if (token) loadYuvakData(true);
  }, [token]);

  // Real-Time Cross-Client Sync via EventSource (SSE) & WebSocket + 6s Polling Fallback
  useEffect(() => {
    if (!token) return;

    let eventSource = null;
    let ws = null;

    // 1. Try EventSource (Server-Sent Events)
    try {
      const sseUrl = getRealtimeSseUrl();
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setIsLiveConnected(true);
        console.log('[YUVAK SSE REALTIME] Connected to live event stream');
      };

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.event && parsed.event !== 'CONNECTED') {
            handleLiveEvent(parsed);
          }
        } catch (err) {
          console.error('Yuvak SSE parse error:', err);
        }
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (e) {
      console.warn('Yuvak SSE fallback:', e);
    }

    // 2. Try WebSocket as secondary stream
    try {
      const wsUrl = getRealtimeWebSocketUrl();
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsLiveConnected(true);
        console.log('[YUVAK WS REALTIME] Connected to live websocket stream');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message && message.event) {
            handleLiveEvent(message);
          }
        } catch (err) {
          console.error('Yuvak WS parse error:', err);
        }
      };
    } catch (err) {
      console.warn('Yuvak WS fallback:', err);
    }

    // 3. Resilient Background Polling Fallback (Every 6 seconds)
    const pollInterval = setInterval(() => {
      loadYuvakData(false);
    }, 6000);

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
  }, [token, user, profile]);

  const p = profile || user || {};

  /* Conditional Rendering Handler based on activeTab */
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <BapsHomeSection 
            onNavigateTab={setActiveTab} 
            feeds={feeds} 
            yuvaksCount={metrics.total_sabhas} 
            isAdmin={false} 
          />
        );
      case 'analytics':
        return <YuvakAnalytics metrics={metrics} p={p} />;
      case 'content':
        return <SatsangContentFeed feeds={feeds} photos={photos} />;
      case 'attendance':
      default:
        return <SabhaAttendanceTracker metrics={metrics} p={p} />;
    }
  };

  return (
    <div className="dashboard-layout" style={{ maxWidth: '1440px', margin: '0 auto 5rem', padding: '0 0' }}>
      
      {/* 1. BAPS Hero Photo Slideshow (Directly at the Top when on Home / Dashboard) */}
      {activeTab === 'dashboard' && (
        <div style={{ marginBottom: '2rem' }}>
          <BapsHeroSlideshow onNavigateTab={setActiveTab} />
        </div>
      )}

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 clamp(0.75rem, 3vw, 1.5rem)' }}>
        {/* Real-time Notification Toast */}
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

        {/* 2. Top Greeting Banner (Kept directly AFTER the Slideshow) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-banner"
          style={{ 
            background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(255, 122, 24, 0.08) 100%)', 
            borderColor: 'rgba(255, 122, 24, 0.35)',
            borderRadius: '20px',
            padding: '1.75rem 2rem',
            marginBottom: '2rem'
          }}
        >
          <div className="hero-content">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <span className="badge badge-admin" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
                Yuvak Portal
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                ID: {p.yuvak_id || 'DHE2712'}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 2rem)', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em', color: 'var(--text-orange)', WebkitTextFillColor: 'var(--text-orange)' }}>
              Jay Swaminarayan, {p.full_name || 'Yuvak'}! <span className="emoji-color">🙏</span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              Welcome to your personal Saturday Sabha attendance portal & mandal announcement feeds.
            </p>
          </div>

          {/* Hero Stats */}
          <div className="hero-stats-grid" style={{ display: 'flex', gap: '1.25rem' }}>
            <div className="hero-stat-box" style={{ background: 'var(--bg-stat-box)', borderRadius: '16px', padding: '1rem 1.4rem', border: '1px solid var(--border-subtle)', minWidth: '130px', textAlign: 'center' }}>
              <div className="hero-stat-value" style={{ color: 'var(--text-orange)', fontSize: '1.75rem', fontWeight: 800 }}>
                {metrics.attendance_percentage}%
              </div>
              <div className="hero-stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Attendance Rate
              </div>
            </div>

            <div className="hero-stat-box" style={{ background: 'var(--bg-stat-box)', borderRadius: '16px', padding: '1rem 1.4rem', border: '1px solid var(--border-subtle)', minWidth: '130px', textAlign: 'center' }}>
              <div className="hero-stat-value" style={{ color: 'var(--text-orange)', fontSize: '1.75rem', fontWeight: 800 }}>
                {metrics.attended_sabhas} / {metrics.total_sabhas}
              </div>
              <div className="hero-stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Sabhas Attended
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Primary Dynamic Viewport */}
        <main className="yuvak-main-viewport">
          {renderActiveView()}
        </main>
      </div>

      {/* Fixed Bottom Glass Navigation (3 Tabs: Attendance, Analytics, Content) */}
      <MobileNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onFabClick={() => setActiveTab('attendance')} 
      />
    </div>
  );
}
