import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, CalendarCheck, Megaphone, ShieldPlus, ArrowRight } from 'lucide-react';
import { formatDob } from '../utils/formatDate';

/**
 * Global Search Modal triggered via Ctrl + K.
 */
export default function GlobalSearchModal({ isOpen, onClose, yuvaks = [], setActiveTab, onOpenCreateAdminModal }) {
  const [query, setQuery] = useState('');

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredYuvaks = query.trim() 
    ? yuvaks.filter(y => 
        y.full_name.toLowerCase().includes(query.toLowerCase()) ||
        y.yuvak_id.toLowerCase().includes(query.toLowerCase()) ||
        (y.location && y.location.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : [];

  const handleSelectYuvak = (yuvak) => {
    setActiveTab('yuvaks');
    onClose();
  };

  const handleSelectAction = (actionId) => {
    if (actionId === 'admin') {
      if (onOpenCreateAdminModal) onOpenCreateAdminModal();
    } else {
      setActiveTab(actionId);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="search-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input Header */}
          <div className="search-modal-input-wrapper">
            <Search size={20} color="#ff7a18" />
            <input
              type="text"
              className="search-modal-input"
              placeholder="Search Yuvaks by Name, ID (DHE2712), or jump to tabs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Results Body */}
          <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
            {query.trim() !== '' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Matching Yuvak Members ({filteredYuvaks.length})
                </div>
                {filteredYuvaks.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                    No Yuvak members found matching "{query}"
                  </div>
                ) : (
                  filteredYuvaks.map((y) => (
                    <div
                      key={y.yuvak_id}
                      onClick={() => handleSelectYuvak(y)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)',
                        marginBottom: '0.4rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,122,24,0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <User size={18} color="#ff9b42" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{y.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {y.location || 'Bochasan'} • {y.mobile_no}{y.dob ? ` • DOB: ${formatDob(y.dob)}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="yuvak-id-highlight">{y.yuvak_id}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Quick Navigation Commands */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Quick Workspace Actions
              </div>
              
              <div 
                onClick={() => handleSelectAction('attendance')} 
                style={cmdItemStyle}
                onMouseEnter={hoverIn}
                onMouseLeave={hoverOut}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CalendarCheck size={18} color="#14b8a6" />
                  <span>Mark Sabha Attendance</span>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>

              <div 
                onClick={() => handleSelectAction('content')} 
                style={cmdItemStyle}
                onMouseEnter={hoverIn}
                onMouseLeave={hoverOut}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Megaphone size={18} color="#ff7a18" />
                  <span>Upload Announcements / Niyama</span>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>

              {onOpenCreateAdminModal && (
                <div 
                  onClick={() => handleSelectAction('admin')} 
                  style={cmdItemStyle}
                  onMouseEnter={hoverIn}
                  onMouseLeave={hoverOut}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldPlus size={18} color="#22c55e" />
                    <span>Create Karyakar Admin Account</span>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

const cmdItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.65rem 0.8rem',
  borderRadius: '8px',
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.03)',
  marginBottom: '0.4rem',
  fontSize: '0.9rem',
  transition: 'all 0.2s'
};

const hoverIn = (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; };
const hoverOut = (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; };
