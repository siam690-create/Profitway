const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>Profitway - Reseller Portal Complete Tutorial Guide</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700;800&display=swap');
  
  @page {
    size: A4;
    margin: 15mm 15mm 18mm 15mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Hind Siliguri', 'Inter', -apple-system, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 13px;
    line-height: 1.55;
  }

  .page-break {
    page-break-before: always;
  }

  .cover-header {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);
    color: #ffffff;
    padding: 30px 25px;
    border-radius: 16px;
    margin-bottom: 25px;
    box-shadow: 0 10px 25px rgba(49, 46, 129, 0.2);
  }

  .cover-title {
    font-size: 24px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cover-subtitle {
    font-size: 13px;
    color: #cbd5e1;
    line-height: 1.4;
  }

  .section-card {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 22px;
    background: #ffffff;
    page-break-inside: avoid;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #8b5cf6;
  }

  .step-badge {
    background: #7c3aed;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    font-family: 'Inter', sans-serif;
  }

  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }

  .step-item {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    align-items: flex-start;
  }

  .step-num {
    width: 24px;
    height: 24px;
    background: #ede9fe;
    color: #6d28d9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .step-text {
    flex: 1;
    font-size: 13px;
  }

  .step-text strong {
    color: #1e1b4b;
  }

  .ui-mockup {
    background: #0f172a;
    color: #f8fafc;
    border-radius: 10px;
    padding: 16px;
    margin: 14px 0;
    font-size: 12px;
    border: 1px solid #334155;
    position: relative;
  }

  .mockup-header {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    margin-bottom: 10px;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 6px;
  }

  .indicator-box {
    background: rgba(239, 68, 68, 0.15);
    border: 1.5px dashed #ef4444;
    border-radius: 8px;
    padding: 8px 12px;
    margin-top: 8px;
    font-size: 11.5px;
    color: #fecaca;
  }

  .indicator-box.green {
    background: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
    color: #a7f3d0;
  }

  .indicator-box.purple {
    background: rgba(139, 92, 246, 0.15);
    border-color: #a78bfa;
    color: #ddd6fe;
  }

  .table-sample {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 11.5px;
  }

  .table-sample th {
    background: #f1f5f9;
    color: #334155;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    font-weight: 700;
  }

  .table-sample td {
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    color: #1e293b;
  }

  .badge-tag {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 10.5px;
    font-weight: 700;
  }
  .badge-purple { background: #ede9fe; color: #6d28d9; }
  .badge-green { background: #d1fae5; color: #047857; }
  .badge-blue { background: #e0f2fe; color: #0369a1; }
  .badge-red { background: #fee2e2; color: #b91c1c; }

  .tip-box {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    font-size: 12px;
    color: #92400e;
    margin-top: 10px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
</style>
</head>
<body>

  <!-- HEADER / COVER BANNER -->
  <div class="cover-header">
    <div class="cover-title">
      <span>🛍️ Profitway - রিসেলার পোর্টাল ইউজার গাইড</span>
    </div>
    <div class="cover-subtitle">
      রিসেলার সেলফ-সার্ভিস পোর্টালে হোলসেল প্রোডাক্ট ব্রাউজ, সিঙ্গেল অর্ডার সাবমিট, এক্সেল বাল্ক আপলোড এবং লাইভ প্রফিট ও ইনভয়েস স্টেটমেন্ট চেক করার পূর্ণাঙ্গ টিউটোরিয়াল।
    </div>
  </div>

  <!-- SECTION 1: OVERVIEW & DASHBOARD -->
  <div class="section-card">
    <div class="section-header">
      <span class="step-badge">ধাপ ১</span>
      <h2 class="section-title">পোর্টালে প্রবেশ ও ড্যাশবোর্ড পরিচিতি</h2>
    </div>

    <div class="step-item">
      <div class="step-num">১</div>
      <div class="step-text">
        <strong>পোর্টাল লগইন:</strong> আপনার রিসেলার ইমেইল বা ফোন নম্বর এবং পাসওয়ার্ড দিয়ে পোর্টালে লগইন করুন। উপরে আপনার স্টোর নাম (যেমন: <span class="badge-tag badge-purple">Technique Gadget</span>) দেখতে পাবেন।
      </div>
    </div>

    <!-- UI Mockup of KPI Cards -->
    <div class="ui-mockup">
      <div class="mockup-header">
        <span>📊 ড্যাশবোর্ডের ৪টি প্রধান রিয়েল-টাইম কার্ড</span>
        <span>LIVE UPDATES</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; padding: 10px; borderRadius: 8px;">
          <div style="color: #34d399; font-size: 11px; font-weight: 700;">💳 Total Received Money</div>
          <div style="font-size: 16px; font-weight: 800; color: #34d399; margin-top: 4px;">৳০.০০</div>
          <div style="font-size: 9.5px; color: #94a3b8;">বিকাশ/ব্যাংকে প্রাপ্ত টাকা</div>
        </div>

        <div style="background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; padding: 10px; borderRadius: 8px;">
          <div style="color: #60a5fa; font-size: 11px; font-weight: 700;">✅ Total Delivered Order</div>
          <div style="font-size: 16px; font-weight: 800; color: #60a5fa; margin-top: 4px;">২ Orders</div>
          <div style="font-size: 9.5px; color: #34d399;">Profit: +৳৬৪৫.০০</div>
        </div>

        <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; padding: 10px; borderRadius: 8px;">
          <div style="color: #f87171; font-size: 11px; font-weight: 700;">🔄 Total Returned Order</div>
          <div style="font-size: 16px; font-weight: 800; color: #f87171; margin-top: 4px;">০ Orders</div>
          <div style="font-size: 9.5px; color: #f87171;">Loss: -৳০.০০</div>
        </div>

        <div style="background: rgba(168, 85, 247, 0.15); border: 1px solid #a855f7; padding: 10px; borderRadius: 8px;">
          <div style="color: #c084fc; font-size: 11px; font-weight: 700;">🛍️ Total Order</div>
          <div style="font-size: 16px; font-weight: 800; color: #c084fc; margin-top: 4px;">৯ Orders</div>
          <div style="font-size: 9.5px; color: #94a3b8;">৭ Active / In Transit</div>
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION 2: SINGLE ORDER SUBMISSION -->
  <div class="section-card">
    <div class="section-header">
      <span class="step-badge">ধাপ ২</span>
      <h2 class="section-title">সিঙ্গেল কাস্টমার অর্ডার সাবমিট করার পদ্ধতি</h2>
    </div>

    <div class="step-item">
      <div class="step-num">১</div>
      <div class="step-text">
        <strong>প্রোডাক্ট নির্বাচন:</strong> ক্যাটালগে থাকা যেকোনো প্রোডাক্টের নিচে <strong>"+ Submit Order for Customer"</strong> বাটনে ক্লিক করুন। অথবা সার্চ বারে নাম/SKU লিখে সরাসরি খুঁজুন।
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">২</div>
      <div class="step-text">
        <strong>কাস্টমার ডেলিভারি তথ্য:</strong> কাস্টমারের নাম, সচল ১১ ডিজিটের ফোন নম্বর এবং সম্পূর্ণ বিস্তারিত ঠিকানা দিন।
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">৩</div>
      <div class="step-text">
        <strong>কুরিয়ার এলাকা নির্বাচন (Delivery Area):</strong> ড্রপডাউন থেকে সঠিক কুরিয়ার এরিয়া নির্বাচন করুন:
        <span class="badge-tag badge-blue">🚚 ঢাকার ভেতরে (৳৬০)</span>, 
        <span class="badge-tag badge-purple">🚚 সাব ঢাকা (৳১০০)</span>, 
        <span class="badge-tag badge-green">🚚 ঢাকার বাইরে (৳১৩০)</span>।
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">৪</div>
      <div class="step-text">
        <strong>কাস্টমার বিক্রয়মূল্য (Product Sale Price):</strong> ডেলিভারি চার্জ <u>ছাড়া</u> শুধু প্রোডাক্টের বিক্রয়মূল্য লিখুন (যেমন: ৳৪০০)। সিস্টেম স্বয়ংক্রিয়ভাবে ডেলিভারি চার্জ যোগ করে কাস্টমারের <strong>Total COD</strong> হিসাব করবে।
      </div>
    </div>

    <!-- UI Modal Box Simulation -->
    <div class="ui-mockup">
      <div class="mockup-header">
        <span>🛒 অর্ডার সাবমিশন মডাল ও লাইভ লাভ-লোকসান হিসাব</span>
        <span>LIVE PROFIT / LOSS CALCULATION</span>
      </div>

      <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
          <span style="color: #94a3b8;">Product Sale Price (প্রোডাক্ট বিক্রয়মূল্য):</span>
          <span style="font-weight: 700; color: #fff;">৳৪০০.০০</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
          <span style="color: #38bdf8;">Delivery Charge (সাব ঢাকা):</span>
          <span style="font-weight: 700; color: #38bdf8;">+৳১০০.০০</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12.5px; border-top: 1px dashed #475569; padding-top: 4px; font-weight: 700;">
          <span style="color: #f59e0b;">Total COD (ডেলিভারিসহ মোট কালেকশন):</span>
          <span style="color: #f59e0b;">৳৫০০.০০</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; border-top: 1px solid #475569; padding-top: 6px; margin-top: 4px; font-weight: 800;">
          <span>Estimated Reseller Profit (আনুমানিক লাভ):</span>
          <span style="color: #10b981;">+৳১৫৫.০০</span>
        </div>
      </div>

      <div class="indicator-box green">
        ✔ লাভ হলে সবুজ রঙে <strong>Estimated Reseller Profit</strong> দেখাবে। কিন্তু বিক্রয়মূল্য হোলসেল খরচের চেয়ে কম হলে লাল রঙে <strong>⚠️ Estimated Loss (লোকসান)</strong> সতর্কবার্তা আসবে।
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">৫</div>
      <div class="step-text">
        <strong>আরেকটি প্রোডাক্ট যোগ করা:</strong> এক অর্ডারে একাধিক প্রোডাক্ট থাকলে মডালের সার্চ বক্সে SKU বা নাম লিখে <strong>"+ Add"</strong> বাটনে ক্লিক করুন। সবশেষে <strong>"Confirm & Submit Order"</strong> ক্লিক করুন।
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3: BULK EXCEL UPLOAD -->
  <div class="section-card">
    <div class="section-header">
      <span class="step-badge">ধাপ ৩</span>
      <h2 class="section-title">এক্সেল ফাইলের মাধ্যমে বাল্ক অর্ডার আপলোড (Bulk Order Upload)</h2>
    </div>

    <div class="step-item">
      <div class="step-num">১</div>
      <div class="step-text">
        পোর্টালে উপরের ডানপাশে থাকা <strong>"📥 Bulk Excel Upload"</strong> বাটনে ক্লিক করুন।
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">২</div>
      <div class="step-text">
        মডালে থাকা <strong>"Download Sample Excel Template"</strong> বাটনে ক্লিক করে অফিশিয়াল এক্সেল ফরম্যাটটি ডাউনলোড করে নিন।
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">৩</div>
      <div class="step-text">
        <strong>এক্সেলে নিচের ৭টি কলাম সঠিকভাবে পূরণ করুন:</strong>
      </div>
    </div>

    <!-- Excel Column Structure Table -->
    <table class="table-sample">
      <thead>
        <tr>
          <th>কলামের নাম (Column Header)</th>
          <th>উদাহরণ (Sample Data)</th>
          <th>নির্দেশনা ও নিয়ম</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Customer Name</strong></td>
          <td>Tanvir Ahmed</td>
          <td>কাস্টমারের পূর্ণ নাম লিখুন।</td>
        </tr>
        <tr>
          <td><strong>Customer Phone</strong></td>
          <td>01711000000</td>
          <td>সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।</td>
        </tr>
        <tr>
          <td><strong>Delivery Address</strong></td>
          <td>House 12, Road 4, Sector 10, Uttara</td>
          <td>কাস্টমারের সম্পূর্ণ ঠিকানা (জেলা/থানা সহ একসাথে)।</td>
        </tr>
        <tr>
          <td><strong>Delivery Zone</strong></td>
          <td><span class="badge-tag badge-purple">সাব ঢাকা</span> বা <span class="badge-tag badge-blue">ঢাকার ভেতরে</span></td>
          <td>কুরিয়ার জোন: 'ঢাকার ভেতরে', 'সাব ঢাকা', বা 'ঢাকার বাইরে'।</td>
        </tr>
        <tr>
          <td><strong>Customer Sale Price</strong></td>
          <td>380</td>
          <td>ডেলিভারি চার্জ ছাড়া শুধু প্রোডাক্টের বিক্রয়মূল্য।</td>
        </tr>
        <tr>
          <td><strong>Product SKU / Items</strong></td>
          <td>P0289 (x1), KM666C (x2)</td>
          <td>প্রোডাক্টের সঠিক SKU এবং পরিমাণ লিখুন।</td>
        </tr>
        <tr>
          <td><strong>Notes</strong></td>
          <td>Deliver before 5 PM</td>
          <td>কুরিয়ারের জন্য বিশেষ কোনো নির্দেশনা (ঐচ্ছিক)।</td>
        </tr>
      </tbody>
    </table>

    <div class="ui-mockup">
      <div class="mockup-header">
        <span>📥 এক্সেল প্রিভিউ ও ইনস্ট্যান্ট ভ্যালিডেশন</span>
        <span>ONE-CLICK BULK IMPORT</span>
      </div>
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px; border-radius: 8px;">
        <span style="color: #34d399; font-weight: 700;">✓ ২০টি অর্ডার সঠিকভাবে প্রস্তুত হয়েছে!</span>
        <span style="color: #cbd5e1; font-size: 11px; display: block; margin-top: 3px;">
          ফাইল আপলোড করার পর লাইভ টেবিল প্রিভিউতে সবুজ টিক দেখে <strong>"Confirm & Submit All Orders"</strong> এ ক্লিক করলেই মুহূর্তেই সব অর্ডার তৈরি হয়ে যাবে।
        </span>
      </div>
    </div>

    <div class="tip-box">
      💡 <strong>টিপস:</strong> এক্সেল ফাইলে কোনো কাস্টমারের ফোন নম্বর ভুল বা SKU অমিল থাকলে প্রিভিউতেই লাল সতর্কবার্তা দেখাবে, যাতে ভুল সংশোধন করে সাবমিট করতে পারেন।
    </div>
  </div>

  <!-- SECTION 4: ORDER TRACKING & INVOICES -->
  <div class="section-card">
    <div class="section-header">
      <span class="step-badge">ধাপ ৪</span>
      <h2 class="section-title">অর্ডার ট্র্যাকিং, সেটেলমেন্ট ইনভয়েস ও পে-আউট হিস্ট্রি</h2>
    </div>

    <div class="grid-2">
      <div>
        <h4 style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 6px;">📦 Active Orders ট্যাবে ট্র্যাকিং:</h4>
        <p style="font-size: 12px; color: #475569; margin-bottom: 8px;">
          সব অর্ডার সাবমিটের সাথে সাথে <strong>Active Orders</strong> ট্যাবে জমা হবে। কুরিয়ারে বুকিং হলে ট্র্যাকিং কোড জেনারেট হবে এবং এক ক্লিকে পার্সেল লাইভ ট্র্যাক করা যাবে।
        </p>
        <span class="badge-tag badge-blue">New Orders</span> ➔ 
        <span class="badge-tag badge-purple">In Courier</span> ➔ 
        <span class="badge-tag badge-green">Delivered</span>
      </div>

      <div>
        <h4 style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 6px;">💰 Earnings & Payout Statements ট্যাবে ইনভয়েস:</h4>
        <p style="font-size: 12px; color: #475569; margin-bottom: 8px;">
          অ্যাডমিন থেকে পে-আউট ইনভয়েস তৈরি হওয়ার সাথে সাথে <strong>Reseller Settlement Invoices</strong> তালিকায় চলে আসবে। <strong>"👁️ View & Print"</strong> বাটনে ক্লিক করে লাভ-লোকসানের সম্পূর্ণ ব্রেকডাউন প্রিন্ট/PDF করা যাবে।
        </p>
        <span class="badge-tag badge-green">✓ Paid</span>
        <span class="badge-tag badge-purple">🖨️ Print Statement</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="text-align: center; margin-top: 15px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    <strong>Profitway Smart Reseller Management System</strong> • সর্বস্বত্ব সংরক্ষিত © ২০২৬
  </div>

</body>
</html>`;

const publicDir = path.join(__dirname, '..', '..', 'frontend', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const htmlFilePath = path.join(__dirname, 'tutorial.html');
const pdfFilePath = path.join(publicDir, 'Reseller_Portal_Tutorial_Guide.pdf');
const rootPdfFilePath = path.join(__dirname, '..', '..', 'Reseller_Portal_Tutorial_Guide.pdf');
const publicHtmlPath = path.join(publicDir, 'reseller-guide.html');

fs.writeFileSync(htmlFilePath, htmlContent);
fs.writeFileSync(publicHtmlPath, htmlContent);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

try {
  console.log('Generating PDF using browser at:', browserPath);
  const command = `"${browserPath}" --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfFilePath}" "${htmlFilePath}"`;
  execSync(command);
  fs.copyFileSync(pdfFilePath, rootPdfFilePath);
  console.log('PDF generated successfully without headers/footers at:', pdfFilePath);
  console.log('PDF copied to root at:', rootPdfFilePath);
} catch (err) {
  console.error('Error generating PDF:', err);
}
