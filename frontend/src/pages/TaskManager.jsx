import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckSquare, Plus, Clock, User, AlertCircle, CheckCircle2, 
  MessageSquare, Trash2, Edit3, ArrowRight, ArrowLeft, Filter, 
  Award, Layers, Calendar, ChevronRight, X, Send, Check
} from 'lucide-react';

const CATEGORIES = [
  'General', 'Inventory Restock', 'Customer Support', 'Courier Booking', 
  'Accounts Audit', 'POS Sales Counter', 'Marketing & Ads'
];

export const TaskManager = () => {
  const { authFetch } = useApp();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list' or 'performance'

  // Filters
  const [filterStaff, setFilterStaff] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [newComment, setNewComment] = useState('');

  // Create Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'medium',
    assigned_to_staff_id: '',
    due_date: '',
    checklist_input: '',
    checklists: []
  });

  const fetchTasks = async () => {
    try {
      let url = '/api/tasks';
      const query = [];
      if (filterStaff) query.push(`staff_id=${filterStaff}`);
      if (filterPriority) query.push(`priority=${filterPriority}`);
      if (query.length > 0) url += `?${query.join('&')}`;

      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await authFetch('/api/staff/employees');
      const data = await res.json();
      if (res.ok) setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await authFetch('/api/tasks/analytics');
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchAnalytics();
  }, [filterStaff, filterPriority]);

  // Handlers
  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title) return alert('Task title is required');

    try {
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setTaskForm({
          title: '',
          description: '',
          category: 'General',
          priority: 'medium',
          assigned_to_staff_id: '',
          due_date: '',
          checklist_input: '',
          checklists: []
        });
        fetchTasks();
        fetchAnalytics();
        alert(data.message || 'Task assigned successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklist = async (checklistId) => {
    try {
      const res = await authFetch(`/api/tasks/checklists/${checklistId}`, { method: 'PATCH' });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCommentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTaskDetails || !newComment.trim()) return;

    try {
      const res = await authFetch(`/api/tasks/${selectedTaskDetails.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment_text: newComment.trim() })
      });
      if (res.ok) {
        setNewComment('');
        fetchTasks();
        // Refresh selected task comments locally
        setSelectedTaskDetails(prev => ({
          ...prev,
          comments: [...(prev.comments || []), { user_name: 'You', comment_text: newComment.trim(), created_at: new Date().toISOString() }]
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklistItemToForm = () => {
    if (!taskForm.checklist_input.trim()) return;
    setTaskForm(prev => ({
      ...prev,
      checklists: [...prev.checklists, prev.checklist_input.trim()],
      checklist_input: ''
    }));
  };

  const renderPriorityBadge = (priority) => {
    if (priority === 'high') {
      return <span className="badge badge-danger" style={{ fontSize: '10px' }}>🔴 HIGH</span>;
    } else if (priority === 'medium') {
      return <span className="badge badge-warning" style={{ fontSize: '10px' }}>🟡 MEDIUM</span>;
    } else {
      return <span className="badge badge-success" style={{ fontSize: '10px' }}>🟢 LOW</span>;
    }
  };

  // Group tasks by Kanban status
  const kanbanColumns = [
    { id: 'todo', title: '📋 To-Do', tasks: tasks.filter(t => t.status === 'todo') },
    { id: 'in_progress', title: '⏳ In Progress', tasks: tasks.filter(t => t.status === 'in_progress') },
    { id: 'in_review', title: '🔍 In Review', tasks: tasks.filter(t => t.status === 'in_review') },
    { id: 'completed', title: '✅ Completed', tasks: tasks.filter(t => t.status === 'completed') },
    { id: 'overdue', title: '⚠️ Overdue', tasks: tasks.filter(t => t.status === 'overdue') }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckSquare size={26} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Staff Task Management & Work Tracker OS</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Assign tasks to staff, track Kanban progress, manage checklist items, and evaluate staff performance scores
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>+ Assign New Task</span>
        </button>
      </div>

      {/* Summary Analytics Bar */}
      {analytics && analytics.summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Assigned Tasks</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px' }}>{analytics.summary.total_tasks}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
              {Number(analytics.summary.in_progress_count || 0) + Number(analytics.summary.todo_count || 0)}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--success)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed Tasks</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', marginTop: '4px' }}>
              {analytics.summary.completed_count}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--danger)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue Tasks</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--danger)', marginTop: '4px' }}>
              {analytics.summary.overdue_count}
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: View Switcher & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('kanban')}
            className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📋 Kanban Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📑 List Table
          </button>
          <button
            onClick={() => setViewMode('performance')}
            className={`btn btn-sm ${viewMode === 'performance' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📊 Staff Performance Scores
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ padding: '4px 10px', fontSize: '13px', width: '180px' }}
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
          >
            <option value="">All Staff Members</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ padding: '4px 10px', fontSize: '13px', width: '150px' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* 1. KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {kanbanColumns.map(col => (
            <div key={col.id} className="glass-card" style={{ padding: '16px', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '12px', background: col.id === 'overdue' ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{col.title}</h4>
                <span className="badge badge-secondary" style={{ fontSize: '11px' }}>{col.tasks.length}</span>
              </div>

              {col.tasks.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No tasks in this stage
                </div>
              ) : (
                col.tasks.map(t => (
                  <div
                    key={t.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{t.category}</span>
                      {renderPriorityBadge(t.priority)}
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '2px 0', color: 'var(--text-primary)' }}>{t.title}</h4>

                    {t.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {t.description}
                      </p>
                    )}

                    {/* Checklists Progress Bar */}
                    {t.checklist_total > 0 && (
                      <div style={{ marginTop: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Checklist</span>
                          <span>{t.checklist_completed}/{t.checklist_total}</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--success)', width: `${(t.checklist_completed / t.checklist_total) * 100}%` }}></div>
                        </div>
                      </div>
                    )}

                    {/* Footer Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        <strong>{t.assignee_name}</strong>
                      </div>

                      {t.due_date && (
                        <div style={{ color: t.is_overdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: t.is_overdue ? 'bold' : 'normal' }}>
                          <Clock size={11} style={{ inlineSize: '11px' }} /> {new Date(t.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Task Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <button
                        onClick={() => setSelectedTaskDetails(t)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                      >
                        <MessageSquare size={12} />
                        <span>Comments ({t.comments ? t.comments.length : 0})</span>
                      </button>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {t.status !== 'todo' && (
                          <button
                            onClick={() => {
                              const prev = t.status === 'in_progress' ? 'todo' : (t.status === 'in_review' ? 'in_progress' : 'in_review');
                              handleStatusChange(t.id, prev);
                            }}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Move Back"
                          >
                            <ArrowLeft size={12} />
                          </button>
                        )}

                        {t.status !== 'completed' && (
                          <button
                            onClick={() => {
                              const next = t.status === 'todo' ? 'in_progress' : (t.status === 'in_progress' ? 'in_review' : 'completed');
                              handleStatusChange(t.id, next);
                            }}
                            className="btn btn-success btn-icon btn-sm"
                            title="Move Forward / Complete"
                          >
                            <ArrowRight size={12} />
                          </button>
                        )}

                        <button onClick={() => handleDeleteTask(t.id)} className="btn btn-danger btn-icon btn-sm" title="Delete Task">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. TABLE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Task Master Table</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Category</th>
                  <th>Assigned Staff</th>
                  <th>Priority</th>
                  <th>Checklist Progress</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>No tasks assigned yet.</td></tr>
                ) : (
                  tasks.map(t => (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.title}</strong>
                        {t.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.description}</div>}
                      </td>
                      <td><span className="badge badge-secondary" style={{ fontSize: '10px' }}>{t.category}</span></td>
                      <td><strong>{t.assignee_name}</strong></td>
                      <td>{renderPriorityBadge(t.priority)}</td>
                      <td>
                        {t.checklist_total > 0 ? (
                          <span style={{ fontSize: '12px', color: 'var(--success)' }}>
                            {t.checklist_completed}/{t.checklist_total} Done
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No checklist</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: t.is_overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {t.due_date ? new Date(t.due_date).toLocaleString() : 'No deadline'}
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'completed' ? 'badge-success' : (t.status === 'overdue' ? 'badge-danger' : 'badge-warning')}`} style={{ textTransform: 'uppercase' }}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setSelectedTaskDetails(t)} className="btn btn-secondary btn-icon btn-sm" title="View Comments & Checklists">
                            <MessageSquare size={14} />
                          </button>
                          <button onClick={() => handleDeleteTask(t.id)} className="btn btn-danger btn-icon btn-sm" title="Delete Task">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. STAFF PERFORMANCE SCORES TAB */}
      {viewMode === 'performance' && analytics && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Staff Performance Scoreboard</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Performance scores are calculated based on on-time task completion ratios.
          </p>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Assigned Tasks</th>
                  <th>Completed Tasks</th>
                  <th>Overdue Tasks</th>
                  <th>Performance Score (%)</th>
                  <th>Rating Badge</th>
                </tr>
              </thead>
              <tbody>
                {analytics.staff_performance.map(s => (
                  <tr key={s.staff_id}>
                    <td><strong>{s.staff_name}</strong> ({s.employee_code})</td>
                    <td style={{ fontWeight: '700' }}>{s.assigned_count}</td>
                    <td style={{ color: 'var(--success)', fontWeight: '700' }}>{s.completed_count}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: '700' }}>{s.overdue_count}</td>
                    <td style={{ fontWeight: '800', fontSize: '16px', color: s.performance_score_pct >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                      {s.performance_score_pct}%
                    </td>
                    <td>
                      <span className={`badge ${s.performance_score_pct >= 90 ? 'badge-success' : (s.performance_score_pct >= 70 ? 'badge-warning' : 'badge-danger')}`}>
                        {s.performance_score_pct >= 90 ? '⭐ TOP PERFORMER' : (s.performance_score_pct >= 70 ? '👍 GOOD' : '⚠️ NEEDS IMPROVEMENT')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE NEW TASK MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>+ Assign New Task to Staff</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTaskSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Restock Fantech Gaming Keyboards & Audit Warehouse"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description / Instructions</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Explain the work instructions clearly..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  ></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Assignee Staff Member *</label>
                    <select
                      className="form-select"
                      required
                      value={taskForm.assigned_to_staff_id}
                      onChange={(e) => setTaskForm({ ...taskForm, assigned_to_staff_id: e.target.value })}
                    >
                      <option value="">Choose Staff...</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category Tag</label>
                    <select
                      className="form-select"
                      value={taskForm.category}
                      onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Priority Level</label>
                    <select
                      className="form-select"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="high">🔴 High Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="low">🟢 Low Priority</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Due Date & Time (Deadline)</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Sub-task Checklist Builder */}
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Add Checklist Sub-items (Optional)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Inspect box condition..."
                      value={taskForm.checklist_input}
                      onChange={(e) => setTaskForm({ ...taskForm, checklist_input: e.target.value })}
                    />
                    <button type="button" onClick={handleAddChecklistItemToForm} className="btn btn-secondary btn-sm">Add</button>
                  </div>

                  {taskForm.checklists.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {taskForm.checklists.map((chk, idx) => (
                        <li key={idx}>{chk}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS & COMMENTS MODAL */}
      {selectedTaskDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{selectedTaskDetails.title}</h3>
                <span className="badge badge-secondary" style={{ fontSize: '10px', marginTop: '4px' }}>{selectedTaskDetails.category}</span>
              </div>
              <button onClick={() => setSelectedTaskDetails(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedTaskDetails.description && (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  {selectedTaskDetails.description}
                </div>
              )}

              {/* Checklists Section */}
              {selectedTaskDetails.checklists && selectedTaskDetails.checklists.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Sub-task Checklist Items:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedTaskDetails.checklists.map(chk => (
                      <label key={chk.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '6px' }}>
                        <input
                          type="checkbox"
                          checked={!!chk.is_completed}
                          onChange={() => handleToggleChecklist(chk.id)}
                        />
                        <span style={{ textDecoration: chk.is_completed ? 'line-through' : 'none', color: chk.is_completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {chk.item_text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Comments Stream */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Comments & Discussion:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
                  {(!selectedTaskDetails.comments || selectedTaskDetails.comments.length === 0) ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                      No comments yet. Start the discussion below.
                    </div>
                  ) : (
                    selectedTaskDetails.comments.map((cm, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontWeight: 'bold' }}>
                          <span>{cm.user_name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(cm.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div>{cm.comment_text}</div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddCommentSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Write a message or update..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Send size={14} />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
