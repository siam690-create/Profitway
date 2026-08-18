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

    const [existing] = await db.query('SELECT * FROM shop_settings WHERE tenant_id = ?', [tenantId]);

    if (existing.length === 0) {
      await db.query(
        `INSERT INTO shop_settings 
          (tenant_id, currency, decimal_precision, pos_paper_size, wholesale_paper_size, company_name, tagline, address, phone, email, vat_reg_no, footer_terms, footer_thank_you, show_storage_location, show_staff_name, show_savings_discount, show_qr_barcode, show_shop_name, show_address, show_phone_email, show_vat_no, show_invoice_no, show_invoice_date, show_customer_info, delivery_inside_dhaka, delivery_sub_dhaka, delivery_outside_dhaka)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          currency || '৳',
          !isNaN(Number(decimal_precision)) ? Number(decimal_precision) : 2,
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
          show_storage_location !== undefined ? (show_storage_location ? 1 : 0) : 1,
          show_staff_name !== undefined ? (show_staff_name ? 1 : 0) : 1,
          show_savings_discount !== undefined ? (show_savings_discount ? 1 : 0) : 1,
          show_qr_barcode !== undefined ? (show_qr_barcode ? 1 : 0) : 1,
          show_shop_name !== undefined ? (show_shop_name ? 1 : 0) : 1,
          show_address !== undefined ? (show_address ? 1 : 0) : 1,
          show_phone_email !== undefined ? (show_phone_email ? 1 : 0) : 1,
          show_vat_no !== undefined ? (show_vat_no ? 1 : 0) : 1,
          show_invoice_no !== undefined ? (show_invoice_no ? 1 : 0) : 1,
          show_invoice_date !== undefined ? (show_invoice_date ? 1 : 0) : 1,
          show_customer_info !== undefined ? (show_customer_info ? 1 : 0) : 1,
          !isNaN(Number(delivery_inside_dhaka)) ? Number(delivery_inside_dhaka) : 60.00,
          !isNaN(Number(delivery_sub_dhaka)) ? Number(delivery_sub_dhaka) : 100.00,
          !isNaN(Number(delivery_outside_dhaka)) ? Number(delivery_outside_dhaka) : 130.00
        ]
      );
    } else {
      const cur = existing[0];
      const merged = {
        currency: currency !== undefined ? currency : cur.currency,
        decimal_precision: !isNaN(Number(decimal_precision)) ? Number(decimal_precision) : (cur.decimal_precision !== undefined ? Number(cur.decimal_precision) : 2),
        pos_paper_size: pos_paper_size !== undefined ? pos_paper_size : cur.pos_paper_size,
        wholesale_paper_size: wholesale_paper_size !== undefined ? wholesale_paper_size : cur.wholesale_paper_size,
        company_name: company_name !== undefined ? company_name : cur.company_name,
        tagline: tagline !== undefined ? tagline : cur.tagline,
        address: address !== undefined ? address : cur.address,
        phone: phone !== undefined ? phone : cur.phone,
        email: email !== undefined ? email : cur.email,
        vat_reg_no: vat_reg_no !== undefined ? vat_reg_no : cur.vat_reg_no,
        footer_terms: footer_terms !== undefined ? footer_terms : cur.footer_terms,
        footer_thank_you: footer_thank_you !== undefined ? footer_thank_you : cur.footer_thank_you,
        show_storage_location: show_storage_location !== undefined ? (show_storage_location ? 1 : 0) : cur.show_storage_location,
        show_staff_name: show_staff_name !== undefined ? (show_staff_name ? 1 : 0) : cur.show_staff_name,
        show_savings_discount: show_savings_discount !== undefined ? (show_savings_discount ? 1 : 0) : cur.show_savings_discount,
        show_qr_barcode: show_qr_barcode !== undefined ? (show_qr_barcode ? 1 : 0) : cur.show_qr_barcode,
        show_shop_name: show_shop_name !== undefined ? (show_shop_name ? 1 : 0) : cur.show_shop_name,
        show_address: show_address !== undefined ? (show_address ? 1 : 0) : cur.show_address,
        show_phone_email: show_phone_email !== undefined ? (show_phone_email ? 1 : 0) : cur.show_phone_email,
        show_vat_no: show_vat_no !== undefined ? (show_vat_no ? 1 : 0) : cur.show_vat_no,
        show_invoice_no: show_invoice_no !== undefined ? (show_invoice_no ? 1 : 0) : cur.show_invoice_no,
        show_invoice_date: show_invoice_date !== undefined ? (show_invoice_date ? 1 : 0) : cur.show_invoice_date,
        show_customer_info: show_customer_info !== undefined ? (show_customer_info ? 1 : 0) : cur.show_customer_info,
        delivery_inside_dhaka: !isNaN(Number(delivery_inside_dhaka)) ? Number(delivery_inside_dhaka) : Number(cur.delivery_inside_dhaka || 60),
        delivery_sub_dhaka: !isNaN(Number(delivery_sub_dhaka)) ? Number(delivery_sub_dhaka) : Number(cur.delivery_sub_dhaka || 100),
        delivery_outside_dhaka: !isNaN(Number(delivery_outside_dhaka)) ? Number(delivery_outside_dhaka) : Number(cur.delivery_outside_dhaka || 130)
      };

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
          merged.currency,
          merged.decimal_precision,
          merged.pos_paper_size,
          merged.wholesale_paper_size,
          merged.company_name,
          merged.tagline,
          merged.address,
          merged.phone,
          merged.email,
          merged.vat_reg_no,
          merged.footer_terms,
          merged.footer_thank_you,
          merged.show_storage_location,
          merged.show_staff_name,
          merged.show_savings_discount,
          merged.show_qr_barcode,
          merged.show_shop_name,
          merged.show_address,
          merged.show_phone_email,
          merged.show_vat_no,
          merged.show_invoice_no,
          merged.show_invoice_date,
          merged.show_customer_info,
          merged.delivery_inside_dhaka,
          merged.delivery_sub_dhaka,
          merged.delivery_outside_dhaka,
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
