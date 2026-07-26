import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HelpCircle, Plus, MessageSquare, Phone, Mail, Clock, ShieldAlert, CheckCircle, AlertCircle, X, Send, User, MessageCircle } from 'lucide-react';

export const Support = () => {
  const { authFetch, user, tenant } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New Ticket Form State
  const [category, setCategory] = useState('Shop Name & Account Changes');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categoriesList = [
    { value: 'Shop Name & Account Changes', label: 'Shop Name & Account Changes (দোকানের নাম বা তথ্য পরিবর্তন)' },
    { value: 'Finance & Accounts Help', label: 'Finance & Accounts Help (ফাইন্যান্স ও ডেনাদাবি সমস্যা)' },
    { value: 'Inventory & Stock Issue', label: 'Inventory & Stock Issue (স্টক সমস্যা)' },
    { value: 'POS & Wholesale Invoice Issue', label: 'POS & Wholesale Invoice Issue (ইনভয়েস ও রসিদ সমস্যা)' },
    { value: 'Courier & Returns Issue', label: 'Courier & Returns Issue (কুরিয়ার রিটার্ন সমস্যা)' },
    { value: 'Subscription & Billing', label: 'Subscription & Billing (সাবস্ক্রিপশন ও বিলিং)' },
    { value: 'Other / General Inquiry', label: 'Other / General Inquiry (অন্যান্য)' }
  ];

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/support/tickets');
      const data = await res.json();
      if (res.ok) setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject || !message) return alert('Please enter both subject and message.');

    setSubmitting(true);
    try {
      const res = await authFetch('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ category, subject, priority, message })
      });
      const data = await res.json();

      if (res.ok) {
        setShowCreateModal(false);
        setSubject('');
        setMessage('');
        setPriority('Normal');
        fetchTickets();
        alert(`Support Ticket #${data.ticket_no} created successfully! Super Admin has been notified via email.`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTicket = async (ticketId) => {
    try {
      const res = await authFetch(`/api/support/tickets/${ticketId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(data.ticket);
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText || !selectedTicket) return;

    setSendingReply(true);
    try {
      const res = await authFetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText })
      });

      if (res.ok) {
        setReplyText('');
        handleViewTicket(selectedTicket.id);
        fetchTickets();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Support Banner & Help Center Info */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={26} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Support & Help Desk Desk Center</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Submit tickets for account modifications, shop name updates, technical issues, or general platform inquiries
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '12px 20px', fontWeight: '700' }}>
          <Plus size={18} />
          <span>+ Open Support Ticket</span>
        </button>
      </div>

      {/* Support Info Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '10px', color: '#2563eb' }}>
            <Mail size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Official Support Email</span>
            <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>support@profitway.bd</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: '#10b981' }}>
            <Phone size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Help Desk Phone</span>
            <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>+880 1700-000111</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Support Working Hours</span>
            <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>10:00 AM - 10:00 PM (Daily)</div>
          </div>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>My Support Tickets History</h3>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No support tickets submitted yet. Click "+ Open Support Ticket" if you need any assistance.
                  </td>
                </tr>
              ) : (
                tickets.map(t => {
                  const isOpen = t.status === 'Open';
                  const isResolved = t.status === 'Resolved';
                  const isClosed = t.status === 'Closed';

                  return (
                    <tr key={t.id}>
                      <td><strong style={{ color: 'var(--accent-primary)' }}>#{t.ticket_no}</strong></td>
                      <td style={{ fontSize: '13px' }}>{t.category}</td>
                      <td>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{t.subject}</strong>
                      </td>
                      <td>
                        <span className={`badge ${t.priority === 'Urgent' ? 'badge-danger' : t.priority === 'High' ? 'badge-warning' : 'badge-secondary'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isResolved ? 'badge-success' : isClosed ? 'badge-secondary' : isOpen ? 'badge-warning' : 'badge-primary'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleViewTicket(t.id)} className="btn btn-secondary btn-sm" title="View Conversation Thread">
                          <MessageSquare size={14} />
                          <span>View Thread</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Support Ticket Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Submit New Support Ticket</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '700' }}>Select Support Category *</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categoriesList.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Subject / Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Request to update Master Shop Name"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority Level</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent / Critical</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Request / Message *</label>
                  <textarea
                    className="form-input"
                    rows="5"
                    required
                    placeholder="Describe your issue or request in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details & Discussion Thread Modal */}
      {selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Ticket #{selectedTicket.ticket_no}: {selectedTicket.subject}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Category: {selectedTicket.category}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px', fontSize: '13px' }}>
                <div>Status: <span className="badge badge-warning" style={{ marginLeft: '6px' }}>{selectedTicket.status}</span></div>
                <div>Priority: <span className="badge badge-secondary" style={{ marginLeft: '6px' }}>{selectedTicket.priority}</span></div>
              </div>

              {/* Message Thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '6px' }}>
                {messages.map(m => {
                  const isSuper = m.sender_role === 'superadmin';

                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isSuper ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        background: isSuper ? 'var(--bg-secondary)' : 'rgba(37, 99, 235, 0.15)',
                        border: isSuper ? '1px solid var(--border-color)' : '1px solid var(--accent-primary)',
                        borderRadius: '12px',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '6px', fontSize: '12px' }}>
                        <strong style={{ color: isSuper ? 'var(--success)' : 'var(--accent-primary)' }}>
                          {isSuper ? '🛡️ Super Admin Support' : `👤 ${m.sender_name || 'You'}`}
                        </strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{m.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Box */}
              {selectedTicket.status !== 'Closed' && (
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type your response message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sendingReply || !replyText}>
                    <Send size={16} />
                    <span>Send</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
