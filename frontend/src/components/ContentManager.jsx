import React, { useState, useEffect, useRef } from 'react';
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
  Send,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getEventPhotosApi, 
  postEventPhotoApi, 
  updateEventPhotoApi,
  deleteEventPhotoApi,
  updateContentFeedApi,
  deleteContentFeedApi,
  getSlideshowSlidesApi
} from '../services/api';
import SlideshowEditorModal from './SlideshowEditorModal';

/**
 * Helper to compress and automatically center-crop any image file into a true 16:9 widescreen ratio (e.g. 1920x1080).
 * Handles wide landscape, panoramic, or group photos seamlessly so they display in pristine 16:9 cinematic quality.
 */
function processImageFile(file, maxWidth = 1920, maxHeight = 1080, quality = 0.86) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No photo file selected.'));
      return;
    }

    const isImage = (file.type && file.type.startsWith('image/')) || /\.(jpe?g|png|webp|gif|bmp|svg|avif)$/i.test(file.name || '');
    if (!isImage) {
      reject(new Error('Please select a valid image file (JPG, PNG, WEBP, etc.)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          name: (file.name || 'event_photo').replace(/\.[^/.]+$/, ''),
          size: file.size || Math.round(rawDataUrl.length * 0.75),
          width: maxWidth,
          height: maxHeight
        });
      };

      img.onload = () => {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        const targetRatio = 16 / 9; // 1.7778 Widescreen Ratio
        const origRatio = origW / origH;

        let srcX = 0;
        let srcY = 0;
        let srcW = origW;
        let srcH = origH;

        if (origRatio > targetRatio) {
          // Photo is wider than 16:9 -> center crop horizontal edges
          srcW = Math.round(origH * targetRatio);
          srcH = origH;
          srcX = Math.round((origW - srcW) / 2);
          srcY = 0;
        } else if (origRatio < targetRatio) {
          // Photo is taller than 16:9 -> center crop vertical edges
          srcW = origW;
          srcH = Math.round(origW / targetRatio);
          srcX = 0;
          srcY = Math.round((origH - srcH) / 2);
        }

        // Cap final output resolution (1920x1080 max)
        const finalW = Math.min(srcW, maxWidth);
        const finalH = Math.round(finalW / targetRatio);

        try {
          const canvas = document.createElement('canvas');
          canvas.width = finalW;
          canvas.height = finalH;
          const ctx = canvas.getContext('2d');
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, finalW, finalH);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            dataUrl,
            name: (file.name || 'event_photo').replace(/\.[^/.]+$/, ''),
            size: Math.round(dataUrl.length * 0.75),
            width: finalW,
            height: finalH
          });
        } catch {
          resolve({
            dataUrl: rawDataUrl,
            name: (file.name || 'event_photo').replace(/\.[^/.]+$/, ''),
            size: file.size || Math.round(rawDataUrl.length * 0.75),
            width: maxWidth,
            height: maxHeight
          });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * PhotoModal Component
 * 
 * Interactive modal portaled into document.body allowing Karyakar Admins
 * to upload new or edit existing Utsav & Prasang event photos with Drag & Drop.
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
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'presets' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sample HD preset images for quick testing
  const samplePresets = [
    { label: 'Hindola Utsav', url: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=800&auto=format&fit=crop' },
    { label: 'Saturday Sabha', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop' },
    { label: 'Kirtan Evening', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop' },
    { label: 'Smruti Prasang', url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800&auto=format&fit=crop' },
    { label: 'Bochasan Mandir', url: '/slides/slide1_mandir.jpg' },
    { label: 'Darshan Murti', url: '/slides/slide3_darshan.jpg' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProcessFile = async (file) => {
    if (!file) return;
    setError(null);
    try {
      const res = await processImageFile(file);
      setFormData(prev => ({
        ...prev,
        image_url: res.dataUrl,
        title: prev.title || res.name.replace(/[-_]/g, ' ')
      }));
    } catch (err) {
      setError(err.message || 'Failed to process image file.');
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
        className="modal-overlay"
        onClick={onClose}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.target === e.currentTarget) setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          if (e.dataTransfer?.files?.[0]) {
            handleProcessFile(e.dataTransfer.files[0]);
          }
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25 }}
          className="modal-container"
          style={{
            maxWidth: '580px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: 'var(--bg-modal)',
            borderRadius: '22px',
            padding: '2rem',
            border: isDragging ? '2px dashed #ff7a18' : '1px solid rgba(255, 122, 24, 0.4)',
            boxShadow: isDragging ? '0 0 35px rgba(255,122,24,0.45)' : 'var(--shadow-card)',
            margin: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 122, 24, 0.15)',
                border: '1px solid rgba(255, 122, 24, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff9b42'
              }}>
                <ImageIcon size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {isEditing ? 'Edit Event Photo' : 'Upload Event Photo'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  {isEditing ? 'Update photo details in gallery.' : 'Drag & drop photos or select from device & presets.'}
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
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Title */}
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

            {/* Date & Category */}
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

            {/* Photo Selection Tabs & Dropzone */}
            <div style={{ background: 'rgba(15, 23, 42, 0.45)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ImageIcon size={16} color="#ff7a18" /> Event Photo Source
                </label>

                <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    style={{
                      background: activeTab === 'upload' ? 'rgba(255,122,24,0.25)' : 'none',
                      border: activeTab === 'upload' ? '1px solid #ff7a18' : 'none',
                      color: activeTab === 'upload' ? '#ffffff' : 'var(--text-muted)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <UploadCloud size={13} /> Upload / Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    style={{
                      background: activeTab === 'presets' ? 'rgba(255,122,24,0.25)' : 'none',
                      border: activeTab === 'presets' ? '1px solid #ff7a18' : 'none',
                      color: activeTab === 'presets' ? '#ffffff' : 'var(--text-muted)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Sparkles size={13} /> Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    style={{
                      background: activeTab === 'url' ? 'rgba(255,122,24,0.25)' : 'none',
                      border: activeTab === 'url' ? '1px solid #ff7a18' : 'none',
                      color: activeTab === 'url' ? '#ffffff' : 'var(--text-muted)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    Direct URL
                  </button>
                </div>
              </div>

              {/* TAB 1: Drag & Drop / Device Upload */}
              {activeTab === 'upload' && (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.style.borderColor = '#ff7a18';
                    e.currentTarget.style.background = 'rgba(255,122,24,0.12)';
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.style.borderColor = 'var(--primary-border)';
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.style.borderColor = 'var(--primary-border)';
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                    if (e.dataTransfer?.files?.[0]) {
                      handleProcessFile(e.dataTransfer.files[0]);
                    }
                  }}
                  style={{
                    border: '2px dashed var(--primary-border)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(15, 23, 42, 0.4)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <UploadCloud size={28} color="#ff9b42" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Drag & drop event photo here, or click to browse
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Supports JPG, PNG, WEBP • Full HD compression included
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleProcessFile(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              {/* TAB 2: Sample Presets */}
              {activeTab === 'presets' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                  {samplePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image_url: preset.url, title: formData.title || preset.label });
                      }}
                      style={{
                        background: formData.image_url === preset.url ? 'rgba(255,122,24,0.2)' : 'rgba(15, 23, 42, 0.6)',
                        border: formData.image_url === preset.url ? '1.5px solid #ff7a18' : '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0.4rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}
                    >
                      <img src={preset.url} alt={preset.label} style={{ width: '100%', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 3: Direct URL */}
              {activeTab === 'url' && (
                <input
                  type="url"
                  name="image_url"
                  className="form-control"
                  placeholder="Paste direct HD image URL (https://...)"
                  value={formData.image_url.startsWith('data:') ? '[Uploaded File Loaded]' : formData.image_url}
                  onChange={(e) => handleChange(e)}
                  style={{ fontSize: '0.85rem' }}
                />
              )}

              {/* Image Preview Box (16:9 Widescreen Aspect Ratio) */}
              {formData.image_url && (
                <div style={{
                  marginTop: '0.75rem',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  aspectRatio: '16 / 9',
                  maxHeight: '260px',
                  margin: '0.75rem auto 0 auto',
                  border: '1px solid var(--primary-border)',
                  position: 'relative',
                  background: '#000',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}>
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)',
                    pointerEvents: 'none'
                  }} />
                  <span className="badge badge-admin" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.7rem', zIndex: 2 }}>
                    16:9 HD Preview: {formData.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.75)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2
                    }}
                    title="Remove Photo"
                  >
                    <X size={14} />
                  </button>
                  {formData.title && (
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, zIndex: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formData.title}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Author */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                Publishing Author / Media Team
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

            {/* Submit Action */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
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
                style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
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
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="modal-container"
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-modal)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 122, 24, 0.4)',
          boxShadow: 'var(--shadow-card)',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Megaphone size={22} color="#ff7a18" />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Edit Announcement / Niyama</h3>
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
  const [showSlideshowModal, setShowSlideshowModal] = useState(false);
  const [slideshowSlides, setSlideshowSlides] = useState([]);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editingFeed, setEditingFeed] = useState(null);

  // Fetch slideshow slides
  const loadSlideshowSlides = async () => {
    try {
      const res = await getSlideshowSlidesApi();
      if (res && Array.isArray(res.slides)) {
        setSlideshowSlides(res.slides);
      }
    } catch (err) {
      console.error('Failed to load slideshow slides:', err);
    }
  };

  useEffect(() => {
    loadSlideshowSlides();
  }, []);
  
  // Action in-progress states
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [deletingFeedId, setDeletingFeedId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isGalleryDragging, setIsGalleryDragging] = useState(false);
  const [batchUploading, setBatchUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  const galleryFileInputRef = useRef(null);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Batch upload multiple photos dropped on gallery view
  const handleBatchPhotoUpload = async (files) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showNotify('⚠️ Please select valid image files (JPG, PNG, WEBP).', 'error');
      return;
    }

    setBatchUploading(true);
    let successCount = 0;
    try {
      for (const file of validFiles) {
        const compressed = await processImageFile(file);
        const photoPayload = {
          title: compressed.name.replace(/[-_]/g, ' ') || 'Event Photo',
          event_date: new Date().toISOString().split('T')[0],
          category: selectedCategory !== 'All' ? selectedCategory : 'Utsav',
          image_url: compressed.dataUrl,
          author: 'Bochasan Media Team'
        };
        const res = await postEventPhotoApi(photoPayload, token);
        if (res && res.success) {
          successCount++;
        }
      }
      showNotify(`✅ Successfully uploaded ${successCount} photo(s) to Gallery!`);
      loadPhotos();
      if (onRefreshContent) onRefreshContent();
    } catch (err) {
      showNotify(`❌ Error uploading photos: ${err.message}`, 'error');
    } finally {
      setBatchUploading(false);
    }
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

        <button
          className={`content-switcher-btn ${contentTab === 'slideshow' ? 'active' : ''}`}
          onClick={() => setContentTab('slideshow')}
        >
          <Sliders size={16} /> <span>BAPS Hero Slideshow</span>
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

          {/* Quick Multi-Photo Drag & Drop Zone */}
          <div
            onClick={() => galleryFileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsGalleryDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.target === e.currentTarget) setIsGalleryDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsGalleryDragging(false);
              if (e.dataTransfer?.files) {
                handleBatchPhotoUpload(e.dataTransfer.files);
              }
            }}
            style={{
              border: isGalleryDragging ? '2px dashed #ff7a18' : '2px dashed var(--primary-border)',
              background: isGalleryDragging ? 'rgba(255, 122, 24, 0.15)' : 'rgba(255, 122, 24, 0.05)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: isGalleryDragging ? '0 0 25px rgba(255,122,24,0.35)' : 'none'
            }}
          >
            <input
              ref={galleryFileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) {
                  handleBatchPhotoUpload(e.target.files);
                  e.target.value = '';
                }
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {batchUploading ? (
                <Loader2 size={24} className="animate-spin" color="#ff7a18" />
              ) : (
                <UploadCloud size={24} color="#ff7a18" />
              )}
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {batchUploading ? 'Optimizing & Uploading Photos to Gallery...' : '📸 Drag & Drop Event Photos here to upload instantly'}
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Supports single or multiple HD photos (JPG, PNG, WEBP) • Automatic Full HD optimization
            </span>
          </div>

          {/* Category Filter Pills Bar */}
          <div 
            className="touch-scroll"
            style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '1.5rem', 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '0.5rem',
              width: '100%'
            }}
          >
            {['All', 'Utsav', 'Sabha', 'Cultural', 'Prasang'].map((cat) => (
              <button
                key={cat}
                className={selectedCategory === cat ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', height: '32px', borderRadius: '9999px', flexShrink: 0 }}
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
            <div className="photo-gallery-grid-9-16">
              {filteredPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="photo-story-card"
                  onClick={() => setViewingPhoto(photo)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Full-Bleed 9:16 Image */}
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="photo-story-overlay" />
                  
                  {/* Category Badge Top Left */}
                  <span 
                    className="badge badge-admin" 
                    style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      left: '10px', 
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      zIndex: 3,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
                    }}
                  >
                    {photo.category || 'Event'}
                  </span>

                  {/* Top Right Action Buttons: Edit & Delete */}
                  <div 
                    style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.35rem', zIndex: 3 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setEditingPhoto(photo);
                        setShowPhotoModal(true);
                      }}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        color: '#60a5fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                      }}
                      title="Edit Photo"
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      onClick={() => handleDeletePhoto(photo.id, photo.title)}
                      disabled={deletingPhotoId === photo.id}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                      }}
                      title="Delete Photo"
                    >
                      {deletingPhotoId === photo.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>

                  {/* Bottom Story Content Info */}
                  <div className="photo-story-content">
                    <h4 style={{ 
                      fontSize: '0.92rem', 
                      fontWeight: 800, 
                      color: '#ffffff', 
                      margin: 0, 
                      lineHeight: 1.3,
                      textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {photo.title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={12} color="#ff9b42" />
                        {photo.event_date || 'Recent Event'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>
                        16:9 HD
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Full-Screen 16:9 Widescreen Lightbox Modal */}
      {viewingPhoto && (
        <div 
          className="modal-overlay"
          onClick={() => setViewingPhoto(null)}
          style={{ zIndex: 1100, background: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(16px)', padding: '1rem' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '860px',
              aspectRatio: '16 / 9',
              maxHeight: '85vh',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(255,122,24,0.3)',
              border: '1.5px solid rgba(255, 122, 24, 0.5)',
              background: '#000000',
              margin: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
          >
            <img 
              src={viewingPhoto.image_url} 
              alt={viewingPhoto.title}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Top Close Button & Badge */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
              <span className="badge badge-admin" style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, boxShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {viewingPhoto.category || 'Event'} • 16:9 HD
              </span>

              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Bottom Info Overlay */}
            <div style={{
              position: 'relative',
              zIndex: 3,
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
              padding: '1.75rem 1.5rem 1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.3, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                {viewingPhoto.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} color="#ff9b42" />
                  {viewingPhoto.event_date || 'Recent Event'}
                </span>
                <span>By: {viewingPhoto.author || 'Bochasan Media Team'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODULE 3: BAPS Hero Slideshow Manager */}
      {contentTab === 'slideshow' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card content-manager-container"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                🎞️ BAPS Hero Photo Slideshow Manager
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Manage photos, titles, badges, and quick CTA links for the homepage hero slideshow.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowSlideshowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Sliders size={18} /> Manage & Edit Slideshow
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {slideshowSlides.map((slide, idx) => (
              <div
                key={slide.id || idx}
                style={{
                  background: 'var(--bg-stat-box)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: '150px', position: 'relative' }}>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                    Slide #{idx + 1}
                  </div>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(15,23,42,0.85)', color: slide.badge_color || '#ff7a18', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, border: `1px solid ${slide.badge_color || '#ff7a18'}55` }}>
                    ● {slide.badge}
                  </div>
                </div>

                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                    {slide.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {slide.subtitle}
                  </p>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Target Tab: <strong>{slide.action_tab || 'attendance'}</strong></span>
                    <button
                      type="button"
                      onClick={() => setShowSlideshowModal(true)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

      {/* Slideshow Editor Modal */}
      {showSlideshowModal && (
        <SlideshowEditorModal
          isOpen={showSlideshowModal}
          onClose={() => setShowSlideshowModal(false)}
          initialSlides={slideshowSlides}
          onSlidesUpdated={(updated) => {
            setSlideshowSlides(updated);
            showNotify('✅ Slideshow updated and published successfully!');
          }}
        />
      )}
    </div>
  );
}
