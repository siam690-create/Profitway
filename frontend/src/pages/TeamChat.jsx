import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Send, RefreshCw, Users, Shield, User } from 'lucide-react';

export default function TeamChat() {
  const { authFetch, user } = useApp();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Polling team chat every 5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await authFetch('/api/staff/team-messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await authFetch('/api/staff/team-messages', {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'var(--accent-primary)', borderRadius: '12px', color: '#fff' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Internal Staff Team Chat</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Real-time collaboration channel for all active employees & management
            </div>
          </div>
        </div>

        <button onClick={fetchMessages} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} />
          <span>Refresh Messages</span>
        </button>
      </div>

      {/* Main Chat Stream & Input Area */}
      <div className="glass-card" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '8px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '13px' }}>
              No messages recorded yet. Type a message below to start chatting with your colleagues! 💬
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.user_id === user?.id || msg.sender_name === user?.name;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: isMe ? 'var(--accent-primary)' : 'inherit' }}>{msg.sender_name}</span>
                    <span className="badge badge-secondary" style={{ fontSize: '9px', textTransform: 'capitalize' }}>{msg.sender_role || 'Staff'}</span>
                    <span>• {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div style={{
                    background: isMe ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: isMe ? '#fff' : 'inherit',
                    padding: '12px 16px',
                    borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    maxWidth: '70%',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                  }}>
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginTop: '12px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Type your message to the team..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '14px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: '700' }}>
            <Send size={18} />
            <span>Send Message</span>
          </button>
        </form>
      </div>
    </div>
  );
}
