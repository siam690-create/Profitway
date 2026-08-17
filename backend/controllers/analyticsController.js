const db = require('../config/db');

// Complete Financial Analytics Breakdown with Product Delivery Profits, Wholesale B2B, ROAS, Risk Audit & Product Rankings
exports.getProductAnalytics = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const tenantId = req.user.tenantId;
    const { range, start_date, end_date } = req.query;

    let startDate, endDate;
    const now = new Date();
    const isAllTime = range === 'all' || !range || range === 'All Time';

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
      startDate = '2000-01-01';
      endDate = '2099-12-31';
    }

    let salesWhere = 'WHERE tenant_id = ?';
    let returnsWhere = 'WHERE ri.tenant_id = ?';
    let returnsOnlyWhere = 'WHERE tenant_id = ?';
    let adsWhere = 'WHERE tenant_id = ?';
    let expensesWhere = 'WHERE tenant_id = ? AND category NOT IN (\'Marketing\', \'Courier Return Charges\', \'Courier Return\', \'Return Fees\')';
    let wholesaleWhere = 'WHERE tenant_id = ?';
    let wholesaleBuyersWhere = 'WHERE wc.tenant_id = ?';
    
    let baseParams = [tenantId];

    if (!isAllTime) {
      salesWhere += ' AND DATE(COALESCE(sale_date, created_at)) BETWEEN ? AND ?';
      returnsWhere += ' AND DATE(COALESCE(r.return_date, r.created_at)) BETWEEN ? AND ?';
      returnsOnlyWhere += ' AND DATE(COALESCE(return_date, created_at)) BETWEEN ? AND ?';
      adsWhere += ' AND DATE(COALESCE(ad_date, created_at)) BETWEEN ? AND ?';
      expensesWhere += ' AND DATE(COALESCE(expense_date, created_at)) BETWEEN ? AND ?';
      wholesaleWhere += ' AND DATE(sale_date) BETWEEN ? AND ?';
      wholesaleBuyersWhere += ' AND DATE(ws.sale_date) BETWEEN ? AND ?';
      baseParams.push(startDate, endDate);
    }

    // 1. Overall Gross Sales Financials & Delivery Charge Profits
    let salesSummary = [{ gross_sales_revenue: 0, gross_cogs: 0, gross_projected_profit: 0, total_delivery_charged: 0, total_courier_actual_cost: 0, total_delivery_profit: 0, total_pos_orders: 0 }];
    try {
      const [rows] = await db.query(
        `SELECT 
          COUNT(*) as total_pos_orders,
          COALESCE(SUM(total_amount), 0) as gross_sales_revenue,
          COALESCE(SUM(total_cost), 0) as gross_cogs,
          COALESCE(SUM(gross_profit), 0) as gross_projected_profit,
          COALESCE(SUM(delivery_fee_charged), 0) as total_delivery_charged,
          COALESCE(SUM(courier_actual_cost), 0) as total_courier_actual_cost,
          COALESCE(SUM(delivery_profit), 0) as total_delivery_profit
         FROM sales ${salesWhere}`,
        baseParams
      );
      if (rows.length > 0) salesSummary = rows;
    } catch (e) {
      console.error('Analytics salesSummary Query Error:', e.message);
    }

    // 2. Returned Sales Value & Unearned Product Profit Reversal
    let returnedSalesSummary = [{ returned_sales_revenue: 0, returned_cogs: 0, returned_delivery_profit_reversal: 0 }];
    try {
      const [rows] = await db.query(
        `SELECT 
          COALESCE(SUM(ri.quantity * p.selling_price), 0) as returned_sales_revenue,
          COALESCE(SUM(ri.quantity * p.cost_price), 0) as returned_cogs,
          COALESCE(SUM(COALESCE(r.return_delivery_loss, r.courier_charge, 0)), 0) as returned_delivery_profit_reversal
         FROM return_items ri
         JOIN returns r ON ri.return_id = r.id AND ri.tenant_id = r.tenant_id
         JOIN products p ON ri.product_id = p.id AND ri.tenant_id = p.tenant_id
         ${returnsWhere}`,
        baseParams
      );
      if (rows.length > 0) returnedSalesSummary = rows;
    } catch (e) {
      console.error('Analytics returnedSalesSummary Query Error:', e.message);
    }

    // 3. Total Paid Ads Cost & ROAS Calculation
    let adsSummary = [{ total_paid_ads_cost: 0 }];
    try {
      const [rows] = await db.query(
        `SELECT COALESCE(SUM(total_bdt_cost), 0) as total_paid_ads_cost
         FROM paid_ads ${adsWhere}`,
        baseParams
      );
      if (rows.length > 0) adsSummary = rows;
    } catch (e) {
      console.error('Analytics adsSummary Query Error:', e.message);
    }

    // 4. Total Courier Return Charges & Count
    let returnsSummary = [{ total_returns_count: 0, total_courier_return_cost: 0 }];
    try {
      const [rows] = await db.query(
        `SELECT 
          COUNT(*) as total_returns_count,
          COALESCE(SUM(courier_charge), 0) as total_courier_return_cost
         FROM returns ${returnsOnlyWhere}`,
        baseParams
      );
      if (rows.length > 0) returnsSummary = rows;
    } catch (e) {
      console.error('Analytics returnsSummary Query Error:', e.message);
    }

    // 5. Total Operating Expenses
    let expensesSummary = [{ total_other_expenses: 0 }];
    try {
      const [rows] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total_other_expenses
         FROM expenses ${expensesWhere}`,
        baseParams
      );
      if (rows.length > 0) expensesSummary = rows;
    } catch (e) {
      console.error('Analytics expensesSummary Query Error:', e.message);
    }

    // 6. Wholesale B2B Analytics Summary
    let wholesaleSummary = [{ wholesale_orders_count: 0, wholesale_revenue: 0, wholesale_cogs: 0, wholesale_profit: 0, wholesale_cash_collected: 0, wholesale_pending_pawna: 0 }];
    try {
      const [rows] = await db.query(
        `SELECT 
          COUNT(*) as wholesale_orders_count,
          COALESCE(SUM(total_amount), 0) as wholesale_revenue,
          COALESCE(SUM(total_cost), 0) as wholesale_cogs,
          COALESCE(SUM(gross_profit), 0) as wholesale_profit,
          COALESCE(SUM(paid_amount), 0) as wholesale_cash_collected,
          COALESCE(SUM(due_amount), 0) as wholesale_pending_pawna
         FROM wholesale_sales ${wholesaleWhere}`,
        baseParams
      );
      if (rows.length > 0) wholesaleSummary = rows;
    } catch (e) {
      console.error('Analytics wholesaleSummary Query Error:', e.message);
    }

    // 7. Top Wholesale Buyers Performance Ranking (Fixed MySQL 8 ONLY_FULL_GROUP_BY)
    let topWholesaleBuyers = [];
    try {
      const [rows] = await db.query(
        `SELECT 
          wc.id as buyer_id,
          wc.name as buyer_name,
          wc.phone,
          wc.company_name,
          COUNT(ws.id) as total_orders,
          COALESCE(SUM(ws.total_amount), 0) as total_purchased_amount,
          COALESCE(SUM(ws.gross_profit), 0) as profit_generated,
          COALESCE(SUM(ws.due_amount), 0) as current_due
         FROM wholesale_customers wc
         JOIN wholesale_sales ws ON wc.id = ws.customer_id AND wc.tenant_id = ws.tenant_id
         ${wholesaleBuyersWhere}
         GROUP BY wc.id, wc.name, wc.phone, wc.company_name
         ORDER BY total_purchased_amount DESC
         LIMIT 10`,
        baseParams
      );
      topWholesaleBuyers = rows;
    } catch (e) {
      console.error('Analytics topWholesaleBuyers Query Error:', e.message);
    }

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
    const returnChargesCost = Number(returnsSummary[0].total_returns_count > 0 ? (returnsSummary[0].total_courier_return_cost || 0) : 0);
    const totalReturnsCount = Number(returnsSummary[0].total_returns_count || 0);
    const otherExpensesCost = Number(expensesSummary[0].total_other_expenses || 0);

    const returnRatePct = totalPosOrders > 0 ? ((totalReturnsCount / totalPosOrders) * 100).toFixed(1) : '0.0';
    const roasMultiplier = paidAdsCost > 0 ? (grossSalesRev / paidAdsCost).toFixed(2) : '0.0';

    const resellerGrossProfit = Number(wholesaleSummary[0].wholesale_profit || 0);

    const netDelivProfitHarmonized = grossDeliveryProfit - returnChargesCost;
    // NET REAL PROFIT = Realized Retail Product Profit + Net Delivery Profit + Reseller Profit - Paid Ads - Return Courier Charges - General Expenses
    const netRealProfit = netRealizedGrossProfit + netDelivProfitHarmonized + resellerGrossProfit - paidAdsCost - returnChargesCost - otherExpensesCost;

    // 8. Itemized Product-wise Breakdown
    let salesAggParams = [tenantId];
    let returnsAggParams = [tenantId];
    let adsAggParams = [tenantId];

    let prodSalesWhere = 'WHERE si.tenant_id = ?';
    let prodReturnsWhere = 'WHERE ri.tenant_id = ?';
    let prodAdsWhere = 'WHERE tenant_id = ? AND product_id IS NOT NULL';

    if (!isAllTime) {
      prodSalesWhere += ' AND (s.sale_date IS NULL OR DATE(COALESCE(s.sale_date, s.created_at)) BETWEEN ? AND ?)';
      salesAggParams.push(startDate, endDate);

      prodReturnsWhere += ' AND (r.return_date IS NULL OR DATE(COALESCE(r.return_date, r.created_at)) BETWEEN ? AND ?)';
      returnsAggParams.push(startDate, endDate);

      prodAdsWhere += ' AND (ad_date IS NULL OR DATE(COALESCE(ad_date, created_at)) BETWEEN ? AND ?)';
      adsAggParams.push(startDate, endDate);
    }

    let salesAgg = [];
    try {
      const [rows] = await db.query(
        `SELECT 
           si.product_id,
           COUNT(DISTINCT s.id) as customer_parcels_count,
           SUM(si.quantity) as units_sold,
           SUM(si.total_price) as gross_revenue,
           SUM(si.total_cost) as cogs,
           SUM(si.item_profit) as gross_profit,
           SUM(CASE WHEN s.total_amount > 0 THEN (s.delivery_profit * (si.total_price / s.total_amount)) ELSE 0 END) as product_delivery_profit
         FROM sale_items si
         JOIN sales s ON si.sale_id = s.id AND si.tenant_id = s.tenant_id
         ${prodSalesWhere}
         GROUP BY si.product_id`,
        salesAggParams
      );
      salesAgg = rows;
    } catch (e) {
      console.error('Analytics salesAgg Query Error:', e.message);
    }

    const [allProducts] = await db.query('SELECT id, name, sku, is_combo, stock_quantity, cost_price, selling_price FROM products WHERE tenant_id = ?', [tenantId]);

    const salesMap = new Map();
    salesAgg.forEach(s => {
      if (s.product_id !== null && s.product_id !== undefined) {
        salesMap.set(Number(s.product_id), s);
        salesMap.set(String(s.product_id), s);
      }
    });

    let returnsAgg = [];
    try {
      let returnsOnlyWhere = 'WHERE tenant_id = ?';
      let returnsOnlyParams = [tenantId];
      if (!isAllTime) {
        returnsOnlyWhere += ' AND (return_date IS NULL OR DATE(COALESCE(return_date, created_at)) BETWEEN ? AND ?)';
        returnsOnlyParams.push(startDate, endDate);
      }

      // Fetch all returns for this tenant directly from returns table
      const [allReturnsList] = await db.query(`SELECT * FROM returns ${returnsOnlyWhere}`, returnsOnlyParams);

      // Fetch all return items for this tenant with proper date filtering
      let allReturnItemsList = [];
      try {
        const [riRows] = await db.query(
          `SELECT ri.*, r.courier_charge, r.return_delivery_loss 
           FROM return_items ri
           JOIN returns r ON ri.return_id = r.id AND ri.tenant_id = r.tenant_id
           ${returnsWhere}`,
          baseParams
        );
        allReturnItemsList = riRows;
      } catch (errRi) {
        console.warn('Note on return_items query:', errRi.message);
      }

      // Maps for product matching
      const prodMapById = new Map(allProducts.map(p => [Number(p.id), p]));
      const prodMapByName = new Map(allProducts.map(p => [String(p.name).trim().toLowerCase(), p]));
      const prodMapBySku = new Map(allProducts.map(p => [String(p.sku || '').trim().toLowerCase(), p]));

      const returnSummaryByProd = new Map();

      const getOrCreateSummary = (pId) => {
        const numId = Number(pId);
        if (!returnSummaryByProd.has(numId)) {
          returnSummaryByProd.set(numId, {
            product_id: numId,
            units_returned: 0,
            returned_profit_reversal: 0,
            returned_deliv_profit_reversal: 0,
            return_charges: 0
          });
        }
        return returnSummaryByProd.get(numId);
      };

      // Calculate total shop return courier fees and delivery losses
      const totalShopCourierCharges = allReturnsList.reduce((sum, r) => sum + Number(r.courier_charge || 0), 0);
      const totalShopDeliveryLosses = allReturnsList.reduce((sum, r) => sum + Number(r.return_delivery_loss || 0), 0);

      // Process direct return_items with STRICT matching (NO fallback to allProducts[0])
      for (const item of allReturnItemsList) {
        let matchedProduct = null;
        if (item.product_id) {
          matchedProduct = prodMapById.get(Number(item.product_id));
        }
        if (!matchedProduct && item.product_name) {
          const nameClean = String(item.product_name).trim().toLowerCase();
          matchedProduct = prodMapByName.get(nameClean) || prodMapBySku.get(nameClean);
          if (!matchedProduct) {
            matchedProduct = allProducts.find(p => {
              const pName = String(p.name).toLowerCase();
              const pSku = String(p.sku || '').toLowerCase();
              return pName.includes(nameClean) || nameClean.includes(pName) || (pSku && pSku === nameClean);
            });
          }
        }

        if (matchedProduct) {
          const summary = getOrCreateSummary(matchedProduct.id);
          const qty = Number(item.quantity || 1);
          summary.units_returned += qty;

          const sellPrice = Number(matchedProduct.selling_price || 0);
          const costPrice = Number(matchedProduct.cost_price || 0);
          summary.returned_profit_reversal += qty * (sellPrice - costPrice);
        }
      }

      // Allocate total shop courier return fees and delivery profit reversals ONLY to returned products
      const totalReturnedUnitsAcrossAll = Array.from(returnSummaryByProd.values()).reduce((sum, s) => sum + s.units_returned, 0);

      for (const p of allProducts) {
        const summary = getOrCreateSummary(p.id);
        const retQty = summary.units_returned;

        if (totalReturnedUnitsAcrossAll > 0 && retQty > 0) {
          const ratio = retQty / totalReturnedUnitsAcrossAll;
          summary.return_charges = Number((totalShopCourierCharges * ratio).toFixed(2));
          summary.returned_deliv_profit_reversal = Number((totalShopDeliveryLosses * ratio).toFixed(2));
        } else {
          summary.return_charges = 0;
          summary.returned_deliv_profit_reversal = 0;
        }
      }

      returnsAgg = Array.from(returnSummaryByProd.values());
    } catch (e) {
      console.error('Analytics returnsAgg Calculation Error:', e);
    }

    let adsAgg = [];
    try {
      const [rows] = await db.query(
        `SELECT 
           product_id,
           SUM(total_bdt_cost) as ad_spend_bdt
         FROM paid_ads
         ${prodAdsWhere}
         GROUP BY product_id`,
        adsAggParams
      );
      adsAgg = rows;
    } catch (e) {
      console.error('Analytics adsAgg Query Error:', e.message);
    }



    const returnsMap = new Map();
    returnsAgg.forEach(r => {
      if (r.product_id !== null && r.product_id !== undefined) {
        returnsMap.set(Number(r.product_id), r);
        returnsMap.set(String(r.product_id), r);
      }
    });

    const adsMap = new Map();
    adsAgg.forEach(a => {
      if (a.product_id !== null && a.product_id !== undefined) {
        adsMap.set(Number(a.product_id), a);
        adsMap.set(String(a.product_id), a);
      }
    });

    const formattedProducts = allProducts.map(p => {
      const pIdNum = Number(p.id);
      const pIdStr = String(p.id);

      const s = salesMap.get(pIdNum) || salesMap.get(pIdStr) || {};
      const r = returnsMap.get(pIdNum) || returnsMap.get(pIdStr) || {};
      const a = adsMap.get(pIdNum) || adsMap.get(pIdStr) || {};

      const gProfit = Number(s.gross_profit || 0);
      const delivProfit = Number(s.product_delivery_profit || 0);
      const revProductProfit = Number(r.returned_profit_reversal || 0);
      const revDelivProfit = Number(r.returned_deliv_profit_reversal || 0);
      const adSpend = Number(a.ad_spend_bdt || 0);
      const returnCharge = Number(r.return_charges || 0);
      const returnProfitAdjust = revProductProfit + revDelivProfit;

      const netProfit = gProfit + delivProfit - returnProfitAdjust - adSpend - returnCharge;
      const cogs = Number(s.cogs || 0);
      const marginPct = cogs > 0 ? ((netProfit / cogs) * 100).toFixed(1) : '0.0';

      const grossRev = Number(s.gross_revenue || 0);
      const unitsSold = Number(s.units_sold || 0);
      const roasVal = adSpend > 0 ? Number((grossRev / adSpend).toFixed(2)) : 0;
      const cpaVal = unitsSold > 0 && adSpend > 0 ? Number((adSpend / unitsSold).toFixed(2)) : 0;

      return {
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        is_combo: p.is_combo,
        stock_quantity: p.stock_quantity,
        cost_price: Number(p.cost_price),
        selling_price: Number(p.selling_price),
        parcels_count: Number(s.customer_parcels_count || 0),
        units_sold: unitsSold,
        units_returned: Number(r.units_returned || 0),
        gross_revenue: grossRev,
        cogs: cogs,
        gross_profit: gProfit,
        product_delivery_profit: delivProfit,
        returned_profit_reversal: revProductProfit,
        returned_deliv_profit_reversal: revDelivProfit,
        return_profit_adjust: returnProfitAdjust,
        ad_spend_bdt: adSpend,
        return_charges: returnCharge,
        net_real_profit: netProfit,
        profit_margin: Number(marginPct),
        roas: roasVal,
        cpa: cpaVal
      };
    });

    // Sort all products by Net Real Profit descending (Most profitable products at the top)
    formattedProducts.sort((a, b) => b.net_real_profit - a.net_real_profit);

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
      .sort((a, b) => a.net_real_profit - b.net_real_profit);

    const totalRiskLoss = riskProducts.reduce((sum, p) => sum + (p.net_real_profit < 0 ? Math.abs(p.net_real_profit) : 0), 0);

    res.json({
      date_range: { range, startDate: isAllTime ? 'All Time' : startDate, endDate: isAllTime ? 'All Time' : endDate },
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
    console.error('Analytics Error:', error);
    res.status(500).json({ error: error.message });
  }
};
