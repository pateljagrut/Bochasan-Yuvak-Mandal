import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Premium Statistic Card with glass background, hover glow, and trend indicators.
 */
export default function StatCard({ icon: Icon, title, value, description, trend, trendType = 'up', delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="stat-card"
    >
      <div className="stat-card-header">
        <div className="stat-icon-wrapper">
          {Icon && <Icon size={22} />}
        </div>
        {trend && (
          <span className={`trend-badge ${trendType === 'up' ? 'trend-up' : 'trend-down'}`}>
            {trendType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>

      <div>
        <div className="stat-number">{value}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          {title}
        </div>
        <div className="stat-desc">{description}</div>
      </div>
    </motion.div>
  );
}
