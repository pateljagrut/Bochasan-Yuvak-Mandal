import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginApi } from '../services/api';

const AuthContext = createContext(null);

// Inactivity timeout: 15 minutes of idle time automatically logs out the user
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  // Initial check: if last active timestamp exceeds inactivity threshold, clear session immediately
  const getInitialToken = () => {
    const savedToken = localStorage.getItem('Bochasan_token');
    const savedLastActive = localStorage.getItem('Bochasan_last_active');
    
    if (savedToken && savedLastActive) {
      const elapsed = Date.now() - Number(savedLastActive);
      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        localStorage.removeItem('Bochasan_token');
        localStorage.removeItem('Bochasan_role');
        localStorage.removeItem('Bochasan_user');
        localStorage.removeItem('Bochasan_last_active');
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('Bochasan_session_expired_notice', 'You were automatically logged out due to inactivity.');
        }
        return null;
      }
    }
    return savedToken || null;
  };

  const [token, setToken] = useState(getInitialToken);
  const [role, setRole] = useState(() => (token ? localStorage.getItem('Bochasan_role') || null : null));
  const [user, setUser] = useState(() => {
    if (!token) return null;
    const savedUser = localStorage.getItem('Bochasan_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const logout = (reasonMsg = null) => {
    setToken(null);
    setRole(null);
    setUser(null);
    setHasUnsavedChanges(false);
    if (typeof window !== 'undefined') {
      window.__hasUnsavedChanges = false;
    }
    localStorage.removeItem('Bochasan_token');
    localStorage.removeItem('Bochasan_role');
    localStorage.removeItem('Bochasan_user');
    localStorage.removeItem('Bochasan_last_active');
    
    if (reasonMsg && typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('Bochasan_session_expired_notice', reasonMsg);
    }
  };

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const response = await loginApi(identifier, password);
      if (response.success) {
        setToken(response.access_token);
        setRole(response.role);
        setUser(response.user);

        const now = Date.now();
        localStorage.setItem('Bochasan_token', response.access_token);
        localStorage.setItem('Bochasan_role', response.role);
        localStorage.setItem('Bochasan_user', JSON.stringify(response.user));
        localStorage.setItem('Bochasan_last_active', String(now));
        return { success: true, role: response.role, user: response.user };
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sync window global flag for unsaved changes
  const setUnsavedStatus = (status) => {
    setHasUnsavedChanges(!!status);
    if (typeof window !== 'undefined') {
      window.__hasUnsavedChanges = !!status;
    }
  };

  // -------------------------------------------------------------
  // Automatic Inactivity Tracking & Auto-Logout System
  // -------------------------------------------------------------
  useEffect(() => {
    if (!token) return;

    // Refresh last active timestamp in localStorage
    localStorage.setItem('Bochasan_last_active', String(Date.now()));

    let lastActivityUpdate = Date.now();

    const recordUserActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 10 seconds
      if (now - lastActivityUpdate > 10000) {
        lastActivityUpdate = now;
        localStorage.setItem('Bochasan_last_active', String(now));
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    // Periodic check every 15 seconds
    const intervalId = setInterval(() => {
      const savedLastActive = localStorage.getItem('Bochasan_last_active');
      const lastActiveTime = savedLastActive ? Number(savedLastActive) : lastActivityUpdate;
      const elapsed = Date.now() - lastActiveTime;

      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        logout('You have been automatically logged out due to 15 minutes of inactivity.');
      }
    }, 15000);

    // Tab Visibility Change Check (Auto-logout if user left tab in background past timeout)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const savedLastActive = localStorage.getItem('Bochasan_last_active');
        const lastActiveTime = savedLastActive ? Number(savedLastActive) : lastActivityUpdate;
        const elapsed = Date.now() - lastActiveTime;

        if (elapsed > INACTIVITY_TIMEOUT_MS) {
          logout('You have been automatically logged out due to inactivity.');
        } else {
          recordUserActivity();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prompt user if they attempt to close the tab with unsaved/incomplete edits
    const handleBeforeUnload = (e) => {
      if (window.__hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, recordUserActivity);
      });
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);

  // Listen for global 401 unauthorized / session expired events
  useEffect(() => {
    const handleSessionExpired = (e) => {
      logout(e?.detail?.message || 'Your session has expired. Please sign in again.');
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session_expired', handleSessionExpired);
  }, []);

  const updateUserProfileState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('Bochasan_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        loading,
        isAuthenticated: !!token,
        hasUnsavedChanges,
        setHasUnsavedChanges: setUnsavedStatus,
        login,
        logout,
        updateUserProfileState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
