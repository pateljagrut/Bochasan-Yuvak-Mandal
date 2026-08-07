import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import './styles/global.css';
import './styles/dashboard.css';

function MainAppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('login'); // 'login' | 'register'

  if (isAuthenticated) {
    return <DashboardPage />;
  }

  if (currentPage === 'register') {
    return <RegisterPage onNavigateLogin={() => setCurrentPage('login')} />;
  }

  return <LoginPage onNavigateRegister={() => setCurrentPage('register')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
