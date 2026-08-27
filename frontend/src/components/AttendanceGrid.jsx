import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Calendar, CheckSquare, SquareX, Save, Search, UserCheck, MapPin, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getClosestSaturdayIso() {
  const now = new Date();
  const day = now.getDay();
  const diff = (6 - day + 7) % 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + (diff === 0 ? 0 : (diff <= 3 ? diff : diff - 7)));
  return sat.toISOString().split('T')[0];
}

export default function AttendanceGrid({ 
  yuvaks = [], 
  onSaveAttendance, 
  saving = false,
  onOpenSmsModal
}) {
  const { setHasUnsavedChanges } = useAuth();
  const [sabhaDate, setSabhaDate] = useState(getClosestSaturdayIso());
  const [sabhaTitle, setSabhaTitle] = useState('Saturday Yuvak Sabha');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [presentMap, setPresentMap] = useState({});

  // Sync unsaved changes state with AuthContext & browser beforeunload
  useEffect(() => {
    const hasSelections = Object.values(presentMap).some(Boolean);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(hasSelections);
    }
  }, [presentMap, setHasUnsavedChanges]);

  const toggleYuvak = (yuvakId) => {
    setPresentMap(prev => ({
      ...prev,
      [yuvakId]: !prev[yuvakId]
    }));
  };

  const handleSelectAll = () => {
    const newMap = {};
    filteredYuvaks.forEach(y => { newMap[y.yuvak_id] = true; });
    setPresentMap(prev => ({ ...prev, ...newMap }));
  };

  const handleClearAll = () => {
    setPresentMap({});
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff7a18', '#14b8a6', '#22c55e', '#ff9b42']
      });
    } catch (e) {
      console.log('Confetti trigger fallback', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const presentYuvakIds = Object.keys(presentMap).filter(id => presentMap[id]);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(false);
    }
    triggerConfetti();
    onSaveAttendance({
      sabha_date: sabhaDate,
      sabha_title: sabhaTitle,
      present_yuvak_ids: presentYuvakIds
    });
  };

  // Unique locations for filter dropdown
  const uniqueLocations = Array.from(new Set(yuvaks.map(y => y.location || 'Bochasan')));

  const filteredYuvaks = yuvaks.filter(y => {
    const q = searchQuery.toLowerCase();
    const name = (y.full_name || '').toLowerCase();
    const yId = (y.yuvak_id || '').toLowerCase();
    const uname = (y.username || '').toLowerCase();
    const mob = y.mobile_no || '';
    const matchesSearch = name.includes(q) || yId.includes(q) || uname.includes(q) || mob.includes(q);
    const matchesLocation = locationFilter === 'all' || (y.location || 'Bochasan') === locationFilter;
    return matchesSearch && matchesLocation;
  });

  const presentCount = Object.values(presentMap).filter(Boolean).length;
  const attendanceRate = yuvaks.length > 0 ? Math.round((presentCount / yuvaks.length) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card" 
      style={{ border: '1px solid rgba(255, 122, 24, 0.3)', boxShadow: '0 16px 40px -4px rgba(0,0,0,0.5)' }}
    >
      {/* Top Controls Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ marginBottom: '0.35rem' }}>
            <h3 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Sabha Attendance Management
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            Mark presence for registered Yuvaks using interactive checkboxes & track attendance rates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: 'auto' }}>
          {onOpenSmsModal && (
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', flex: '1 1 auto' }} 
              onClick={onOpenSmsModal}
              title="SMS Broadcast Center"
            >
              <MessageSquare size={15} /> SMS Broadcast
            </button>
          )}
          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', flex: '1 1 auto' }} onClick={handleSelectAll}>
            <CheckSquare size={16} color="#ff7a18" /> Select All
          </button>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', flex: '1 1 auto' }} onClick={handleClearAll}>
            <SquareX size={16} color="#ef4444" /> Clear All
          </button>
        </div>
      </div>

      {/* SMS Broadcast Quick Action Card Under Attendance Management */}
      {onOpenSmsModal && (
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(255, 122, 24, 0.12) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(255, 122, 24, 0.3)',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '240px', flex: '1 1 300px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 122, 24, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
              border: '1px solid rgba(255, 122, 24, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MessageSquare size={22} color="#ff7a18" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-orange)' }}>
                  SMS Broadcast Center
                </h4>
                <span className="badge badge-admin text-xs">Admin Action</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.35 }}>
                Send instant Sabha reminders, Utsav invites & attendance follow-ups to all {yuvaks.length} registered Yuvaks via SMS.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSmsModal}
            className="btn btn-primary"
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(255, 122, 24, 0.35)'
            }}
          >
            <Send size={15} />
            <span>Launch SMS Broadcast</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Sabha Meta Inputs & Search Filters */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', 
          gap: '0.85rem', 
          marginBottom: '1.5rem' 
        }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              📅 Sabha Date
            </label>
            <input
              type="date"
              className="form-control"
              value={sabhaDate}
              onChange={(e) => setSabhaDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              📖 Sabha Title / Topic
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Saturday Yuvak Sabha"
              value={sabhaTitle}
              onChange={(e) => setSabhaTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              🔍 Search Member
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Name, ID, or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              📍 Center Filter
            </label>
            <select
              className="form-control"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop View: Modern Data Table */}
        <div className="desktop-table-view">
          <div className="table-responsive" style={{ maxHeight: '440px', overflowY: 'auto', marginBottom: '1.5rem' }}>
            <table className="custom-table" style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>Mark</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Member ID</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Member Name</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Role</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Mobile Number</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Location</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {filteredYuvaks.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No members found matching search filters.
                    </td>
                  </tr>
                ) : (
                  filteredYuvaks.map((yuvak) => {
                    const isChecked = !!presentMap[yuvak.yuvak_id];
                    const isAdmin = yuvak.role === 'admin';
                    return (
                      <tr 
                        key={yuvak.yuvak_id} 
                        onClick={() => toggleYuvak(yuvak.yuvak_id)} 
                        style={{ 
                          cursor: 'pointer',
                          background: isChecked ? 'rgba(255, 122, 24, 0.08)' : 'transparent'
                        }}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="checkbox-custom"
                            checked={isChecked}
                            onChange={() => toggleYuvak(yuvak.yuvak_id)}
                          />
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className="yuvak-id-highlight" style={{ background: isAdmin ? 'rgba(255, 122, 24, 0.15)' : undefined, color: isAdmin ? '#ff9b42' : undefined }}>
                            {yuvak.yuvak_id}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="member-avatar" style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}>
                              {(yuvak.full_name || 'M')[0]}
                            </div>
                            <span style={{ fontWeight: 600 }}>{yuvak.full_name}</span>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {isAdmin ? (
                            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(255, 122, 24, 0.2)', color: '#ff9b42', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              👑 Admin
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              👤 Yuvak
                            </span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{yuvak.mobile_no}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <MapPin size={14} color="#ff7a18" />
                            {yuvak.location || 'Bochasan'}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ 
                              color: (yuvak.attendance_pct || 100) >= 75 ? '#22c55e' : '#ff9b42', 
                              fontWeight: 700, 
                              fontSize: '0.85rem' 
                            }}>
                              {yuvak.attendance_pct || 100}%
                            </span>
                            <div style={{ flex: 1, minWidth: '40px', maxWidth: '60px', height: '6px', background: 'var(--border-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${yuvak.attendance_pct || 100}%`, 
                                height: '100%', 
                                background: (yuvak.attendance_pct || 100) >= 75 ? '#22c55e' : '#ff7a18' 
                              }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View: Member Cards Grid */}
        <div className="mobile-cards-view" style={{ marginBottom: '1.5rem' }}>
          <div className="mobile-cards-grid">
            {filteredYuvaks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No members found.
              </div>
            ) : (
              filteredYuvaks.map((yuvak) => {
                const isChecked = !!presentMap[yuvak.yuvak_id];
                const isAdmin = yuvak.role === 'admin';
                return (
                  <div
                    key={yuvak.yuvak_id}
                    className="member-mobile-card"
                    onClick={() => toggleYuvak(yuvak.yuvak_id)}
                    style={{
                      border: isChecked ? '1.5px solid rgba(255, 122, 24, 0.5)' : '1px solid var(--border-subtle)',
                      background: isChecked ? 'rgba(255, 122, 24, 0.12)' : 'var(--bg-card)'
                    }}
                  >
                    <div className="member-mobile-left" style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <input
                        type="checkbox"
                        className="checkbox-custom"
                        checked={isChecked}
                        onChange={() => toggleYuvak(yuvak.yuvak_id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="member-avatar">
                        {(yuvak.full_name || 'M')[0]}
                      </div>
                      <div className="member-info" style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '0.92rem', wordBreak: 'break-word' }}>{yuvak.full_name}</h4>
                          {isAdmin && (
                            <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: '6px', background: 'rgba(255, 122, 24, 0.2)', color: '#ff9b42', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="member-sub-info" style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span className="yuvak-id-highlight" style={{ fontSize: '0.72rem' }}>{yuvak.yuvak_id}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{yuvak.location || 'Bochasan'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.5rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: (yuvak.attendance_pct || 100) >= 75 ? '#22c55e' : '#ff9b42' }}>
                        {yuvak.attendance_pct || 100}%
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Attended</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="attendance-footer-bar" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          flexWrap: 'wrap',
          gap: '1rem',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 200px' }}>
            <UserCheck size={20} color="#ff7a18" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Summary: <strong style={{ color: '#ff9b42', fontSize: '1.05rem' }}>{presentCount}</strong> / {yuvaks.length} Present ({attendanceRate}%)
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary attendance-submit-btn" 
            disabled={saving}
            style={{ flex: '1 1 200px', minWidth: '180px' }}
          >
            <Save size={18} />
            {saving ? 'Saving Session...' : 'Save Attendance Session'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
