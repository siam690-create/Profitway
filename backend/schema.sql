-- Full Multi-Tenant SaaS Database Schema
CREATE DATABASE IF NOT EXISTS `profitway_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `profitway_db`;

-- Disable foreign key checks for clean migration
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `sale_items`;
DROP TABLE IF EXISTS `sales`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `subscriptions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `plans`;
DROP TABLE IF EXISTS `tenants`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tenants (Shops/Businesses) Table
CREATE TABLE `tenants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shop_name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(100) UNIQUE NOT NULL,
  `owner_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `logo_url` VARCHAR(255) DEFAULT NULL,
  `currency` VARCHAR(10) DEFAULT '৳',
  `subscription_status` VARCHAR(50) DEFAULT 'pending_approval',
  `trial_ends_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. SaaS Plans Table
CREATE TABLE `plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(30) UNIQUE NOT NULL,
  `price_monthly` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `price_yearly` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `max_products` INT NOT NULL DEFAULT 500,
  `max_staff` INT NOT NULL DEFAULT 2,
  `features_json` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Users Table (Tenant Owners, Cashiers, and Super Admin)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT DEFAULT NULL, -- NULL for Super Admin
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('superadmin', 'owner', 'manager', 'cashier') NOT NULL DEFAULT 'owner',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Subscriptions History Table
CREATE TABLE `subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `plan_id` INT NOT NULL,
  `billing_cycle` ENUM('monthly', 'yearly') DEFAULT 'monthly',
  `status` ENUM('active', 'past_due', 'cancelled') DEFAULT 'active',
  `current_period_start` DATETIME NOT NULL,
  `current_period_end` DATETIME NOT NULL,
  `amount_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) DEFAULT 'bKash',
  `transaction_id` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Categories Table (Multi-Tenant)
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Products Table (Multi-Tenant)
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `sku` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category_id` INT DEFAULT NULL,
  `cost_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `selling_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `low_stock_threshold` INT NOT NULL DEFAULT 5,
  `unit` VARCHAR(20) DEFAULT 'pcs',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `tenant_sku_unique` (`tenant_id`, `sku`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6.5 Store API Keys Table (Multi-Tenant External Order Ingestion)
CREATE TABLE IF NOT EXISTS `store_api_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `store_name` VARCHAR(150) NOT NULL,
  `store_domain` VARCHAR(255) DEFAULT NULL,
  `api_key` VARCHAR(100) NOT NULL UNIQUE,
  `is_active` TINYINT(1) DEFAULT 1,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Sales Table (Multi-Tenant)
CREATE TABLE IF NOT EXISTS `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `invoice_no` VARCHAR(50) NOT NULL,
  `customer_name` VARCHAR(100) DEFAULT 'Walk-in Customer',
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `gross_profit` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `notes` TEXT,
  `sale_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `store_api_key_id` INT DEFAULT NULL,
  `source_website` VARCHAR(150) DEFAULT NULL,
  `external_order_id` VARCHAR(100) DEFAULT NULL,
  `customer_phone` VARCHAR(50) DEFAULT NULL,
  `customer_email` VARCHAR(150) DEFAULT NULL,
  `shipping_address` TEXT DEFAULT NULL,
  `raw_payload` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `tenant_invoice_unique` (`tenant_id`, `invoice_no`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`store_api_key_id`) REFERENCES `store_api_keys`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Sale Items Table (Multi-Tenant)
CREATE TABLE `sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `sale_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_cost` DECIMAL(10,2) NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  `total_cost` DECIMAL(10,2) NOT NULL,
  `item_profit` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Expenses Table (Multi-Tenant)
CREATE TABLE `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA SETUP
-- ============================================================

-- 1. Insert SaaS Plans
INSERT INTO `plans` (`id`, `name`, `code`, `price_monthly`, `price_yearly`, `max_products`, `max_staff`, `features_json`) VALUES
(1, 'Starter Plan', 'starter', 999.00, 9990.00, 300, 2, '{"pos": true, "inventory": true, "basic_reports": true}'),
(2, 'Pro Plan', 'pro', 2499.00, 24990.00, 2500, 5, '{"pos": true, "inventory": true, "advanced_reports": true, "custom_logo": true}'),
(3, 'Enterprise Plan', 'enterprise', 4999.00, 49990.00, 99999, 50, '{"pos": true, "inventory": true, "all_reports": true, "custom_domain": true, "priority_support": true}');

-- 2. Insert Super Admin User (Password: admin123)
-- bcrypt hash for 'admin123': $2a$10$7R.x5kS.yXl3G3/fB5gN6e7wF4hF4w7qH0vJ0k0l0m0n0o0p0q0r0
INSERT INTO `users` (`id`, `tenant_id`, `name`, `email`, `password_hash`, `role`) VALUES
(1, NULL, 'Super Administrator', 'admin@stockmaster.com', '$2a$10$1r2/P6M6T4tH8Y.nF4M9.e/w.e/w.e/w.e/w.e/w.e/w.e/w.e/w.', 'superadmin');

-- 3. Insert Demo Tenant Shop 1 (Demo Electronics) with active 14-day trial
INSERT INTO `tenants` (`id`, `shop_name`, `slug`, `owner_name`, `email`, `phone`, `currency`, `subscription_status`, `trial_ends_at`) VALUES
(1, 'Demo Electronics Store', 'demo-electronics', 'Tanvir Ahmed', 'owner@demostore.com', '01700000000', '৳', 'trial', NOW() + INTERVAL 14 DAY);

-- 4. Insert Tenant 1 Owner User Account (Password: demo123)
INSERT INTO `users` (`id`, `tenant_id`, `name`, `email`, `password_hash`, `role`) VALUES
(2, 1, 'Tanvir Ahmed', 'owner@demostore.com', '$2a$10$1r2/P6M6T4tH8Y.nF4M9.e/w.e/w.e/w.e/w.e/w.e/w.e/w.e/w.', 'owner');

-- 5. Seed Categories for Tenant 1
INSERT INTO `categories` (`id`, `tenant_id`, `name`, `description`) VALUES
(1, 1, 'Electronics', 'Gadgets and electronic items'),
(2, 1, 'Computer Accessories', 'Mice, Keyboards, Cables'),
(3, 1, 'Smart Devices', 'Smartwatches, Fitness bands'),
(4, 1, 'Audio', 'Headphones, Speakers, Microphones');

-- 6. Seed Products for Tenant 1
INSERT INTO `products` (`id`, `tenant_id`, `sku`, `name`, `category_id`, `cost_price`, `selling_price`, `stock_quantity`, `low_stock_threshold`, `unit`) VALUES
(1, 1, 'SKU-1001', 'Logitech Wireless Mouse M185', 2, 450.00, 750.00, 24, 5, 'pcs'),
(2, 1, 'SKU-1002', 'RGB Mechanical Keyboard K552', 2, 2200.00, 3200.00, 12, 4, 'pcs'),
(3, 1, 'SKU-1003', 'Anker USB-C Fast Cable 6ft', 2, 250.00, 500.00, 45, 10, 'pcs'),
(4, 1, 'SKU-1004', 'Haylou Solar Smart Watch LS05', 3, 2100.00, 2900.00, 3, 5, 'pcs'),
(5, 1, 'SKU-1005', 'Fantech Noise Cancelling Headset', 4, 1100.00, 1800.00, 8, 3, 'pcs'),
(6, 1, 'SKU-1006', 'JBL GO 3 Portable Speaker', 4, 2800.00, 3800.00, 2, 4, 'pcs');

-- 7. Seed Sales for Tenant 1
INSERT INTO `sales` (`id`, `tenant_id`, `invoice_no`, `customer_name`, `total_amount`, `total_cost`, `gross_profit`, `payment_method`, `sale_date`) VALUES
(1, 1, 'INV-20260725-001', 'Mr. Rahim', 4700.00, 3100.00, 1600.00, 'bKash', NOW() - INTERVAL 2 DAY),
(2, 1, 'INV-20260725-002', 'Tanvir Ahmed', 1500.00, 900.00, 600.00, 'Cash', NOW() - INTERVAL 1 DAY),
(3, 1, 'INV-20260725-003', 'Walk-in Customer', 3800.00, 2800.00, 1000.00, 'Card', NOW());

-- 8. Seed Sale Items for Tenant 1
INSERT INTO `sale_items` (`id`, `tenant_id`, `sale_id`, `product_id`, `product_name`, `quantity`, `unit_cost`, `unit_price`, `total_price`, `total_cost`, `item_profit`) VALUES
(1, 1, 1, 1, 'Logitech Wireless Mouse M185', 2, 450.00, 750.00, 1500.00, 900.00, 600.00),
(2, 1, 1, 2, 'RGB Mechanical Keyboard K552', 1, 2200.00, 3200.00, 3200.00, 2200.00, 1000.00),
(3, 1, 2, 1, 'Logitech Wireless Mouse M185', 2, 450.00, 750.00, 1500.00, 900.00, 600.00),
(4, 1, 3, 6, 'JBL GO 3 Portable Speaker', 1, 2800.00, 3800.00, 3800.00, 2800.00, 1000.00);

-- 9. Seed Expenses for Tenant 1
INSERT INTO `expenses` (`id`, `tenant_id`, `title`, `category`, `amount`, `expense_date`, `notes`) VALUES
(1, 1, 'Shop Rent (July)', 'Rent', 800.00, CURDATE() - INTERVAL 10 DAY, 'Monthly shop space rent'),
(2, 1, 'Electricity Bill', 'Utilities', 250.00, CURDATE() - INTERVAL 5 DAY, 'AC and Light usage'),
(3, 1, 'Packaging Supplies', 'Miscellaneous', 120.00, CURDATE() - INTERVAL 1 DAY, 'Purchased packaging supplies');
