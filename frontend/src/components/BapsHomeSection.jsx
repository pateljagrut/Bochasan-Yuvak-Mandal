import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarCheck, 
  Users, 
  Megaphone, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Radio, 
  BookOpen, 
  X,
  ExternalLink
} from 'lucide-react';
import { formatDob } from '../utils/formatDate';

/**
 * Calculates the next upcoming Saturday at 20:30 (8:30 PM IST)
 */
function getNextSaturdayTarget() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
  let daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  
  // If today is Saturday and it's already past 21:30, target next week's Saturday
  if (daysUntilSaturday === 0 && (now.getHours() > 21 || (now.getHours() === 21 && now.getMinutes() >= 30))) {
    daysUntilSaturday = 7;
  }

  const target = new Date(now);
  target.setDate(now.getDate() + daysUntilSaturday);
  target.setHours(20, 30, 0, 0); // 8:30 PM
  return target;
}

const DEFAULT_NEWS_ITEMS = [
  {
    id: 1,
    title: 'Saturday Yuvak Sabha: "Samp, Suhradbhav & Ekta"',
    category: 'Youth Sabha',
    date: 'Saturday, Aug 22, 2026',
    author: 'Bochasan Yuvak Mandal',
    badgeColor: '#ff7a18',
    summary: 'Weekly youth assembly focusing on spiritual discourses, leadership development, interactive group discussions, and traditional Mahaprasad.',
    details: 'Jai Swaminarayan! All Yuvaks are cordially invited to join this week\'s Saturday Yuvak Sabha at Bochasan Mandir. Key highlights include discourse on "Samp Ane Ekta" from Vachanamrut Gadhada I-68, inspirational video presentation, and leadership guidance for upcoming mandir celebrations.'
  },
  {
    id: 2,
    title: 'Vicharan Prerna: Pragat Brahmaswarup Mahant Swami Maharaj',
    category: 'Vicharan',
    date: '15 August 2026',
    author: 'BAPS Satsang Pravrutti',
    badgeColor: '#14b8a6',
    summary: 'Spiritual blessings and divine guidance inspiring thousands of youths across Gujarat to uphold daily niyamas and pure living.',
    details: 'During divine satsang vicharan, Param Pujya Mahant Swami Maharaj emphasized the supreme importance of daily satsang reading, preserving moral purity (nasha-mukti), and serving the mandal with genuine humility (dasbhav).'
  },
  {
    id: 3,
    title: 'BAPS Yuvak Mandal Clean Green Mandir & Seva Abhiyan',
    category: 'Humanitarian Seva',
    date: '10 August 2026',
    author: 'Yuvak Seva Wing',
    badgeColor: '#22c55e',
    summary: 'Bochasan youth volunteers conducted tree plantation, mandir campus cleanliness, and medical relief assistance.',
    details: 'Over 120 dedicated Yuvaks participated in the monthly Bochasan Parisar Seva initiative, planting 200 neem and banyan saplings and organizing food distribution for surrounding rural communities.'
  }
];

export default function BapsHomeSection({ 
  onNavigateTab, 
  feeds = [], 
  yuvaksCount = 0, 
  isAdmin = false 
}) {
  // 1. Live Countdown Timer to upcoming Saturday Sabha
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
    const updateCountdown = () => {
      const target = getNextSaturdayTarget();
      const difference = target.getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const newsList = feeds.length > 0 ? feeds.slice(0, 3) : DEFAULT_NEWS_ITEMS;

  return (
    <div className="baps-home-section-container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      
      {/* =========================================================================
          SECTION 1: QUICK PORTAL GATEWAY
          Interactive Cards for Sabha Attendance, Member Directory, Feeds & Admin
          ========================================================================= */}
      <div style={{ marginBottom: '2.5rem' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Bochasan Yuvak Mandal Services
            </h2>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Sabha Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className="glass-card"
            style={{
              padding: '1.5rem',
              borderRadius: '18px',
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(255,122,24,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,122,24,0.12)', border: '1px solid rgba(255,122,24,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7a18', marginBottom: '1rem' }}>
                <CalendarCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
                {isAdmin ? 'Sabha Attendance' : 'Sabha & Satsang'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                {isAdmin 
                  ? 'Record and track Saturday Sabha presence with interactive attendance checklists.'
                  : 'Weekly spiritual sabha assemblies, kirtan aradhana, youth leadership, and attendance records.'}
              </p>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-orange)', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>{isAdmin ? 'Open Attendance Grid' : 'View Sabha Details'}</span>
              <ArrowRight size={16} />
            </div>
          </motion.div>

          {/* Card 2: Yuvak Directory */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => onNavigateTab && onNavigateTab('yuvaks')}
            className="glass-card"
            style={{
              padding: '1.5rem',
              borderRadius: '18px',
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(255,122,24,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,122,24,0.12)', border: '1px solid rgba(255,122,24,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7a18', marginBottom: '1rem' }}>
                <Users size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
                Yuvak Directory
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Search and manage registered youth profiles, contact details, attendance rates, and mandal records.
              </p>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-orange)', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>View {yuvaksCount > 0 ? `${yuvaksCount} Members` : 'Directory'}</span>
              <ArrowRight size={16} />
            </div>
          </motion.div>

          {/* Card 3: Niyama & Announcements */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => onNavigateTab && onNavigateTab('content')}
            className="glass-card"
            style={{
              padding: '1.5rem',
              borderRadius: '18px',
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(255,122,24,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,122,24,0.12)', border: '1px solid rgba(255,122,24,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7a18', marginBottom: '1rem' }}>
                <Megaphone size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
                Niyama & Feeds
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Access weekly spiritual niyamas, mandal announcements, utsav updates, and event photo gallery.
              </p>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-orange)', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>Explore Content Feed</span>
              <ArrowRight size={16} />
            </div>
          </motion.div>

          {/* Card 4: Analytics & Admin */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => onNavigateTab && onNavigateTab('analytics')}
            className="glass-card"
            style={{
              padding: '1.5rem',
              borderRadius: '18px',
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(255,122,24,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,122,24,0.12)', border: '1px solid rgba(255,122,24,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7a18', marginBottom: '1rem' }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
                {isAdmin ? 'Analytics & Reports' : 'Personal Consistency'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                {isAdmin 
                  ? 'Dynamic charts, participation trends, attendance rates, and editable Saturday schedule.'
                  : 'Track your personal monthly participation goals, consistency badges, and milestones.'}
              </p>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-orange)', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>View Analytics</span>
              <ArrowRight size={16} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: UPCOMING SATURDAY SABHA & LIVE COUNTDOWN
          ========================================================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="glass-card"
        style={{
          borderRadius: '22px',
          padding: 'clamp(1.5rem, 4vw, 2.25rem)',
          marginBottom: '2.5rem',
          border: '1.5px solid rgba(255, 122, 24, 0.45)',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(255, 122, 24, 0.06) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          {/* Left Column: Sabha Details */}
          <div>
            <h3 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.9rem)', fontWeight: 800, margin: '0 0 0.6rem 0', color: 'var(--text-orange)' }}>
              Saturday Yuvak Sabha • Bochasan
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55, margin: '0 0 1.25rem 0' }}>
              Join fellow karyakars and yuvaks for weekly spiritual satsang discourses, youth leadership development, kirtan aradhana, and Mahaprasad.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)' }}>
                <Clock size={18} color="#ff7a18" style={{ flexShrink: 0 }} />
                <span><strong>Every Saturday:</strong> 8:30 PM – 10:00 PM IST</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)' }}>
                <MapPin size={18} color="#ff7a18" style={{ flexShrink: 0 }} />
                <span><strong>Venue:</strong> Mahant Hall, 1st Floor, BAPS Mandir, Bochasan</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Countdown Clocks */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
              Time Remaining Until Next Sabha
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(0.35rem, 2vw, 0.75rem)', width: '100%', maxWidth: '380px' }}>
              <div className="countdown-box" style={{ background: 'var(--bg-stat-box)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.65rem 0.35rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 4vw, 1.85rem)', fontWeight: 800, color: 'var(--text-orange)', lineHeight: 1 }}>
                  {timeLeft.days}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.3rem', fontWeight: 600 }}>
                  Days
                </div>
              </div>

              <div className="countdown-box" style={{ background: 'var(--bg-stat-box)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.65rem 0.35rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 4vw, 1.85rem)', fontWeight: 800, color: 'var(--text-orange)', lineHeight: 1 }}>
                  {timeLeft.hours}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.3rem', fontWeight: 600 }}>
                  Hours
                </div>
              </div>

              <div className="countdown-box" style={{ background: 'var(--bg-stat-box)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.65rem 0.35rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 4vw, 1.85rem)', fontWeight: 800, color: 'var(--text-orange)', lineHeight: 1 }}>
                  {timeLeft.minutes}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.3rem', fontWeight: 600 }}>
                  Mins
                </div>
              </div>

              <div className="countdown-box" style={{ background: 'var(--bg-stat-box)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.65rem 0.35rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 4vw, 1.85rem)', fontWeight: 800, color: 'var(--text-orange)', lineHeight: 1 }}>
                  {timeLeft.seconds}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.3rem', fontWeight: 600 }}>
                  Secs
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('attendance')}
                className="btn btn-primary"
                style={{ marginTop: '1.25rem', width: '100%', maxWidth: '380px', padding: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <CalendarCheck size={18} />
                <span>Mark Saturday Sabha Attendance</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* =========================================================================
          SECTION 3: LATEST NEWS, VICHARAN & MANDAL ANNOUNCEMENTS GRID
          ========================================================================= */}
      <div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Latest News, Vicharan & Announcements
            </h2>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigateTab && onNavigateTab('content')}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>View All Feeds</span>
            <ArrowRight size={15} />
          </button>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {newsList.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-card"
              style={{
                borderRadius: '18px',
                padding: '1.4rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedNews(item)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span 
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 122, 24, 0.12)',
                      color: 'var(--text-orange)',
                      border: '1px solid rgba(255, 122, 24, 0.25)'
                    }}
                  >
                    {item.category || 'Mandal Announcement'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.date || item.created_at ? new Date(item.created_at || Date.now()).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                  {item.title}
                </h4>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {item.summary || (item.content && item.content.length > 110 ? `${item.content.substring(0, 110)}...` : item.content)}
                </p>
              </div>

              <div style={{ marginTop: '1.2rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  By: {item.author || 'Bochasan Mandal'}
                </span>
                <span style={{ color: 'var(--text-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  Read Details <ExternalLink size={13} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* News Details Modal Preview */}
      <AnimatePresence>
        {selectedNews && (
          <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '560px',
                padding: '2rem',
                borderRadius: '22px',
                border: '1px solid var(--primary-border)',
                boxShadow: 'var(--shadow-card)',
                margin: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span className="badge badge-admin" style={{ fontSize: '0.75rem' }}>
                  {selectedNews.category || 'Mandal Announcement'}
                </span>
                <button
                  onClick={() => setSelectedNews(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                >
                  <X size={20} />
                </button>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {selectedNews.title}
              </h3>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Published on {selectedNews.date || new Date().toLocaleDateString()} • {selectedNews.author || 'Bochasan Yuvak Mandal'}
              </div>

              <div style={{ background: 'var(--bg-stat-box)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {selectedNews.details || selectedNews.content || selectedNews.summary}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedNews(null)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
