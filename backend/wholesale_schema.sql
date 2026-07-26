-- Complete Wholesale B2B Sales & Buyer Schema
USE `stock_profit_db`;

CREATE TABLE IF NOT EXISTS `wholesale_customers` (
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

CREATE TABLE IF NOT EXISTS `wholesale_sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `invoice_no` VARCHAR(100) NOT NULL,
  `customer_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `total_cost` DECIMAL(12,2) NOT NULL,
  `gross_profit` DECIMAL(12,2) NOT NULL,
  `payment_status` ENUM('paid', 'partial', 'due') DEFAULT 'paid',
  `paid_amount` DECIMAL(12,2) DEFAULT 0.00,
  `due_amount` DECIMAL(12,2) DEFAULT 0.00,
  `account_id` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `sale_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wholesale_sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `sale_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_cost_price` DECIMAL(12,2) NOT NULL,
  `unit_wholesale_price` DECIMAL(12,2) NOT NULL,
  `total_item_price` DECIMAL(12,2) NOT NULL,
  `item_profit` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sale_id`) REFERENCES `wholesale_sales`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default wholesale buyers for demo tenant
INSERT INTO `suppliers` (`tenant_id`, `name`, `phone`, `company_name`, `address`)
SELECT `id`, 'Rahman Traders', '01755112233', 'Rahman Enterprise', 'Chawkbazar, Dhaka' FROM `tenants`
WHERE NOT EXISTS (SELECT 1 FROM `wholesale_customers` WHERE `tenant_id` = `tenants`.`id` AND `name` = 'Rahman Traders');

INSERT INTO `wholesale_customers` (`tenant_id`, `name`, `phone`, `company_name`, `address`)
SELECT `id`, 'Rahman Traders', '01755112233', 'Rahman Enterprise', 'Chawkbazar, Dhaka' FROM `tenants`
WHERE NOT EXISTS (SELECT 1 FROM `wholesale_customers` WHERE `tenant_id` = `tenants`.`id` AND `name` = 'Rahman Traders');

INSERT INTO `wholesale_customers` (`tenant_id`, `name`, `phone`, `company_name`, `address`)
SELECT `id`, 'Kabir Store Chittagong', '01811998877', 'Kabir Electronics', 'Reazuddin Bazar, Chittagong' FROM `tenants`
WHERE NOT EXISTS (SELECT 1 FROM `wholesale_customers` WHERE `tenant_id` = `tenants`.`id` AND `name` = 'Kabir Store Chittagong');
