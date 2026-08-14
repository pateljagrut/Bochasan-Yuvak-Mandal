import React from 'react';
import { motion } from 'framer-motion';
import AttendanceGrid from './AttendanceGrid';

/**
 * AttendanceManager Component
 * 
 * Manages Sabha attendance view, rendering the primary AttendanceGrid component
 * for checking off Yuvak members present during Shanivariya Sabha sessions.
 */
export default function AttendanceManager({ yuvaks = [], onSaveAttendance, saving = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="attendance-manager-container"
    >
      <AttendanceGrid
        yuvaks={yuvaks}
        onSaveAttendance={onSaveAttendance}
        saving={saving}
      />
    </motion.div>
  );
}
