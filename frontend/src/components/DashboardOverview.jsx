import React from 'react';
import { motion } from 'framer-motion';
import { Users, CalendarCheck, MapPin, Award, Megaphone, ArrowRight, Sparkles } from 'lucide-react';
import StatCard from './StatCard';
import QuickActions from './QuickActions';
import { StatSkeleton } from './SkeletonLoader';

/**
 * DashboardOverview Component
 * 
 * Displays top-level workspace metrics, summary statistics, quick action cards,
 * and recent mandal announcement feeds.
 */
export default function DashboardOverview({
  loading,
  yuvaks = [],
  avgAttendance = 100,
  user,
  feeds = [],
  setActiveTab,
  onOpenCreateAdminModal
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="dashboard-overview-container"
    >
      {/* Stat Cards Grid */}
      <div className="stat-cards-grid">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard 
              icon={Users} 
              title="Registered Members" 
              value={yuvaks.length} 
              description="Active Yuvak Profile Directory" 
              trend="+14% this month"
              trendType="up"
              delay={0.05}
            />
            <StatCard 
              icon={CalendarCheck} 
              title="Avg Sabha Attendance" 
              value={`${avgAttendance}%`} 
              description="Overall Mandal Participation" 
              trend="+5.2% vs last month"
              trendType="up"
              delay={0.1}
            />
            <StatCard 
              icon={Award} 
              title="Today's Sabha Status" 
              value="Ready" 
              description="Saturday Session" 
              trend="100% Target"
              trendType="up"
              delay={0.15}
            />
            <StatCard 
              icon={MapPin} 
              title="Active Center" 
              value={user?.location || 'Bochasan'} 
              description="Primary Region Workspace" 
              delay={0.2}
            />
          </>
        )}
      </div>

      {/* Quick Action Workspace Cards */}
      <QuickActions 
        setActiveTab={setActiveTab} 
        onOpenCreateAdminModal={onOpenCreateAdminModal} 
      />

      {/* Recent Feed & Activity Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Recent Announcements Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Megaphone size={20} color="#ff7a18" />
              <h3 style={{ fontSize: '1.15rem' }}>Recent Announcements</h3>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              onClick={() => setActiveTab('content')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {feeds.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No announcements published yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {feeds.slice(0, 3).map((feed, idx) => (
                <div key={idx} style={{ background: 'var(--bg-stat-box)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h4 style={{ color: '#ff9b42', fontSize: '0.9rem', fontWeight: 600 }}>{feed.title}</h4>
                    <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>{feed.category}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>
                    {feed.content.length > 90 ? `${feed.content.substring(0, 90)}...` : feed.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workspace Quick Summary Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Sparkles size={20} color="#ff7a18" />
            <h3 style={{ fontSize: '1.15rem' }}>Quick Workspace Status</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-stat-box)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Sabha Attendance Grid</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ready for Saturday marking</div>
              </div>
              <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setActiveTab('attendance')}>
                Open Grid
              </button>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-stat-box)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Member Profiles</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{yuvaks.length} Members registered</div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setActiveTab('yuvaks')}>
                Directory
              </button>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-stat-box)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Interactive Analytics</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Participation graphs & trends</div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setActiveTab('analytics')}>
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
