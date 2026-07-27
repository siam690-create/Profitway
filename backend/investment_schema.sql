-- Business Investments & Investor Capital Schema
USE `profitway_db`;

CREATE TABLE IF NOT EXISTS `investments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `investor_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `invested_amount` DECIMAL(12,2) NOT NULL,
  `returned_amount` DECIMAL(12,2) DEFAULT 0.00,
  `status` ENUM('active', 'partially_returned', 'returned') DEFAULT 'active',
  `account_id` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `investment_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `investment_id` INT NOT NULL,
  `type` ENUM('deposit', 'repayment') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `account_id` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `transaction_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`investment_id`) REFERENCES `investments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default demo investment
INSERT INTO `investments` (`tenant_id`, `investor_name`, `phone`, `invested_amount`, `returned_amount`, `status`, `notes`)
SELECT `id`, 'Syed Kamrul Hasan (Angel Investor)', '01711223344', 500000.00, 100000.00, 'partially_returned', 'Seed Equity Investment for Store Expansion' FROM `tenants`
WHERE NOT EXISTS (SELECT 1 FROM `investments` WHERE `tenant_id` = `tenants`.`id` AND `investor_name` LIKE '%Syed Kamrul Hasan%');
