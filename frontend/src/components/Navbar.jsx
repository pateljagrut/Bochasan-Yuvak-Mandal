import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../context/ThemeContext';
import Logo from './Logo';
import { 
  Search, 
  LogOut, 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  BarChart3, 
  MessageSquareText 
} from 'lucide-react';

/**
 * Modern Header Navigation Bar with Light and Night mode support.
 */
export default function Navbar({ 
  activeTab = 'dashboard', 
  setActiveTab = () => {}, 
  onOpenCreateAdminModal,
  onOpenSearch = () => {}
}) {
  const { user, role, logout } = useAuth();

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
