require('dotenv').config();
const db = require('./config/db');

async function checkM10TWSReturns() {
  try {
    // 1. Find product
    const [prods] = await db.query(
      `SELECT id, name, sku FROM products WHERE sku LIKE '%M10TWS%' OR name LIKE '%M10%' OR name LIKE '%TWS%'`
    );
    console.log('=== MATCHED PRODUCTS ===');
    console.table(prods);

    const prodIds = prods.map(p => p.id);
    const prodNames = prods.map(p => p.name.toLowerCase());

    // 2. Fetch all return items for these products or matching name
    const [returnsList] = await db.query(
      `SELECT 
         ri.id as return_item_id,
         ri.product_id,
         ri.product_name,
         ri.quantity,
         ri.restock_condition,
         r.id as return_id,
         r.return_no,
         r.invoice_no,
         r.courier_name,
         r.courier_charge,
         r.return_date,
         r.created_at
       FROM return_items ri
       JOIN returns r ON ri.return_id = r.id AND ri.tenant_id = r.tenant_id
       WHERE ri.product_id IN (?) OR LOWER(ri.product_name) LIKE '%m10%'
       ORDER BY r.return_date ASC, r.created_at ASC`,
      [prodIds.length > 0 ? prodIds : [0]]
    );

    console.log(`=== M10 TWS RETURN DETAILS (TOTAL ITEMS RECORDED: ${returnsList.length}) ===`);
    
    let totalQty = 0;
    const dateBreakdown = {};

    returnsList.forEach((r, idx) => {
      const d = (r.return_date || r.created_at).toISOString().slice(0, 10);
      const qty = Number(r.quantity || 1);
      totalQty += qty;
      if (!dateBreakdown[d]) dateBreakdown[d] = { count: 0, qty: 0, returns: [] };
      dateBreakdown[d].count += 1;
      dateBreakdown[d].qty += qty;
      dateBreakdown[d].returns.push({
        return_no: r.return_no,
        invoice_no: r.invoice_no,
        courier: r.courier_name,
        qty: qty,
        courier_charge: r.courier_charge
      });
    });

    console.log('\n--- DATE-WISE SUMMARY ---');
    console.table(
      Object.entries(dateBreakdown).map(([date, info]) => ({
        Date: date,
        'Return Records': info.count,
        'Total Units Returned': info.qty
      }))
    );

    console.log(`\nTOTAL RETURNED UNITS FOR M10 TWS: ${totalQty}`);

    console.log('\n--- DETAILED RETURN RECORDS LIST ---');
    returnsList.forEach((r, i) => {
      const d = (r.return_date || r.created_at).toISOString().slice(0, 10);
      console.log(`${i + 1}. Date: ${d} | Return No: ${r.return_no} | Invoice: ${r.invoice_no || 'N/A'} | Courier: ${r.courier_name} | Qty: ${r.quantity} | Courier Fee: ৳${r.courier_charge}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkM10TWSReturns();
