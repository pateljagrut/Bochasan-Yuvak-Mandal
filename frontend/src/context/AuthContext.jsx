import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginApi, verifyTokenApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Clear any legacy persistent localStorage entries to ensure automatic logout on close
  try {
    localStorage.removeItem('Bochasan_token');
    localStorage.removeItem('Bochasan_role');
    localStorage.removeItem('Bochasan_user');
  } catch (e) {
    // Ignore storage access issues
  }

  const [token, setToken] = useState(() => sessionStorage.getItem('Bochasan_token') || null);
  const [role, setRole] = useState(() => sessionStorage.getItem('Bochasan_role') || null);
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('Bochasan_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
    setUser(null);
    try {
      sessionStorage.removeItem('Bochasan_token');
      sessionStorage.removeItem('Bochasan_role');
      sessionStorage.removeItem('Bochasan_user');
      localStorage.removeItem('Bochasan_token');
      localStorage.removeItem('Bochasan_role');
      localStorage.removeItem('Bochasan_user');
    } catch (e) {}
  }, []);

  // Listen for global 401 Unauthorized events from API requests
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  // Verify active session with backend on initial load / refresh
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    verifyTokenApi(token)
      .then((res) => {
        if (isMounted && res?.user) {
          setUser(res.user);
          setRole(res.role);
          sessionStorage.setItem('Bochasan_user', JSON.stringify(res.user));
          sessionStorage.setItem('Bochasan_role', res.role);
        }
      })
      .catch(() => {
        if (isMounted) {
          logout();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const response = await loginApi(identifier, password);
      if (response.success) {
        setToken(response.access_token);
        setRole(response.role);
        setUser(response.user);

        // Store in sessionStorage (automatically cleared when user closes the browser/tab)
        sessionStorage.setItem('Bochasan_token', response.access_token);
        sessionStorage.setItem('Bochasan_role', response.role);
        sessionStorage.setItem('Bochasan_user', JSON.stringify(response.user));
        return { success: true, role: response.role, user: response.user };
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfileState = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('Bochasan_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        loading,
        isAuthenticated: !!token,
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
