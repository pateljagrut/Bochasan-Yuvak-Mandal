import React, { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function ScrollManager() {
  const { scrollY } = useScroll();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let lastState = false;
    const unsubscribeScroll = scrollY.on('change', (latest) => {
      const shouldShow = latest > 300;
      if (shouldShow !== lastState) {
        lastState = shouldShow;
        setShowScrollTop(shouldShow);
      }
    });

    return () => {
      unsubscribeScroll();
    };
  }, [scrollY]);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Floating Animated "Scroll to Top" Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            onClick={handleScrollToTop}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="floating-scroll-top-btn"
            style={{
              position: 'fixed',
              bottom: 'clamp(1.25rem, 4vw, 2.25rem)',
              right: 'clamp(1.25rem, 4vw, 2.25rem)',
              zIndex: 900,
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'var(--bg-modal)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255, 122, 24, 0.55)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card), 0 0 16px rgba(255, 122, 24, 0.3)',
              padding: 0
            }}
            title="Scroll to Top"
            aria-label="Scroll back to top"
          >
            <ArrowUp size={20} color="#ff7a18" className="animate-bounce-subtle" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
