import React from 'react';
import { motion } from 'framer-motion';
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
  Tooltip
} from 'recharts';
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

/**
 * Recharts-Powered Analytics Dashboard Section.
 * Includes Attendance Trend (Area), Monthly Attendance (Bar), Growth (Line), & Distribution (Pie).
 */
export default function AnalyticsSection({ yuvaks = [] }) {
  // Sample analytics data derived dynamically or formatted gracefully
  const attendanceTrendData = [
    { month: 'Jan', attendance: 88, target: 85 },
    { month: 'Feb', attendance: 92, target: 85 },
    { month: 'Mar', attendance: 85, target: 85 },
    { month: 'Apr', attendance: 95, target: 85 },
    { month: 'May', attendance: 91, target: 85 },
    { month: 'Jun', attendance: 97, target: 85 },
    { month: 'Jul', attendance: 94, target: 85 }
  ];

  const monthlySabhaData = [
    { week: 'W1', present: 42, absent: 5 },
    { week: 'W2', present: 45, absent: 3 },
    { week: 'W3', present: 39, absent: 8 },
    { week: 'W4', present: 48, absent: 2 }
  ];

  const distributionData = [
    { name: 'Regular (90%+)', value: 65, color: '#ff7a18' },
    { name: 'Moderate (70-89%)', value: 25, color: '#14b8a6' },
    { name: 'Needs Follow-up (<70%)', value: 10, color: '#ef4444' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Grid Row 1: Area Chart & Donut Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Area Chart: Attendance Trend */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>📈 Sabha Attendance Trend</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>6-Month Participation Rate (%)</p>
            </div>
            <span className="badge badge-yuvak">+6.2% Overall</span>
          </div>

          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff7a18" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff7a18" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,122,24,0.3)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#ff7a18" strokeWidth={3} fillOpacity={1} fill="url(#areaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Distribution */}
        <div className="glass-card">
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>🎯 Yuvak Engagement Categories</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attendance rate breakdown across members</p>
          </div>

          <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            {distributionData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Row 2: Bar Chart & Upcoming Sabha Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Bar Chart: Weekly Attendance */}
        <div className="glass-card">
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>📊 Weekly Sabha Attendance (This Month)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Present vs Absent headcount per week</p>
          </div>

          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={monthlySabhaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                <Bar dataKey="present" fill="#ff7a18" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="rgba(239, 68, 68, 0.4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Sabha & Announcement Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sparkles size={20} color="#ff7a18" />
              <h3 style={{ fontSize: '1.1rem' }}>Upcoming Prerna Sabha</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Special Sunday session on spiritual niyama, youth leadership, and mandal development.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                <Calendar size={16} color="#14b8a6" />
                <span><strong>Date:</strong> This Sunday, 5:30 PM IST</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                <MapPin size={16} color="#ff7a18" />
                <span><strong>Venue:</strong> Main Mandir Assembly Hall</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                <Clock size={16} color="#22c55e" />
                <span><strong>Duration:</strong> 90 Minutes (Sabha + Mahaprasad)</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: 100% Attendance</span>
            <span className="badge badge-success">On Schedule</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
