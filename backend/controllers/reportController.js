const db = require('../config/db');

exports.getProfitLossReport = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { start_date, end_date } = req.query;

    const isAllTime = !start_date || !end_date || start_date === '2000-01-01';

    let salesWhere = 'WHERE tenant_id = ?';
    let returnsWhere = 'WHERE tenant_id = ?';
    let expensesWhere = 'WHERE tenant_id = ?';
    let adsWhere = 'WHERE tenant_id = ?';
    let queryParams = [tenantId];

    if (!isAllTime) {
      salesWhere += ' AND DATE(COALESCE(sale_date, created_at)) BETWEEN ? AND ?';
      returnsWhere += ' AND DATE(COALESCE(return_date, created_at)) BETWEEN ? AND ?';
      expensesWhere += ' AND DATE(COALESCE(expense_date, created_at)) BETWEEN ? AND ?';
      adsWhere += ' AND DATE(COALESCE(ad_date, created_at)) BETWEEN ? AND ?';
      queryParams.push(start_date, end_date);
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
       FROM sales ${salesWhere}`,
      queryParams
    );

    // 2. Returned Product Sales Value & Product Profit Reversal
    const [returnedProductSummary] = await db.query(
      `SELECT 
        COALESCE(SUM(ri.quantity * p.selling_price), 0) as returned_sales_revenue,
        COALESCE(SUM(ri.quantity * p.cost_price), 0) as returned_cogs,
        COALESCE(SUM(ri.quantity * (p.selling_price - p.cost_price)), 0) as returned_product_profit_reversal
       FROM return_items ri
       JOIN returns r ON ri.return_id = r.id AND ri.tenant_id = r.tenant_id
       JOIN products p ON ri.product_id = p.id AND ri.tenant_id = p.tenant_id
       ${returnsWhere.replace('WHERE tenant_id = ?', 'WHERE ri.tenant_id = ?')}`,
      queryParams
    );

    // 3. Returned Orders Delivery Profit Reversals
    const [returnedDeliverySummary] = await db.query(
      `SELECT 
        COALESCE(SUM(r.courier_charge), 0) as returned_delivery_profit_reversal
       FROM returns r ${returnsWhere.replace('WHERE tenant_id = ?', 'WHERE r.tenant_id = ?')}`,
      queryParams
    );

    // 4. Total Operating Expenses Categorized
    const [expenseCategoryRows] = await db.query(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM expenses ${expensesWhere}
       GROUP BY category`,
      queryParams
    );

    // 5. Total Courier Return Fees from returns table
    const [returnFeesResult] = await db.query(
      `SELECT COALESCE(SUM(courier_charge), 0) as total_courier_return_charges
       FROM returns ${returnsWhere}`,
      queryParams
    );

    // 6. Total Paid Ads Spend
    const [adsResult] = await db.query(
      `SELECT COALESCE(SUM(total_bdt_cost), 0) as total_paid_ads_cost
       FROM paid_ads ${adsWhere}`,
      queryParams
    );

    // 7. Reseller Sales Gross Profit & Revenue
    let resellerWhere = 'WHERE tenant_id = ?';
    let resellerReturnWhere = 'WHERE tenant_id = ?';
    if (!isAllTime) {
      resellerWhere += ' AND DATE(COALESCE(sale_date, created_at)) BETWEEN ? AND ?';
      resellerReturnWhere += ' AND DATE(COALESCE(return_date, created_at)) BETWEEN ? AND ?';
    }
    const [resellerResult] = await db.query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as total_reseller_revenue,
        COALESCE(SUM(total_cost), 0) as total_reseller_cogs,
        COALESCE(SUM(gross_profit + delivery_profit), 0) as reseller_gross_profit
       FROM reseller_sales ${resellerWhere}`,
      queryParams
    );

    const [resellerReturnResult] = await db.query(
      `SELECT COALESCE(SUM(returned_profit_reversal), 0) as reseller_returned_profit_reversal
       FROM reseller_returns ${resellerReturnWhere}`,
      queryParams
    );

    const resellerProfitReversal = Number(resellerReturnResult[0].reseller_returned_profit_reversal || 0);
    const rawResellerProfit = Number(resellerResult[0].reseller_gross_profit || 0);
    const resellerGrossProfit = rawResellerProfit - resellerProfitReversal;
    const resellerSalesRevenue = Number(resellerResult[0].total_reseller_revenue || 0);

    const rawSalesRevenue = Number(salesResult[0].total_sales_revenue || 0);
    const returnedSalesRev = Number(returnedProductSummary[0].returned_sales_revenue || 0);
    const netSalesRevenue = Math.max(0, rawSalesRevenue - returnedSalesRev);

    const rawProductProfit = Number(salesResult[0].gross_product_profit || 0);
    const returnedProductProfitReversal = Number(returnedProductSummary[0].returned_product_profit_reversal || 0);
    const netProductProfit = rawProductProfit - returnedProductProfitReversal;

    const grossDeliveryProfit = Number(salesResult[0].gross_delivery_profit || 0);
    const returnedDeliveryProfitReversal = Number(returnedDeliverySummary[0].returned_delivery_profit_reversal || 0);

    const netDeliveryProfit = grossDeliveryProfit - returnedDeliveryProfitReversal;

    const totalOperatingGrossIncome = netProductProfit + netDeliveryProfit;

    let expenseBreakdown = {};
    let totalOperatingExpenses = 0;

    expenseCategoryRows.forEach(row => {
      const amt = Number(row.total);
      expenseBreakdown[row.category] = amt;
      totalOperatingExpenses += amt;
    });

    const totalReturnFees = Number(returnFeesResult[0].total_courier_return_charges || 0);
    const totalAdsCost = Number(adsResult[0].total_paid_ads_cost || 0);

    const netOperatingProfit = totalOperatingGrossIncome + resellerGrossProfit - totalOperatingExpenses - totalReturnFees - totalAdsCost;
    const totalRevForMargin = netSalesRevenue + resellerSalesRevenue;
    const profitMarginPct = totalRevForMargin > 0 ? ((netOperatingProfit / totalRevForMargin) * 100).toFixed(2) : 0;

    res.json({
      date_range: { startDate: start_date || 'All Time', endDate: end_date || 'All Time' },
      financial_summary: {
        total_sales_revenue: Number(netSalesRevenue.toFixed(2)),
        total_cogs: Number((salesResult[0].total_cogs - returnedProductSummary[0].returned_cogs).toFixed(2)),
        gross_product_profit: Number(netProductProfit.toFixed(2)),
        returned_product_profit_reversal: Number(returnedProductProfitReversal.toFixed(2)),
        gross_delivery_profit: Number(grossDeliveryProfit.toFixed(2)),
        returned_delivery_profit_reversal: Number(returnedDeliveryProfitReversal.toFixed(2)),
        net_delivery_profit: Number(netDeliveryProfit.toFixed(2)),
        reseller_sales_revenue: Number(resellerSalesRevenue.toFixed(2)),
        reseller_gross_profit: Number(resellerGrossProfit.toFixed(2)),
        total_operating_gross_income: Number(totalOperatingGrossIncome.toFixed(2)),
        total_operating_expenses: Number(totalOperatingExpenses.toFixed(2)),
        total_return_fees: Number(totalReturnFees.toFixed(2)),
        total_ads_cost: Number(totalAdsCost.toFixed(2)),
        net_operating_profit: Number(netOperatingProfit.toFixed(2)),
        profit_margin_pct: Number(profitMarginPct)
      },
      expense_breakdown: expenseBreakdown
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
