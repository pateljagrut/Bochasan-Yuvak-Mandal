import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Flame,
  Edit3,
  Save,
  X,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUpcomingSabhaApi, updateUpcomingSabhaApi } from '../services/api';

/**
 * Helper function to format ISO date string (YYYY-MM-DD) into display label
 * e.g., '2026-08-01' -> '01 Aug (Sat)'
 */
function formatSabhaDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const weekday = d.toLocaleString('en-US', { weekday: 'short' });
    return `${day} ${month} (${weekday})`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Helper function to calculate default next upcoming Saturday date
 */
function getDefaultSaturdayInfo() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const nextSat = new Date(now);
  nextSat.setDate(now.getDate() + daysUntilSaturday);

  const formattedDate = nextSat.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    title: 'Upcoming Saturday Sabha',
    date: formattedDate,
    iso: nextSat.toISOString().split('T')[0],
    timing: '8:30 PM IST',
    venue: 'Mahant Hall 1st floor',
    description: 'Weekly spiritual session, youth leadership development, Satsang Chintan and Mahaprasad.',
    target_attendance: '100% Attendance',
    status_badge: '● Saturday Scheduled'
  };
}

/**
 * Custom Tooltip for Attendance Bar Chart
 */
function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'var(--bg-modal)',
        border: '1px solid var(--primary-border)',
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        boxShadow: 'var(--shadow-card)',
        fontSize: '0.82rem',
        color: 'var(--text-primary)'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-orange)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={13} /> {data.displayDate}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {data.title || 'Saturday Yuvak Sabha'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ color: '#22c55e' }}>● Present:</span>
            <strong>{data.present} Yuvaks</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ color: '#ef4444' }}>● Absent:</span>
            <strong>{data.absent} Yuvaks</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-orange)' }}>Attendance Rate:</span>
            <strong>{data.rate}%</strong>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Custom Tooltip for Participation Trend Area Chart
 */
function CustomAreaTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'var(--bg-modal)',
        border: '1px solid rgba(20, 184, 166, 0.4)',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        boxShadow: 'var(--shadow-card)',
        fontSize: '0.82rem',
        color: 'var(--text-primary)'
      }}>
        <div style={{ fontWeight: 700, color: '#14b8a6', marginBottom: '0.25rem' }}>
          📅 {data.displayDate}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          Rate: <strong style={{ color: 'var(--text-primary)' }}>{data.attendance}%</strong> ({data.headcount})
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
          Target: 85%
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Recharts-Powered Analytics Dashboard Section.
 * 100% Dynamically calculates attendance rates, trends, headcount distributions,
 * and upcoming Saturday schedules directly from database records.
 * Supports interactive in-place editing of the Upcoming Sabha Card.
 */
export default function AnalyticsSection({ yuvaks = [], sessions = [], onRefreshData }) {
  const { token, role } = useAuth();
  const isAdmin = role === 'admin';

  const defaultSchedule = useMemo(() => getDefaultSaturdayInfo(), []);
  const [sabhaSchedule, setSabhaSchedule] = useState(defaultSchedule);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(defaultSchedule);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Load latest upcoming sabha schedule from API on mount
  useEffect(() => {
    getUpcomingSabhaApi()
      .then(res => {
        if (res?.schedule) {
          setSabhaSchedule(prev => ({
            ...prev,
            title: res.schedule.title || prev.title,
            date: res.schedule.date_str || prev.date,
            timing: res.schedule.timing || prev.timing,
            venue: res.schedule.venue || prev.venue,
            description: res.schedule.description || prev.description,
            target_attendance: res.schedule.target_attendance || prev.target_attendance,
            status_badge: res.schedule.status_badge || prev.status_badge
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenEditModal = () => {
    setEditFormData({
      title: sabhaSchedule.title || 'Upcoming Saturday Sabha',
      date_str: sabhaSchedule.date || defaultSchedule.date,
      timing: sabhaSchedule.timing || '8:30 PM IST',
      venue: sabhaSchedule.venue || 'Mahant Hall 1st floor',
      description: sabhaSchedule.description || defaultSchedule.description,
      target_attendance: sabhaSchedule.target_attendance || '100% Attendance',
      status_badge: sabhaSchedule.status_badge || '● Saturday Scheduled'
    });
    setShowEditModal(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      setSavingSchedule(true);
      const res = await updateUpcomingSabhaApi(editFormData, token);
      if (res?.success) {
        setSabhaSchedule({
          title: editFormData.title,
          date: editFormData.date_str,
          timing: editFormData.timing,
          venue: editFormData.venue,
          description: editFormData.description,
          target_attendance: editFormData.target_attendance,
          status_badge: editFormData.status_badge
        });
        setShowEditModal(false);
        setToastMsg('Sabha schedule updated successfully!');
        setTimeout(() => setToastMsg(null), 4000);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Error saving upcoming sabha schedule:', err);
      alert('Failed to save sabha schedule. Please try again.');
    } finally {
      setSavingSchedule(false);
    }
  };

  // 1. Process attendance session data dynamically
  const { 
    barChartData, 
    trendData, 
    distributionData, 
    avgAttendanceRate, 
    bestSabha, 
    totalSabhasCount 
  } = useMemo(() => {
    const totalMembers = yuvaks.length || 1;

    // Sort sessions chronologically (oldest to newest)
    const sortedSessions = [...sessions].sort((a, b) => 
      (a.sabha_date || '').localeCompare(b.sabha_date || '')
    );

    // Build Bar Chart & Trend Data for each Saturday session
    const barData = sortedSessions.map((session, index) => {
      const presentCount = session.present_yuvak_ids?.length || 0;
      const totalForSession = Math.max(totalMembers, presentCount);
      const absentCount = Math.max(0, totalForSession - presentCount);
      const rate = Math.round((presentCount / totalForSession) * 100);
      const displayDate = formatSabhaDate(session.sabha_date);

      return {
        date: session.sabha_date,
        displayDate,
        title: session.sabha_title || `Saturday Sabha #${index + 1}`,
        present: presentCount,
        absent: absentCount,
        total: totalForSession,
        rate
      };
    });

    const trend = sortedSessions.map((session, index) => {
      const presentCount = session.present_yuvak_ids?.length || 0;
      const totalForSession = Math.max(totalMembers, presentCount);
      const rate = Math.round((presentCount / totalForSession) * 100);
      return {
        displayDate: formatSabhaDate(session.sabha_date),
        attendance: rate,
        target: 85,
        headcount: `${presentCount}/${totalForSession} Present`
      };
    });

    // Calculate Engagement Distribution across registered Yuvaks
    let regularCount = 0;
    let moderateCount = 0;
    let followUpCount = 0;

    yuvaks.forEach(y => {
      const attended = sortedSessions.filter(s => 
        s.present_yuvak_ids?.includes(y.yuvak_id)
      ).length;
      const pct = sortedSessions.length > 0 
        ? Math.round((attended / sortedSessions.length) * 100) 
        : 100;

      if (pct >= 90) regularCount++;
      else if (pct >= 70) moderateCount++;
      else followUpCount++;
    });

    const totalCalculated = yuvaks.length || 1;
    const distData = [
      { 
        name: 'Regular (90%+)', 
        count: regularCount, 
        value: Math.round((regularCount / totalCalculated) * 100), 
        color: '#ff7a18' 
      },
      { 
        name: 'Moderate (70-89%)', 
        count: moderateCount, 
        value: Math.round((moderateCount / totalCalculated) * 100), 
        color: '#14b8a6' 
      },
      { 
        name: 'Needs Follow-up (<70%)', 
        count: followUpCount, 
        value: Math.round((followUpCount / totalCalculated) * 100), 
        color: '#ef4444' 
      }
    ];

    // Compute Overall Average Attendance %
    const totalPresentSum = sortedSessions.reduce((acc, s) => acc + (s.present_yuvak_ids?.length || 0), 0);
    const totalPossibleSum = sortedSessions.length * totalMembers;
    const avgRate = totalPossibleSum > 0 
      ? Math.round((totalPresentSum / totalPossibleSum) * 100) 
      : 100;

    // Find Best Attended Sabha
    let best = null;
    if (barData.length > 0) {
      best = [...barData].sort((a, b) => b.rate - a.rate || b.present - a.present)[0];
    }

    return {
      barChartData: barData,
      trendData: trend,
      distributionData: distData,
      avgAttendanceRate: avgRate,
      bestSabha: best,
      totalSabhasCount: sortedSessions.length
    };
  }, [yuvaks, sessions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {toastMsg && (
        <div style={{
          padding: '0.75rem 1.25rem',
          background: 'rgba(34, 197, 94, 0.18)',
          border: '1px solid #22c55e',
          color: '#4ade80',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '0.88rem',
          textAlign: 'center'
        }}>
          ✅ {toastMsg}
        </div>
      )}

      {/* Dynamic Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Mandal Attendance Rate</span>
            <TrendingUp size={18} color="#ff7a18" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-orange)' }}>
            {avgAttendanceRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.25rem' }}>
            ↑ Across {totalSabhasCount} Saturday Sessions
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Saturday Sabhas</span>
            <Calendar size={18} color="#ff7a18" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-orange)' }}>
            {totalSabhasCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Saturday Sessions Recorded
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Active Registered Yuvaks</span>
            <Users size={18} color="#ff7a18" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-orange)' }}>
            {yuvaks.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Enrolled in Mandal Directory
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Peak Attended Sabha</span>
            <Award size={18} color="#ff7a18" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-orange)' }}>
            {bestSabha ? `${bestSabha.rate}%` : '100%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {bestSabha ? `${bestSabha.displayDate} (${bestSabha.present} present)` : 'All Sabhas active'}
          </div>
        </div>
      </div>

      {/* Row 1: Primary Date-Based Bar Graph & Upcoming Saturday Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
        
        {/* Main Bar Chart: Saturday Sabha Attendance by Date */}
        <div className="glass-card" style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={20} color="#ff7a18" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Saturday Sabha Attendance by Date
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Present vs Absent headcount for each scheduled Saturday Sabha session.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '3px', background: '#ff7a18' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '3px', background: 'rgba(239, 68, 68, 0.5)' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>Absent</span>
              </div>
            </div>
          </div>

          {barChartData.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No Saturday Sabha attendance records found. Mark attendance in the Attendance tab to view charts.
            </div>
          ) : (
            <div style={{ width: '100%', height: 260, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="var(--text-muted)" 
                    fontSize={10} 
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="present" fill="#ff7a18" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="absent" fill="rgba(239, 68, 68, 0.45)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Upcoming Saturday Prerna Sabha Card (Editable by Admins) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#ff7a18" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{sabhaSchedule.title || 'Upcoming Saturday Sabha'}</h3>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={handleOpenEditModal}
                  title="Edit Upcoming Sabha Schedule"
                >
                  <Edit3 size={13} color="#ff7a18" /> Edit
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {sabhaSchedule.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: 'var(--text-secondary)' }}>
                <Calendar size={16} color="#ff7a18" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Scheduled Date:</strong>
                  <span>{sabhaSchedule.date}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: 'var(--text-secondary)' }}>
                <Clock size={16} color="#ff7a18" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Sabha Timing:</strong>
                  <span>{sabhaSchedule.timing}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: 'var(--text-secondary)' }}>
                <MapPin size={16} color="#ff7a18" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Venue:</strong>
                  <span>{sabhaSchedule.venue}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {sabhaSchedule.target_attendance}</span>
            <span className="badge badge-success">{sabhaSchedule.status_badge}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Attendance Rate Trajectory (Area) & Engagement Distribution (Donut) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
        
        {/* Area Chart: Attendance % Trend */}
        <div className="glass-card" style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📈 Attendance Percentage Trajectory</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Participation rate (%) across consecutive Saturday Sabhas</p>
            </div>
            <span className="badge badge-yuvak">Target: 85%+</span>
          </div>

          {trendData.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No trend data recorded.</div>
          ) : (
            <div style={{ width: '100%', height: 240, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="var(--text-muted)" 
                    fontSize={10} 
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="#14b8a6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#areaGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Donut Chart: Yuvak Engagement Distribution */}
        <div className="glass-card">
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>🎯 Member Engagement Categories</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Dynamic attendance rate breakdown across all {yuvaks.length} registered members</p>
          </div>

          <div style={{ width: '100%', height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name, entry) => [`${entry.payload.count} Members (${val}%)`, name]}
                  contentStyle={{ background: 'var(--bg-modal)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            {distributionData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {d.name}: <strong style={{ color: '#ffffff' }}>{d.count}</strong> ({d.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Recorded Saturday Sessions History Log */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>📜 Saturday Sabha History Log</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>All recorded Saturday Sabha sessions with headcounts and attendance rates</p>
          </div>
          <span className="badge badge-admin">{sessions.length} Recorded Sessions</span>
        </div>

        {sessions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No Sabha attendance records found.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Saturday Date</th>
                  <th>Sabha Topic / Title</th>
                  <th>Present / Total</th>
                  <th>Attendance %</th>
                  <th>Marked By</th>
                </tr>
              </thead>
              <tbody>
                {[...sessions].reverse().map((session, idx) => {
                  const presentCount = session.present_yuvak_ids?.length || 0;
                  const total = Math.max(yuvaks.length, presentCount);
                  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;
                  const displayDate = formatSabhaDate(session.sabha_date);

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#ff9b42' }}>
                        {displayDate}
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>
                        {session.sabha_title || 'Saturday Yuvak Sabha'}
                      </td>
                      <td>
                        <strong>{presentCount}</strong> / {total} Yuvaks
                      </td>
                      <td>
                        <span className={`badge ${pct >= 85 ? 'badge-success' : pct >= 70 ? 'badge-yuvak' : 'badge-admin'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {session.marked_by || 'Karyakar Admin'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Upcoming Sabha Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div 
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '520px',
                padding: '1.75rem',
                borderRadius: '20px',
                border: '1px solid rgba(255, 122, 24, 0.4)',
                boxShadow: '0 20px 45px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Sparkles size={22} color="#ff7a18" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Edit Upcoming Sabha Details
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Sabha Title / Heading
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      📅 Scheduled Date String
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.date_str}
                      onChange={(e) => setEditFormData({ ...editFormData, date_str: e.target.value })}
                      placeholder="e.g. Saturday, Aug 22, 2026"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      ⏰ Sabha Timing
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.timing}
                      onChange={(e) => setEditFormData({ ...editFormData, timing: e.target.value })}
                      placeholder="e.g. 8:30 PM IST"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    📍 Sabha Venue
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.venue}
                    onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
                    placeholder="e.g. Mahant Hall 1st floor"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    📝 Agenda / Description
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Target Label
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.target_attendance}
                      onChange={(e) => setEditFormData({ ...editFormData, target_attendance: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Status Badge
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.status_badge}
                      onChange={(e) => setEditFormData({ ...editFormData, status_badge: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowEditModal(false)}
                    disabled={savingSchedule}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={savingSchedule}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Save size={16} />
                    {savingSchedule ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
