const db = require('../config/db');

exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Ensure delivery charge columns exist
    const [c1] = await db.query(`SHOW COLUMNS FROM shop_settings LIKE 'delivery_inside_dhaka'`);
    if (c1.length === 0) {
      await db.query(`ALTER TABLE shop_settings ADD COLUMN delivery_inside_dhaka DECIMAL(10,2) DEFAULT 60.00`);
    }
    const [c2] = await db.query(`SHOW COLUMNS FROM shop_settings LIKE 'delivery_sub_dhaka'`);
    if (c2.length === 0) {
      await db.query(`ALTER TABLE shop_settings ADD COLUMN delivery_sub_dhaka DECIMAL(10,2) DEFAULT 100.00`);
    }
    const [c3] = await db.query(`SHOW COLUMNS FROM shop_settings LIKE 'delivery_outside_dhaka'`);
    if (c3.length === 0) {
      await db.query(`ALTER TABLE shop_settings ADD COLUMN delivery_outside_dhaka DECIMAL(10,2) DEFAULT 130.00`);
    }

    // Check if shop_settings exists for this tenant
    const [rows] = await db.query('SELECT * FROM shop_settings WHERE tenant_id = ?', [tenantId]);

    if (rows.length === 0) {
      // Fetch shop details from tenants table to seed default settings
      const [tenantRows] = await db.query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
      const tenant = tenantRows[0] || {};

      const defaultSettings = {
        tenant_id: tenantId,
        currency: tenant.currency || '৳',
        decimal_precision: 2,
        pos_paper_size: '80mm',
        wholesale_paper_size: 'A4',
        company_name: tenant.shop_name || 'Demo Electronics Store',
        tagline: 'Leading Retail & Wholesale Electronics Supplier',
        address: 'House #12, Road #4, Block #C, Dhanmondi, Dhaka-1209',
        phone: tenant.phone || '+880 1711 000111',
        email: tenant.email || 'contact@demostore.com',
        vat_reg_no: 'VAT-REG-99887766',
        footer_terms: 'Goods once sold are returnable within 7 days with valid invoice copy.',
        footer_thank_you: 'Thank you for shopping with us! Have a great day!',
        show_storage_location: 1,
        show_staff_name: 1,
        show_savings_discount: 1,
        show_qr_barcode: 1,
        show_shop_name: 1,
        show_address: 1,
        show_phone_email: 1,
        show_vat_no: 1,
        show_invoice_no: 1,
        show_invoice_date: 1,
        show_customer_info: 1
      };

      await db.query(
        `INSERT INTO shop_settings 
          (tenant_id, currency, decimal_precision, pos_paper_size, wholesale_paper_size, company_name, tagline, address, phone, email, vat_reg_no, footer_terms, footer_thank_you, show_storage_location, show_staff_name, show_savings_discount, show_qr_barcode, show_shop_name, show_address, show_phone_email, show_vat_no, show_invoice_no, show_invoice_date, show_customer_info)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          defaultSettings.currency,
          defaultSettings.decimal_precision,
          defaultSettings.pos_paper_size,
          defaultSettings.wholesale_paper_size,
          defaultSettings.company_name,
          defaultSettings.tagline,
          defaultSettings.address,
          defaultSettings.phone,
          defaultSettings.email,
          defaultSettings.vat_reg_no,
          defaultSettings.footer_terms,
          defaultSettings.footer_thank_you,
          defaultSettings.show_storage_location,
          defaultSettings.show_staff_name,
          defaultSettings.show_savings_discount,
          defaultSettings.show_qr_barcode,
          defaultSettings.show_shop_name,
          defaultSettings.show_address,
          defaultSettings.show_phone_email,
          defaultSettings.show_vat_no,
          defaultSettings.show_invoice_no,
          defaultSettings.show_invoice_date,
          defaultSettings.show_customer_info
        ]
      );

      const [newRows] = await db.query('SELECT * FROM shop_settings WHERE tenant_id = ?', [tenantId]);
      return res.json(newRows[0]);
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      currency,
      decimal_precision,
      pos_paper_size,
      wholesale_paper_size,
      company_name,
      tagline,
      address,
      phone,
      email,
      vat_reg_no,
      footer_terms,
      footer_thank_you,
      show_storage_location,
      show_staff_name,
      show_savings_discount,
      show_qr_barcode,
      show_shop_name,
      show_address,
      show_phone_email,
      show_vat_no,
      show_invoice_no,
      show_invoice_date,
      show_customer_info,
      delivery_inside_dhaka,
      delivery_sub_dhaka,
      delivery_outside_dhaka
    } = req.body;

    const [existing] = await db.query('SELECT id FROM shop_settings WHERE tenant_id = ?', [tenantId]);

    if (existing.length === 0) {
      await db.query(
        `INSERT INTO shop_settings 
          (tenant_id, currency, decimal_precision, pos_paper_size, wholesale_paper_size, company_name, tagline, address, phone, email, vat_reg_no, footer_terms, footer_thank_you, show_storage_location, show_staff_name, show_savings_discount, show_qr_barcode, show_shop_name, show_address, show_phone_email, show_vat_no, show_invoice_no, show_invoice_date, show_customer_info, delivery_inside_dhaka, delivery_sub_dhaka, delivery_outside_dhaka)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          currency || '৳',
          decimal_precision !== undefined ? Number(decimal_precision) : 2,
          pos_paper_size || '80mm',
          wholesale_paper_size || 'A4',
          company_name || 'My Store',
          tagline || '',
          address || '',
          phone || '',
          email || '',
          vat_reg_no || '',
          footer_terms || '',
          footer_thank_you || '',
          show_storage_location ? 1 : 0,
          show_staff_name ? 1 : 0,
          show_savings_discount ? 1 : 0,
          show_qr_barcode ? 1 : 0,
          show_shop_name !== undefined ? (show_shop_name ? 1 : 0) : 1,
          show_address !== undefined ? (show_address ? 1 : 0) : 1,
          show_phone_email !== undefined ? (show_phone_email ? 1 : 0) : 1,
          show_vat_no !== undefined ? (show_vat_no ? 1 : 0) : 1,
          show_invoice_no !== undefined ? (show_invoice_no ? 1 : 0) : 1,
          show_invoice_date !== undefined ? (show_invoice_date ? 1 : 0) : 1,
          show_customer_info !== undefined ? (show_customer_info ? 1 : 0) : 1,
          delivery_inside_dhaka !== undefined ? Number(delivery_inside_dhaka) : 60.00,
          delivery_sub_dhaka !== undefined ? Number(delivery_sub_dhaka) : 100.00,
          delivery_outside_dhaka !== undefined ? Number(delivery_outside_dhaka) : 130.00
        ]
      );
    } else {
      await db.query(
        `UPDATE shop_settings SET
          currency = ?,
          decimal_precision = ?,
          pos_paper_size = ?,
          wholesale_paper_size = ?,
          company_name = ?,
          tagline = ?,
          address = ?,
          phone = ?,
          email = ?,
          vat_reg_no = ?,
          footer_terms = ?,
          footer_thank_you = ?,
          show_storage_location = ?,
          show_staff_name = ?,
          show_savings_discount = ?,
          show_qr_barcode = ?,
          show_shop_name = ?,
          show_address = ?,
          show_phone_email = ?,
          show_vat_no = ?,
          show_invoice_no = ?,
          show_invoice_date = ?,
          show_customer_info = ?,
          delivery_inside_dhaka = ?,
          delivery_sub_dhaka = ?,
          delivery_outside_dhaka = ?
         WHERE tenant_id = ?`,
        [
          currency,
          Number(decimal_precision),
          pos_paper_size,
          wholesale_paper_size,
          company_name,
          tagline,
          address,
          phone,
          email,
          vat_reg_no,
          footer_terms,
          footer_thank_you,
          show_storage_location ? 1 : 0,
          show_staff_name ? 1 : 0,
          show_savings_discount ? 1 : 0,
          show_qr_barcode ? 1 : 0,
          show_shop_name ? 1 : 0,
          show_address ? 1 : 0,
          show_phone_email ? 1 : 0,
          show_vat_no ? 1 : 0,
          show_invoice_no ? 1 : 0,
          show_invoice_date ? 1 : 0,
          show_customer_info ? 1 : 0,
          delivery_inside_dhaka !== undefined ? Number(delivery_inside_dhaka) : 60.00,
          delivery_sub_dhaka !== undefined ? Number(delivery_sub_dhaka) : 100.00,
          delivery_outside_dhaka !== undefined ? Number(delivery_outside_dhaka) : 130.00,
          tenantId
        ]
      );
    }

    if (currency) {
      await db.query('UPDATE tenants SET currency = ? WHERE id = ?', [currency, tenantId]);
    }

    res.json({ message: 'Shop & Invoice Customization Settings saved successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
