-- Supplier Directory and Enhanced Purchase Payment Schema
USE `profitway_db`;

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `company_name` VARCHAR(150) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add payment columns to purchases table if missing
SET @dbname = DATABASE();
SET @tablename = "purchases";

SET @columnname = "supplier_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE purchases ADD COLUMN supplier_id INT DEFAULT NULL AFTER tenant_id;"
));
PREPARE add_supplier_id FROM @preparedStatement;
EXECUTE add_supplier_id;
DEALLOCATE PREPARE add_supplier_id;

SET @columnname = "payment_status";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE purchases ADD COLUMN payment_status ENUM('paid', 'partial', 'due') DEFAULT 'paid' AFTER total_amount;"
));
PREPARE add_payment_status FROM @preparedStatement;
EXECUTE add_payment_status;
DEALLOCATE PREPARE add_payment_status;

SET @columnname = "paid_amount";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE purchases ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0.00 AFTER payment_status;"
));
PREPARE add_paid_amount FROM @preparedStatement;
EXECUTE add_paid_amount;
DEALLOCATE PREPARE add_paid_amount;

SET @columnname = "due_amount";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE purchases ADD COLUMN due_amount DECIMAL(12,2) DEFAULT 0.00 AFTER paid_amount;"
));
PREPARE add_due_amount FROM @preparedStatement;
EXECUTE add_due_amount;
DEALLOCATE PREPARE add_due_amount;

SET @columnname = "account_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE purchases ADD COLUMN account_id INT DEFAULT NULL AFTER due_amount;"
));
PREPARE add_account_id FROM @preparedStatement;
EXECUTE add_account_id;
DEALLOCATE PREPARE add_account_id;

-- Seed default suppliers for demo tenant
INSERT INTO `suppliers` (`tenant_id`, `name`, `phone`, `company_name`, `address`)
SELECT `id`, 'StarTech Wholesale Ltd', '01711002233', 'StarTech Bangladesh', 'IDB Bhaban, Agargaon, Dhaka' FROM `tenants`
WHERE NOT EXISTS (SELECT 1 FROM `suppliers` WHERE `tenant_id` = `tenants`.`id` AND `name` = 'StarTech Wholesale Ltd');

INSERT INTO `suppliers` (`tenant_id`, `name`, `phone`, `company_name`, `address`)
SELECT `id`, 'Alif Enterprise Importers', '01899112244', 'Alif Electronics', 'Stadium Market, Gulistan, Dhaka' FROM `tenants`
WHERE NOT EXISTS (SELECT 1 FROM `suppliers` WHERE `tenant_id` = `tenants`.`id` AND `name` = 'Alif Enterprise Importers');
