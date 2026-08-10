import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock, CheckCircle, AlertCircle, LogOut, MessageSquare, Send,
  Briefcase, Calendar, CheckSquare, User, Shield, RefreshCw, Zap
} from 'lucide-react';

export default function StaffPortal() {
  const { authFetch, user } = useApp();
  const [activePortalTab, setActivePortalTab] = useState('punch');

  // Clock & Punch Status State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [punchStatus, setPunchStatus] = useState(null);
  const [loadingPunch, setLoadingPunch] = useState(false);

  // My Tasks State
  const [myTasks, setMyTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Team Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Real-time clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchMyStatus();
    fetchMyTasks();
    fetchTeamMessages();
  }, []);

  const fetchMyStatus = async () => {
    try {
      const res = await authFetch('/api/staff/attendance/my-status');
      if (res.ok) {
        const data = await res.json();
        setPunchStatus(data);
      }
    } catch (err) {
      console.error('Error fetching punch status:', err);
    }
  };

  const fetchMyTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await authFetch('/api/staff/tasks');
      if (res.ok) {
        const data = await res.json();
        setMyTasks(data);
      }
    } catch (err) {
      console.error('Error fetching my tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchTeamMessages = async () => {
    setLoadingChat(true);
    try {
      const res = await authFetch('/api/staff/team-messages');
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handlePunchIn = async () => {
    setLoadingPunch(true);
    try {
      const res = await authFetch('/api/staff/attendance/punch-in', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchMyStatus();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingPunch(false);
    }
  };

  const handlePunchOut = async () => {
    if (!window.confirm('Are you sure you want to Clock Out and leave office for today?')) return;
    setLoadingPunch(true);
    try {
      const res = await authFetch('/api/staff/attendance/punch-out', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchMyStatus();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingPunch(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await authFetch('/api/staff/team-messages', {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        fetchTeamMessages();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleChecklist = async (taskId, checklistId, currentStatus) => {
    try {
      const res = await authFetch(`/api/staff/tasks/${taskId}/checklist/${checklistId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_completed: !currentStatus })
      });
      if (res.ok) fetchMyTasks();
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await authFetch(`/api/staff/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchMyTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const isPunchedIn = punchStatus?.punched_in;
  const isPunchedOut = punchStatus?.punched_out;
  const empInfo = punchStatus?.employee || { name: user?.name, designation: user?.role || 'Staff' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Live Clock Widget */}
      <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'var(--accent-primary)', borderRadius: '12px', color: '#fff' }}>
                <User size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Welcome back, {empInfo.name || user?.name}! 👋</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{empInfo.designation || user?.role}</span>
                  <span>• Staff Portal & Action Hub</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Digital Clock & Punch Control Widget */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                {currentTime.toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!isPunchedIn ? (
                <button
                  onClick={handlePunchIn}
                  disabled={loadingPunch}
                  className="btn btn-success btn-lg"
                  style={{ borderRadius: '12px', padding: '10px 18px', fontWeight: '700', gap: '8px', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)' }}
                >
                  <Zap size={18} />
                  <span>⚡ PUNCH IN (উপস্থিতি)</span>
                </button>
              ) : isPunchedOut ? (
                <span className="badge badge-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                  🏁 Clocked Out ({punchStatus.attendance?.out_time})
                </span>
              ) : (
                <button
                  onClick={handlePunchOut}
                  disabled={loadingPunch}
                  className="btn btn-danger"
                  style={{ borderRadius: '12px', padding: '10px 16px', fontWeight: '700', gap: '8px' }}
                >
                  <LogOut size={16} />
                  <span>🚶 CLOCK OUT (প্রস্থান)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current Punch Status Notification Strip */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
          {isPunchedIn ? (
            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
              <CheckCircle size={16} />
              <span>Punched In Today at {punchStatus.attendance?.in_time} {punchStatus.attendance?.out_time ? `• Clocked Out at ${punchStatus.attendance.out_time}` : '• Working In Office'}</span>
            </div>
          ) : (
            <div style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} />
              <span>You have not punched in for today yet. Click "⚡ PUNCH IN" to mark your attendance!</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-card" style={{ padding: '8px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActivePortalTab('punch')}
          className={`btn ${activePortalTab === 'punch' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Clock size={16} />
          <span>Daily Punch & Overview</span>
        </button>

        <button
          onClick={() => setActivePortalTab('tasks')}
          className={`btn ${activePortalTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <CheckSquare size={16} />
          <span>My Tasks & Actions ({myTasks.length})</span>
        </button>

        <button
          onClick={() => setActivePortalTab('chat')}
          className={`btn ${activePortalTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <MessageSquare size={16} />
          <span>Internal Team Chat</span>
        </button>
      </div>

      {/* TAB 1: DAILY PUNCH & OVERVIEW */}
      {activePortalTab === 'punch' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Punch Card */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--accent-primary)" />
              Today's Attendance Status
            </h3>

            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className={`badge ${isPunchedIn ? 'badge-success' : 'badge-warning'}`}>
                  {isPunchedIn ? 'Present' : 'Not Marked'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>In Time (প্রবেশ সময়):</span>
                <strong>{punchStatus?.attendance?.in_time || 'Not Punched In'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Out Time (প্রস্থান সময়):</span>
                <strong>{punchStatus?.attendance?.out_time || 'Working...'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Weekly Off Day:</span>
                <span style={{ color: '#8b5cf6', fontWeight: '600' }}>{empInfo.weekly_off_day || 'Friday'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handlePunchIn}
                disabled={isPunchedIn || loadingPunch}
                className="btn btn-success"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Zap size={16} />
                <span>{isPunchedIn ? '✓ Punched In' : 'Punch In Now'}</span>
              </button>

              <button
                onClick={handlePunchOut}
                disabled={!isPunchedIn || isPunchedOut || loadingPunch}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <LogOut size={16} />
                <span>Clock Out</span>
              </button>
            </div>
          </div>

          {/* Quick Tasks Summary */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={18} color="var(--accent-primary)" />
                My Active Tasks
              </h3>
              <button onClick={() => setActivePortalTab('tasks')} className="btn btn-secondary btn-xs">View All</button>
            </div>

            {myTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active tasks assigned to you right now! 🎉
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myTasks.slice(0, 4).map(task => (
                  <div key={task.id} style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{task.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category: {task.category}</div>
                    </div>
                    <span className={`badge ${task.status === 'completed' ? 'badge-success' : task.status === 'in_progress' ? 'badge-warning' : 'badge-secondary'}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY TASKS & ACTION TRACKER */}
      {activePortalTab === 'tasks' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>My Assigned Tasks & Action Tracker</h3>
            <button onClick={fetchMyTasks} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
              <span>Refresh Tasks</span>
            </button>
          </div>

          {loadingTasks ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>Loading tasks...</div>
          ) : myTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No tasks assigned to you. When your manager assigns a task, it will appear here.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {myTasks.map(task => (
                <div key={task.id} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{task.title}</h4>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category: {task.category || 'General'}</div>
                    </div>
                    <span className={`badge ${task.priority === 'urgent' ? 'badge-danger' : task.priority === 'high' ? 'badge-warning' : 'badge-secondary'}`}>
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{task.description}</p>
                  )}

                  {/* Checklist Items */}
                  {task.checklists && task.checklists.length > 0 && (
                    <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>CHECKLIST ({task.checklists.filter(c => c.is_completed).length}/{task.checklists.length})</div>
                      {task.checklists.map(item => (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!item.is_completed}
                            onChange={() => handleToggleChecklist(task.id, item.id, item.is_completed)}
                          />
                          <span style={{ textDecoration: item.is_completed ? 'line-through' : 'none', color: item.is_completed ? 'var(--text-muted)' : 'inherit' }}>
                            {item.item_text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Status Toggle Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Status: <strong style={{ textTransform: 'capitalize' }}>{task.status}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {task.status !== 'in_progress' && task.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                          className="btn btn-warning btn-xs"
                        >
                          Start Task
                        </button>
                      )}
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                          className="btn btn-success btn-xs"
                        >
                          ✓ Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTERNAL TEAM CHAT */}
      {activePortalTab === 'chat' && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '550px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--accent-primary)" />
              Internal Team Chat Room
            </h3>
            <button onClick={fetchTeamMessages} className="btn btn-secondary btn-xs">
              <RefreshCw size={12} /> Refresh Chat
            </button>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '13px' }}>
                No messages yet. Be the first to send a message to the team! 💬
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMe = msg.user_id === user?.id || msg.sender_name === user?.name;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', gap: '6px' }}>
                      <strong>{msg.sender_name}</strong>
                      <span style={{ textTransform: 'capitalize' }}>({msg.sender_role || 'Staff'})</span>
                      <span>• {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div style={{
                      background: isMe ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: isMe ? '#fff' : 'inherit',
                      padding: '10px 14px',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      maxWidth: '75%',
                      fontSize: '13px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', marginTop: '12px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Type your message to the team..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
