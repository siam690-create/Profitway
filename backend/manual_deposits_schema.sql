-- Database Migration for Manual Cash & Bank Deposits Log
USE `profitway_db`;

CREATE TABLE IF NOT EXISTS `manual_deposits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `account_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `source_title` VARCHAR(255) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `deposit_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`account_id`) REFERENCES `finance_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
