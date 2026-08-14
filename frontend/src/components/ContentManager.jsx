import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  Edit3,
  Calendar, 
  Tag, 
  UploadCloud, 
  X, 
  Sparkles, 
  Loader2,
  Film,
  CheckCircle2,
  AlertCircle,
  Save,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getEventPhotosApi, 
  postEventPhotoApi, 
  updateEventPhotoApi,
  deleteEventPhotoApi,
  updateContentFeedApi,
  deleteContentFeedApi 
} from '../services/api';

/**
 * PhotoModal Component
 * 
 * Interactive modal portaled into document.body allowing Karyakar Admins
 * to upload new or edit existing Utsav & Prasang event photos.
 */
function PhotoModal({ initialPhoto = null, onClose, onSaveSuccess }) {
  const { token } = useAuth();
  const isEditing = Boolean(initialPhoto && initialPhoto.id);

  const [formData, setFormData] = useState({
    title: initialPhoto?.title || '',
    event_date: initialPhoto?.event_date || new Date().toISOString().split('T')[0],
    category: initialPhoto?.category || 'Utsav',
    image_url: initialPhoto?.image_url || '',
    author: initialPhoto?.author || 'Bochasan Media Team'
  });
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sample HD preset images for quick testing
  const samplePresets = [
    { label: 'Hindola Utsav', url: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=800&auto=format&fit=crop' },
    { label: 'Shanivariya Sabha', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop' },
    { label: 'Kirtan Evening', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop' },
    { label: 'Smruti Prasang', url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800&auto=format&fit=crop' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle local file selection & conversion to Base64 preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      setError('Please provide an Image URL or select a photo file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const res = await updateEventPhotoApi(initialPhoto.id, formData, token);
        if (res && res.success) {
          if (onSaveSuccess) onSaveSuccess({ ...initialPhoto, ...formData }, true);
          onClose();
        } else {
          throw new Error(res?.message || 'Failed to update event photo');
        }
      } else {
        const res = await postEventPhotoApi(formData, token);
        if (res && res.success) {
          if (onSaveSuccess) onSaveSuccess(res.photo || formData, false);
          onClose();
        } else {
          throw new Error(res?.message || 'Failed to publish event photo');
        }
      }
    } catch (err) {
      setError(err.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
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
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.5rem',
          overflowY: 'auto'
        }}
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25 }}
          style={{
            maxWidth: '540px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#0f172a',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid rgba(255, 122, 24, 0.4)',
            boxShadow: '0 25px 60px -10px rgba(0,0,0,0.9), 0 0 40px rgba(255,122,24,0.2)',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 122, 24, 0.15)',
                border: '1px solid rgba(255, 122, 24, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff9b42'
              }}>
                <ImageIcon size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  {isEditing ? 'Edit Event Photo' : 'Upload Event Photo'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  {isEditing ? 'Update photo details in gallery.' : 'Publish Utsav & Prasang photos to Yuvak Gallery.'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                padding: '0.5rem',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              color: '#f87171',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                Event Title / Headline
              </label>
              <input
                type="text"
                name="title"
                className="form-control"
                placeholder="e.g. Hindola Utsav 2026"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                  Event Date
                </label>
                <input
                  type="date"
                  name="event_date"
                  className="form-control"
                  value={formData.event_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                  Category Badge
                </label>
                <select
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Utsav">Utsav</option>
                  <option value="Sabha">Sabha</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Prasang">Prasang</option>
                </select>
              </div>
            </div>

            {/* Photo URL or Local File Upload */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                Image File Upload or Direct URL
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <input
                  type="url"
                  name="image_url"
                  className="form-control"
                  placeholder="Paste HD Image URL (https://...)"
                  value={filePreview ? '[Uploaded File Loaded]' : formData.image_url}
                  onChange={(e) => {
                    setFilePreview(null);
                    handleChange(e);
                  }}
                />

                {/* Drag and Drop File Input Box */}
                <label style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(15, 23, 42, 0.4)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <UploadCloud size={24} color="#ff9b42" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Or click to browse photo file from device
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Sample Presets Quick Click */}
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  ⚡ Or click a sample preset photo:
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {samplePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: '28px' }}
                      onClick={() => {
                        setFilePreview(null);
                        setFormData({ ...formData, image_url: preset.url, title: formData.title || preset.label });
                      }}
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Preview Box */}
            {(formData.image_url || filePreview) && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', height: '160px', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                <img
                  src={formData.image_url}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className="badge badge-admin" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.7rem' }}>
                  Preview: {formData.category}
                </span>
              </div>
            )}

            {/* Submit Action */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem' }}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? <Save size={18} /> : <Sparkles size={18} />)}
                {loading ? (isEditing ? 'Saving...' : 'Publishing...') : (isEditing ? 'Save Changes' : 'Publish to Gallery')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

/**
 * EditFeedModal Component
 * 
 * Modal for modifying existing Announcements or Niyama feeds.
 */
function EditFeedModal({ feed, onClose, onSaveSuccess }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: feed?.title || '',
    content: feed?.content || '',
    category: feed?.category || 'announcement',
    author: feed?.author || 'Bochasan Karyakar Team'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await updateContentFeedApi(feed.id, formData, token);
      if (res && res.success) {
        if (onSaveSuccess) onSaveSuccess({ ...feed, ...formData });
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to update announcement');
      }
    } catch (err) {
      setError(err.message || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.5rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#0f172a',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 122, 24, 0.4)',
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.9), 0 0 40px rgba(255,122,24,0.2)',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Megaphone size={22} color="#ff7a18" />
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>Edit Announcement / Niyama</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
              Title / Headline
            </label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
              Category
            </label>
            <select name="category" className="form-control" value={formData.category} onChange={handleChange}>
              <option value="announcement">Announcement</option>
              <option value="niyama">Niyama / Vichar of the Week</option>
              <option value="schedule">Sabha Schedule</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
              Content Description
            </label>
            <textarea
              name="content"
              rows="4"
              className="form-control"
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
              Publishing Author / Team
            </label>
            <input
              type="text"
              name="author"
              className="form-control"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/**
 * ContentManager Component
 * 
 * Multi-module workspace component that enables Karyakars to manage:
 * 1. Announcements & Niyamas (Full CRUD: Create, Read, Update, Delete)
 * 2. Utsav & Prasang Photo Gallery (Full CRUD: Create, Read, Update, Delete)
 */
export default function ContentManager({ 
  feeds = [], 
  photos: propPhotos = [], 
  onOpenContentModal,
  onRefreshContent 
}) {
  const { token } = useAuth();
  const [contentTab, setContentTab] = useState('announcements'); // 'announcements' | 'photos'
  const [photos, setPhotos] = useState(propPhotos);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modal states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editingFeed, setEditingFeed] = useState(null);
  
  // Action in-progress states
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [deletingFeedId, setDeletingFeedId] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync photos when parent passes updated props
  useEffect(() => {
    if (propPhotos && Array.isArray(propPhotos)) {
      setPhotos(propPhotos);
    }
  }, [propPhotos]);

  // Fetch Event Photos from backend API
  const loadPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const res = await getEventPhotosApi();
      if (res && Array.isArray(res.photos)) {
        setPhotos(res.photos);
      }
    } catch (err) {
      console.error('Error fetching event photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const handlePhotoSaved = (savedPhoto, isUpdate) => {
    if (isUpdate) {
      showNotify(`✅ Event photo '${savedPhoto.title}' updated successfully!`);
      setPhotos(prev => prev.map(p => (p.id === savedPhoto.id ? savedPhoto : p)));
    } else {
      showNotify(`✅ Event photo '${savedPhoto.title}' published successfully!`);
      setPhotos(prev => [savedPhoto, ...prev]);
    }
    loadPhotos();
    if (onRefreshContent) onRefreshContent();
  };

  const handleFeedSaved = (savedFeed) => {
    showNotify(`✅ Announcement '${savedFeed.title}' updated successfully!`);
    if (onRefreshContent) onRefreshContent();
  };

  const handleDeletePhoto = async (photoId, photoTitle) => {
    if (!window.confirm(`Are you sure you want to delete '${photoTitle || 'this photo'}' from the gallery?`)) {
      return;
    }

    try {
      setDeletingPhotoId(photoId);
      // Optimistically update UI state
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      
      const res = await deleteEventPhotoApi(photoId, token);
      if (res && res.success) {
        showNotify(`✅ Event photo '${photoTitle || photoId}' removed from gallery.`);
        if (onRefreshContent) onRefreshContent();
      } else {
        throw new Error(res?.message || 'Failed to delete photo');
      }
    } catch (err) {
      showNotify(`❌ Failed to remove photo: ${err.message}`, 'error');
      loadPhotos();
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleDeleteFeed = async (feedId, feedTitle) => {
    if (!window.confirm(`Are you sure you want to delete announcement '${feedTitle || 'this announcement'}'?`)) {
      return;
    }

    try {
      setDeletingFeedId(feedId);
      const res = await deleteContentFeedApi(feedId, token);
      if (res && res.success) {
        showNotify(`✅ Announcement '${feedTitle || feedId}' removed from feed.`);
        if (onRefreshContent) onRefreshContent();
      } else {
        throw new Error(res?.message || 'Failed to delete announcement');
      }
    } catch (err) {
      showNotify(`❌ Failed to delete announcement: ${err.message}`, 'error');
    } finally {
      setDeletingFeedId(null);
    }
  };

  // Category filtering logic
  const filteredPhotos = selectedCategory === 'All'
    ? photos
    : photos.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="content-manager-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Sub-Header Workspace Switcher Tabs */}
      <div className="content-switcher-container">
        <button
          className={`content-switcher-btn ${contentTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setContentTab('announcements')}
        >
          <Megaphone size={16} /> <span>Announcements & Niyamas</span>
        </button>

        <button
          className={`content-switcher-btn ${contentTab === 'photos' ? 'active' : ''}`}
          onClick={() => setContentTab('photos')}
        >
          <ImageIcon size={16} /> <span>Utsav & Prasang Photos</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            fontWeight: 600,
            background: notification.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)',
            border: notification.type === 'error' ? '1px solid var(--danger)' : '1px solid var(--success)',
            color: notification.type === 'error' ? '#f87171' : '#4ade80',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {notification.msg}
        </motion.div>
      )}

      {/* MODULE 1: Announcements & Niyamas */}
      {contentTab === 'announcements' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card content-manager-container"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                📢 Content & Announcement Feeds
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Publish and manage updates and Niyama feeds visible to all Yuvaks.
              </p>
            </div>
            <button className="btn btn-primary" onClick={onOpenContentModal}>
              <Plus size={18} /> Upload Announcement / Niyama
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {feeds.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No announcement feeds uploaded yet.
              </div>
            ) : (
              feeds.map((feed, idx) => (
                <div 
                  key={feed.id || idx} 
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    padding: '1.25rem', 
                    borderRadius: '14px', 
                    border: '1px solid var(--border-subtle)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ color: '#ff9b42', fontSize: 'clamp(0.95rem, 3.5vw, 1.05rem)', margin: 0, flex: '1 1 200px' }}>
                      {feed.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span className="badge badge-admin">{feed.category}</span>
                      
                      {/* Edit Announcement Button */}
                      <button
                        onClick={() => setEditingFeed(feed)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid rgba(59, 130, 246, 0.35)',
                          color: '#60a5fa',
                          borderRadius: '8px',
                          padding: '0.25rem 0.55rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                        title="Edit Announcement"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      {/* Delete Announcement Button */}
                      {feed.id && (
                        <button
                          onClick={() => handleDeleteFeed(feed.id, feed.title)}
                          disabled={deletingFeedId === feed.id}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#f87171',
                            borderRadius: '8px',
                            padding: '0.25rem 0.55rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease'
                          }}
                          title="Delete Announcement"
                        >
                          {deletingFeedId === feed.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    {feed.content}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Published by: {feed.author} • {new Date(feed.created_at || Date.now()).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* MODULE 2: Utsav & Prasang Photos Gallery Management */}
      {contentTab === 'photos' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card photos-manager-container"
        >
          {/* Gallery Header & Action Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                 Utsav & Prasang Photo Gallery
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Upload, edit and manage event photo galleries visible to Yuvak members.
              </p>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={() => {
                setEditingPhoto(null);
                setShowPhotoModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            >
              <Plus size={18} />
              <span>Upload Event Photos</span>
            </button>
          </div>

          {/* Category Filter Pills Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {['All', 'Utsav', 'Sabha', 'Cultural', 'Prasang'].map((cat) => (
              <button
                key={cat}
                className={selectedCategory === cat ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', height: '32px', borderRadius: '9999px' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Responsive Gallery Grid (3-4 Columns) */}
          {loadingPhotos ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
              Loading event photo gallery...
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px', border: '1px dashed var(--border-subtle)' }}>
              <ImageIcon size={32} color="#ff9b42" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Event Photos Found</h4>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Click "+ Upload Event Photos" above to add photos to the gallery.</p>
            </div>
          ) : (
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                gap: '1.25rem' 
              }}
            >
              {filteredPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.5)',
                    transition: 'transform 0.25s ease, border-color 0.25s ease'
                  }}
                  className="photo-card-item"
                >
                  {/* Image Container with Zoom Hover Effect */}
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.35s ease'
                      }}
                    />
                    
                    {/* Category Badge Top Left */}
                    <span 
                      className="badge badge-admin" 
                      style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        left: '10px', 
                        fontSize: '0.7rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                      }}
                    >
                      {photo.category || 'Event'}
                    </span>

                    {/* Top Right Action Buttons: Edit & Delete */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => {
                          setEditingPhoto(photo);
                          setShowPhotoModal(true);
                        }}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(59, 130, 246, 0.5)',
                          color: '#60a5fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                        }}
                        title="Edit Photo"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeletePhoto(photo.id, photo.title)}
                        disabled={deletingPhotoId === photo.id}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          color: '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                        }}
                        title="Delete Photo"
                      >
                        {deletingPhotoId === photo.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Photo Card Body Info */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                      {photo.title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                      <Calendar size={14} color="#ff9b42" />
                      <span>{photo.event_date || 'Recent Event'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Photo Upload / Edit Modal */}
      {showPhotoModal && (
        <PhotoModal
          initialPhoto={editingPhoto}
          onClose={() => {
            setShowPhotoModal(false);
            setEditingPhoto(null);
          }}
          onSaveSuccess={handlePhotoSaved}
        />
      )}

      {/* Edit Announcement Modal */}
      {editingFeed && (
        <EditFeedModal
          feed={editingFeed}
          onClose={() => setEditingFeed(null)}
          onSaveSuccess={handleFeedSaved}
        />
      )}
    </div>
  );
}
