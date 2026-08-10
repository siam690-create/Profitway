const analyticsController = require('./controllers/analyticsController');

const req = {
  user: { tenantId: 2 },
  query: { range: 'all' }
};

const res = {
  setHeader: (k, v) => {},
  json: (data) => {
    console.log('--- API RESPONSE SUMMARY ---');
    console.log(data.summary);
    
    console.log('\n--- SAMPLE PRODUCTS IN API RESPONSE ---');
    const prodsWithReturns = data.products.filter(p => p.units_returned > 0 || p.return_charges > 0);
    console.log('Total Products in response:', data.products.length);
    console.log('Products with units_returned > 0 or return_charges > 0:', prodsWithReturns.length);
    console.log('Sample Products with returns/charges:', prodsWithReturns.slice(0, 5));

    console.log('\n--- TOP 5 PRODUCTS IN RESPONSE ARRAY ---');
    console.log(data.products.slice(0, 5));
    process.exit(0);
  },
  status: (code) => ({ json: (err) => { console.error('API ERROR status ' + code, err); process.exit(1); } })
};

analyticsController.getProductAnalytics(req, res);
