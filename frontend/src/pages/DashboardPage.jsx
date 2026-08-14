import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import YuvakDashboard from '../components/YuvakDashboard';
import KaryakarDashboard from '../components/KaryakarDashboard';
import AdminKaryakarCreationModal from '../components/AdminKaryakarCreationModal';
import GlobalSearchModal from '../components/GlobalSearchModal';
import NotificationDrawer from '../components/NotificationDrawer';
import { getAllYuvaksApi, getContentFeedsApi } from '../services/api';

export default function DashboardPage() {
  const { role, token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState(null);
  const [yuvaksList, setYuvaksList] = useState([]);
  const [feedsList, setFeedsList] = useState([]);

  // Fetch yuvaks & feeds for global search and notification drawer for all users
  useEffect(() => {
    if (!token) return;

    if (role === 'admin') {
      getAllYuvaksApi(token).then(res => {
        if (res?.yuvaks) setYuvaksList(res.yuvaks);
      }).catch(() => {});
    }

    const loadFeeds = () => {
      getContentFeedsApi().then(res => {
        if (res?.feeds) setFeedsList(res.feeds);
      }).catch(() => {});
    };

    loadFeeds();
    const interval = setInterval(loadFeeds, 8000);
    return () => clearInterval(interval);
  }, [token, role]);

  // Handle Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAdminSuccess = (msg) => {
    setAdminSuccessMsg(msg);
    setTimeout(() => setAdminSuccessMsg(null), 5000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateAdminModal={() => setShowAdminModal(true)} 
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenNotifications={() => setShowNotifications(true)}
      />

      {adminSuccessMsg && (
        <div style={{
          maxWidth: '1440px',
          margin: '1rem auto -0.5rem',
          padding: '0.8rem 1.5rem',
          background: 'var(--success-bg)',
          border: '1px solid var(--success)',
          color: '#4ade80',
          borderRadius: '12px',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          ✅ {adminSuccessMsg}
        </div>
      )}

      {/* Role-Based Dashboard Workspace */}
      {role === 'admin' ? (
        <KaryakarDashboard 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreateAdminModal={() => setShowAdminModal(true)} 
          onOpenSearch={() => setShowSearchModal(true)}
          onOpenNotifications={() => setShowNotifications(true)}
        />
      ) : (
        <YuvakDashboard 
          activeTab={activeTab === 'dashboard' ? 'attendance' : activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* RBAC Admin Creation Modal */}
      {showAdminModal && (
        <AdminKaryakarCreationModal
          onClose={() => setShowAdminModal(false)}
          onSuccess={handleAdminSuccess}
        />
      )}

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        yuvaks={yuvaksList}
        setActiveTab={setActiveTab}
        onOpenCreateAdminModal={() => setShowAdminModal(true)}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        feeds={feedsList}
      />
    </div>
  );
}
