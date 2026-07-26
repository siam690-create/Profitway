-- Database Migration for Product Storage Location & Staff Module Permissions
USE `stock_profit_db`;

-- 1. Add storage location column to products table if not exists
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='stock_profit_db' AND TABLE_NAME='products' AND COLUMN_NAME='location');
SET @sql := IF(@exist = 0, 'ALTER TABLE products ADD COLUMN location VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Add permissions column to users table if not exists
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='stock_profit_db' AND TABLE_NAME='users' AND COLUMN_NAME='permissions');
SET @sql := IF(@exist = 0, 'ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing demo products with sample storage locations
UPDATE `products` SET `location` = 'Warehouse A - Rack #3 - Shelf B' WHERE `id` = 1;
UPDATE `products` SET `location` = 'Storefront - Counter Display' WHERE `id` = 2;
UPDATE `products` SET `location` = 'Floor 2 - Cabinet #12' WHERE `id` = 3;
