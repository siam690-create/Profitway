-- Complete Finance, Accounts, Dena-Pawna, and Payroll Schema
USE `stock_profit_db`;

CREATE TABLE IF NOT EXISTS `finance_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `account_type` ENUM('cash', 'bkash', 'nagad', 'bank', 'other') DEFAULT 'cash',
  `account_number` VARCHAR(100) DEFAULT NULL,
  `balance` DECIMAL(12,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `liabilities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `party_type` ENUM('supplier', 'courier', 'vendor', 'other') DEFAULT 'supplier',
  `party_name` VARCHAR(150) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `amount_paid` DECIMAL(12,2) DEFAULT 0.00,
  `status` ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
  `due_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `receivables` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `party_type` ENUM('customer', 'courier_cod', 'other') DEFAULT 'customer',
  `party_name` VARCHAR(150) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `amount_collected` DECIMAL(12,2) DEFAULT 0.00,
  `status` ENUM('pending', 'partial', 'collected') DEFAULT 'pending',
  `due_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payroll` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `staff_id` INT DEFAULT NULL,
  `staff_name` VARCHAR(150) NOT NULL,
  `month_year` VARCHAR(20) NOT NULL,
  `base_salary` DECIMAL(10,2) NOT NULL,
  `bonus` DECIMAL(10,2) DEFAULT 0.00,
  `advance_deduction` DECIMAL(10,2) DEFAULT 0.00,
  `net_salary_paid` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `payment_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default financial accounts for existing tenants if not present
INSERT INTO `finance_accounts` (`tenant_id`, `name`, `account_type`, `account_number`, `balance`)
SELECT `id`, 'Hand Cash (দোকানের ক্যাশ)', 'cash', 'CASH-DRAWER', 15000.00 FROM `tenants`
WHERE NOT EXISTS (SELECT 1 FROM `finance_accounts` WHERE `tenant_id` = `tenants`.`id` AND `account_type` = 'cash');

INSERT INTO `finance_accounts` (`tenant_id`, `name`, `account_type`, `account_number`, `balance`)
SELECT `id`, 'bKash Merchant Account', 'bkash', '01700000000', 5500.00 FROM `tenants`
WHERE NOT EXISTS (SELECT 1 FROM `finance_accounts` WHERE `tenant_id` = `tenants`.`id` AND `account_type` = 'bkash');

INSERT INTO `finance_accounts` (`tenant_id`, `name`, `account_type`, `account_number`, `balance`)
SELECT `id`, 'Dutch-Bangla Bank Ltd', 'bank', 'DBBL-11029384', 45000.00 FROM `tenants`
WHERE NOT EXISTS (SELECT 1 FROM `finance_accounts` WHERE `tenant_id` = `tenants`.`id` AND `account_type` = 'bank');
