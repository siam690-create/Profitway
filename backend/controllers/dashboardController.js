const db = require('../config/db');

exports.getDashboardSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // 1. Sales totals for tenant
    const [salesTotals] = await db.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(SUM(total_cost), 0) AS total_costOfGoods,
        COALESCE(SUM(gross_profit), 0) AS gross_profit,
        COUNT(id) AS total_sales_count
      FROM sales WHERE tenant_id = ?
    `, [tenantId]);

    // 2. Expenses total for tenant
    const [expenseTotals] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses WHERE tenant_id = ?
    `, [tenantId]);

    // 3. Inventory summary for tenant
    const [inventoryTotals] = await db.query(`
      SELECT 
        COUNT(id) AS total_products,
        COALESCE(SUM(cost_price * stock_quantity), 0) AS total_inventory_cost,
        COALESCE(SUM(selling_price * stock_quantity), 0) AS total_inventory_value,
        SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) AS low_stock_count
      FROM products WHERE tenant_id = ?
    `, [tenantId]);

    const grossProfit = Number(salesTotals[0].gross_profit);
    const totalExpenses = Number(expenseTotals[0].total_expenses);
    const netProfit = grossProfit - totalExpenses;

    // 4. Low stock products for tenant
    const [lowStockProducts] = await db.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.tenant_id = ? AND p.stock_quantity <= p.low_stock_threshold
      ORDER BY p.stock_quantity ASC
      LIMIT 10
    `, [tenantId]);

    // 5. Recent 5 Sales for tenant
    const [recentSales] = await db.query(`
      SELECT * FROM sales WHERE tenant_id = ? ORDER BY sale_date DESC LIMIT 5
    `, [tenantId]);

    // 6. Last 7 Days Daily Breakdown for tenant
    const [dailySalesChart] = await db.query(`
      SELECT 
        DATE_FORMAT(d.date, '%Y-%m-%d') AS date_label,
        COALESCE(SUM(s.total_amount), 0) AS sales,
        COALESCE(SUM(s.gross_profit), 0) AS gross_profit,
        COALESCE(e.expense_total, 0) AS expenses,
        COALESCE(SUM(s.gross_profit), 0) - COALESCE(e.expense_total, 0) AS net_profit
      FROM (
        SELECT CURDATE() - INTERVAL (a.a + (b.a * 10)) DAY AS date
        FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
        CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) AS b
      ) d
      LEFT JOIN sales s ON DATE(s.sale_date) = d.date AND s.tenant_id = ?
      LEFT JOIN (
        SELECT expense_date, SUM(amount) AS expense_total
        FROM expenses WHERE tenant_id = ?
        GROUP BY expense_date
      ) e ON e.expense_date = d.date
      WHERE d.date BETWEEN (CURDATE() - INTERVAL 6 DAY) AND CURDATE()
      GROUP BY d.date
      ORDER BY d.date ASC
    `, [tenantId, tenantId]);

    res.json({
      summary: {
        total_revenue: Number(salesTotals[0].total_revenue),
        total_costOfGoods: Number(salesTotals[0].total_costOfGoods),
        gross_profit: grossProfit,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        net_margin_pct: salesTotals[0].total_revenue > 0 
          ? Number(((netProfit / salesTotals[0].total_revenue) * 100).toFixed(2)) 
          : 0,
        total_sales_count: salesTotals[0].total_sales_count,
        total_products: inventoryTotals[0].total_products,
        total_inventory_value: Number(inventoryTotals[0].total_inventory_value),
        total_inventory_cost: Number(inventoryTotals[0].total_inventory_cost),
        low_stock_count: inventoryTotals[0].low_stock_count || 0
      },
      low_stock_products: lowStockProducts,
      recent_sales: recentSales,
      daily_chart: dailySalesChart
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
