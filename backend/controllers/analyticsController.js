const db = require('../config/db');

// Complete Financial Analytics Breakdown with Product Delivery Profits, Wholesale B2B, ROAS, Risk Audit & Product Rankings
exports.getProductAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { range, start_date, end_date } = req.query;

    let startDate, endDate;
    const now = new Date();

    if (range === 'today') {
      startDate = now.toISOString().slice(0, 10);
      endDate = startDate;
    } else if (range === 'week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate = firstDay.toISOString().slice(0, 10);
      endDate = new Date().toISOString().slice(0, 10);
    } else if (range === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = firstDay.toISOString().slice(0, 10);
      endDate = new Date().toISOString().slice(0, 10);
    } else if (range === 'custom' && start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else {
      // All Time
      startDate = '2000-01-01';
      endDate = '2099-12-31';
    }

    // 1. Overall Gross Sales Financials & Delivery Charge Profits
    const [salesSummary] = await db.query(
      `SELECT 
        COUNT(*) as total_pos_orders,
        COALESCE(SUM(total_amount), 0) as gross_sales_revenue,
        COALESCE(SUM(total_cost), 0) as gross_cogs,
        COALESCE(SUM(gross_profit), 0) as gross_projected_profit,
        COALESCE(SUM(delivery_fee_charged), 0) as total_delivery_charged,
        COALESCE(SUM(courier_actual_cost), 0) as total_courier_actual_cost,
        COALESCE(SUM(delivery_profit), 0) as total_delivery_profit
       FROM sales 
       WHERE tenant_id = ? AND DATE(COALESCE(sale_date, created_at)) BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );

    // 2. Returned Sales Value & Unearned Product Profit Reversal
    const [returnedSalesSummary] = await db.query(
      `SELECT 
        COALESCE(SUM(ri.quantity * p.selling_price), 0) as returned_sales_revenue,
        COALESCE(SUM(ri.quantity * p.cost_price), 0) as returned_cogs,
        COALESCE(SUM(s.delivery_profit), 0) as returned_delivery_profit_reversal
       FROM return_items ri
       JOIN returns r ON ri.return_id = r.id AND ri.tenant_id = r.tenant_id
       JOIN products p ON ri.product_id = p.id AND ri.tenant_id = p.tenant_id
       LEFT JOIN sales s ON r.invoice_no = s.invoice_no AND r.tenant_id = s.tenant_id
       WHERE ri.tenant_id = ? AND DATE(COALESCE(r.return_date, r.created_at)) BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );

    // 3. Total Paid Ads Cost & ROAS Calculation
    const [adsSummary] = await db.query(
      `SELECT COALESCE(SUM(total_bdt_cost), 0) as total_paid_ads_cost
       FROM paid_ads
       WHERE tenant_id = ? AND DATE(COALESCE(ad_date, created_at)) BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );

    // 4. Total Courier Return Charges (Delivery Fee Loss on Returns) & Count
    const [returnsSummary] = await db.query(
      `SELECT 
        COUNT(*) as total_returns_count,
        COALESCE(SUM(courier_charge), 0) as total_courier_return_cost
       FROM returns
       WHERE tenant_id = ? AND DATE(COALESCE(return_date, created_at)) BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );

    // 5. Total Operating Expenses (excluding Marketing and Transport)
    const [expensesSummary] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_other_expenses
       FROM expenses
       WHERE tenant_id = ? 
         AND DATE(COALESCE(expense_date, created_at)) BETWEEN ? AND ?
         AND category NOT IN ('Marketing', 'Transport')`,
      [tenantId, startDate, endDate]
    );

    // 6. Wholesale B2B Analytics Summary
    const [wholesaleSummary] = await db.query(
      `SELECT 
        COUNT(*) as wholesale_orders_count,
        COALESCE(SUM(total_amount), 0) as wholesale_revenue,
        COALESCE(SUM(total_cost), 0) as wholesale_cogs,
        COALESCE(SUM(gross_profit), 0) as wholesale_profit,
        COALESCE(SUM(paid_amount), 0) as wholesale_cash_collected,
        COALESCE(SUM(due_amount), 0) as wholesale_pending_pawna
       FROM wholesale_sales
       WHERE tenant_id = ? AND DATE(COALESCE(sale_date, created_at)) BETWEEN ? AND ?`,
      [tenantId, startDate, endDate]
    );

    // 7. Top Wholesale Buyers Performance Ranking
    const [topWholesaleBuyers] = await db.query(
      `SELECT 
        wc.id as buyer_id,
        wc.name as buyer_name,
        wc.phone,
        wc.company_name,
        COUNT(ws.id) as orders_count,
        COALESCE(SUM(ws.total_amount), 0) as total_spent,
        COALESCE(SUM(ws.gross_profit), 0) as total_profit_generated,
        COALESCE(SUM(ws.due_amount), 0) as current_pawna_due
       FROM wholesale_customers wc
       JOIN wholesale_sales ws ON wc.id = ws.customer_id AND ws.tenant_id = wc.tenant_id
       WHERE wc.tenant_id = ? AND DATE(COALESCE(ws.sale_date, ws.created_at)) BETWEEN ? AND ?
       GROUP BY wc.id
       ORDER BY total_spent DESC LIMIT 10`,
      [tenantId, startDate, endDate]
    );

    const grossSalesRev = Number(salesSummary[0].gross_sales_revenue || 0);
    const grossCogs = Number(salesSummary[0].gross_cogs || 0);
    const grossProjectedProfit = Number(salesSummary[0].gross_projected_profit || 0);
    const deliveryCharged = Number(salesSummary[0].total_delivery_charged || 0);
    const courierCost = Number(salesSummary[0].total_courier_actual_cost || 0);
    const grossDeliveryProfit = Number(salesSummary[0].total_delivery_profit || 0);
    const totalPosOrders = Number(salesSummary[0].total_pos_orders || 0);

    const returnedSalesRev = Number(returnedSalesSummary[0].returned_sales_revenue || 0);
    const returnedCogs = Number(returnedSalesSummary[0].returned_cogs || 0);
    const returnedProductProfitReversal = returnedSalesRev - returnedCogs;
    const returnedDeliveryProfitReversal = Number(returnedSalesSummary[0].returned_delivery_profit_reversal || 0);

    const netRealizedSales = grossSalesRev - returnedSalesRev;
    const netRealizedGrossProfit = grossProjectedProfit - returnedProductProfitReversal;
    const netDeliveryProfit = grossDeliveryProfit - returnedDeliveryProfitReversal;

    const paidAdsCost = Number(adsSummary[0].total_paid_ads_cost || 0);
    const returnChargesCost = Number(returnsSummary[0].total_courier_return_cost || 0);
    const totalReturnsCount = Number(returnsSummary[0].total_returns_count || 0);
    const otherExpensesCost = Number(expensesSummary[0].total_other_expenses || 0);

    const returnRatePct = totalPosOrders > 0 ? ((totalReturnsCount / totalPosOrders) * 100).toFixed(1) : '0.0';
    const roasMultiplier = paidAdsCost > 0 ? (grossSalesRev / paidAdsCost).toFixed(2) : '0.0';

    // NET REAL PROFIT = Realized Product Profit + Net Delivery Profit - Paid Ads - Courier Return Charges - Other Expenses
    const netRealProfit = netRealizedGrossProfit + netDeliveryProfit - paidAdsCost - returnChargesCost - otherExpensesCost;

    // 8. Itemized Product-wise Breakdown with Delivery Profits
    const [productBreakdown] = await db.query(
      `SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.is_combo,
        p.stock_quantity,
        p.cost_price,
        p.selling_price,
        COALESCE(sales_agg.units_sold, 0) as units_sold,
        COALESCE(sales_agg.gross_revenue, 0) as gross_revenue,
        COALESCE(sales_agg.cogs, 0) as cogs,
        COALESCE(sales_agg.gross_profit, 0) as gross_profit,
        COALESCE(sales_agg.product_delivery_profit, 0) as product_delivery_profit,
        COALESCE(returns_agg.units_returned, 0) as units_returned,
        COALESCE(returns_agg.returned_profit_reversal, 0) as returned_profit_reversal,
        COALESCE(returns_agg.returned_deliv_profit_reversal, 0) as returned_deliv_profit_reversal,
        COALESCE(returns_agg.return_charges, 0) as return_charges,
        COALESCE(ads_agg.ad_spend_bdt, 0) as ad_spend_bdt
       FROM products p
       LEFT JOIN (
         SELECT 
           si.product_id,
           SUM(si.quantity) as units_sold,
           SUM(si.total_price) as gross_revenue,
           SUM(si.total_cost) as cogs,
           SUM(si.item_profit) as gross_profit,
           SUM(s.delivery_profit) as product_delivery_profit
         FROM sale_items si
         JOIN sales s ON si.sale_id = s.id AND si.tenant_id = s.tenant_id
         WHERE si.tenant_id = ? AND DATE(COALESCE(s.sale_date, s.created_at)) BETWEEN ? AND ?
         GROUP BY si.product_id
       ) sales_agg ON p.id = sales_agg.product_id
       LEFT JOIN (
         SELECT 
           ri.product_id,
           SUM(ri.quantity) as units_returned,
           SUM(ri.quantity * (p_sub.selling_price - p_sub.cost_price)) as returned_profit_reversal,
           SUM(s_sub.delivery_profit) as returned_deliv_profit_reversal,
           SUM(r.courier_charge) as return_charges
         FROM return_items ri
         JOIN returns r ON ri.return_id = r.id AND ri.tenant_id = r.tenant_id
         JOIN products p_sub ON ri.product_id = p_sub.id AND ri.tenant_id = p_sub.tenant_id
         LEFT JOIN sales s_sub ON r.invoice_no = s_sub.invoice_no AND r.tenant_id = s_sub.tenant_id
         WHERE ri.tenant_id = ? AND DATE(COALESCE(r.return_date, r.created_at)) BETWEEN ? AND ?
         GROUP BY ri.product_id
       ) returns_agg ON p.id = returns_agg.product_id
       LEFT JOIN (
         SELECT 
           product_id,
           SUM(total_bdt_cost) as ad_spend_bdt
         FROM paid_ads
         WHERE tenant_id = ? AND DATE(COALESCE(ad_date, created_at)) BETWEEN ? AND ? AND product_id IS NOT NULL
         GROUP BY product_id
       ) ads_agg ON p.id = ads_agg.product_id
       WHERE p.tenant_id = ?`,
      [tenantId, startDate, endDate, tenantId, startDate, endDate, tenantId, startDate, endDate, tenantId]
    );

    const formattedProducts = productBreakdown.map(p => {
      const gProfit = Number(p.gross_profit || 0);
      const delivProfit = Number(p.product_delivery_profit || 0);
      const revProductProfit = Number(p.returned_profit_reversal || 0);
      const revDelivProfit = Number(p.returned_deliv_profit_reversal || 0);
      const adSpend = Number(p.ad_spend_bdt || 0);
      const returnCharge = Number(p.return_charges || 0);

      const netProfit = gProfit + delivProfit - revProductProfit - revDelivProfit - adSpend - returnCharge;
      const cogs = Number(p.cogs || 0);
      const marginPct = cogs > 0 ? ((netProfit / cogs) * 100).toFixed(1) : '0.0';

      const grossRev = Number(p.gross_revenue || 0);
      const unitsSold = Number(p.units_sold || 0);
      const roasVal = adSpend > 0 ? Number((grossRev / adSpend).toFixed(2)) : 0;
      const cpaVal = unitsSold > 0 && adSpend > 0 ? Number((adSpend / unitsSold).toFixed(2)) : 0;

      return {
        product_id: p.product_id,
        product_name: p.product_name,
        sku: p.sku,
        is_combo: p.is_combo,
        stock_quantity: p.stock_quantity,
        cost_price: Number(p.cost_price),
        selling_price: Number(p.selling_price),
        units_sold: unitsSold,
        units_returned: Number(p.units_returned || 0),
        gross_revenue: grossRev,
        cogs: cogs,
        gross_profit: gProfit,
        product_delivery_profit: delivProfit,
        returned_profit_reversal: revProductProfit,
        returned_deliv_profit_reversal: revDelivProfit,
        ad_spend_bdt: adSpend,
        return_charges: returnCharge,
        net_real_profit: netProfit,
        profit_margin: Number(marginPct),
        roas: roasVal,
        cpa: cpaVal
      };
    });

    // Top Selling Products
    const topSellers = [...formattedProducts]
      .filter(p => p.units_sold > 0)
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, 5);

    // Slow-Moving Products
    const slowMovers = [...formattedProducts]
      .filter(p => !p.is_combo && p.stock_quantity > 0 && p.units_sold <= 2)
      .sort((a, b) => b.stock_quantity - a.stock_quantity)
      .slice(0, 5);

    // Product Ad Performance Ranking
    const adsPerformance = [...formattedProducts]
      .filter(p => p.ad_spend_bdt > 0 || p.units_sold > 0)
      .sort((a, b) => b.roas - a.roas);

    // Risk Products Audit List (Loss-Making Products & High Risk Alerts)
    const riskProducts = formattedProducts
      .filter(p => p.net_real_profit < 0 || p.selling_price < p.cost_price || (p.units_returned > 0 && p.units_returned >= p.units_sold))
      .map(p => {
        let risk_reason = 'Negative Net Real Profit';
        let risk_recommendation = 'Review Pricing & Operating Margin';

        if (p.selling_price < p.cost_price) {
          risk_reason = 'Selling Price below Cost Price (Direct Loss)';
          risk_recommendation = 'Increase Selling Price immediately';
        } else if (p.ad_spend_bdt > (p.gross_profit + p.product_delivery_profit)) {
          risk_reason = 'Ad Spend exceeds Product Profit';
          risk_recommendation = 'Pause or Optimize Ad Campaign targeting';
        } else if (p.units_returned > 0 && p.units_returned >= p.units_sold) {
          risk_reason = 'High Courier Return Rate & Reversal Loss';
          risk_recommendation = 'Improve Packaging & Order Confirmation';
        }

        return {
          ...p,
          risk_reason,
          risk_recommendation
        };
      })
      .sort((a, b) => a.net_real_profit - b.net_real_profit); // Worst losses first!

    const totalRiskLoss = riskProducts.reduce((sum, p) => sum + (p.net_real_profit < 0 ? Math.abs(p.net_real_profit) : 0), 0);

    res.json({
      date_range: { range, startDate, endDate },
      summary: {
        gross_sales_revenue: Number(grossSalesRev.toFixed(2)),
        gross_cogs: Number(grossCogs.toFixed(2)),
        gross_projected_profit: Number(grossProjectedProfit.toFixed(2)),
        returned_sales_revenue: Number(returnedSalesRev.toFixed(2)),
        returned_profit_reversal: Number(returnedProductProfitReversal.toFixed(2)),
        returned_delivery_profit_reversal: Number(returnedDeliveryProfitReversal.toFixed(2)),
        net_realized_sales: Number(netRealizedSales.toFixed(2)),
        net_realized_gross_profit: Number(netRealizedGrossProfit.toFixed(2)),
        delivery_fee_charged: Number(deliveryCharged.toFixed(2)),
        courier_actual_cost: Number(courierCost.toFixed(2)),
        gross_delivery_profit: Number(grossDeliveryProfit.toFixed(2)),
        net_delivery_profit: Number(netDeliveryProfit.toFixed(2)),
        paid_ads_cost: Number(paidAdsCost.toFixed(2)),
        courier_return_cost: Number(returnChargesCost.toFixed(2)),
        other_expenses_cost: Number(otherExpensesCost.toFixed(2)),
        net_real_profit: Number(netRealProfit.toFixed(2)),
        total_pos_orders: totalPosOrders,
        total_returns_count: totalReturnsCount,
        return_rate_pct: returnRatePct,
        roas_multiplier: roasMultiplier,
        total_risk_products_count: riskProducts.length,
        total_risk_loss: Number(totalRiskLoss.toFixed(2))
      },
      wholesale_summary: {
        wholesale_orders_count: Number(wholesaleSummary[0].wholesale_orders_count || 0),
        wholesale_revenue: Number(wholesaleSummary[0].wholesale_revenue || 0),
        wholesale_cogs: Number(wholesaleSummary[0].wholesale_cogs || 0),
        wholesale_profit: Number(wholesaleSummary[0].wholesale_profit || 0),
        wholesale_cash_collected: Number(wholesaleSummary[0].wholesale_cash_collected || 0),
        wholesale_pending_pawna: Number(wholesaleSummary[0].wholesale_pending_pawna || 0)
      },
      top_wholesale_buyers: topWholesaleBuyers,
      top_sellers: topSellers,
      slow_movers: slowMovers,
      ads_performance: adsPerformance,
      risk_products: riskProducts,
      products: formattedProducts.filter(p => p.units_sold > 0 || p.units_returned > 0 || p.ad_spend_bdt > 0)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
