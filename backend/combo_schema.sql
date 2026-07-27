-- Add Combo Product Bundling support
USE `profitway_db`;

-- Add is_combo flag to products table if not exists
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `is_combo` TINYINT(1) DEFAULT 0;

-- Table to map Combo Products to Child Products
CREATE TABLE IF NOT EXISTS `combo_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `combo_product_id` INT NOT NULL,
  `child_product_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`combo_product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`child_product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
