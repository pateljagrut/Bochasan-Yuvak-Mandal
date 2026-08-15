import React, { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Calendar, CheckSquare, SquareX, Save, Search, UserCheck, MapPin } from 'lucide-react';

function getClosestSaturdayIso() {
  const now = new Date();
  const day = now.getDay();
  const diff = (6 - day + 7) % 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + (diff === 0 ? 0 : (diff <= 3 ? diff : diff - 7)));
  return sat.toISOString().split('T')[0];
}

export default function AttendanceGrid({ yuvaks = [], onSaveAttendance, saving = false }) {
  const [sabhaDate, setSabhaDate] = useState(getClosestSaturdayIso());
  const [sabhaTitle, setSabhaTitle] = useState('Shanivariya Yuvak Sabha');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [presentMap, setPresentMap] = useState({});

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <span className="badge badge-admin">Primary Module</span>
            <h3 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Sabha Attendance Management
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            Mark presence for registered Yuvaks using interactive checkboxes & track attendance rates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: 'auto' }}>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', flex: '1 1 auto' }} onClick={handleSelectAll}>
            <CheckSquare size={16} color="#14b8a6" /> Select All
          </button>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', flex: '1 1 auto' }} onClick={handleClearAll}>
            <SquareX size={16} color="#ef4444" /> Clear All
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Sabha Meta Inputs & Search Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
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
              placeholder="e.g. Shanivariya Yuvak Sabha - Niyama Orientation"
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
          <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto', marginBottom: '1.5rem' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>Mark</th>
                  <th>Member ID</th>
                  <th>Member Name</th>
                  <th>Role</th>
                  <th>Mobile Number</th>
                  <th>Location</th>
                  <th>Attendance %</th>
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
                        <td>
                          <span className="yuvak-id-highlight" style={{ background: isAdmin ? 'rgba(255, 122, 24, 0.15)' : undefined, color: isAdmin ? '#ff9b42' : undefined }}>
                            {yuvak.yuvak_id}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="member-avatar" style={{ width: '34px', height: '34px', fontSize: '0.85rem', background: isAdmin ? 'linear-gradient(135deg, #ff7a18 0%, #f59e0b 100%)' : undefined }}>
                              {(yuvak.full_name || 'M')[0]}
                            </div>
                            <span style={{ fontWeight: 600 }}>{yuvak.full_name}</span>
                          </div>
                        </td>
                        <td>
                          {isAdmin ? (
                            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(255, 122, 24, 0.2)', color: '#ff9b42', fontWeight: 700 }}>
                              👑 Admin
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6', fontWeight: 600 }}>
                              👤 Yuvak
                            </span>
                          )}
                        </td>
                        <td>{yuvak.mobile_no}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <MapPin size={14} color="#14b8a6" />
                            {yuvak.location || 'Bochasan'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ 
                              color: (yuvak.attendance_pct || 100) >= 75 ? '#22c55e' : '#ff9b42', 
                              fontWeight: 700, 
                              fontSize: '0.85rem' 
                            }}>
                              {yuvak.attendance_pct || 100}%
                            </span>
                            <div style={{ flex: 1, maxWidth: '60px', height: '6px', background: 'var(--border-hover)', borderRadius: '3px', overflow: 'hidden' }}>
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
                      border: isChecked ? '1px solid rgba(255, 122, 24, 0.4)' : '1px solid var(--border-subtle)',
                      background: isChecked ? 'rgba(255, 122, 24, 0.12)' : 'var(--bg-card)'
                    }}
                  >
                    <div className="member-mobile-left">
                      <input
                        type="checkbox"
                        className="checkbox-custom"
                        checked={isChecked}
                        onChange={() => toggleYuvak(yuvak.yuvak_id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="member-avatar" style={{ background: isAdmin ? 'linear-gradient(135deg, #ff7a18 0%, #f59e0b 100%)' : undefined }}>
                        {(yuvak.full_name || 'M')[0]}
                      </div>
                      <div className="member-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <h4 style={{ margin: 0 }}>{yuvak.full_name}</h4>
                          {isAdmin && (
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '6px', background: 'rgba(255, 122, 24, 0.2)', color: '#ff9b42', fontWeight: 700 }}>
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="member-sub-info">
                          <span className="yuvak-id-highlight" style={{ fontSize: '0.7rem' }}>{yuvak.yuvak_id}</span>
                          <span>{yuvak.location || 'Bochasan'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: (yuvak.attendance_pct || 100) >= 75 ? '#22c55e' : '#ff9b42' }}>
                        {yuvak.attendance_pct || 100}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Attended</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserCheck size={20} color="#ff7a18" />
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Summary: <strong style={{ color: '#ff9b42', fontSize: '1.05rem' }}>{presentCount}</strong> / {yuvaks.length} Members Present ({attendanceRate}%)
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
            style={{ minWidth: '180px' }}
          >
            <Save size={18} />
            {saving ? 'Saving Session...' : 'Save Attendance Session'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
