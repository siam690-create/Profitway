const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const superAdminController = require('../controllers/superAdminController');
const dashboardController = require('../controllers/dashboardController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const saleController = require('../controllers/saleController');
const expenseController = require('../controllers/expenseController');
const reportController = require('../controllers/reportController');
const staffController = require('../controllers/staffController');
const purchaseController = require('../controllers/purchaseController');
const returnController = require('../controllers/returnController');
const adController = require('../controllers/adController');
const analyticsController = require('../controllers/analyticsController');
const financeController = require('../controllers/financeController');
const supplierController = require('../controllers/supplierController');
const wholesaleController = require('../controllers/wholesaleController');
const investmentController = require('../controllers/investmentController');
const settingController = require('../controllers/settingController');
const supportController = require('../controllers/supportController');
const subscriptionController = require('../controllers/subscriptionController');

const storeApiKeyController = require('../controllers/storeApiKeyController');
const externalOrderController = require('../controllers/externalOrderController');
const taskController = require('../controllers/taskController');

const { authenticate, requireSuperAdmin, checkActiveSubscription } = require('../middleware/authMiddleware');

// -------------------------------------------------------------
// PUBLIC EXTERNAL ORDER INGESTION API (AUTHENTICATED VIA API KEY)
// -------------------------------------------------------------
router.post('/v1/orders/import', externalOrderController.importExternalOrder);

// -------------------------------------------------------------
// PUBLIC AUTHENTICATION & LANDING APIS
// -------------------------------------------------------------
router.post('/auth/register', authController.registerTenant);
router.post('/auth/login', authController.login);

// Public Plans List
router.get('/plans', async (req, res) => {
  try {
    const db = require('../config/db');
    const [plans] = await db.query('SELECT * FROM plans WHERE is_active = 1');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected Profile Check
router.get('/auth/me', authenticate, authController.getMe);

// -------------------------------------------------------------
// SUPER ADMIN SAAS MANAGEMENT APIS
// -------------------------------------------------------------
router.get('/super-admin/dashboard', authenticate, requireSuperAdmin, superAdminController.getSuperAdminDashboard);
router.get('/super-admin/tenants', authenticate, requireSuperAdmin, superAdminController.getTenants);
router.patch('/super-admin/tenants/:tenant_id', authenticate, requireSuperAdmin, superAdminController.updateTenantSubscription);

// -------------------------------------------------------------
// PROTECTED MULTI-TENANT SHOP APIS
// -------------------------------------------------------------
router.use(authenticate);

// Dashboard API
router.get('/dashboard/summary', dashboardController.getDashboardSummary);

// Product APIs
router.get('/products', productController.getProducts);
router.post('/products', checkActiveSubscription, productController.createProduct);
router.post('/products/bulk-import', checkActiveSubscription, productController.bulkImportProducts);
router.get('/products/export', productController.exportProducts);
router.get('/products/:id/stock-history', productController.getStockHistory);
router.put('/products/:id', checkActiveSubscription, productController.updateProduct);
router.patch('/products/:id/adjust-stock', checkActiveSubscription, productController.adjustStock);
router.delete('/products/:id', checkActiveSubscription, productController.deleteProduct);

// Business Analytics API
router.get('/analytics/products', analyticsController.getProductAnalytics);

// Shop Settings & Print Customization APIs
router.get('/settings', settingController.getSettings);
router.put('/settings', checkActiveSubscription, settingController.updateSettings);

// Store API Keys Management APIs (External Order Ingestion Setup)
router.get('/store-api-keys', storeApiKeyController.getStoreApiKeys);
router.post('/store-api-keys', checkActiveSubscription, storeApiKeyController.createStoreApiKey);
router.patch('/store-api-keys/:id/toggle', checkActiveSubscription, storeApiKeyController.toggleStoreApiKey);
router.delete('/store-api-keys/:id', checkActiveSubscription, storeApiKeyController.deleteStoreApiKey);

// Subscription & Plan Status APIs
router.get('/subscription/my-plan', subscriptionController.getMySubscription);
router.post('/subscription/upgrade', subscriptionController.requestPlanUpgrade);

// Support & Help Desk Ticket APIs
router.get('/support/tickets', supportController.getTickets);
router.post('/support/tickets', checkActiveSubscription, supportController.createTicket);
router.get('/support/tickets/:id', supportController.getTicketById);
router.post('/support/tickets/:id/messages', supportController.addTicketMessage);
router.patch('/support/tickets/:id/status', supportController.updateTicketStatus);

// Finance, Accounts, Dena-Pawna & Payroll APIs
router.get('/finance/summary', financeController.getFinanceSummary);
router.post('/finance/accounts', checkActiveSubscription, financeController.createAccount);
router.post('/finance/deposit', checkActiveSubscription, financeController.depositFund);
router.get('/finance/accounts/:id/statement', financeController.getAccountStatement);
router.post('/finance/transfer', checkActiveSubscription, financeController.transferFunds);
router.post('/finance/adjust', checkActiveSubscription, financeController.adjustAccountBalance);
router.post('/finance/liabilities', checkActiveSubscription, financeController.createLiability);
router.get('/finance/liabilities/:id/audit', financeController.getDenaAudit);
router.post('/finance/liabilities/:id/pay', checkActiveSubscription, financeController.payLiability);
router.post('/finance/receivables', checkActiveSubscription, financeController.createReceivable);
router.get('/finance/receivables/:id/audit', financeController.getPawnaAudit);
router.post('/finance/receivables/:id/collect', checkActiveSubscription, financeController.collectReceivable);
router.post('/finance/payroll', checkActiveSubscription, financeController.paySalary);

// Investment Capital APIs
router.get('/investments', investmentController.getInvestments);
router.post('/investments', checkActiveSubscription, investmentController.createInvestment);
router.post('/investments/:id/repay', checkActiveSubscription, investmentController.repayInvestment);

// Wholesale B2B APIs
router.get('/wholesale/customers', wholesaleController.getWholesaleCustomers);
router.post('/wholesale/customers', checkActiveSubscription, wholesaleController.createWholesaleCustomer);
router.put('/wholesale/customers/:id', checkActiveSubscription, wholesaleController.updateWholesaleCustomer);
router.delete('/wholesale/customers/:id', checkActiveSubscription, wholesaleController.deleteWholesaleCustomer);
router.get('/wholesale/sales', wholesaleController.getWholesaleSales);
router.get('/wholesale/sales/:id', wholesaleController.getWholesaleSaleById);
router.post('/wholesale/sales', checkActiveSubscription, wholesaleController.createWholesaleSale);
router.delete('/wholesale/sales/:id', checkActiveSubscription, wholesaleController.deleteWholesaleSale);

// Supplier Directory APIs
router.get('/suppliers', supplierController.getSuppliers);
router.post('/suppliers', checkActiveSubscription, supplierController.createSupplier);
router.put('/suppliers/:id', checkActiveSubscription, supplierController.updateSupplier);
router.delete('/suppliers/:id', checkActiveSubscription, supplierController.deleteSupplier);

// Stock Purchase / Restock APIs
router.post('/purchases', checkActiveSubscription, purchaseController.createPurchase);
router.get('/purchases', purchaseController.getPurchases);
router.get('/purchases/:id', purchaseController.getPurchaseById);
router.put('/purchases/:id', checkActiveSubscription, purchaseController.updatePurchase);
router.delete('/purchases/:id', checkActiveSubscription, purchaseController.deletePurchase);

// Courier Returns & Product Restock APIs
router.post('/returns', checkActiveSubscription, returnController.createReturn);
router.get('/returns', returnController.getReturns);
router.get('/returns/:id', returnController.getReturnById);
router.put('/returns/:id', checkActiveSubscription, returnController.updateReturn);

// Paid Ads & Marketing Cost Tracker APIs
router.post('/ads', checkActiveSubscription, adController.createAd);
router.get('/ads', adController.getAds);
router.delete('/ads/:id', checkActiveSubscription, adController.deleteAd);

// Category APIs
router.get('/categories', categoryController.getCategories);
router.post('/categories', checkActiveSubscription, categoryController.createCategory);
router.delete('/categories/:id', checkActiveSubscription, categoryController.deleteCategory);

// Sales & POS APIs
router.post('/sales', checkActiveSubscription, saleController.createSale);
router.get('/sales', saleController.getSales);
router.get('/sales/:id', saleController.getSaleById);
router.put('/sales/:id', checkActiveSubscription, saleController.updateSale);
router.delete('/sales/:id', checkActiveSubscription, saleController.deleteSale);

// Expense APIs
router.get('/expenses', expenseController.getExpenses);
router.post('/expenses', checkActiveSubscription, expenseController.createExpense);
router.delete('/expenses/:id', checkActiveSubscription, expenseController.deleteExpense);

// Reports API
router.get('/reports/profit-loss', reportController.getProfitLossReport);

// Staff / Users APIs
router.get('/staff', staffController.getStaff);
router.post('/staff', checkActiveSubscription, staffController.createStaff);
router.patch('/staff/:id', checkActiveSubscription, staffController.updateStaff);
router.delete('/staff/:id', checkActiveSubscription, staffController.deleteStaff);

// Enterprise HR, Payroll & Attendance OS APIs
router.get('/staff/employees', staffController.getEmployees);
router.post('/staff/employees', checkActiveSubscription, staffController.createEmployee);
router.put('/staff/employees/:id', checkActiveSubscription, staffController.updateEmployee);
router.delete('/staff/employees/:id', checkActiveSubscription, staffController.deleteEmployee);

router.get('/staff/attendance', staffController.getAttendance);
router.post('/staff/attendance/batch', checkActiveSubscription, staffController.markAttendanceBatch);

router.get('/staff/leaves', staffController.getLeaves);
router.post('/staff/leaves', checkActiveSubscription, staffController.createLeave);
router.patch('/staff/leaves/:id/status', checkActiveSubscription, staffController.updateLeaveStatus);

router.get('/staff/loans', staffController.getLoans);
router.post('/staff/loans/disburse', checkActiveSubscription, staffController.disburseLoan);

router.get('/staff/bonuses', staffController.getBonuses);
router.post('/staff/bonuses', checkActiveSubscription, staffController.createBonus);

router.get('/staff/salary-sheet', staffController.getMonthlySalarySheet);
router.post('/staff/salary-sheet/disburse', checkActiveSubscription, staffController.disburseSalary);

// Staff Task Management System APIs
router.get('/tasks', taskController.getTasks);
router.post('/tasks', checkActiveSubscription, taskController.createTask);
router.put('/tasks/:id', checkActiveSubscription, taskController.updateTask);
router.delete('/tasks/:id', checkActiveSubscription, taskController.deleteTask);
router.patch('/tasks/checklists/:id', checkActiveSubscription, taskController.toggleChecklist);
router.post('/tasks/:id/comments', checkActiveSubscription, taskController.addComment);
router.get('/tasks/analytics', taskController.getTaskAnalytics);

module.exports = router;
