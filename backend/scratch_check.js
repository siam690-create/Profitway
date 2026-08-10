const db = require('./config/db');

(async () => {
  try {
    const [tenants] = await db.query('SELECT id, shop_name, shop_code FROM tenants');
    console.log('--- TENANTS ---');
    console.log(tenants);

    const [returns] = await db.query('SELECT id, tenant_id, return_no, courier_name, courier_charge, return_delivery_loss FROM returns');
    console.log('--- RETURNS (Count: ' + returns.length + ') ---');
    console.log(returns);

    const [items] = await db.query('SELECT id, tenant_id, return_id, product_id, product_name, quantity FROM return_items');
    console.log('--- RETURN ITEMS (Count: ' + items.length + ') ---');
    console.log(items);

    const [products] = await db.query('SELECT id, tenant_id, name, sku FROM products');
    console.log('--- PRODUCTS (Count: ' + products.length + ') ---');
    console.log(products.slice(0, 10));

    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
