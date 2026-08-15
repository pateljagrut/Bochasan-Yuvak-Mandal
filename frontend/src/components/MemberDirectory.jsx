import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit, UserPlus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import { deleteYuvakMemberApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDob } from '../utils/formatDate';

/**
 * MemberDirectory Component
 * 
 * Displays the complete Yuvak profile directory with real-time search filtering,
 * responsive table layout for desktop, card views for mobile screens,
 * "+ Add Member" registration action, and "Delete Member" functionality.
 */
export default function MemberDirectory({
  filteredYuvaks = [],
  searchQuery = '',
  setSearchQuery,
  setEditingYuvak,
  onRefreshData,
  onNotify,
  onDeleteYuvakSuccess
}) {
  const { token } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingYuvak, setDeletingYuvak] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

  const handleMemberAddSuccess = (msg) => {
    if (onNotify) onNotify(msg);
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingYuvak) return;
    const targetId = deletingYuvak.yuvak_id;
    const targetName = deletingYuvak.full_name;

    try {
      setIsDeleting(true);
      const res = await deleteYuvakMemberApi(targetId, token);
      if (res && res.success) {
        if (onNotify) {
          onNotify(`✅ Member '${targetName}' (${targetId}) deleted successfully!`);
        }
        setDeletingYuvak(null);
        if (onDeleteYuvakSuccess) {
          onDeleteYuvakSuccess(targetId);
        }
        if (onRefreshData) {
          onRefreshData();
        }
      }
    } catch (err) {
      if (onNotify) {
        onNotify(`❌ Failed to delete member: ${err.message}`, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter members by role filter selection
  const displayedMembers = filteredYuvaks.filter(member => {
    if (roleFilter === 'all') return true;
    if (roleFilter === 'admin') return member.role === 'admin';
    if (roleFilter === 'yuvak') return member.role !== 'admin';
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card member-directory-container"
      style={{ marginTop: '1rem', padding: '1.5rem 1.75rem' }}
    >
      {/* Directory Header Toolbar with Proper Flex Spacing */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '1.25rem', 
          marginBottom: '1.5rem', 
          flexWrap: 'wrap' 
        }}
      >
        {/* Title & Subtitle */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
            👥 Member Directory (Yuvaks & Admins)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            View member profiles, roles, contact details, attendance rates, and manage memberships.
          </p>
        </div>

        {/* Action Controls: Role Filter, Search Input & Add Member Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Role Filter Selector */}
          <select
            className="form-control"
            style={{ height: '40px', fontSize: '0.85rem', width: '140px', padding: '0 0.75rem' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="yuvak">Yuvaks Only</option>
            <option value="admin">Admins Only</option>
          </select>

          {/* Search Bar Input */}
          <div style={{ position: 'relative', width: '240px', maxWidth: '100%' }}>
            <input
              type="text"
              className="form-control"
              style={{ 
                paddingLeft: '2.5rem', 
                paddingRight: '1rem',
                fontSize: '0.85rem',
                height: '40px'
              }}
              placeholder="Search Name, ID, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search 
              size={16} 
              color="var(--text-muted)" 
              style={{ 
                position: 'absolute', 
                left: '0.85rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }} 
            />
          </div>

          {/* Add Yuvak Member Button */}
          <button 
            className="btn btn-primary"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              height: '40px',
              padding: '0.5rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={18} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="desktop-table-view" style={{ marginTop: '1rem' }}>
        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.85rem 1rem' }}>Member ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Full Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Mobile Number</th>
                <th style={{ padding: '0.85rem 1rem' }}>Date of Birth</th>
                <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                <th style={{ padding: '0.85rem 1rem' }}>Attendance Rate</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedMembers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No members found matching search & role filters.
                  </td>
                </tr>
              ) : (
                displayedMembers.map((yuvak) => {
                  const isAdmin = yuvak.role === 'admin';
                  return (
                    <tr key={yuvak.yuvak_id}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="yuvak-id-highlight" style={{ background: isAdmin ? 'rgba(255, 122, 24, 0.15)' : undefined, color: isAdmin ? '#ff9b42' : undefined }}>
                          {yuvak.yuvak_id}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{yuvak.full_name}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isAdmin ? (
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, rgba(255, 122, 24, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
                            color: '#ff9b42',
                            border: '1px solid rgba(255, 122, 24, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            👑 Admin
                          </span>
                        ) : (
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background: 'rgba(20, 184, 166, 0.15)',
                            color: '#14b8a6',
                            border: '1px solid rgba(20, 184, 166, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            👤 Yuvak
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>{yuvak.mobile_no}</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.88rem' }}>{formatDob(yuvak.dob)}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{yuvak.location || 'Bochasan'}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ color: (yuvak.attendance_pct || 100) >= 75 ? '#22c55e' : '#ff9b42', fontWeight: 700 }}>
                          {yuvak.attendance_pct || 100}%
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {/* Edit Button */}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => setEditingYuvak(yuvak)}
                            title="Edit Profile"
                          >
                            <Edit size={14} /> Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            className="btn btn-secondary"
                            style={{ 
                              padding: '0.35rem 0.65rem', 
                              fontSize: '0.8rem',
                              color: '#f87171',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              background: 'rgba(239, 68, 68, 0.08)'
                            }}
                            onClick={() => setDeletingYuvak(yuvak)}
                            title="Delete Member"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Mobile Card View */}
      <div className="mobile-cards-view">
        <div className="mobile-cards-grid">
          {displayedMembers.map((yuvak) => {
            const isAdmin = yuvak.role === 'admin';
            return (
              <div key={yuvak.yuvak_id} className="member-mobile-card">
                <div className="member-mobile-left">
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
                    <div className="member-sub-info" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                      <span className="yuvak-id-highlight" style={{ fontSize: '0.7rem' }}>{yuvak.yuvak_id}</span>
                      <span>{yuvak.mobile_no}</span>
                      {yuvak.dob && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          🎂 {formatDob(yuvak.dob)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.75rem' }}
                    onClick={() => setEditingYuvak(yuvak)}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.4rem 0.7rem', 
                      fontSize: '0.75rem',
                      color: '#f87171',
                      borderColor: 'rgba(239, 68, 68, 0.3)'
                    }}
                    onClick={() => setDeletingYuvak(yuvak)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Registration Modal */}
      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleMemberAddSuccess}
        />
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingYuvak && createPortal(
        <AnimatePresence>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '1.5rem'
            }}
            onClick={() => setDeletingYuvak(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              style={{
                maxWidth: '440px',
                width: '100%',
                background: '#0f172a',
                borderRadius: '18px',
                padding: '1.75rem',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 25px 60px -10px rgba(0,0,0,0.9), 0 0 30px rgba(239, 68, 68, 0.2)',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: '#f87171'
              }}>
                <AlertTriangle size={26} />
              </div>

              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                Delete Yuvak Member?
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Are you sure you want to permanently delete <strong style={{ color: '#ff9b42' }}>{deletingYuvak.full_name}</strong> (<span className="yuvak-id-highlight">{deletingYuvak.yuvak_id}</span>)? This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={() => setDeletingYuvak(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  style={{ 
                    flex: 1, 
                    padding: '0.65rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
                  }}
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={16} />}
                  {isDeleting ? 'Deleting...' : 'Delete Member'}
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
