-- Add Purchases and Purchase Items tables for Stock Buying & Weighted Average Cost calculation
USE `profitway_db`;

CREATE TABLE IF NOT EXISTS `purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `purchase_no` VARCHAR(50) NOT NULL,
  `supplier_name` VARCHAR(150) DEFAULT 'General Supplier',
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT,
  `purchase_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `tenant_purchase_unique` (`tenant_id`, `purchase_no`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `purchase_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `purchase_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_buy_price` DECIMAL(10,2) NOT NULL,
  `total_cost` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
