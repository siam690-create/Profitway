-- Add return_delivery_loss column to returns table
USE `stock_profit_db`;

ALTER TABLE `returns` ADD COLUMN IF NOT EXISTS `return_delivery_loss` DECIMAL(10,2) DEFAULT 0.00;
