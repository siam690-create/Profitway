-- Add Courier Returns & Product Restock tables
USE `stock_profit_db`;

CREATE TABLE IF NOT EXISTS `returns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `return_no` VARCHAR(50) NOT NULL,
  `invoice_no` VARCHAR(50) DEFAULT NULL,
  `courier_name` VARCHAR(100) DEFAULT 'Steadfast Courier',
  `courier_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `reason` VARCHAR(255) DEFAULT 'Customer Refused / Undelivered',
  `notes` TEXT,
  `return_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `tenant_return_unique` (`tenant_id`, `return_no`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `return_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `return_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `quantity` INT NOT NULL,
  `restock_condition` ENUM('good_restockable', 'damaged_scrap') DEFAULT 'good_restockable',
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
