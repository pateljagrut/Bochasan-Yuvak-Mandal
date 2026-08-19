import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  MoveUp, 
  MoveDown, 
  Sliders, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Layers
} from 'lucide-react';
import { updateAllSlideshowSlidesApi } from '../services/api';

const PRESET_IMAGES = [
  { label: 'Mandir Sunset', url: '/slides/bochasan_mandir_sunset.jpg' },
  { label: 'Mandir Courtyard', url: '/slides/bochasan_mandir_courtyard.jpg' },
  { label: 'Akshardham Yuvak Mandal', url: '/slides/bochasan_yuvak_akshardham.jpg' },
  { label: 'Shikhar & Dhwaja', url: '/slides/bochasan_mandir_rooftop.jpg' },
  { label: 'Sunlit Shikhars', url: '/slides/bochasan_mandir_shikhars.jpg' },
  { label: 'Mandir Evening Glow', url: '/slides/bochasan_mandir_evening.jpg' },
  { label: 'Classic Mandir', url: '/slides/slide1_mandir.jpg' },
  { label: 'Sabha Assembly', url: '/slides/slide2_sabha.jpg' },
  { label: 'Daily Darshan', url: '/slides/slide3_darshan.jpg' },
  { label: 'Youth Seva', url: '/slides/slide4_seva.jpg' }
];

const PRESET_COLORS = [
  { label: 'Saffron Orange', color: '#ff7a18' },
  { label: 'Divine Teal', color: '#14b8a6' },
  { label: 'Sacred Green', color: '#22c55e' },
  { label: 'Golden Yellow', color: '#eab308' },
  { label: 'Royal Purple', color: '#c084fc' }
];

const ACTION_TABS = [
  { id: 'dashboard', label: 'Home / Dashboard' },
  { id: 'attendance', label: 'Sabha Attendance' },
  { id: 'yuvaks', label: 'Yuvak Directory' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'content', label: 'Content Feeds' }
];

export default function SlideshowEditorModal({
  isOpen,
  onClose,
  initialSlides = [],
  onSlidesUpdated
}) {
  const { token } = useAuth();
  const [slides, setSlides] = useState(() => (initialSlides && initialSlides.length > 0 ? initialSlides : []));
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleEditField = (slideId, field, value) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, [field]: value } : s));
  };

  const handleAddSlide = () => {
    const newId = `slide_${Date.now()}`;
    const newSlide = {
      id: newId,
      image: '/slides/slide1_mandir.jpg',
      badge: 'Bochasan Mandal',
      badge_color: '#ff7a18',
      title: 'New Slideshow Slide',
      subtitle: 'Add your spiritual subtitle and description here.',
      cta_text: 'Explore Portal',
      action_tab: 'attendance',
      order: slides.length + 1,
      is_active: true
    };
    setSlides([...slides, newSlide]);
    setEditingSlideId(newId);
  };

  const handleDeleteSlide = (slideId) => {
    if (slides.length <= 1) {
      alert('You must maintain at least one slide in the slideshow.');
      return;
    }
    setSlides(prev => prev.filter(s => s.id !== slideId));
    if (editingSlideId === slideId) setEditingSlideId(null);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newSlides = [...slides];
    const temp = newSlides[index - 1];
    newSlides[index - 1] = newSlides[index];
    newSlides[index] = temp;
    // update orders
    newSlides.forEach((s, idx) => { s.order = idx + 1; });
    setSlides(newSlides);
  };

  const handleMoveDown = (index) => {
    if (index === slides.length - 1) return;
    const newSlides = [...slides];
    const temp = newSlides[index + 1];
    newSlides[index + 1] = newSlides[index];
    newSlides[index] = temp;
    // update orders
    newSlides.forEach((s, idx) => { s.order = idx + 1; });
    setSlides(newSlides);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const payloadSlides = slides.map((s, idx) => ({
        ...s,
        order: idx + 1,
        is_active: s.is_active !== false
      }));

      const res = await updateAllSlideshowSlidesApi(payloadSlides, token);
      if (res?.slides) {
        setSuccessMsg('Slideshow slides updated successfully!');
        if (onSlidesUpdated) onSlidesUpdated(res.slides);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to update slideshow slides.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90dvh',
          overflowY: 'auto',
          padding: 'clamp(1.25rem, 3.5vw, 2rem)',
          borderRadius: '22px',
          border: '1.5px solid var(--primary-border)',
          boxShadow: 'var(--shadow-card)',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,122,24,0.15)', border: '1px solid rgba(255,122,24,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7a18' }}>
              <Sliders size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                BAPS Hero Photo Slideshow Manager
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Edit photos, headings, badge categories, and actions in real time
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Success / Error Alerts */}
        {error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#ef4444', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success)', color: '#4ade80', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={18} /> {successMsg}
          </div>
        )}

        {/* Slides List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {slides.map((slide, index) => {
            const isEditing = editingSlideId === slide.id;
            return (
              <div 
                key={slide.id}
                style={{
                  background: 'var(--bg-stat-box)',
                  border: isEditing ? '1.5px solid var(--primary-border)' : '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  transition: 'all 0.2s'
                }}
              >
                {/* Slide Row Summary */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Slide Thumbnail */}
                    <div style={{ width: '84px', height: '52px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)', flexShrink: 0, position: 'relative' }}>
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{ position: 'absolute', top: '2px', left: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        #{index + 1}
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: slide.badge_color || '#ff7a18', textTransform: 'uppercase' }}>
                          ● {slide.badge || 'Category'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • Tab: {slide.action_tab || 'attendance'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {slide.title}
                      </h4>
                    </div>
                  </div>

                  {/* Actions: Move Up / Down, Edit, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', opacity: index === 0 ? 0.4 : 1 }}
                      title="Move Slide Up"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === slides.length - 1}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', opacity: index === slides.length - 1 ? 0.4 : 1 }}
                      title="Move Slide Down"
                    >
                      <MoveDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSlideId(isEditing ? null : slide.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Edit3 size={14} color="#ff7a18" />
                      <span>{isEditing ? 'Done' : 'Edit Slide'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', color: '#ef4444' }}
                      title="Delete Slide"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded In-Place Editor */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                      {/* Title & Badge */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Slide Heading Title
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={slide.title || ''}
                            onChange={(e) => handleEditField(slide.id, 'title', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Badge Label (e.g. Saturday 8:30 PM)
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={slide.badge || ''}
                            onChange={(e) => handleEditField(slide.id, 'badge', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Subtitle */}
                      <div>
                        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                          Subtitle / Description
                        </label>
                        <textarea
                          rows={2}
                          className="form-control"
                          value={slide.subtitle || ''}
                          onChange={(e) => handleEditField(slide.id, 'subtitle', e.target.value)}
                        />
                      </div>

                      {/* Image Selection */}
                      <div>
                        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                          Slide Image URL or Choose Preset
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={slide.image || ''}
                          onChange={(e) => handleEditField(slide.id, 'image', e.target.value)}
                          placeholder="e.g. /slides/slide1_mandir.jpg or https://..."
                          style={{ marginBottom: '0.5rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {PRESET_IMAGES.map((preset) => (
                            <button
                              key={preset.url}
                              type="button"
                              onClick={() => handleEditField(slide.id, 'image', preset.url)}
                              className="btn btn-secondary"
                              style={{ 
                                padding: '0.25rem 0.65rem', 
                                fontSize: '0.75rem',
                                borderColor: slide.image === preset.url ? '#ff7a18' : 'var(--border-subtle)'
                              }}
                            >
                              📷 {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Badge Color Preset & CTA Button Settings */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Badge Color Accent
                          </label>
                          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => handleEditField(slide.id, 'badge_color', c.color)}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: c.color,
                                  border: slide.badge_color === c.color ? '2px solid #ffffff' : 'none',
                                  boxShadow: slide.badge_color === c.color ? `0 0 8px ${c.color}` : 'none',
                                  cursor: 'pointer'
                                }}
                                title={c.label}
                              />
                            ))}
                            <input
                              type="text"
                              className="form-control"
                              value={slide.badge_color || '#ff7a18'}
                              onChange={(e) => handleEditField(slide.id, 'badge_color', e.target.value)}
                              style={{ width: '90px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            CTA Button Text
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={slide.cta_text || ''}
                            onChange={(e) => handleEditField(slide.id, 'cta_text', e.target.value)}
                            placeholder="e.g. Mark Attendance"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Action Target Tab
                          </label>
                          <select
                            className="form-control"
                            value={slide.action_tab || 'attendance'}
                            onChange={(e) => handleEditField(slide.id, 'action_tab', e.target.value)}
                          >
                            {ACTION_TABS.map(tab => (
                              <option key={tab.id} value={tab.id}>{tab.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Modal Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            onClick={handleAddSlide}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Add New Slide</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving Slides...' : 'Save & Publish Slideshow'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
