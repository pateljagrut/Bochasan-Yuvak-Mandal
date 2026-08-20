import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Layers,
  UploadCloud,
  Copy,
  Eye,
  EyeOff,
  Link,
  FolderOpen,
  RefreshCw,
  AlertCircle,
  FileImage
} from 'lucide-react';
import { updateAllSlideshowSlidesApi, getEventPhotosApi } from '../services/api';

const DEFAULT_FALLBACK_SLIDES = [
  {
    id: 'slide_1',
    image: '/slides/slide1_mandir.jpg',
    badge: 'Bochasan Tirthdham',
    badge_color: '#ff7a18',
    title: 'Bochasan Swaminarayan Akshar Mandir',
    subtitle: 'The Sacred Foundation of Akshar Purushottam Satsang • Established by Brahmaswarup Shastriji Maharaj',
    cta_text: 'Explore Mandal Portal',
    action_tab: 'dashboard',
    order: 1,
    is_active: true,
    fit_mode: 'auto',
    object_position: 'center center'
  },
  {
    id: 'slide_2',
    image: '/slides/slide2_sabha.jpg',
    badge: 'Saturday 8:30 PM',
    badge_color: '#14b8a6',
    title: 'Saturday Yuvak Sabha',
    subtitle: 'Fostering Youth Leadership, Spiritual Sanskar, Samp, Suhradbhav & Ekta through weekly satsang assemblies',
    cta_text: 'Explore Sabha Satsang',
    action_tab: 'attendance',
    order: 2,
    is_active: true,
    fit_mode: 'auto',
    object_position: 'center center'
  },
  {
    id: 'slide_3',
    image: '/slides/slide3_darshan.jpg',
    badge: 'Daily Darshan',
    badge_color: '#eab308',
    title: 'Shri Akshar Purushottam Maharaj Darshan',
    subtitle: 'Divine Murti Darshan & Daily Satsang Upasana • Guided by the divine presence of Pragat Brahmaswarup Mahant Swami Maharaj',
    cta_text: 'View Niyama & Feeds',
    action_tab: 'content',
    order: 3,
    is_active: true,
    fit_mode: 'auto',
    object_position: 'center center'
  },
  {
    id: 'slide_4',
    image: '/slides/slide4_seva.jpg',
    badge: 'Nishkam Seva',
    badge_color: '#22c55e',
    title: 'Youth Seva & Humanitarian Services',
    subtitle: '“In the joy of others, lies our own. In the progress of others, rests our own.” — Brahmaswarup Pramukh Swami Maharaj',
    cta_text: 'Yuvak Directory',
    action_tab: 'yuvaks',
    order: 4,
    is_active: true,
    fit_mode: 'auto',
    object_position: 'center center'
  }
];

const PRESET_IMAGES = [
  { label: 'Bochasan Mandir', url: '/slides/slide1_mandir.jpg', desc: 'Main Akshar Mandir View' },
  { label: 'Yuvak Sabha Hall', url: '/slides/slide2_sabha.jpg', desc: 'Youth Assembly & Satsang' },
  { label: 'Akshar Purushottam Darshan', url: '/slides/slide3_darshan.jpg', desc: 'Sanctum Murti Darshan' },
  { label: 'Youth Seva Relief', url: '/slides/slide4_seva.jpg', desc: 'Humanitarian & Volunteer Seva' }
];

const PRESET_COLORS = [
  { label: 'Saffron Orange', color: '#ff7a18' },
  { label: 'Divine Teal', color: '#14b8a6' },
  { label: 'Sacred Green', color: '#22c55e' },
  { label: 'Golden Yellow', color: '#eab308' },
  { label: 'Royal Purple', color: '#c084fc' },
  { label: 'Rose Pink', color: '#f43f5e' },
  { label: 'Sky Blue', color: '#38bdf8' }
];

const ACTION_TABS = [
  { id: 'dashboard', label: 'Home / Dashboard' },
  { id: 'attendance', label: 'Sabha Attendance' },
  { id: 'yuvaks', label: 'Yuvak Directory' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'content', label: 'Content Feeds' }
];

/**
 * Robust helper to compress and convert any image file to an optimized Base64 JPEG data URL.
 * Works seamlessly across Chrome, Edge, Safari, iOS & Android.
 */
function processImageFile(file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No image file selected.'));
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
        // Fallback to raw base64 data url if image canvas drawing fails
        resolve({
          dataUrl: rawDataUrl,
          name: (file.name || 'slide_photo').replace(/\.[^/.]+$/, ''),
          size: file.size || Math.round(rawDataUrl.length * 0.75),
          width: maxWidth,
          height: maxHeight
        });
      };

      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            dataUrl,
            name: (file.name || 'slide_photo').replace(/\.[^/.]+$/, ''),
            size: Math.round(dataUrl.length * 0.75),
            width,
            height
          });
        } catch {
          // Fallback if canvas fails
          resolve({
            dataUrl: rawDataUrl,
            name: (file.name || 'slide_photo').replace(/\.[^/.]+$/, ''),
            size: file.size || Math.round(rawDataUrl.length * 0.75),
            width,
            height
          });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function SlideshowEditorModal({
  isOpen,
  onClose,
  initialSlides = [],
  onSlidesUpdated
}) {
  const { token } = useAuth();
  const [slides, setSlides] = useState(() => (initialSlides && initialSlides.length > 0 ? initialSlides : DEFAULT_FALLBACK_SLIDES));
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [activeImageSourceTab, setActiveImageSourceTab] = useState({}); // { [slideId]: 'upload' | 'presets' | 'gallery' | 'url' }

  const globalFileInputRef = useRef(null);

  // Sync state if initialSlides changes
  useEffect(() => {
    if (initialSlides && initialSlides.length > 0) {
      setSlides(initialSlides);
    }
  }, [initialSlides]);

  // Fetch Gallery Photos so admin can also select from existing event photos
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingGallery(true);
    getEventPhotosApi()
      .then(res => {
        if (isMounted && res?.photos && Array.isArray(res.photos)) {
          setGalleryPhotos(res.photos);
        }
      })
      .catch(err => {
        console.error('Failed to load gallery photos:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingGallery(false);
      });
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEditField = (slideId, field, value) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, [field]: value } : s));
  };

  const handleToggleActive = (slideId) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, is_active: s.is_active === false ? true : false } : s));
  };

  const handleAddSlide = (customData = {}) => {
    const newId = `slide_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSlide = {
      id: newId,
      image: customData.image || '/slides/slide1_mandir.jpg',
      badge: customData.badge || 'Bochasan Mandal',
      badge_color: customData.badge_color || '#ff7a18',
      title: customData.title || 'New Slideshow Slide',
      subtitle: customData.subtitle || 'Add spiritual description or event announcement details here.',
      cta_text: customData.cta_text || 'Explore Portal',
      action_tab: customData.action_tab || 'attendance',
      order: slides.length + 1,
      is_active: true,
      fit_mode: customData.fit_mode || 'auto',
      object_position: customData.object_position || 'center center'
    };
    setSlides(prev => [...prev, newSlide]);
    setEditingSlideId(newId);
  };

  const handleDuplicateSlide = (slide) => {
    const newId = `slide_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clone = {
      ...slide,
      id: newId,
      title: `${slide.title} (Copy)`,
      order: slide.order + 1
    };
    const slideIndex = slides.findIndex(s => s.id === slide.id);
    const newSlides = [...slides];
    newSlides.splice(slideIndex + 1, 0, clone);
    newSlides.forEach((s, idx) => { s.order = idx + 1; });
    setSlides(newSlides);
    setEditingSlideId(newId);
    setSuccessMsg('Slide duplicated successfully.');
    setTimeout(() => setSuccessMsg(null), 2000);
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
    newSlides.forEach((s, idx) => { s.order = idx + 1; });
    setSlides(newSlides);
  };

  const handleMoveDown = (index) => {
    if (index === slides.length - 1) return;
    const newSlides = [...slides];
    const temp = newSlides[index + 1];
    newSlides[index + 1] = newSlides[index];
    newSlides[index] = temp;
    newSlides.forEach((s, idx) => { s.order = idx + 1; });
    setSlides(newSlides);
  };

  // Process single or multiple image files dropped globally or via global file browser
  const handleProcessMultipleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setError(null);
    try {
      const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        setError('Please drop valid image files (JPG, PNG, WEBP).');
        return;
      }

      const processedImages = await Promise.all(
        validFiles.map(file => processImageFile(file))
      );

      const newSlideObjects = processedImages.map((proc, idx) => ({
        id: `slide_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        image: proc.dataUrl,
        badge: 'Photo Gallery',
        badge_color: '#ff7a18',
        title: proc.name.replace(/[-_]/g, ' ') || 'New Photo Slide',
        subtitle: 'Bochasan Yuvak Mandal • Satsang Darshan & Seva Moments',
        cta_text: 'Explore Portal',
        action_tab: 'attendance',
        order: slides.length + idx + 1,
        is_active: true,
        fit_mode: 'auto',
        object_position: 'center center'
      }));

      setSlides(prev => [...prev, ...newSlideObjects]);
      if (newSlideObjects.length > 0) {
        setEditingSlideId(newSlideObjects[0].id);
      }
      setSuccessMsg(`Added ${newSlideObjects.length} new slide(s) from uploaded photos!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to process photo files.');
    }
  };

  // Process a photo dropped on a specific slide's dropzone
  const handleSlideImageUpload = async (slideId, file) => {
    if (!file) return;
    setError(null);
    try {
      const result = await processImageFile(file);
      setSlides(prev => prev.map(s => {
        if (s.id === slideId) {
          return {
            ...s,
            image: result.dataUrl,
            title: s.title === 'New Slideshow Slide' ? (result.name.replace(/[-_]/g, ' ') || s.title) : s.title
          };
        }
        return s;
      }));
      setSuccessMsg('Photo updated for slide!');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err) {
      setError(err.message || 'Failed to load image file.');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const payloadSlides = slides.map((s, idx) => ({
        ...s,
        order: idx + 1,
        is_active: s.is_active !== false,
        fit_mode: s.fit_mode || 'auto',
        object_position: s.object_position || 'center center'
      }));

      const res = await updateAllSlideshowSlidesApi(payloadSlides, token);
      if (res?.slides) {
        setSuccessMsg('Slideshow slides updated & published successfully!');
        if (onSlidesUpdated) onSlidesUpdated(res.slides);
        window.dispatchEvent(new CustomEvent('slideshow-updated', { detail: res.slides }));
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

  const modalNode = (
    <div 
      className="modal-overlay" 
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92dvh',
          overflowY: 'auto',
          padding: 'clamp(1.25rem, 3.5vw, 2.25rem)',
          borderRadius: '24px',
          border: '1.5px solid var(--primary-border)',
          boxShadow: 'var(--shadow-card)',
          margin: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,122,24,0.15)', border: '1px solid rgba(255,122,24,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7a18' }}>
              <Sliders size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                BAPS Hero Photo Slideshow Manager
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Drag & drop photos, customize captions, badge themes, and reorder slides dynamically
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '10px' }}
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        {/* Global Drag & Drop / Multi-Photo Fast Upload Zone */}
        <div
          onClick={() => globalFileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsGlobalDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === e.currentTarget) setIsGlobalDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsGlobalDragging(false);
            if (e.dataTransfer?.files) {
              handleProcessMultipleFiles(e.dataTransfer.files);
            }
          }}
          style={{
            border: isGlobalDragging ? '2px dashed #ff7a18' : '2px dashed var(--primary-border)',
            background: isGlobalDragging ? 'rgba(255, 122, 24, 0.18)' : 'rgba(255, 122, 24, 0.05)',
            borderRadius: '16px',
            padding: '1.35rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            boxShadow: isGlobalDragging ? '0 0 30px rgba(255,122,24,0.4)' : 'none'
          }}
        >
          <input
            ref={globalFileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) {
                handleProcessMultipleFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UploadCloud size={26} color="#ff7a18" />
            <span style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              📸 Drag & Drop Photos here to add new slides instantly
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Or click to browse photos from your computer/phone • Supports multiple image upload (JPG, PNG, WEBP)
          </span>
        </div>

        {/* Success / Error Alerts */}
        {error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#ef4444', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> {error}
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
            const slideTab = activeImageSourceTab[slide.id] || 'upload';

            return (
              <div 
                key={slide.id}
                style={{
                  background: 'var(--bg-stat-box)',
                  border: isEditing ? '1.5px solid var(--primary-border)' : '1px solid var(--border-subtle)',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  transition: 'all 0.2s',
                  opacity: slide.is_active === false ? 0.6 : 1
                }}
              >
                {/* Slide Row Summary Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Slide Thumbnail + Quick Photo Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                      <div style={{ width: '96px', height: '60px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)', position: 'relative', background: '#000' }}>
                        <img 
                          src={slide.image} 
                          alt={slide.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{ position: 'absolute', top: '3px', left: '4px', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          #{index + 1}
                        </span>
                        {slide.is_active === false && (
                          <span style={{ position: 'absolute', bottom: '3px', right: '4px', background: 'rgba(239,68,68,0.85)', color: '#fff', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                            Hidden
                          </span>
                        )}
                      </div>

                      {/* Quick 1-Click Change Photo Button on Row */}
                      <label
                        style={{
                          fontSize: '0.72rem',
                          color: '#ff7a18',
                          background: 'rgba(255,122,24,0.12)',
                          border: '1px solid rgba(255,122,24,0.3)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                        title="Upload a new photo for this slide directly"
                      >
                        <UploadCloud size={12} /> Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleSlideImageUpload(slide.id, e.target.files[0]);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: slide.badge_color || '#ff7a18', textTransform: 'uppercase' }}>
                          ● {slide.badge || 'Category'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • Tab: <strong>{slide.action_tab || 'attendance'}</strong>
                        </span>
                        {slide.is_active === false && (
                          <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>
                            (Draft / Inactive)
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {slide.title}
                      </h4>
                    </div>
                  </div>

                  {/* Actions Bar: Move Up / Down, Duplicate, Toggle Visible, Edit, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', opacity: index === 0 ? 0.35 : 1 }}
                      title="Move Slide Up"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === slides.length - 1}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', opacity: index === slides.length - 1 ? 0.35 : 1 }}
                      title="Move Slide Down"
                    >
                      <MoveDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateSlide(slide)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem' }}
                      title="Duplicate Slide"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(slide.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', color: slide.is_active === false ? 'var(--text-muted)' : '#4ade80' }}
                      title={slide.is_active === false ? 'Enable Slide in Slideshow' : 'Hide Slide from Slideshow'}
                    >
                      {slide.is_active === false ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSlideId(isEditing ? null : slide.id)}
                      className={isEditing ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Edit3 size={14} color={isEditing ? '#ffffff' : '#ff7a18'} />
                      <span>{isEditing ? 'Done' : 'Edit Details'}</span>
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
                      style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                    >
                      {/* Photo Selector Section */}
                      <div style={{ background: 'rgba(15, 23, 42, 0.45)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ImageIcon size={16} color="#ff7a18" /> Choose Slide Photo
                          </label>

                          {/* Source Tabs */}
                          <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setActiveImageSourceTab(prev => ({ ...prev, [slide.id]: 'upload' }))}
                              style={{
                                background: slideTab === 'upload' ? 'rgba(255,122,24,0.25)' : 'none',
                                border: slideTab === 'upload' ? '1px solid #ff7a18' : 'none',
                                color: slideTab === 'upload' ? '#ffffff' : 'var(--text-muted)',
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
                              onClick={() => setActiveImageSourceTab(prev => ({ ...prev, [slide.id]: 'presets' }))}
                              style={{
                                background: slideTab === 'presets' ? 'rgba(255,122,24,0.25)' : 'none',
                                border: slideTab === 'presets' ? '1px solid #ff7a18' : 'none',
                                color: slideTab === 'presets' ? '#ffffff' : 'var(--text-muted)',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Sparkles size={13} /> BAPS Presets
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveImageSourceTab(prev => ({ ...prev, [slide.id]: 'gallery' }))}
                              style={{
                                background: slideTab === 'gallery' ? 'rgba(255,122,24,0.25)' : 'none',
                                border: slideTab === 'gallery' ? '1px solid #ff7a18' : 'none',
                                color: slideTab === 'gallery' ? '#ffffff' : 'var(--text-muted)',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <FolderOpen size={13} /> Event Gallery
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveImageSourceTab(prev => ({ ...prev, [slide.id]: 'url' }))}
                              style={{
                                background: slideTab === 'url' ? 'rgba(255,122,24,0.25)' : 'none',
                                border: slideTab === 'url' ? '1px solid #ff7a18' : 'none',
                                color: slideTab === 'url' ? '#ffffff' : 'var(--text-muted)',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Link size={13} /> Direct URL
                            </button>
                          </div>
                        </div>

                        {/* TAB 1: Drag & Drop / Upload from Device */}
                        {slideTab === 'upload' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                                  handleSlideImageUpload(slide.id, e.dataTransfer.files[0]);
                                }
                              }}
                              style={{
                                border: '2px dashed var(--primary-border)',
                                borderRadius: '12px',
                                padding: '1rem',
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
                              <UploadCloud size={24} color="#ff7a18" />
                              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Drag & drop a photo here, or click to browse
                              </span>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                Automatic Full HD optimization & compression included
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleSlideImageUpload(slide.id, e.target.files[0]);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}

                        {/* TAB 2: Spiritual Presets */}
                        {slideTab === 'presets' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
                            {PRESET_IMAGES.map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => handleEditField(slide.id, 'image', preset.url)}
                                style={{
                                  background: slide.image === preset.url ? 'rgba(255,122,24,0.18)' : 'rgba(15, 23, 42, 0.6)',
                                  border: slide.image === preset.url ? '1.5px solid #ff7a18' : '1px solid var(--border-subtle)',
                                  borderRadius: '10px',
                                  padding: '0.5rem',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                <img src={preset.url} alt={preset.label} style={{ width: '48px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                                <div>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>{preset.label}</div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{preset.desc}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* TAB 3: Event Gallery Chooser */}
                        {slideTab === 'gallery' && (
                          <div>
                            {loadingGallery ? (
                              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Loading event gallery photos...
                              </div>
                            ) : galleryPhotos.length === 0 ? (
                              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                No event gallery photos found. Use Upload or Presets above.
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                                {galleryPhotos.map((photo) => (
                                  <div
                                    key={photo.id}
                                    onClick={() => {
                                      handleEditField(slide.id, 'image', photo.image_url);
                                      if (photo.title && slide.title === 'New Slideshow Slide') {
                                        handleEditField(slide.id, 'title', photo.title);
                                      }
                                    }}
                                    style={{
                                      position: 'relative',
                                      height: '80px',
                                      borderRadius: '8px',
                                      overflow: 'hidden',
                                      cursor: 'pointer',
                                      border: slide.image === photo.image_url ? '2px solid #ff7a18' : '1px solid var(--border-subtle)'
                                    }}
                                    title={photo.title}
                                  >
                                    <img src={photo.image_url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {photo.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* TAB 4: Direct URL Input */}
                        {slideTab === 'url' && (
                          <div>
                            <input
                              type="url"
                              className="form-control"
                              value={slide.image || ''}
                              onChange={(e) => handleEditField(slide.id, 'image', e.target.value)}
                              placeholder="Paste direct image URL (https://...)"
                              style={{ fontSize: '0.85rem' }}
                            />
                          </div>
                        )}

                        {/* Live Photo Preview Strip */}
                        {slide.image && (
                          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '10px' }}>
                            <img src={slide.image} alt="Preview" style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Check size={12} /> Active Photo Selected
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {slide.image.startsWith('data:') ? 'Custom Uploaded Photo (Base64 Optimized)' : slide.image}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Title & Badge Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label htmlFor={`slide-title-${slide.id}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Slide Heading Title
                          </label>
                          <input
                            id={`slide-title-${slide.id}`}
                            name={`slide_title_${slide.id}`}
                            type="text"
                            className="form-control"
                            value={slide.title || ''}
                            onChange={(e) => handleEditField(slide.id, 'title', e.target.value)}
                            placeholder="e.g. Saturday Yuvak Sabha"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor={`slide-badge-${slide.id}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Badge Label (e.g. Saturday 8:30 PM)
                          </label>
                          <input
                            id={`slide-badge-${slide.id}`}
                            name={`slide_badge_${slide.id}`}
                            type="text"
                            className="form-control"
                            value={slide.badge || ''}
                            onChange={(e) => handleEditField(slide.id, 'badge', e.target.value)}
                            placeholder="e.g. Bochasan Tirthdham"
                          />
                        </div>
                      </div>

                      {/* Subtitle */}
                      <div>
                        <label htmlFor={`slide-subtitle-${slide.id}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                          Subtitle / Description
                        </label>
                        <textarea
                          id={`slide-subtitle-${slide.id}`}
                          name={`slide_subtitle_${slide.id}`}
                          rows={2}
                          className="form-control"
                          value={slide.subtitle || ''}
                          onChange={(e) => handleEditField(slide.id, 'subtitle', e.target.value)}
                          placeholder="Spiritual sanskar, youth seva and satsang details..."
                        />
                      </div>

                      {/* Badge Color Preset & CTA Button Settings */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label htmlFor={`slide-badge-color-${slide.id}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Badge Color Accent
                          </label>
                          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => handleEditField(slide.id, 'badge_color', c.color)}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  background: c.color,
                                  border: slide.badge_color === c.color ? '2.5px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                                  boxShadow: slide.badge_color === c.color ? `0 0 10px ${c.color}` : 'none',
                                  cursor: 'pointer'
                                }}
                                title={c.label}
                              />
                            ))}
                            <input
                              id={`slide-badge-color-${slide.id}`}
                              name={`slide_badge_color_${slide.id}`}
                              type="text"
                              className="form-control"
                              value={slide.badge_color || '#ff7a18'}
                              onChange={(e) => handleEditField(slide.id, 'badge_color', e.target.value)}
                              style={{ width: '84px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              aria-label="Custom badge color hex"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor={`slide-cta-text-${slide.id}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            CTA Button Text
                          </label>
                          <input
                            id={`slide-cta-text-${slide.id}`}
                            name={`slide_cta_text_${slide.id}`}
                            type="text"
                            className="form-control"
                            value={slide.cta_text || ''}
                            onChange={(e) => handleEditField(slide.id, 'cta_text', e.target.value)}
                            placeholder="e.g. Explore Portal"
                          />
                        </div>

                        <div>
                          <label htmlFor={`slide-action-tab-${slide.id}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Action Target Tab
                          </label>
                          <select
                            id={`slide-action-tab-${slide.id}`}
                            name={`slide_action_tab_${slide.id}`}
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

                      {/* Photo Auto-Fit & Alignment Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '10px' }}>
                        <div>
                          <label htmlFor={`slide-fit-mode-${slide.id}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Photo Auto-Fit Mode
                          </label>
                          <select
                            id={`slide-fit-mode-${slide.id}`}
                            name={`slide_fit_mode_${slide.id}`}
                            className="form-control"
                            value={slide.fit_mode || 'auto'}
                            onChange={(e) => handleEditField(slide.id, 'fit_mode', e.target.value)}
                          >
                            <option value="auto">✨ Auto-Fit (Ambient Glow + Crisp Photo)</option>
                            <option value="cover">🖼️ Cover (Fill Frame)</option>
                            <option value="contain">🔍 Contain (Full Photo Visible)</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor={`slide-obj-pos-${slide.id}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Focal Positioning
                          </label>
                          <select
                            id={`slide-obj-pos-${slide.id}`}
                            name={`slide_obj_pos_${slide.id}`}
                            className="form-control"
                            value={slide.object_position || 'center center'}
                            onChange={(e) => handleEditField(slide.id, 'object_position', e.target.value)}
                          >
                            <option value="center center">Center Center (Default)</option>
                            <option value="top center">Top Center (Faces / Spires)</option>
                            <option value="bottom center">Bottom Center</option>
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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleAddSlide()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              <span>Add Empty Slide</span>
            </button>
            <button
              type="button"
              onClick={() => globalFileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#ff7a18', borderColor: 'rgba(255,122,24,0.4)' }}
            >
              <UploadCloud size={16} />
              <span>Upload Photo Slide</span>
            </button>
          </div>

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
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, padding: '0.65rem 1.35rem' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving Slides...' : 'Save & Publish Slideshow'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
