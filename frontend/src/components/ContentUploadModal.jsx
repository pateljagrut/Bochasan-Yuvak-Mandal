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
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="modal-container"
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-modal)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 122, 24, 0.4)',
          boxShadow: 'var(--shadow-card)',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Megaphone size={22} color="#ff7a18" />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Upload Content / Announcement</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="upload-content-title">Title / Headline</label>
            <input
              id="upload-content-title"
              type="text"
              name="title"
              className="form-control"
              placeholder="e.g. Upcoming Saturday Prerna Sabha"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="upload-content-category">Category</label>
            <select 
              id="upload-content-category"
              name="category" 
              className="form-control" 
              value={formData.category} 
              onChange={handleChange}
            >
              <option value="announcement">Announcement</option>
              <option value="niyama">Niyama / Vichar of the Week</option>
              <option value="schedule">Sabha Schedule</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="upload-content-body">Content Description</label>
            <textarea
              id="upload-content-body"
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
            <label htmlFor="upload-content-author">Publishing Author / Team</label>
            <input
              id="upload-content-author"
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
