export interface InvoiceData {
  orderNumber: string
  invoiceNumber: string
  orderDate: string
  customerName: string
  customerEmail: string
  customerAddress: string
  vendorAddress: string
  items: Array<{
    productName: string
    sku?: string
    quantity: number
    unitPrice: number
    total: number
  }>
  rentalStart: string
  rentalEnd: string
  subtotal: number
  depositAmount: number
  taxAmount: number
  totalPaid: number
  paymentMethod: string
}

export function generateAmazonStyleInvoiceHtml(data: InvoiceData): string {
  const itemRows = data.items
    .map(
      (item, idx) => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 12px; font-size: 13px; color: #111827;">${idx + 1}</td>
      <td style="padding: 12px; font-size: 13px; color: #111827; font-weight: 600;">
        ${item.productName}
        <div style="font-size: 11px; color: #6B7280; font-weight: normal; margin-top: 2px;">
          SKU: ${item.sku || 'EQP-2026-N1'} | Period: ${new Date(data.rentalStart).toLocaleDateString()} to ${new Date(data.rentalEnd).toLocaleDateString()}
        </div>
      </td>
      <td style="padding: 12px; font-size: 13px; color: #111827; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; font-size: 13px; color: #111827; text-align: right; font-family: monospace;">₹${item.unitPrice.toLocaleString()}</td>
      <td style="padding: 12px; font-size: 13px; color: #111827; text-align: right; font-family: monospace; font-weight: 700;">₹${item.total.toLocaleString()}</td>
    </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #FFFFFF; color: #111827; margin: 0; padding: 20px; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #D1D5DB; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 2px solid #F26522; padding-bottom: 16px; }
    .amazon-badge { background-color: #232F3E; color: #FF9900; font-weight: bold; padding: 6px 14px; border-radius: 6px; font-size: 14px; display: inline-block; }
    .invoice-title { font-size: 24px; font-weight: bold; color: #111827; margin: 0; }
    .details-grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .details-box { width: 50%; vertical-align: top; padding: 12px; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items-table th { background-color: #F3F4F6; color: #374151; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #D1D5DB; }
    .totals-table { width: 320px; float: right; border-collapse: collapse; margin-bottom: 24px; }
    .totals-table td { padding: 6px 12px; font-size: 13px; }
    .paid-stamp { display: inline-block; background-color: #DCFCE7; color: #166534; border: 2px solid #22C55E; font-weight: bold; font-size: 14px; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; }
    .footer-note { clear: both; border-top: 1px border-dashed #D1D5DB; pt: 16px; font-size: 11px; color: #6B7280; text-align: center; margin-top: 40px; }
  </style>
</head>
<body>

<div class="invoice-card">
  <!-- Top Banner -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <span class="amazon-badge">Lease360 Prime</span>
        <span style="font-weight: bold; font-size: 18px; margin-left: 8px; color: #111827;">Official Order Receipt</span>
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <h1 class="invoice-title">TAX INVOICE</h1>
        <div style="font-size: 12px; color: #4B5563; font-family: monospace; margin-top: 4px;">
          Invoice No: <strong>${data.invoiceNumber}</strong><br>
          Order Ref: <strong>${data.orderNumber}</strong><br>
          Date: ${data.orderDate}
        </div>
      </td>
    </tr>
  </table>

  <!-- Status Banner -->
  <div style="margin-bottom: 24px; text-align: right;">
    <span class="paid-stamp">✓ PAYMENT VERIFIED & PAID</span>
  </div>

  <!-- Seller vs Buyer Address Grid -->
  <table class="details-grid">
    <tr>
      <td class="details-box" style="padding-right: 16px;">
        <div style="font-size: 11px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin-bottom: 6px;">Sold By (Vendor Warehouse)</div>
        <div style="font-size: 13px; font-weight: bold; color: #111827;">Lease360 Central Vendor Warehouse</div>
        <div style="font-size: 12px; color: #4B5563; line-height: 1.5; margin-top: 4px;">
          Gate 4, MIDC Industrial Area, Tech Park Compound<br>
          Mumbai, Maharashtra - 400050<br>
          GSTIN: <strong>27AAAAA0000A1Z5</strong>
        </div>
      </td>
      <td style="width: 16px;"></td>
      <td class="details-box">
        <div style="font-size: 11px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin-bottom: 6px;">Billed & Delivered To (Customer)</div>
        <div style="font-size: 13px; font-weight: bold; color: #111827;">${data.customerName}</div>
        <div style="font-size: 12px; color: #4B5563; line-height: 1.5; margin-top: 4px;">
          ${data.customerAddress}<br>
          Email: <strong>${data.customerEmail}</strong>
        </div>
      </td>
    </tr>
  </table>

  <!-- Itemized Breakdown Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Description / Equipment</th>
        <th style="text-align: center; width: 60px;">Qty</th>
        <th style="text-align: right; width: 100px;">Daily Rate</th>
        <th style="text-align: right; width: 110px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Totals Summary Table -->
  <table class="totals-table">
    <tr>
      <td style="color: #4B5563;">Subtotal (Equipment Net):</td>
      <td style="text-align: right; font-weight: 600; font-family: monospace;">₹${data.subtotal.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="color: #4B5563;">Escrow Security Deposit (Refundable):</td>
      <td style="text-align: right; font-weight: 600; font-family: monospace; color: #2563EB;">₹${data.depositAmount.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="color: #4B5563;">Estimated GST (18% Included):</td>
      <td style="text-align: right; font-weight: 600; font-family: monospace;">₹${data.taxAmount.toLocaleString()}</td>
    </tr>
    <tr style="border-top: 2px solid #111827; border-bottom: 2px solid #111827;">
      <td style="font-weight: bold; font-size: 15px; color: #111827; padding-top: 8px; padding-bottom: 8px;">Total Paid:</td>
      <td style="text-align: right; font-weight: bold; font-size: 16px; color: #F26522; font-family: monospace; padding-top: 8px; padding-bottom: 8px;">₹${data.totalPaid.toLocaleString()}</td>
    </tr>
  </table>

  <!-- Footer Proof Note -->
  <div class="footer-note">
    <strong>PROOF OF PAYMENT & ORDER CONTRACT</strong><br>
    This computer-generated tax invoice serves as official proof of payment and equipment rental reservation.<br>
    No physical signature required. Powered by Lease360 Operations Engine © 2026.
  </div>
</div>

</body>
</html>
  `
}
