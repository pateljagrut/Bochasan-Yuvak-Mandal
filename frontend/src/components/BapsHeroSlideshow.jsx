import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles, Calendar, HeartHandshake, Eye, Edit3, Sliders } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSlideshowSlidesApi } from '../services/api';
import SlideshowEditorModal from './SlideshowEditorModal';

const DEFAULT_SLIDES = [
  {
    id: '1',
    image: '/slides/bochasan_mandir_sunset.jpg',
    badge: 'Bochasan Tirthdham',
    badge_color: '#ff7a18',
    title: 'Bochasan Swaminarayan Akshar Mandir',
    subtitle: 'The Sacred Foundation of Akshar Purushottam Satsang • Established by Brahmaswarup Shastriji Maharaj',
    cta_text: 'Explore Mandal Portal',
    action_tab: 'dashboard',
    is_active: true
  },
  {
    id: '2',
    image: '/slides/bochasan_mandir_courtyard.jpg',
    badge: 'Pavitra Tirth',
    badge_color: '#eab308',
    title: 'Shri Akshar Purushottam Mandir',
    subtitle: 'Divine architectural marvel and sanctuary of spiritual peace, devotion, and supreme upasana in Bochasan',
    cta_text: 'Daily Satsang Feeds',
    action_tab: 'content',
    is_active: true
  },
  {
    id: '3',
    image: '/slides/bochasan_yuvak_akshardham.jpg',
    badge: 'Yuvak Mandal Yatra',
    badge_color: '#14b8a6',
    title: 'Bochasan Yuvak Mandal & Karyakar Pariwar',
    subtitle: 'United in devotion, sanskar, and seva at Swaminarayan Akshardham Gandhinagar • Samp, Suhradbhav & Ekta',
    cta_text: 'Yuvak Directory',
    action_tab: 'yuvaks',
    is_active: true
  },
  {
    id: '4',
    image: '/slides/bochasan_mandir_rooftop.jpg',
    badge: 'Akshar Purushottam Darshan',
    badge_color: '#c084fc',
    title: 'Shikhar Darshan & Divine Dhwaja',
    subtitle: 'Sacred kalash and fluttering BAPS flags radiating divine peace and spiritual bliss across Bochasan Tirth',
    cta_text: 'Mark Sabha Attendance',
    action_tab: 'attendance',
    is_active: true
  },
  {
    id: '5',
    image: '/slides/bochasan_mandir_shikhars.jpg',
    badge: 'Saturday 8:30 PM',
    badge_color: '#22c55e',
    title: 'Shanivariya Yuvak Sabha',
    subtitle: 'Weekly youth satsang assembly for spiritual character, sanskar, leadership, and brotherhood in Bochasan',
    cta_text: 'Sabha Attendance',
    action_tab: 'attendance',
    is_active: true
  },
  {
    id: '6',
    image: '/slides/bochasan_mandir_evening.jpg',
    badge: 'Nishkam Seva',
    badge_color: '#f43f5e',
    title: 'Youth Seva & Humanitarian Services',
    subtitle: '“In the joy of others, lies our own. In the progress of others, rests our own.” — Brahmaswarup Pramukh Swami Maharaj',
    cta_text: 'Community Feeds',
    action_tab: 'content',
    is_active: true
  }
];

export default function BapsHeroSlideshow({ onCtaClick, onNavigateTab, isAdmin: propIsAdmin }) {
  const { role } = useAuth();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : role === 'admin';

  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev
  const [showEditorModal, setShowEditorModal] = useState(false);

  // Fetch real slides from backend if available
  useEffect(() => {
    getSlideshowSlidesApi()
      .then(res => {
        if (res?.slides && res.slides.length > 0) {
          const activeSlides = res.slides.filter(s => s.is_active !== false);
          if (activeSlides.length > 0) {
            setSlides(activeSlides);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Touch Swipe Gesture Refs for iOS & Android
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index) => {
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
    const minSwipeDistance = 40;
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        nextSlide(); // Swiped left -> next
      } else {
        prevSlide(); // Swiped right -> prev
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      // Tap toggle for mobile devices
      setIsHovered((prev) => !prev);
    }
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
    touchStartYRef.current = 0;
  };

  // Safe fallback if index exceeds array
  const safeIndex = currentIndex < totalSlides ? currentIndex : 0;
  const currentSlide = slides[safeIndex] || DEFAULT_SLIDES[0];

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

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1440px',
        margin: '1.25rem auto 1.5rem auto',
        padding: '0 clamp(0.75rem, 3.5vw, 1.75rem)'
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
          height: 'clamp(380px, 58vh, 620px)',
          borderRadius: '24px',
          overflow: 'hidden',
          background: '#070b14',
          boxShadow: '0 16px 45px -8px rgba(0, 0, 0, 0.55), 0 0 25px rgba(255, 122, 24, 0.15)',
          border: '1px solid rgba(255, 122, 24, 0.3)',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        aria-label="BAPS Photo Slideshow"
      >
            {/* Background Slide Images with Ken Burns Zoom & Crossfade */}
            <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide.id}
          custom={direction}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.85, ease: [0.25, 1, 0.5, 1] }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        >
          <img 
            src={currentSlide.image} 
            alt={currentSlide.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center'
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Multi-Layer Cinematic Gradient Overlay - Smoothly deepens on hover */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(11, 17, 32, 0.2) 0%, rgba(11, 17, 32, 0.05) 50%, rgba(11, 17, 32, 0.75) 88%, rgba(11, 17, 32, 0.95) 100%), radial-gradient(circle at 20% 50%, rgba(255, 122, 24, 0.12) 0%, transparent 60%)',
          zIndex: 2,
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0.35,
          transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />

      {/* Subtle Hint Pill shown ONLY when NOT hovered */}
      <AnimatePresence>
        {!isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.85, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '18px',
              left: 'clamp(1rem, 4vw, 2.5rem)',
              zIndex: 3,
              pointerEvents: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '0.78rem',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            <Sparkles size={13} color="var(--primary)" />
            <span>Hover to view details</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Floating "Edit Slideshow" Quick-Access Button */}
      {isAdmin && (
        <div 
          style={{
            position: 'absolute',
            top: '16px',
            right: 'clamp(1rem, 4vw, 2.5rem)',
            zIndex: 5
          }}
        >
          <button
            type="button"
            onClick={() => setShowEditorModal(true)}
            className="btn btn-secondary"
            style={{
              background: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 122, 24, 0.5)',
              color: '#ffffff',
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
            }}
            title="Edit Slideshow Photos & Content"
          >
            <Sliders size={15} color="#ff7a18" />
            <span>Edit Slideshow</span>
          </button>
        </div>
      )}

      {/* Slide Content Caption Overlay - SHOWN ONLY ON HOVER */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            key={currentSlide.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 3,
              padding: 'clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 5vw, 3.5rem)',
              maxWidth: '1440px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              pointerEvents: 'auto'
            }}
          >
            <div style={{ maxWidth: '850px' }}>
              {/* Category / Event Badge */}
              <div 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.3rem 0.85rem',
                  borderRadius: '999px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${currentSlide.badge_color || '#ff7a18'}55`,
                  color: currentSlide.badge_color || '#ff7a18',
                  fontSize: 'clamp(0.72rem, 1.8vw, 0.82rem)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.65rem',
                  boxShadow: `0 4px 14px ${currentSlide.badge_color || '#ff7a18'}22`
                }}
              >
                <Sparkles size={14} />
                {currentSlide.badge || 'Bochasan Mandal'}
              </div>

              {/* Slide Heading */}
              <h2 
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.4rem, 4.2vw, 2.6rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.2,
                  margin: '0 0 0.55rem 0',
                  textShadow: '0 3px 12px rgba(0,0,0,0.85)',
                  letterSpacing: '-0.01em'
                }}
              >
                {currentSlide.title}
              </h2>

              {/* Slide Subtitle */}
              <p 
                style={{
                  color: 'rgba(255, 255, 255, 0.88)',
                  fontSize: 'clamp(0.85rem, 2vw, 1.05rem)',
                  lineHeight: 1.5,
                  margin: '0 0 1.25rem 0',
                  maxWidth: '720px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                }}
              >
                {currentSlide.subtitle}
              </p>

              {/* CTA Button */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleAction(currentSlide.action_tab || 'attendance')}
                  className="btn btn-primary"
                  style={{
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxShadow: '0 6px 20px rgba(255, 122, 24, 0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <span>{currentSlide.cta_text || 'Explore Portal'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Arrows (Prev / Next) */}
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
            padding: '0 clamp(0.5rem, 2vw, 1.5rem)',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        >
          <button
            type="button"
            onClick={prevSlide}
            className="slideshow-arrow-btn"
            aria-label="Previous Slide"
            style={{
              pointerEvents: 'auto',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
            }}
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="slideshow-arrow-btn"
            aria-label="Next Slide"
            style={{
              pointerEvents: 'auto',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Bottom Controls Bar: Dots, Counter, Play/Pause */}
      <div 
        style={{
          position: 'absolute',
          bottom: '14px',
          right: 'clamp(1rem, 5vw, 3.5rem)',
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          padding: '0.4rem 0.85rem',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
        }}
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
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {/* Slide Counter (01 / 04) */}
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>
          0{safeIndex + 1} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/ 0{totalSlides}</span>
        </span>

        {/* Indicator Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {slides.map((slide, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                style={{
                  width: isActive ? '22px' : '8px',
                  height: '8px',
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

        {/* Admin Slideshow Editor Modal */}
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
