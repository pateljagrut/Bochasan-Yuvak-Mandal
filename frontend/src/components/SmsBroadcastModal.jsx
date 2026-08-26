import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Check, 
  Clock, 
  Smartphone, 
  Sparkles, 
  X, 
  AlertCircle, 
  Search, 
  History, 
  CheckCircle2, 
  Layers,
  ChevronRight,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendSmsBroadcastApi, getSmsHistoryApi, getSmsTemplatesApi } from '../services/api';

/**
 * Admin-Only SMS Broadcast Center Modal.
 * Allows Karyakars to broadcast Sabha reminders, Utsav invitations, and custom alerts.
 */
export default function SmsBroadcastModal({ 
  isOpen, 
  onClose, 
  yuvaks = [], 
  preselectedYuvak = null,
  onNotify = () => {} 
}) {
  const { token, user, role } = useAuth();

  // Guard: Only Karyakar Admins can use SMS Broadcast
  if (role !== 'admin') return null;

  const [activeSubTab, setActiveSubTab] = useState('compose'); // 'compose' | 'history'
  const [recipientMode, setRecipientMode] = useState('all'); // 'all' | 'selected' | 'custom'
  const [selectedYuvakIds, setSelectedYuvakIds] = useState([]);
  const [customNumbersInput, setCustomNumbersInput] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('sabha_reminder');
  const [templates, setTemplates] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [sendResult, setSendResult] = useState(null);

  // If a preselected yuvak is passed (e.g. from member directory), configure selection
  useEffect(() => {
    if (preselectedYuvak && preselectedYuvak.yuvak_id) {
      setRecipientMode('selected');
      setSelectedYuvakIds([preselectedYuvak.yuvak_id]);
      setMessage(`Jai Swaminarayan ${preselectedYuvak.full_name || 'Brother'}! 🙏 Reminding you to join this Saturday's Yuvak Sabha at 8:30 PM at Bochasan Mandir.`);
    }
  }, [preselectedYuvak]);

  // Load templates on modal open
  useEffect(() => {
    if (!isOpen || !token) return;

    getSmsTemplatesApi(token)
      .then(res => {
        if (res?.templates) {
          setTemplates(res.templates);
          // Set default template message if empty and not preselected
          if (!message && !preselectedYuvak && res.templates.length > 0) {
            setMessage(res.templates[0].text);
            setSelectedTemplate(res.templates[0].id);
          }
        }
      })
      .catch(() => {});

    loadHistory();
  }, [isOpen, token]);

  const loadHistory = () => {
    if (!token) return;
    setLoadingHistory(true);
    getSmsHistoryApi(token)
      .then(res => {
        if (res?.logs) setHistoryLogs(res.logs);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle template selection
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl.id);
    setMessage(tpl.text);
  };

  // Toggle member selection
  const toggleMemberSelection = (yuvakId) => {
    setSelectedYuvakIds(prev => 
      prev.includes(yuvakId) 
        ? prev.filter(id => id !== yuvakId) 
        : [...prev, yuvakId]
    );
  };

  // Select / Deselect all filtered members
  const toggleSelectAllFiltered = (filteredList) => {
    const ids = filteredList.map(y => y.yuvak_id);
    const allSelected = ids.every(id => selectedYuvakIds.includes(id));
    if (allSelected) {
      setSelectedYuvakIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedYuvakIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  // Calculate character & segment count
  const charCount = message.length;
  const isUnicode = anyUnicode(message);
  const maxSingle = isUnicode ? 70 : 160;
  const segments = isUnicode 
    ? (charCount <= 70 ? 1 : Math.ceil(charCount / 67))
    : (charCount <= 160 ? 1 : Math.ceil(charCount / 153));

  function anyUnicode(str) {
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 127) return true;
    }
    return false;
  }

  // Active yuvak list
  const activeYuvaks = yuvaks.filter(y => y.status !== 'inactive' && y.mobile_no);
  const filteredYuvaks = activeYuvaks.filter(y => {
    const q = memberSearch.toLowerCase();
    return (
      (y.full_name || '').toLowerCase().includes(q) ||
      (y.yuvak_id || '').toLowerCase().includes(q) ||
      (y.mobile_no || '').includes(q)
    );
  });

  // Calculate target recipient count
  let targetCount = 0;
  if (recipientMode === 'all') {
    targetCount = activeYuvaks.length;
  } else if (recipientMode === 'selected') {
    targetCount = selectedYuvakIds.length;
  } else {
    targetCount = customNumbersInput.split(/[\n,;]+/).filter(n => n.trim().length >= 10).length;
  }

  // Handle Send Broadcast
  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      onNotify('⚠️ Please enter an SMS message body.', 'error');
      return;
    }

    if (recipientMode === 'selected' && selectedYuvakIds.length === 0) {
      onNotify('⚠️ Please select at least one member recipient.', 'error');
      return;
    }

    if (recipientMode === 'custom' && targetCount === 0) {
      onNotify('⚠️ Please enter at least one valid 10-digit mobile number.', 'error');
      return;
    }

    setSending(true);
    setSendResult(null);

    const payload = {
      message: message.trim(),
      recipient_mode: recipientMode,
      template_type: selectedTemplate,
      yuvak_ids: recipientMode === 'selected' ? selectedYuvakIds : [],
      custom_numbers: recipientMode === 'custom' 
        ? customNumbersInput.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
        : []
    };

    try {
      const res = await sendSmsBroadcastApi(payload, token);
      if (res?.success) {
        setSendResult(res);
        onNotify(`✅ SMS broadcast sent to ${res.recipient_count} recipients!`, 'success');
        loadHistory();
      } else {
        onNotify(`❌ Failed: ${res?.message || 'Error'}`, 'error');
      }
    } catch (err) {
      onNotify(`❌ Error sending SMS: ${err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2 }}
          className="sms-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sms-modal-header">
            <div className="sms-header-left">
              <div className="sms-header-icon-box">
                <MessageSquare size={22} color="#ff7a18" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="sms-modal-title">SMS Broadcast Center</h2>
                  <span className="badge badge-admin text-xs">Admin Only</span>
                </div>
                <p className="sms-modal-subtitle">
                  Send instant Sabha reminders, Utsav invites & spiritual updates via SMS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Toggle: Compose vs History */}
              <div className="sms-tab-pill-group">
                <button
                  className={`sms-tab-pill ${activeSubTab === 'compose' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('compose')}
                >
                  <Send size={14} />
                  <span>Compose</span>
                </button>
                <button
                  className={`sms-tab-pill ${activeSubTab === 'history' ? 'active' : ''}`}
                  onClick={() => { setActiveSubTab('history'); loadHistory(); }}
                >
                  <History size={14} />
                  <span>History</span>
                </button>
              </div>

              <button 
                onClick={onClose} 
                className="navbar-icon-btn close-modal-btn"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="sms-modal-body">
            {activeSubTab === 'compose' ? (
              <div className="sms-compose-grid">
                
                {/* Left Form Area */}
                <div className="sms-form-col">
                  
                  {/* Step 1: Recipient Selection */}
                  <div className="sms-section-box">
                    <label className="sms-field-label">
                      <Users size={15} color="#ff7a18" />
                      <span>1. Select Recipients</span>
                    </label>

                    <div className="sms-recipient-type-grid">
                      <button
                        type="button"
                        className={`sms-recipient-type-btn ${recipientMode === 'all' ? 'active' : ''}`}
                        onClick={() => setRecipientMode('all')}
                      >
                        <div className="recipient-btn-title">All Active Members</div>
                        <div className="recipient-btn-sub">{activeYuvaks.length} registered Yuvaks</div>
                      </button>

                      <button
                        type="button"
                        className={`sms-recipient-type-btn ${recipientMode === 'selected' ? 'active' : ''}`}
                        onClick={() => setRecipientMode('selected')}
                      >
                        <div className="recipient-btn-title">Specific Members</div>
                        <div className="recipient-btn-sub">
                          {selectedYuvakIds.length > 0 ? `${selectedYuvakIds.length} chosen` : 'Pick from list'}
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`sms-recipient-type-btn ${recipientMode === 'custom' ? 'active' : ''}`}
                        onClick={() => setRecipientMode('custom')}
                      >
                        <div className="recipient-btn-title">Custom Numbers</div>
                        <div className="recipient-btn-sub">Manual phone numbers</div>
                      </button>
                    </div>

                    {/* Conditional: Member Picker */}
                    {recipientMode === 'selected' && (
                      <div className="sms-member-picker-box">
                        <div className="sms-picker-search-row">
                          <div className="sms-picker-search-wrap">
                            <Search size={14} />
                            <input
                              type="text"
                              placeholder="Search member by name, ID or mobile..."
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              className="sms-picker-search-input"
                            />
                          </div>
                          <button
                            type="button"
                            className="sms-select-all-btn"
                            onClick={() => toggleSelectAllFiltered(filteredYuvaks)}
                          >
                            {filteredYuvaks.every(y => selectedYuvakIds.includes(y.yuvak_id))
                              ? 'Deselect All'
                              : 'Select All Filtered'}
                          </button>
                        </div>

                        <div className="sms-member-checkbox-list">
                          {filteredYuvaks.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted">No members match search.</div>
                          ) : (
                            filteredYuvaks.map(y => {
                              const isChecked = selectedYuvakIds.includes(y.yuvak_id);
                              return (
                                <div
                                  key={y.yuvak_id}
                                  className={`sms-member-item ${isChecked ? 'selected' : ''}`}
                                  onClick={() => toggleMemberSelection(y.yuvak_id)}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => {}} // handled by parent onClick
                                  />
                                  <div className="sms-member-info">
                                    <span className="sms-member-name">{y.full_name}</span>
                                    <span className="sms-member-meta">{y.yuvak_id} • {y.mobile_no}</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Conditional: Custom Numbers Input */}
                    {recipientMode === 'custom' && (
                      <div className="mt-3">
                        <textarea
                          rows={2}
                          className="sms-textarea-input font-mono text-xs"
                          placeholder="Enter 10-digit mobile numbers separated by commas or new lines (e.g. 9876543210, 9898989898)..."
                          value={customNumbersInput}
                          onChange={(e) => setCustomNumbersInput(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Step 2: Quick Templates */}
                  <div className="sms-section-box">
                    <label className="sms-field-label">
                      <Sparkles size={15} color="#ff7a18" />
                      <span>2. Choose BAPS Template (Optional)</span>
                    </label>

                    <div className="sms-template-pills">
                      {templates.map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          className={`sms-template-chip ${selectedTemplate === tpl.id ? 'active' : ''}`}
                          onClick={() => handleSelectTemplate(tpl)}
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Message Compose */}
                  <div className="sms-section-box">
                    <div className="flex items-center justify-between mb-2">
                      <label className="sms-field-label m-0">
                        <MessageSquare size={15} color="#ff7a18" />
                        <span>3. SMS Message Text</span>
                      </label>

                      {/* Character & Segment Counter Badge */}
                      <div className="sms-char-counter">
                        <span className={charCount > maxSingle ? 'text-amber-400 font-bold' : ''}>
                          {charCount} chars
                        </span>
                        <span>•</span>
                        <span className="sms-segment-pill">
                          {segments} SMS {segments > 1 ? 'Parts' : 'Part'}
                        </span>
                        {isUnicode && <span className="sms-unicode-pill">Unicode</span>}
                      </div>
                    </div>

                    <textarea
                      rows={4}
                      className="sms-textarea-input"
                      placeholder="Type your SMS message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  {/* Result Banner if Sent */}
                  {sendResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="sms-result-banner"
                    >
                      <CheckCircle2 size={20} color="#4ade80" />
                      <div className="text-xs">
                        <strong>Broadcast Dispatched!</strong> {sendResult.message}
                        <div className="text-muted mt-0.5">
                          Provider: <span className="text-amber-400">{sendResult.provider}</span> • {sendResult.segments} SMS parts
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Action Button */}
                  <div className="sms-submit-row">
                    <div className="sms-summary-info">
                      <span>Targeting <strong>{targetCount}</strong> recipients</span>
                      <span>Estimated {targetCount * segments} total SMS</span>
                    </div>

                    <button
                      type="button"
                      disabled={sending || targetCount === 0 || !message.trim()}
                      onClick={handleSendBroadcast}
                      className="sms-send-btn"
                    >
                      {sending ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Dispatching SMS...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Send Broadcast ({targetCount})</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* Right Column: Live Mobile Preview Frame */}
                <div className="sms-preview-col">
                  <div className="sms-phone-mockup">
                    <div className="phone-notch">
                      <div className="phone-speaker" />
                    </div>

                    {/* Phone Screen */}
                    <div className="phone-screen">
                      <div className="phone-top-bar">
                        <span className="phone-time">8:30 PM</span>
                        <div className="phone-signal-icons">
                          <span>5G</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="phone-chat-header">
                        <div className="phone-sender-avatar">BAPS</div>
                        <div className="phone-sender-name">Bochasan Mandal</div>
                        <span className="phone-sender-tag">Verified SMS</span>
                      </div>

                      <div className="phone-messages-body">
                        <div className="phone-date-divider">Today</div>
                        
                        <motion.div 
                          key={message}
                          initial={{ opacity: 0.8, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="phone-sms-bubble"
                        >
                          <p className="phone-bubble-text">
                            {message || 'Type an SMS in the composer to preview it on this phone screen...'}
                          </p>
                          <div className="phone-bubble-time">
                            Just now • SMS
                          </div>
                        </motion.div>
                      </div>

                      <div className="phone-footer-hint">
                        <span>📲 Real-time Live Preview</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* History SubTab */
              <div className="sms-history-container">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary">Previous SMS Broadcast Logs</h3>
                  <button 
                    onClick={loadHistory} 
                    className="notif-action-btn flex items-center gap-1 text-xs"
                    disabled={loadingHistory}
                  >
                    <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
                    <span>Refresh Logs</span>
                  </button>
                </div>

                {historyLogs.length === 0 ? (
                  <div className="sms-history-empty">
                    <History size={36} color="var(--text-secondary)" />
                    <p className="font-semibold text-sm mt-2">No SMS Broadcasts Sent Yet</p>
                    <p className="text-xs text-muted">Past SMS broadcasts, delivery receipts, and reports will show here.</p>
                  </div>
                ) : (
                  <div className="sms-history-list">
                    {historyLogs.map(log => (
                      <div key={log.id} className="sms-history-card">
                        <div className="sms-history-card-header">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-admin">{log.template_type?.toUpperCase() || 'SMS'}</span>
                            <span className="font-semibold text-xs text-primary">
                              Sent to {log.recipient_count} Members
                            </span>
                          </div>
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Clock size={11} /> {log.sent_at}
                          </span>
                        </div>

                        <p className="sms-history-message-preview">{log.message}</p>

                        <div className="sms-history-card-footer">
                          <span className="text-xs text-muted">By: <strong>{log.sent_by}</strong></span>
                          <span className="sms-provider-tag">{log.provider}</span>
                          <span className="sms-status-pill">{log.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
