const db = require('./config/db');

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_no VARCHAR(50) NOT NULL UNIQUE,
      tenant_id INT NOT NULL,
      user_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
      status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      sender_id INT NOT NULL,
      sender_role ENUM('owner', 'staff', 'superadmin') NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  console.log('Support tickets tables created successfully!');
  process.exit();
}

run().catch(err => {
  console.error('Error applying support schema:', err);
  process.exit(1);
});
