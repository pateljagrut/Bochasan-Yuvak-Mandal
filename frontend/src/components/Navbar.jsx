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

  const currentNavItems = role === 'admin' ? adminNavItems : yuvakNavItems;

  return (
    <header className="w-full bg-slate-900/90 border-b border-gray-800 backdrop-blur-md sticky top-0 z-50 px-3 sm:px-6 py-2.5 min-h-[3.75rem] flex items-center justify-between app-header">
      <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-3 header-container">
        
        {/* Left: Brand Logo */}
        <div 
          className="cursor-pointer shrink-0" 
          onClick={() => setActiveTab(role === 'admin' ? 'dashboard' : 'attendance')}
        >
          <Logo size="md" />
        </div>

        {/* Center: Desktop Navigation Tabs (Karyakar Admin / Yuvak Workspace) */}
        <nav className="hidden md:flex items-center gap-0.5 bg-gray-800/40 p-1 rounded-full border border-gray-700/50 desktop-nav-tabs">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-tab-btn px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive 
                    ? 'active bg-orange-500/20 text-orange-400 border border-orange-500/40 font-semibold' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }`}
                onClick={() => setActiveTab(item.id)}
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
