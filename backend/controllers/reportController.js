const db = require('../config/db');

exports.getProfitLossReport = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { start_date, end_date } = req.query;

    let startDate, endDate;
    const now = new Date();

    if (start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else {
      startDate = '2000-01-01';
      endDate = '2099-12-31';
    }

    // 1. Total Sales Revenue, COGS, Gross Product Profit & Delivery Charge Profit
    const [salesResult] = await db.query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales_revenue,
        COALESCE(SUM(total_cost), 0) as total_cogs,
        COALESCE(SUM(gross_profit), 0) as gross_product_profit,
        COALESCE(SUM(delivery_fee_charged), 0) as total_delivery_fee_charged,
        COALESCE(SUM(courier_actual_cost), 0) as total_courier_actual_cost,
        COALESCE(SUM(delivery_profit), 0) as gross_delivery_profit
       FROM sales
       WHERE tenant_id = ? AND DATE(sale_date) BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );

    // 2. Returned Orders Delivery Profit Reversals (Direct sum of return_delivery_loss from returns)
    const [returnedDeliverySummary] = await db.query(
      `SELECT 
        COALESCE(SUM(r.return_delivery_loss), 0) as returned_delivery_profit_reversal
       FROM returns r
       WHERE r.tenant_id = ? AND DATE(r.return_date) BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );

    // 3. Total Operating Expenses Categorized
    const [expenseCategoryRows] = await db.query(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE tenant_id = ? AND DATE(expense_date) BETWEEN ? AND ?
       GROUP BY category`,
      [tenantId, startDate, endDate]
    );

    // 4. Total Courier Return Fees from returns table
    const [returnFeesResult] = await db.query(
      `SELECT COALESCE(SUM(courier_charge), 0) as total_courier_return_charges
       FROM returns
       WHERE tenant_id = ? AND DATE(return_date) BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );

    // 5. Total Paid Ads Spend
    const [adsResult] = await db.query(
      `SELECT COALESCE(SUM(total_bdt_cost), 0) as total_paid_ads_cost
       FROM paid_ads
       WHERE tenant_id = ? AND ad_date BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );

    const grossSalesRevenue = Number(salesResult[0].total_sales_revenue || 0);
    const totalCogs = Number(salesResult[0].total_cogs || 0);
    const grossProductProfit = Number(salesResult[0].gross_product_profit || 0);
    const grossDeliveryProfit = Number(salesResult[0].gross_delivery_profit || 0);
    const returnedDeliveryProfitReversal = Number(returnedDeliverySummary[0].returned_delivery_profit_reversal || 0);

    const netDeliveryProfit = grossDeliveryProfit - returnedDeliveryProfitReversal;
    const totalOperatingGrossIncome = grossProductProfit + netDeliveryProfit;

    let expenseBreakdown = {};
    let totalOperatingExpenses = 0;

    expenseCategoryRows.forEach(row => {
      const amt = Number(row.total);
      expenseBreakdown[row.category] = amt;
      totalOperatingExpenses += amt;
    });

    const totalReturnFees = Number(returnFeesResult[0].total_courier_return_charges || 0);
    const totalAdsCost = Number(adsResult[0].total_paid_ads_cost || 0);

    const netOperatingProfit = totalOperatingGrossIncome - totalOperatingExpenses;
    const profitMarginPct = grossSalesRevenue > 0 ? ((netOperatingProfit / grossSalesRevenue) * 100).toFixed(2) : 0;

    res.json({
      date_range: { startDate, endDate },
      financial_summary: {
        total_sales_revenue: Number(grossSalesRevenue.toFixed(2)),
        total_cogs: Number(totalCogs.toFixed(2)),
        gross_product_profit: Number(grossProductProfit.toFixed(2)),
        gross_delivery_profit: Number(grossDeliveryProfit.toFixed(2)),
        returned_delivery_profit_reversal: Number(returnedDeliveryProfitReversal.toFixed(2)),
        net_delivery_profit: Number(netDeliveryProfit.toFixed(2)),
        total_operating_gross_income: Number(totalOperatingGrossIncome.toFixed(2)),
        total_operating_expenses: Number(totalOperatingExpenses.toFixed(2)),
        net_operating_profit: Number(netOperatingProfit.toFixed(2)),
        profit_margin_pct: Number(profitMarginPct)
      },
      expense_breakdown: expenseBreakdown,
      paid_ads_total: totalAdsCost,
      courier_returns_total: totalReturnFees
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
