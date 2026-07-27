-- Add Paid Ads & Marketing Cost Tracker tables
USE `profitway_db`;

CREATE TABLE IF NOT EXISTS `paid_ads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `product_name` VARCHAR(150) DEFAULT 'General Campaign',
  `platform` VARCHAR(50) DEFAULT 'Facebook Ads',
  `amount_usd` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `exchange_rate` DECIMAL(10,2) NOT NULL DEFAULT 120.00,
  `total_bdt_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `ad_date` DATE NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
