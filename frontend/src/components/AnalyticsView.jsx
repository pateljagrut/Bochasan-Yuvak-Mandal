import React from 'react';
import { motion } from 'framer-motion';
import AnalyticsSection from './AnalyticsSection';

/**
 * AnalyticsView Component
 * 
 * Displays interactive mandal analytics, chart visualizations, attendance rate distributions,
 * and regional demographics.
 */
export default function AnalyticsView({ yuvaks = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="analytics-view-container"
    >
      <AnalyticsSection yuvaks={yuvaks} />
    </motion.div>
  );
}
