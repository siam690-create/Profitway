import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const safeJsonParse = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(safeJsonParse('user'));
  const [tenant, setTenant] = useState(safeJsonParse('tenant'));

  // App Navigation View & Tab Persistence
  const [view, setView] = useState(token ? 'dashboard' : 'landing');
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('profitway_active_tab') || 'dashboard';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => setMobileSidebarOpen(prev => !prev);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setMobileSidebarOpen(false);
    if (tab) {
      localStorage.setItem('profitway_active_tab', tab);
    }
  };

  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [cart, setCart] = useState([]);
  const [shopSettings, setShopSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rawCurrency = shopSettings?.currency || tenant?.currency;
  const currency = (rawCurrency && !rawCurrency.includes('Ó') && !rawCurrency.includes('º')) ? rawCurrency : '৳';

  // Toggle Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Helper fetch with Auth Bearer token
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      logout();
    }
    return res;
  };

  // Fetch Public Plans
  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (res.ok) setPlans(data);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  // Fetch Shop & Print Settings
  const fetchSettings = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/settings');
      const data = await res.json();
      if (res.ok) setShopSettings(data);
    } catch (err) {
      console.error('Error fetching shop settings:', err);
    }
  };

  // Login Action
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        if (data.tenant) data.tenant.currency = data.tenant.currency || '৳';
        setTenant(data.tenant);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('tenant', JSON.stringify(data.tenant));

        if (data.user.role === 'superadmin') {
          setView('superadmin');
        } else {
          setView('dashboard');
        }
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Register Tenant Action (Requires Super Admin Approval)
  const registerTenant = async (shopName, ownerName, email, password, planId) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_name: shopName, owner_name: ownerName, email, password, plan_id: planId })
      });
      const data = await res.json();

      if (res.ok) {
        return { 
          success: true, 
          requires_approval: true, 
          message: data.message, 
          shop_name: data.shop_name, 
          shop_code: data.shop_code 
        };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    setTenant(null);
    setShopSettings(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    localStorage.removeItem('profitway_active_tab');
    setActiveTabState('dashboard');
    setView('landing');
  };

  // Fetch Dashboard Summary
  const fetchDashboard = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await authFetch('/api/dashboard/summary');
      const data = await res.json();
      if (res.ok) setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/products');
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/categories');
      const data = await res.json();
      if (res.ok) setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch Sales
  const fetchSales = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/sales');
      const data = await res.json();
      if (res.ok) setSales(data);
    } catch (err) {
      console.error('Error fetching sales:', err);
    }
  };

  // Fetch Expenses
  const fetchExpenses = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/expenses');
      const data = await res.json();
      if (res.ok) setExpenses(data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  // Refresh All Application Data
  const refreshAllData = () => {
    if (token) {
      fetchDashboard();
      fetchProducts();
      fetchCategories();
      fetchSales();
      fetchExpenses();
      fetchSettings();
    }
  };

  useEffect(() => {
    fetchPlans();
    if (token) {
      refreshAllData();
    }
  }, [token]);

  // Cart Management
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock_quantity) {
          alert(`Cannot add more. Available stock for ${product.name} is ${product.stock_quantity}.`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      } else {
        if (product.stock_quantity < 1) {
          alert(`${product.name} is out of stock!`);
          return prev;
        }
        const sellPrice = Number(product.selling_price || 0);
        const costPrice = Number(product.cost_price || 0);
        return [...prev, {
          ...product,
          qty: 1,
          selling_price: sellPrice,
          cost_price: costPrice,
          unit_price: sellPrice,
          unit_cost: costPrice
        }];
      }
    });
  };

  const updateCartQty = (productId, targetQty) => {
    setCart(prev => {
      return prev.map(item => {
        const id = item.id || item.product_id;
        if (id === productId) {
          if (targetQty === '' || targetQty === null || targetQty === undefined) {
            return { ...item, qty: '', quantity: '' };
          }
          const parsed = parseInt(targetQty, 10);
          if (isNaN(parsed)) {
            return { ...item, qty: '', quantity: '' };
          }
          const qtyVal = Math.max(1, parsed);
          if (qtyVal > item.stock_quantity) {
            alert(`Stock limit reached (${item.stock_quantity} available for ${item.name || item.product_name}).`);
            return { ...item, qty: item.stock_quantity, quantity: item.stock_quantity };
          }
          return { ...item, qty: qtyVal, quantity: qtyVal };
        }
        return item;
      });
    });
  };

  const updateCartPrice = (productId, targetPrice) => {
    setCart(prev => {
      return prev.map(item => {
        const id = item.id || item.product_id;
        if (id === productId) {
          if (targetPrice === '' || targetPrice === null || targetPrice === undefined) {
            return { ...item, selling_price: '', unit_price: '' };
          }
          const priceVal = Number(targetPrice);
          return { ...item, selling_price: isNaN(priceVal) ? '' : priceVal, unit_price: isNaN(priceVal) ? '' : priceVal };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Checkout Action (Create Sale)
  const checkoutSale = async (customerName, paymentMethod, notes = '', customerDeliveryFee = 0, courierFee = 0, saleDate = null) => {
    if (cart.length === 0) return { success: false, error: 'Cart is empty' };

    try {
      const payload = {
        customer_name: customerName,
        payment_method: paymentMethod,
        notes,
        customer_delivery_fee: Number(customerDeliveryFee || 0),
        courier_fee: Number(courierFee || 0),
        sale_date: saleDate,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty || item.quantity || 1,
          unit_price: Number(item.selling_price || item.unit_price || 0)
        }))
      };

      const res = await authFetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        clearCart();
        refreshAllData();
        return { success: true, sale: data.sale || data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Product Actions
  const addProduct = async (productData) => {
    try {
      const res = await authFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (res.ok) {
        refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const res = await authFetch(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (res.ok) {
        refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Expense Actions
  const addExpense = async (expenseData) => {
    try {
      const res = await authFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(expenseData)
      });
      const data = await res.json();
      if (res.ok) {
        refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteExpense = async (id) => {
    try {
      const res = await authFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Helper format currency based on decimal precision
  const formatCurrency = (val) => {
    const amount = Number(val || 0);
    const precision = shopSettings?.decimal_precision !== undefined ? shopSettings.decimal_precision : 2;
    return `${currency}${amount.toFixed(precision)}`;
  };

  const deleteSale = async (saleId) => {
    try {
      const res = await authFetch(`/api/sales/${saleId}`, {
        method: 'DELETE'
      });

      let data = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: `Server returned non-JSON response (${res.status}). Please restart PM2 backend.` };
      }

      if (res.ok) {
        fetchSales();
        fetchProducts();
        fetchDashboard();
        return { success: true, message: data.message || 'Order deleted successfully' };
      } else {
        return { success: false, error: data.error || `HTTP Error ${res.status}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        token,
        user,
        tenant,
        view,
        setView,
        activeTab,
        setActiveTab,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleMobileSidebar,
        dashboardData,
        products,
        categories,
        sales,
        expenses,
        plans,
        cart,
        shopSettings,
        fetchSettings,
        loading,
        error,
        currency,
        formatCurrency,
        authFetch,
        login,
        registerTenant,
        logout,
        fetchDashboard,
        fetchProducts,
        fetchCategories,
        fetchSales,
        fetchExpenses,
        refreshAllData,
        addToCart,
        updateCartQty,
        updateCartPrice,
        removeFromCart,
        clearCart,
        checkoutSale,
        deleteSale,
        addProduct,
        updateProduct,
        deleteProduct,
        addExpense,
        deleteExpense
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
