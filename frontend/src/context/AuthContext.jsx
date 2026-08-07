import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('Bochasan_token') || null);
  const [role, setRole] = useState(localStorage.getItem('Bochasan_role') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('Bochasan_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const response = await loginApi(identifier, password);
      if (response.success) {
        setToken(response.access_token);
        setRole(response.role);
        setUser(response.user);

        // Store in localStorage for session persistence
        localStorage.setItem('Bochasan_token', response.access_token);
        localStorage.setItem('Bochasan_role', response.role);
        localStorage.setItem('Bochasan_user', JSON.stringify(response.user));
        return { success: true, role: response.role, user: response.user };
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem('Bochasan_token');
    localStorage.removeItem('Bochasan_role');
    localStorage.removeItem('Bochasan_user');
  };

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
