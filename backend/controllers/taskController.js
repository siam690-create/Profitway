const db = require('../config/db');

// Get all tasks for tenant with checklists & assignee info
exports.getTasks = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, staff_id, priority } = req.query;

    let whereClause = 'WHERE t.tenant_id = ?';
    let params = [tenantId];

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }
    if (staff_id) {
      whereClause += ' AND t.assigned_to_staff_id = ?';
      params.push(staff_id);
    }
    if (priority) {
      whereClause += ' AND t.priority = ?';
      params.push(priority);
    }

    const [tasks] = await db.query(
      `SELECT t.*, 
              COALESCE(e.name, u.name, 'Unassigned') AS assignee_name,
              e.employee_code,
              e.designation AS assignee_designation
       FROM tasks t
       LEFT JOIN employees e ON e.id = t.assigned_to_staff_id
       LEFT JOIN users u ON u.id = t.assigned_to_staff_id
       ${whereClause}
       ORDER BY 
         CASE WHEN t.priority = 'high' THEN 1 WHEN t.priority = 'medium' THEN 2 ELSE 3 END,
         t.id DESC`,
      params
    );

    // Fetch checklists for all tasks
    const taskIds = tasks.map(t => t.id);
    let checklistsMap = {};
    let commentsMap = {};

    if (taskIds.length > 0) {
      const [checklists] = await db.query(
        'SELECT * FROM task_checklists WHERE tenant_id = ? AND task_id IN (?) ORDER BY id ASC',
        [tenantId, taskIds]
      );
      checklists.forEach(c => {
        if (!checklistsMap[c.task_id]) checklistsMap[c.task_id] = [];
        checklistsMap[c.task_id].push(c);
      });

      const [comments] = await db.query(
        'SELECT * FROM task_comments WHERE tenant_id = ? AND task_id IN (?) ORDER BY id ASC',
        [tenantId, taskIds]
      );
      comments.forEach(cm => {
        if (!commentsMap[cm.task_id]) commentsMap[cm.task_id] = [];
        commentsMap[cm.task_id].push(cm);
      });
    }

    const result = tasks.map(t => {
      const chk = checklistsMap[t.id] || [];
      const completedChk = chk.filter(c => c.is_completed).length;
      const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed';

      return {
        ...t,
        status: isOverdue && t.status !== 'completed' ? 'overdue' : t.status,
        is_overdue: isOverdue,
        checklists: chk,
        checklist_total: chk.length,
        checklist_completed: completedChk,
        comments: commentsMap[t.id] || []
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const { title, description, category, priority, assigned_to_staff_id, due_date, checklists } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const [result] = await db.query(
      `INSERT INTO tasks (
        tenant_id, assigned_to_staff_id, created_by_user_id, title, description,
        category, priority, status, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', ?)`,
      [
        tenantId, assigned_to_staff_id || null, userId, title, description || null,
        category || 'General', priority || 'medium', due_date || null
      ]
    );

    const taskId = result.insertId;

    // Insert checklist items if provided
    if (Array.isArray(checklists) && checklists.length > 0) {
      for (const itemText of checklists) {
        if (itemText && itemText.trim()) {
          await db.query(
            'INSERT INTO task_checklists (tenant_id, task_id, item_text) VALUES (?, ?, ?)',
            [tenantId, taskId, itemText.trim()]
          );
        }
      }
    }

    res.status(201).json({ message: 'Task created successfully', taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update task (status, priority, due date, assignee)
exports.updateTask = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { title, description, category, priority, status, assigned_to_staff_id, due_date } = req.body;

    const completedAt = status === 'completed' ? new Date() : null;

    await db.query(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        assigned_to_staff_id = ?,
        due_date = ?,
        completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
      WHERE id = ? AND tenant_id = ?`,
      [
        title || null, description || null, category || null, priority || null, status || null,
        assigned_to_staff_id || null, due_date || null, status || null, id, tenantId
      ]
    );

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await db.query('DELETE FROM task_checklists WHERE task_id = ? AND tenant_id = ?', [id, tenantId]);
    await db.query('DELETE FROM task_comments WHERE task_id = ? AND tenant_id = ?', [id, tenantId]);
    await db.query('DELETE FROM tasks WHERE id = ? AND tenant_id = ?', [id, tenantId]);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle checklist item
exports.toggleChecklist = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [chk] = await db.query('SELECT is_completed FROM task_checklists WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (chk.length === 0) return res.status(404).json({ error: 'Checklist item not found.' });

    const newStatus = chk[0].is_completed ? 0 : 1;
    await db.query(
      'UPDATE task_checklists SET is_completed = ?, completed_at = CASE WHEN ? = 1 THEN NOW() ELSE NULL END WHERE id = ?',
      [newStatus, newStatus, id]
    );

    res.json({ message: 'Checklist updated', is_completed: newStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { comment_text } = req.body;
    const userName = req.user.name || 'User';

    if (!comment_text) return res.status(400).json({ error: 'Comment text is required.' });

    await db.query(
      'INSERT INTO task_comments (tenant_id, task_id, user_id, user_name, comment_text) VALUES (?, ?, ?, ?, ?)',
      [tenantId, id, req.user.id || null, userName, comment_text]
    );

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Task analytics & staff performance scores
exports.getTaskAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [totals] = await db.query(`
      SELECT 
        COUNT(id) AS total_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) AS todo_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
        SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) AS in_review_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 ELSE 0 END) AS overdue_count
      FROM tasks WHERE tenant_id = ?
    `, [tenantId]);

    const [staffStats] = await db.query(`
      SELECT 
        e.id AS staff_id,
        e.name AS staff_name,
        e.employee_code,
        COUNT(t.id) AS assigned_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN t.due_date < NOW() AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_count
      FROM employees e
      LEFT JOIN tasks t ON t.assigned_to_staff_id = e.id AND t.tenant_id = e.tenant_id
      WHERE e.tenant_id = ? AND e.is_active = 1
      GROUP BY e.id, e.name, e.employee_code
    `, [tenantId]);

    const formattedStaffStats = staffStats.map(s => {
      const assigned = Number(s.assigned_count || 0);
      const completed = Number(s.completed_count || 0);
      const scorePct = assigned > 0 ? Number(((completed / assigned) * 100).toFixed(1)) : 100;

      return {
        ...s,
        assigned_count: assigned,
        completed_count: completed,
        overdue_count: Number(s.overdue_count || 0),
        performance_score_pct: scorePct
      };
    });

    res.json({
      summary: totals[0],
      staff_performance: formattedStaffStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
