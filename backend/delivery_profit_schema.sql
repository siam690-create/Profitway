-- Add Delivery Fee Charged, Courier Actual Cost, and Delivery Profit to sales table
USE `stock_profit_db`;

ALTER TABLE `sales` ADD COLUMN IF NOT EXISTS `delivery_fee_charged` DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE `sales` ADD COLUMN IF NOT EXISTS `courier_actual_cost` DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE `sales` ADD COLUMN IF NOT EXISTS `delivery_profit` DECIMAL(10,2) DEFAULT 0.00;
