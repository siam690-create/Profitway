-- Database Migration for Liability Payments and Receivable Collection Logs
USE `profitway_db`;

CREATE TABLE IF NOT EXISTS `liability_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `liability_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `account_id` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`liability_id`) REFERENCES `liabilities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `receivable_collections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `receivable_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `account_id` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `collection_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receivable_id`) REFERENCES `receivables`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
