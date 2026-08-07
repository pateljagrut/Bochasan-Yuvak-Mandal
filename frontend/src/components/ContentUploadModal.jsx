import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Megaphone, X, Send } from 'lucide-react';

export default function ContentUploadModal({ onClose, onPublish, publishing }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'announcement',
    author: 'Bochasan Karyakar Team'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPublish(formData);
  };

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.5rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#0f172a',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 122, 24, 0.4)',
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.9), 0 0 40px rgba(255,122,24,0.2)',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Megaphone size={22} color="#ff7a18" />
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Upload Content / Announcement</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title / Headline</label>
            <input
              type="text"
              name="title"
              className="form-control"
              placeholder="e.g. Upcoming Sunday Prerna Sabha"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select name="category" className="form-control" value={formData.category} onChange={handleChange}>
              <option value="announcement">Announcement</option>
              <option value="niyama">Niyama / Vichar of the Week</option>
              <option value="schedule">Sabha Schedule</option>
            </select>
          </div>

          <div className="form-group">
            <label>Content Description</label>
            <textarea
              name="content"
              rows="4"
              className="form-control"
              placeholder="Write the full announcement details for Yuvaks..."
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Publishing Author / Team</label>
            <input
              type="text"
              name="author"
              className="form-control"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={publishing}>
              <Send size={16} />
              {publishing ? 'Publishing...' : 'Publish Content'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
