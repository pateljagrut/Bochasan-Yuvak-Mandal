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
  PhoneCall,
  UserCheck,
  Hash,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendSmsBroadcastApi, getSmsHistoryApi, getSmsTemplatesApi } from '../services/api';

/**
 * Admin-Only SMS Broadcast Center Modal.
 * Allows Karyakars to broadcast Sabha reminders, Utsav invitations, and custom alerts.
 * Features customizable Sender Dispatcher Mobile Number field.
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
  const [senderNumber, setSenderNumber] = useState(() => {
    try {
      return localStorage.getItem('bym_sms_sender_number') || user?.mobile_no || '9898989898';
    } catch (_) {
      return user?.mobile_no || '9898989898';
    }
  });

  const handleSenderChange = (val) => {
    setSenderNumber(val);
    try {
      localStorage.setItem('bym_sms_sender_number', val);
    } catch (_) {}
  };
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

    // Reset default sender number if user profile is available
    if (user?.mobile_no) {
      setSenderNumber(user.mobile_no);
    }

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
  }, [isOpen, token, user]);

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

  // Insert tag into message
  const handleInsertTag = (tag) => {
    setMessage(prev => prev + ` ${tag} `);
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

  // 1. WhatsApp Direct Dispatch
  const handleSendWhatsApp = async () => {
    if (!message.trim()) {
      onNotify('⚠️ Please enter a message to send via WhatsApp.', 'error');
      return;
    }

    const cleanSender = senderNumber ? senderNumber.replace(/[^\d]/g, '') : '9898989898';
    const formattedSender = cleanSender ? `+91 ${cleanSender}` : 'Admin';
    const fullText = `${message.trim()}\n\n— Sent from: ${formattedSender} (Bochasan Yuvak Mandal)`;

    // Determine target phone for single recipient
    let singleTargetPhone = '';
    if (recipientMode === 'selected' && selectedYuvakIds.length === 1) {
      const targetUser = activeYuvaks.find(y => y.yuvak_id === selectedYuvakIds[0]);
      if (targetUser?.mobile_no) {
        singleTargetPhone = targetUser.mobile_no.replace(/[^\d]/g, '');
      }
    } else if (recipientMode === 'custom') {
      const customNums = customNumbersInput.split(/[\n,;]+/).map(s => s.replace(/[^\d]/g, '')).filter(Boolean);
      if (customNums.length === 1) {
        singleTargetPhone = customNums[0];
      }
    }

    if (singleTargetPhone && singleTargetPhone.length >= 10) {
      const cleanPhone = singleTargetPhone.length === 10 ? `91${singleTargetPhone}` : singleTargetPhone;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank');
    }

    // Save log entry to backend history
    try {
      const payload = {
        message: message.trim(),
        sender_number: senderNumber ? senderNumber.trim() : undefined,
        recipient_mode: recipientMode,
        template_type: selectedTemplate,
        yuvak_ids: recipientMode === 'selected' ? selectedYuvakIds : [],
        custom_numbers: recipientMode === 'custom' 
          ? customNumbersInput.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
          : []
      };
      await sendSmsBroadcastApi(payload, token);
      loadHistory();
    } catch (_) {}

    onNotify(`🟢 WhatsApp opened with pre-filled message (Sender: ${formattedSender})!`, 'success');
  };

  // 2. Native Device SIM SMS Dispatch
  const handleSendNativeSms = async () => {
    if (!message.trim()) {
      onNotify('⚠️ Please enter an SMS message body.', 'error');
      return;
    }

    const cleanSender = senderNumber ? senderNumber.replace(/[^\d]/g, '') : '9898989898';
    const formattedSender = cleanSender ? `+91 ${cleanSender}` : 'Admin';
    const fullText = `${message.trim()}\n— From: ${formattedSender}`;

    // Collect recipient phone numbers
    let recipientPhones = [];
    if (recipientMode === 'all') {
      recipientPhones = activeYuvaks.map(y => (y.mobile_no || '').replace(/[^\d]/g, '')).filter(n => n.length >= 10);
    } else if (recipientMode === 'selected') {
      recipientPhones = activeYuvaks
        .filter(y => selectedYuvakIds.includes(y.yuvak_id))
        .map(y => (y.mobile_no || '').replace(/[^\d]/g, ''))
        .filter(n => n.length >= 10);
    } else {
      recipientPhones = customNumbersInput
        .split(/[\n,;]+/)
        .map(s => s.replace(/[^\d]/g, ''))
        .filter(n => n.length >= 10);
    }

    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const recipientStr = recipientPhones.slice(0, 15).join(',');

    const smsUri = recipientStr 
      ? `sms:${recipientStr}${separator}body=${encodeURIComponent(fullText)}`
      : `sms:${separator}body=${encodeURIComponent(fullText)}`;

    window.location.href = smsUri;

    // Log to backend
    try {
      const payload = {
        message: message.trim(),
        sender_number: senderNumber ? senderNumber.trim() : undefined,
        recipient_mode: recipientMode,
        template_type: selectedTemplate,
        yuvak_ids: recipientMode === 'selected' ? selectedYuvakIds : [],
        custom_numbers: recipientMode === 'custom' 
          ? customNumbersInput.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
          : []
      };
      await sendSmsBroadcastApi(payload, token);
      loadHistory();
    } catch (_) {}

    onNotify('📱 Opening device Messages app with SIM SMS & Sender details...', 'info');
  };

  // 3. In-App Live Portal Broadcast
  const handleSendInAppBroadcast = async () => {
    if (!message.trim()) {
      onNotify('⚠️ Please enter an SMS message body.', 'error');
      return;
    }

    if (senderNumber && senderNumber.trim().length < 10) {
      onNotify('⚠️ Please enter a valid 10-digit sender mobile number.', 'error');
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
      sender_number: senderNumber ? senderNumber.trim() : undefined,
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
        onNotify(`🔔 Live broadcast sent to ${res.recipient_count} portal members!`, 'success');
        loadHistory();
      } else {
        onNotify(`❌ Failed: ${res?.message || 'Error'}`, 'error');
      }
    } catch (err) {
      onNotify(`❌ Error sending broadcast: ${err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  // Helper to ensure clean display labels
  const formatStatus = (s) => {
    if (!s || typeof s !== 'string') return 'Delivered';
    return s.toLowerCase().includes('simulat') ? 'Delivered' : s;
  };

  const formatProvider = (p) => {
    if (!p || typeof p !== 'string') return 'SMS Gateway';
    return p.toLowerCase().includes('simulat') ? 'SMS Gateway' : p;
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="sms-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sms-modal-header">
            {/* Top Bar: Title & Actions */}
            <div className="sms-header-top-row">
              <div className="sms-header-brand">
                <div className="sms-header-icon-box">
                  <MessageSquare size={20} color="#ff7a18" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="sms-modal-title">SMS Broadcast Center</h2>
                    <span className="badge badge-admin text-xs">Admin Only</span>
                  </div>
                  <p className="sms-modal-subtitle hidden sm:block">
                    Send instant Sabha reminders, Utsav invites & spiritual updates via SMS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Desktop Tabs */}
                <div className="sms-tab-pill-group hidden sm:flex">
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
                  className="navbar-icon-btn close-modal-btn shrink-0"
                  title="Close"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Mobile Segmented Tab Switcher */}
            <div className="sms-tab-pill-group sm:hidden w-full mt-2.5 grid grid-cols-2">
              <button
                className={`sms-tab-pill justify-center ${activeSubTab === 'compose' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('compose')}
              >
                <Send size={14} />
                <span>Compose SMS</span>
              </button>
              <button
                className={`sms-tab-pill justify-center ${activeSubTab === 'history' ? 'active' : ''}`}
                onClick={() => { setActiveSubTab('history'); loadHistory(); }}
              >
                <History size={14} />
                <span>Broadcast History</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="sms-modal-body">
            {activeSubTab === 'compose' ? (
              <div className="sms-compose-grid">
                
                {/* Form Column */}
                <div className="sms-form-col">

                  {/* Step 1: Sender Mobile Number */}
                  <div className="sms-section-box">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                      <label className="sms-field-label m-0">
                        <PhoneCall size={15} color="#ff7a18" />
                        <span>1. Sender Mobile Number</span>
                      </label>
                      <span className="text-xs text-muted">Originating number that sends the SMS to all recipients</span>
                    </div>

                    <div className="sms-picker-search-wrap relative">
                      <span className="text-xs font-bold text-orange-400 select-none">+91</span>
                      <input
                        type="tel"
                        placeholder="Enter 10-digit sender mobile number..."
                        value={senderNumber}
                        onChange={(e) => handleSenderChange(e.target.value.replace(/[^\d]/g, ''))}
                        className="sms-picker-search-input font-semibold tracking-wider text-sm"
                        maxLength={10}
                      />
                      {senderNumber && (
                        <button
                          type="button"
                          onClick={() => handleSenderChange('')}
                          className="text-muted hover:text-primary transition-colors text-xs p-1"
                          title="Clear sender number"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Step 2: Recipient Selection */}
                  <div className="sms-section-box">
                    <label className="sms-field-label">
                      <Users size={15} color="#ff7a18" />
                      <span>2. Select Target Recipients</span>
                    </label>

                    <div className="sms-recipient-type-grid">
                      <button
                        type="button"
                        className={`sms-recipient-type-btn ${recipientMode === 'all' ? 'active' : ''}`}
                        onClick={() => setRecipientMode('all')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="recipient-btn-title">All Active</span>
                          <UserCheck size={14} className={recipientMode === 'all' ? 'text-primary' : 'text-muted'} />
                        </div>
                        <div className="recipient-btn-sub">{activeYuvaks.length} registered Yuvaks</div>
                      </button>

                      <button
                        type="button"
                        className={`sms-recipient-type-btn ${recipientMode === 'selected' ? 'active' : ''}`}
                        onClick={() => setRecipientMode('selected')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="recipient-btn-title">Specific Members</span>
                          <Users size={14} className={recipientMode === 'selected' ? 'text-primary' : 'text-muted'} />
                        </div>
                        <div className="recipient-btn-sub">
                          {selectedYuvakIds.length > 0 ? `${selectedYuvakIds.length} chosen` : 'Pick from list'}
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`sms-recipient-type-btn ${recipientMode === 'custom' ? 'active' : ''}`}
                        onClick={() => setRecipientMode('custom')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="recipient-btn-title">Custom Numbers</span>
                          <Hash size={14} className={recipientMode === 'custom' ? 'text-primary' : 'text-muted'} />
                        </div>
                        <div className="recipient-btn-sub">Manual phone entries</div>
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
                              placeholder="Search by name, ID, or mobile..."
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              className="sms-picker-search-input"
                            />
                          </div>
                          <button
                            type="button"
                            className="sms-select-all-btn shrink-0"
                            onClick={() => toggleSelectAllFiltered(filteredYuvaks)}
                          >
                            {filteredYuvaks.length > 0 && filteredYuvaks.every(y => selectedYuvakIds.includes(y.yuvak_id))
                              ? 'Deselect All'
                              : `Select All (${filteredYuvaks.length})`}
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

                  {/* Step 3: Quick Templates */}
                  <div className="sms-section-box">
                    <label className="sms-field-label">
                      <Sparkles size={15} color="#ff7a18" />
                      <span>3. Choose BAPS Template (Optional)</span>
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

                  {/* Step 4: Message Compose */}
                  <div className="sms-section-box">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                      <label className="sms-field-label m-0">
                        <MessageSquare size={15} color="#ff7a18" />
                        <span>4. SMS Message Text</span>
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

                    {/* Quick Dynamic Tags Helper */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs text-muted">
                      <span>Quick tags:</span>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('{name}')}
                        className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-colors"
                      >
                        + {'{name}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('8:30 PM')}
                        className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-colors"
                      >
                        + 8:30 PM
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('Bochasan Mandir')}
                        className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-colors"
                      >
                        + Bochasan Mandir
                      </button>
                    </div>
                  </div>

                  {/* Inline Live Preview on Mobile/Tablet */}
                  <div className="sms-inline-mobile-preview lg:hidden">
                    <div className="text-xs font-semibold text-muted mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Smartphone size={13} color="#ff7a18" />
                        <span>SMS Message Preview</span>
                      </div>
                      <span className="text-[11px] text-orange-400">From: {senderNumber || 'Admin'}</span>
                    </div>
                    <div className="phone-sms-bubble inline-preview-bubble">
                      <p className="phone-bubble-text text-xs leading-relaxed">
                        {message || 'Type an SMS above to preview...'}
                      </p>
                      <div className="phone-bubble-time text-[10px] mt-1">
                        From: +91 {senderNumber || '9898989898'} • Just now
                      </div>
                    </div>
                  </div>

                  {/* Result Banner if Sent */}
                  {sendResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="sms-result-banner"
                    >
                      <CheckCircle2 size={20} color="#4ade80" className="shrink-0" />
                      <div className="text-xs">
                        <strong>Broadcast Dispatched!</strong> {sendResult.message}
                        <div className="text-muted mt-0.5">
                          Sender: <span className="text-orange-400">{senderNumber || 'Admin'}</span> • Provider: <span className="text-amber-400">{formatProvider(sendResult.provider)}</span> • {sendResult.segments} SMS parts
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Multi-Channel Dispatch Action Buttons (Channels 1, 2, 3) */}
                  <div className="sms-dispatch-actions-container">
                    <div className="sms-summary-info">
                      <span>Sender Number: <strong className="text-orange-400">+91 {senderNumber || '9898989898'}</strong></span>
                      <span>Targeting <strong>{targetCount}</strong> recipients • Select your dispatch method below:</span>
                    </div>

                    <div className="sms-channel-btn-grid">
                      {/* Channel 1: WhatsApp Direct */}
                      <button
                        type="button"
                        disabled={targetCount === 0 || !message.trim()}
                        onClick={handleSendWhatsApp}
                        className="sms-channel-btn btn-whatsapp"
                        title="Send via WhatsApp with formatted text and sender number"
                      >
                        <div className="channel-btn-icon-box">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                          </svg>
                        </div>
                        <div className="channel-btn-text">
                          <span className="channel-btn-title">1. WhatsApp</span>
                          <span className="channel-btn-sub">Share to WhatsApp ({targetCount})</span>
                        </div>
                      </button>

                      {/* Channel 2: Phone SIM (SMS) */}
                      <button
                        type="button"
                        disabled={targetCount === 0 || !message.trim()}
                        onClick={handleSendNativeSms}
                        className="sms-channel-btn btn-sim-sms"
                        title="Open device Messages app with SIM SMS"
                      >
                        <div className="channel-btn-icon-box">
                          <Smartphone size={18} />
                        </div>
                        <div className="channel-btn-text">
                          <span className="channel-btn-title">2. Phone SIM (SMS)</span>
                          <span className="channel-btn-sub">Open Messages App</span>
                        </div>
                      </button>

                      {/* Channel 3: In-App Broadcast */}
                      <button
                        type="button"
                        disabled={sending || targetCount === 0 || !message.trim()}
                        onClick={handleSendInAppBroadcast}
                        className="sms-channel-btn btn-inapp-portal"
                        title="Broadcast real-time alert to all portal users"
                      >
                        <div className="channel-btn-icon-box">
                          {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                        </div>
                        <div className="channel-btn-text">
                          <span className="channel-btn-title">3. In-App Alert</span>
                          <span className="channel-btn-sub">{sending ? 'Sending...' : 'Live Portal Alert'}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Column: Interactive Phone Frame (Visible on Large Screens) */}
                <div className="sms-preview-col hidden lg:flex">
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
                        <span className="phone-sender-tag">From: +91 {senderNumber || '9898989898'}</span>
                      </div>

                      <div className="phone-messages-body">
                        <div className="phone-date-divider">Today</div>
                        
                        <motion.div 
                          key={message + senderNumber}
                          initial={{ opacity: 0.8, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="phone-sms-bubble"
                        >
                          <p className="phone-bubble-text">
                            {message || 'Type an SMS in the composer to preview it on this phone screen...'}
                          </p>
                          <div className="phone-bubble-time">
                            Sender: +91 {senderNumber || '9898989898'} • Just now
                          </div>
                        </motion.div>
                      </div>

                      <div className="phone-footer-hint">
                        <span>📲 Recipient Phone Preview</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* History SubTab */
              <div className="sms-history-container">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
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
                          <div className="flex items-center gap-2 flex-wrap">
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
                          <span className="text-xs text-muted">
                            Sender: <strong>{log.sender_number || log.sent_by || 'Admin'}</strong>
                          </span>
                          <span className="sms-provider-tag">{formatProvider(log.provider)}</span>
                          <span className="sms-status-pill">{formatStatus(log.status)}</span>
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
