import React from 'react';
import { useAuth } from '../context/AuthContext';
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
 * Refactored Responsive Header Navigation Bar.
 * 
 * Fixes layout cramping, text wrapping, and profile pill overflow
 * using Tailwind Flexbox layout, `whitespace-nowrap`, and responsive `hidden sm:flex` breakpoints.
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
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content', icon: MessageSquareText }
  ];

  const navItems = role === 'admin' ? adminNavItems : yuvakNavItems;

  return (
    <header className="navbar-container sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/60 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Logo />
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right-Side Action Group */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 user-nav-actions">
          
          {/* Quick Search Shortcut Trigger */}
          <button 
            className="search-trigger-btn hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700/60 bg-gray-800/40 text-gray-400 hover:text-white hover:border-gray-600 text-xs transition-all"
            onClick={onOpenSearch} 
            title="Search Workspace (Ctrl+K)"
          >
            <Search size={14} />
            <span className="whitespace-nowrap">Search</span>
            <span className="search-kbd bg-black/40 border border-gray-700 px-1 rounded text-[10px] text-gray-400">⌘K</span>
          </button>

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
                className="btn btn-secondary p-2 rounded-lg border border-gray-700/60 bg-gray-800/40 text-gray-300 hover:text-white hover:border-gray-600 transition-all shrink-0"
                onClick={logout}
                title="Logout"
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
