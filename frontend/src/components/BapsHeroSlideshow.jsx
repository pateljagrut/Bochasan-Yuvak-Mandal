import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Sparkles, 
  Sliders, 
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSlideshowSlidesApi } from '../services/api';
import SlideshowEditorModal from './SlideshowEditorModal';

const DEFAULT_SLIDES = [
  {
    id: '1',
    image: '/slides/slide1_mandir.jpg',
    badge: 'Bochasan Tirthdham',
    badge_color: '#ff7a18',
    title: 'Bochasan Swaminarayan Akshar Mandir',
    subtitle: 'The Sacred Foundation of Akshar Purushottam Satsang • Established by Brahmaswarup Shastriji Maharaj',
    cta_text: 'Explore Mandal Portal',
    action_tab: 'dashboard',
    is_active: true,
    fit_mode: 'auto',
    object_position: 'center center'
  },
  {
    id: '2',
    image: '/slides/slide2_sabha.jpg',
    badge: 'Saturday 8:30 PM',
    badge_color: '#14b8a6',
    title: 'Saturday Yuvak Sabha',
    subtitle: 'Fostering Youth Leadership, Spiritual Sanskar, Samp, Suhradbhav & Ekta through weekly satsang assemblies',
    cta_text: 'Explore Sabha Satsang',
    action_tab: 'attendance',
    is_active: true,
    fit_mode: 'auto',
    object_position: 'center center'
  },
  {
    id: '3',
    image: '/slides/slide3_darshan.jpg',
    badge: 'Daily Darshan',
    badge_color: '#eab308',
    title: 'Shri Akshar Purushottam Maharaj Darshan',
    subtitle: 'Divine Murti Darshan & Daily Satsang Upasana • Guided by the divine presence of Pragat Brahmaswarup Mahant Swami Maharaj',
    cta_text: 'View Niyama & Feeds',
    action_tab: 'content',
    is_active: true,
    fit_mode: 'auto',
    object_position: 'center center'
  },
  {
    id: '4',
    image: '/slides/slide4_seva.jpg',
    badge: 'Nishkam Seva',
    badge_color: '#22c55e',
    title: 'Youth Seva & Humanitarian Services',
    subtitle: '“In the joy of others, lies our own. In the progress of others, rests our own.” — Brahmaswarup Pramukh Swami Maharaj',
    cta_text: 'Yuvak Directory',
    action_tab: 'yuvaks',
    is_active: true,
    fit_mode: 'auto',
    object_position: 'center center'
  }
];

export default function BapsHeroSlideshow({ onCtaClick, onNavigateTab, isAdmin: propIsAdmin }) {
  const { role } = useAuth();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : role === 'admin';

  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [photoRatio, setPhotoRatio] = useState(16 / 9);

  // Fetch slideshow details from database
  const fetchSlidesFromDatabase = useCallback(async () => {
    try {
      const res = await getSlideshowSlidesApi();
      if (res?.slides && Array.isArray(res.slides) && res.slides.length > 0) {
        const activeSlides = res.slides.filter(s => s.is_active !== false);
        if (activeSlides.length > 0) {
          setSlides(activeSlides);
        } else {
          setSlides(res.slides);
        }
      }
    } catch (err) {
      console.warn('Could not fetch slideshow details from database, using cached defaults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + Realtime Sync listener
  useEffect(() => {
    fetchSlidesFromDatabase();

    const handleSync = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        const active = e.detail.filter(s => s.is_active !== false);
        setSlides(active.length > 0 ? active : e.detail);
        setCurrentIndex(0);
      } else {
        fetchSlidesFromDatabase();
      }
    };

    window.addEventListener('slideshow-updated', handleSync);
    window.addEventListener('focus', fetchSlidesFromDatabase);

    return () => {
      window.removeEventListener('slideshow-updated', handleSync);
      window.removeEventListener('focus', fetchSlidesFromDatabase);
    };
  }, [fetchSlidesFromDatabase]);

  // Touch Swipe Gesture Refs for iOS & Android
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setImageLoaded(false);
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setImageLoaded(false);
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index) => {
    if (index === currentIndex) return;
    setImageLoaded(false);
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Autoplay Timer (5.5 seconds)
  useEffect(() => {
    if (!isPlaying || isHovered || totalSlides <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(timer);
  }, [isPlaying, isHovered, nextSlide, totalSlides]);

  // Touch Gesture Listeners (iOS Safari & Android Chrome)
  const handleTouchStart = (e) => {
    if (!e.touches || !e.touches[0]) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!e.touches || !e.touches[0]) return;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const deltaX = touchStartXRef.current - touchEndXRef.current;
    const deltaY = touchStartYRef.current - (e.changedTouches?.[0]?.clientY || touchStartYRef.current);
    const minSwipeDistance = 35;
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        nextSlide(); // Swiped left -> next
      } else {
        prevSlide(); // Swiped right -> prev
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      // Tap toggle for mobile & touch devices
      setIsHovered((prev) => !prev);
    }
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
    touchStartYRef.current = 0;
  };

  // Safe fallback if index exceeds array
  const safeIndex = currentIndex < totalSlides ? currentIndex : 0;
  const currentSlide = slides[safeIndex] || DEFAULT_SLIDES[0];

  // Auto-detect each slide's natural aspect ratio so borders adjust smoothly to photo size
  useEffect(() => {
    if (!currentSlide?.image) return;
    const img = new window.Image();
    img.src = currentSlide.image;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        const ratio = img.naturalWidth / img.naturalHeight;
        // Clamp aspect ratio between 1.33 (4:3) and 2.4 (21:9)
        const clampedRatio = Math.max(1.33, Math.min(2.4, ratio));
        setPhotoRatio(clampedRatio);
      }
    };
  }, [currentSlide?.image]);

  const handleAction = (tab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (onCtaClick) {
      onCtaClick(tab);
    }
  };

  const handleSlidesUpdated = (newSlides) => {
    if (newSlides && newSlides.length > 0) {
      const activeSlides = newSlides.filter(s => s.is_active !== false);
      setSlides(activeSlides.length > 0 ? activeSlides : newSlides);
      setCurrentIndex(0);
    }
  };

  // Determine photo fit style (auto, cover, contain)
  const fitMode = currentSlide.fit_mode || 'auto';
  const objectPosition = currentSlide.object_position || 'center center';
  const badgeColor = currentSlide.badge_color || '#ff7a18';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1440px',
        margin: '1rem auto 1.5rem auto',
        padding: '0 clamp(0.6rem, 3vw, 1.5rem)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div 
        className="baps-slideshow-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: `min(100%, calc(clamp(340px, 56vh, 620px) * ${photoRatio}))`,
          aspectRatio: `${photoRatio}`,
          maxHeight: 'clamp(340px, 56vh, 620px)',
          borderRadius: 'clamp(16px, 3vw, 24px)',
          overflow: 'hidden',
          background: '#070b14',
          boxShadow: `0 16px 45px -8px rgba(0, 0, 0, 0.65), 0 0 25px ${badgeColor}25`,
          border: `1.5px solid ${badgeColor}55`,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: 'pointer',
          transition: 'max-width 0.45s cubic-bezier(0.25, 1, 0.5, 1), aspect-ratio 0.45s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.4s ease, box-shadow 0.4s ease'
        }}
        aria-label="BAPS Photo Slideshow"
      >
        {/* Skeleton placeholder during initial load */}
        {loading && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #0b1120 0%, #151e32 50%, #0b1120 100%)',
              backgroundSize: '200% 100%',
              animation: 'skeletonPulse 1.8s infinite ease-in-out',
              zIndex: 10
            }}
          />
        )}

        {/* 1. AUTO-FITTED PHOTO ENGINE (Dual-Layer: Ambient Blur Fill + Crisp Foreground Photo) */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
              overflow: 'hidden'
            }}
          >
            {/* Ambient Blurred Backdrop Layer: Auto-fills sides/top for any photo aspect ratio */}
            <div 
              style={{
                position: 'absolute',
                inset: '-25px',
                backgroundImage: `url("${currentSlide.image}")`,
                backgroundSize: 'cover',
                backgroundPosition: objectPosition,
                filter: 'blur(36px) brightness(0.55) saturate(1.3)',
                transform: 'scale(1.15)',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />

            {/* Foreground Auto-Fitted Image Layer */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              <img 
                src={currentSlide.image} 
                alt={currentSlide.title || 'Bochasan Mandal Slideshow'}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.currentTarget.src = '/slides/slide1_mandir.jpg';
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: objectPosition,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block'
                }}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 2. Responsive Multi-Layer Cinematic Gradient Overlay - Smoothly deepens on hover */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(7, 11, 20, 0.25) 0%, rgba(7, 11, 20, 0.05) 45%, rgba(7, 11, 20, 0.78) 82%, rgba(7, 11, 20, 0.96) 100%), radial-gradient(circle at 20% 65%, rgba(255, 122, 24, 0.16) 0%, transparent 65%)',
            zIndex: 2,
            pointerEvents: 'none',
            opacity: isHovered ? 1 : 0.35,
            transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* 3. Subtle Hint Pill shown ONLY when NOT hovered */}
        <AnimatePresence>
          {!isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.88, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.28 }}
              style={{
                position: 'absolute',
                bottom: 'clamp(12px, 2.5vw, 18px)',
                left: 'clamp(12px, 3.5vw, 24px)',
                zIndex: 3,
                pointerEvents: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                background: 'rgba(15, 23, 42, 0.72)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: 'clamp(0.72rem, 1.8vw, 0.78rem)',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)'
              }}
            >
              <Sparkles size={13} color="var(--primary)" />
              <span>Hover to view details</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Admin Floating "Edit Slideshow" Quick Button */}
        {isAdmin && (
          <div 
            style={{
              position: 'absolute',
              top: 'clamp(10px, 2.5vw, 16px)',
              right: 'clamp(10px, 3vw, 24px)',
              zIndex: 6
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEditorModal(true);
              }}
              className="btn btn-secondary"
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 122, 24, 0.55)',
                color: '#ffffff',
                padding: 'clamp(0.35rem, 1.5vw, 0.48rem) clamp(0.65rem, 2vw, 0.95rem)',
                borderRadius: '999px',
                fontSize: 'clamp(0.72rem, 1.8vw, 0.82rem)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 18px rgba(0,0,0,0.6)'
              }}
              title="Edit Slideshow Photos & Content (Stored in Database)"
            >
              <Sliders size={14} color="#ff7a18" />
              <span>Edit Slideshow</span>
            </button>
          </div>
        )}

        {/* 5. Slide Content Caption Overlay - SHOWN ON HOVER / TAP */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              key={currentSlide.id + '_caption'}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 3,
                padding: 'clamp(1.2rem, 3.8vw, 2.4rem) clamp(1rem, 4.5vw, 3.2rem)',
                maxWidth: '1440px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                pointerEvents: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ maxWidth: '820px' }}>
                {/* Category / Event Badge */}
                <div 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.38rem',
                    padding: 'clamp(0.24rem, 1vw, 0.34rem) clamp(0.6rem, 1.8vw, 0.85rem)',
                    borderRadius: '999px',
                    background: 'rgba(15, 23, 42, 0.82)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${badgeColor}66`,
                    color: badgeColor,
                    fontSize: 'clamp(0.68rem, 1.9vw, 0.8rem)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 'clamp(0.35rem, 1.2vw, 0.6rem)',
                    boxShadow: `0 4px 14px ${badgeColor}25`
                  }}
                >
                  <Sparkles size={13} />
                  <span>{currentSlide.badge || 'Bochasan Mandal'}</span>
                </div>

                {/* Slide Heading Title */}
                <h2 
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.25rem, 4.2vw, 2.45rem)',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.22,
                    margin: '0 0 clamp(0.35rem, 1vw, 0.55rem) 0',
                    textShadow: '0 2px 14px rgba(0,0,0,0.92)',
                    letterSpacing: '-0.01em',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {currentSlide.title}
                </h2>

                {/* Slide Subtitle / Description */}
                {currentSlide.subtitle && (
                  <p 
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: 'clamp(0.8rem, 2.1vw, 1rem)',
                      lineHeight: 1.5,
                      margin: '0 0 clamp(0.85rem, 2vw, 1.25rem) 0',
                      maxWidth: '720px',
                      textShadow: '0 2px 8px rgba(0,0,0,0.85)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {currentSlide.subtitle}
                  </p>
                )}

                {/* CTA Action Button */}
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(currentSlide.action_tab || 'attendance');
                    }}
                    className="btn btn-primary"
                    style={{
                      padding: 'clamp(0.5rem, 1.8vw, 0.68rem) clamp(1rem, 3vw, 1.45rem)',
                      fontSize: 'clamp(0.82rem, 2.1vw, 0.92rem)',
                      fontWeight: 700,
                      boxShadow: '0 6px 20px rgba(255, 122, 24, 0.45)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      borderRadius: '999px'
                    }}
                  >
                    <span>{currentSlide.cta_text || 'Explore Portal'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. Navigation Arrows (Prev / Next) */}
        {totalSlides > 1 && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 clamp(0.4rem, 1.8vw, 1.25rem)',
              zIndex: 5,
              pointerEvents: 'none'
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="slideshow-arrow-btn"
              aria-label="Previous Slide"
              style={{
                pointerEvents: 'auto',
                width: 'clamp(36px, 7.5vw, 44px)',
                height: 'clamp(36px, 7.5vw, 44px)',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.72)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="slideshow-arrow-btn"
              aria-label="Next Slide"
              style={{
                pointerEvents: 'auto',
                width: 'clamp(36px, 7.5vw, 44px)',
                height: 'clamp(36px, 7.5vw, 44px)',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.72)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* 7. Responsive Bottom Controls Bar: Dots, Counter, Play/Pause */}
        <div 
          style={{
            position: 'absolute',
            bottom: 'clamp(10px, 2.5vw, 16px)',
            right: 'clamp(10px, 3.5vw, 24px)',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.45rem, 1.8vw, 0.75rem)',
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(12px)',
            padding: 'clamp(0.28rem, 1vw, 0.38rem) clamp(0.55rem, 1.8vw, 0.85rem)',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: 'none',
              border: 'none',
              color: isPlaying ? 'var(--text-orange)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            title={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
            aria-label={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>

          {/* Slide Counter (01 / 04) */}
          <span style={{ fontSize: 'clamp(0.68rem, 1.8vw, 0.75rem)', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
            0{safeIndex + 1} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/ 0{totalSlides}</span>
          </span>

          {/* Indicator Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {slides.map((slide, idx) => {
              const isActive = idx === safeIndex;
              return (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  style={{
                    width: isActive ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '999px',
                    background: isActive ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* 8. Admin Slideshow Editor Modal */}
        {showEditorModal && (
          <SlideshowEditorModal
            isOpen={showEditorModal}
            onClose={() => setShowEditorModal(false)}
            initialSlides={slides}
            onSlidesUpdated={handleSlidesUpdated}
          />
        )}
      </div>
    </div>
  );
}
