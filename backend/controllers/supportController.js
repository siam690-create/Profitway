const db = require('../config/db');
const { sendSupportNotificationEmail } = require('../utils/mailer');

// Get Support Tickets (For Tenant or Super Admin)
exports.getTickets = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const tenantId = req.user.tenantId;

    let query = `
      SELECT st.*, t.shop_name, t.shop_code, u.name AS created_by_name, u.email AS created_by_email,
        (SELECT COUNT(id) FROM support_messages WHERE ticket_id = st.id) AS message_count
      FROM support_tickets st
      JOIN tenants t ON st.tenant_id = t.id
      JOIN users u ON st.user_id = u.id
    `;

    const params = [];
    if (!isSuperAdmin) {
      query += ` WHERE st.tenant_id = ?`;
      params.push(tenantId);
    }

    query += ` ORDER BY st.id DESC`;

    const [tickets] = await db.query(query, params);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create New Support Ticket
exports.createTicket = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { category, subject, priority, message } = req.body;

    if (!category || !subject || !message) {
      return res.status(400).json({ error: 'Category, subject, and message details are required.' });
    }

    const ticketNo = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    const [result] = await db.query(
      `INSERT INTO support_tickets (ticket_no, tenant_id, user_id, category, subject, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Open')`,
      [ticketNo, tenantId, userId, category, subject, priority || 'Normal']
    );

    const ticketId = result.insertId;

    // Add initial message
    await db.query(
      `INSERT INTO support_messages (ticket_id, sender_id, sender_role, message)
       VALUES (?, ?, ?, ?)`,
      [ticketId, userId, req.user.role, message]
    );

    // Fetch tenant & user info for email notification
    const [tenants] = await db.query('SELECT shop_name, shop_code, email, owner_name FROM tenants WHERE id = ?', [tenantId]);
    const [users] = await db.query('SELECT email, name FROM users WHERE id = ?', [userId]);

    const tenant = tenants[0] || {};
    const user = users[0] || {};

    // 📩 Send Email Notification to Super Admin
    const superAdminEmail = 'admin@profitway.bd';
    const emailSubject = `🚨 New Support Ticket #${ticketNo}: [${tenant.shop_name}] ${subject}`;
    const emailBody = `
      <h2>New Support Ticket Created</h2>
      <p><strong>Ticket #:</strong> ${ticketNo}</p>
      <p><strong>Shop:</strong> ${tenant.shop_name} (Code: ${tenant.shop_code || 'N/A'})</p>
      <p><strong>Requested By:</strong> ${user.name} (${user.email})</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Priority:</strong> ${priority || 'Normal'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <blockquote style="background: #f1f5f9; padding: 12px; border-left: 4px solid #2563eb;">
        ${message}
      </blockquote>
    `;

    await sendSupportNotificationEmail({
      to: superAdminEmail,
      subject: emailSubject,
      htmlBody: emailBody,
      textBody: `New Ticket #${ticketNo} from ${tenant.shop_name}: ${subject}\n\nMessage: ${message}`
    });

    res.status(201).json({
      message: 'Support ticket submitted successfully. Super admin notified.',
      ticket_no: ticketNo,
      ticket_id: ticketId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Ticket Details & Messages History
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user.role === 'superadmin';
    const tenantId = req.user.tenantId;

    const [tickets] = await db.query(
      `SELECT st.*, t.shop_name, t.shop_code, t.email AS tenant_email, u.name AS created_by_name, u.email AS created_by_email
       FROM support_tickets st
       JOIN tenants t ON st.tenant_id = t.id
       JOIN users u ON st.user_id = u.id
       WHERE st.id = ?`,
      [id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Support ticket not found.' });
    }

    const ticket = tickets[0];
    if (!isSuperAdmin && String(ticket.tenant_id) !== String(tenantId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const [messages] = await db.query(
      `SELECT sm.*, u.name AS sender_name
       FROM support_messages sm
       JOIN users u ON sm.sender_id = u.id
       WHERE sm.ticket_id = ?
       ORDER BY sm.id ASC`,
      [id]
    );

    res.json({
      ticket,
      messages
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Post Reply Message to Ticket
exports.addTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;
    const isSuperAdmin = req.user.role === 'superadmin';

    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const [tickets] = await db.query(
      `SELECT st.*, t.shop_name, t.email AS tenant_email, u.email AS creator_email, u.name AS creator_name
       FROM support_tickets st
       JOIN tenants t ON st.tenant_id = t.id
       JOIN users u ON st.user_id = u.id
       WHERE st.id = ?`,
      [id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const ticket = tickets[0];

    // Insert response message
    await db.query(
      `INSERT INTO support_messages (ticket_id, sender_id, sender_role, message)
       VALUES (?, ?, ?, ?)`,
      [id, req.user.userId, req.user.role, message]
    );

    // Update status if provided or default to 'In Progress' for superadmin reply
    const newStatus = status || (isSuperAdmin ? 'In Progress' : ticket.status);
    await db.query('UPDATE support_tickets SET status = ? WHERE id = ?', [newStatus, id]);

    // 📩 Send Email Notification to Shop Owner if Super Admin replied!
    if (isSuperAdmin) {
      const recipientEmail = ticket.creator_email || ticket.tenant_email;
      const emailSubject = `💬 Reply on Support Ticket #${ticket.ticket_no}: ${ticket.subject}`;
      const emailBody = `
        <h2>Super Admin Replied to Your Support Ticket</h2>
        <p>Dear ${ticket.creator_name || 'Shop Owner'},</p>
        <p>Your support ticket <strong>#${ticket.ticket_no}</strong> (${ticket.subject}) has received a new update from Super Admin.</p>
        <p><strong>Current Ticket Status:</strong> <span style="padding: 3px 8px; background: #e0e7ff; color: #3730a3; border-radius: 4px; font-weight: bold;">${newStatus}</span></p>
        <hr />
        <p><strong>Super Admin Response:</strong></p>
        <blockquote style="background: #f8fafc; padding: 12px; border-left: 4px solid #10b981;">
          ${message}
        </blockquote>
        <p>Log in to your Profitway Dashboard to view full conversation history or submit further replies.</p>
      `;

      await sendSupportNotificationEmail({
        to: recipientEmail,
        subject: emailSubject,
        htmlBody: emailBody,
        textBody: `Super Admin replied to Ticket #${ticket.ticket_no}:\n\n${message}\n\nStatus: ${newStatus}`
      });
    }

    res.json({ message: 'Reply sent successfully.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Ticket Status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query('UPDATE support_tickets SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Ticket status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
