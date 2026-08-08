import nodemailer from 'nodemailer'

const SMTP_EMAIL = process.env.NEXT_PUBLIC_SMTP_EMAIL || process.env.SMTP_EMAIL
const SMTP_PASS = process.env.NEXT_PUBLIC_SMTP_PASS || process.env.SMTP_PASS

// Configure transport (Gmail default or custom SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASS,
  },
})

// General mail sender helper with non-blocking error handling
async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!SMTP_EMAIL || !SMTP_PASS) {
    console.warn('[MAILER] SMTP credentials not set in env. Skipping email send.')
    return false
  }

  try {
    const info = await transporter.sendMail({
      from: `"RentalOS Operations" <${SMTP_EMAIL}>`,
      to,
      subject,
      html,
    })
    console.log('[MAILER] Email sent successfully:', info.messageId, 'to:', to)
    return true
  } catch (err) {
    console.error('[MAILER] Error sending email:', err)
    return false
  }
}

// ── HTML Template Wrapper ──────────────────────────────────────
function emailWrapper(title: string, bodyContent: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #FAFAFA; }
      .container { max-width: 600px; margin: 20px auto; background-color: #111111; border: 1px solid #222222; border-radius: 16px; overflow: hidden; }
      .header { background-color: #161616; padding: 24px; text-align: center; border-bottom: 1px solid #222222; }
      .logo-badge { display: inline-block; width: 36px; height: 36px; background-color: #F26522; border-radius: 50%; color: #FFFFFF; font-weight: bold; font-size: 16px; line-height: 36px; text-align: center; }
      .brand-title { font-size: 20px; font-weight: 700; color: #FFFFFF; vertical-align: middle; margin-left: 8px; }
      .content { padding: 32px 24px; }
      .heading { font-size: 22px; font-weight: 700; color: #FFFFFF; margin-top: 0; margin-bottom: 8px; }
      .subheading { font-size: 14px; color: #888888; margin-bottom: 24px; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
      .badge-orange { background-color: rgba(242, 101, 34, 0.15); color: #F26522; border: 1px solid rgba(242, 101, 34, 0.3); }
      .badge-green { background-color: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
      .badge-red { background-color: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
      .card { background-color: rgba(255, 255, 255, 0.03); border: 1px solid #222222; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
      .table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
      .table th { text-align: left; color: #666666; font-size: 12px; padding-bottom: 8px; border-bottom: 1px solid #222222; }
      .table td { padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #DDDDDD; }
      .total-row { font-weight: bold; font-size: 16px; color: #FFFFFF; }
      .btn { display: inline-block; background-color: #F26522; color: #FFFFFF; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-size: 14px; margin-top: 16px; }
      .footer { background-color: #0d0d0d; padding: 20px; text-align: center; font-size: 12px; color: #555555; border-top: 1px solid #1c1c1c; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <span class="logo-badge">R</span>
        <span class="brand-title">RentalOS</span>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        RentalOS — Automated Equipment Rental & Deposit Security Engine<br>
        Odoo Hackathon 2026 Submission
      </div>
    </div>
  </body>
  </html>
  `
}

// ── 1. Order Confirmation Email (to Customer & Staff) ──────────
export async function sendOrderConfirmationEmail({
  userEmail,
  userName,
  orderNumber,
  items,
  totalAmount,
  depositAmount,
  rentalStart,
  rentalEnd,
}: {
  userEmail: string
  userName: string
  orderNumber: string
  items: Array<{ productName: string; quantity: number; unitPrice: number }>
  totalAmount: number
  depositAmount: number
  rentalStart: string
  rentalEnd: string
}) {
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td>${item.productName} ×${item.quantity}</td>
      <td style="text-align: right;">₹${(item.unitPrice * item.quantity).toLocaleString()}</td>
    </tr>`
    )
    .join('')

  const content = `
    <span class="badge badge-orange">Order Confirmed</span>
    <h1 class="heading" style="margin-top: 12px;">Rental Order #${orderNumber}</h1>
    <p class="subheading">Hello ${userName}, your rental order has been confirmed and reserved.</p>

    <div class="card">
      <div style="font-size: 12px; color: #888888; margin-bottom: 8px;">RENTAL PERIOD</div>
      <div style="font-size: 15px; font-weight: 600; color: #FFFFFF;">
        ${new Date(rentalStart).toLocaleDateString()} — ${new Date(rentalEnd).toLocaleDateString()}
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Equipment</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr>
          <td>Security Deposit (Refundable)</td>
          <td style="text-align: right; color: #3b82f6;">₹${depositAmount.toLocaleString()}</td>
        </tr>
        <tr class="total-row">
          <td style="padding-top: 16px;">Total Reserved Amount</td>
          <td style="text-align: right; padding-top: 16px; color: #F26522;">₹${totalAmount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:3000/dashboard/orders" class="btn">View Order Details →</a>
    </div>
  `

  return sendMail({
    to: userEmail,
    subject: `[RentalOS] Rental Order #${orderNumber} Confirmed`,
    html: emailWrapper(`Order #${orderNumber} Confirmed`, content),
  })
}

// ── 2. Pickup Dispatch Email (to Customer & Staff) ─────────────
export async function sendPickupNotificationEmail({
  userEmail,
  userName,
  orderNumber,
  rentalEnd,
}: {
  userEmail: string
  userName: string
  orderNumber: string
  rentalEnd: string
}) {
  const content = `
    <span class="badge badge-orange">Equipment Picked Up</span>
    <h1 class="heading" style="margin-top: 12px;">Active Rental: Order #${orderNumber}</h1>
    <p class="subheading">Hello ${userName}, equipment has been picked up. Please ensure return before the due date to avoid late fees.</p>

    <div class="card" style="border-color: rgba(242, 101, 34, 0.3);">
      <div style="font-size: 12px; color: #F26522; font-weight: 600; margin-bottom: 4px;">RETURN DUE DATE</div>
      <div style="font-size: 18px; font-weight: 700; color: #FFFFFF;">
        ${new Date(rentalEnd).toLocaleString()}
      </div>
      <div style="font-size: 12px; color: #888888; margin-top: 8px;">
        Late returns incur charges calculated hourly per contract rules.
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:3000/dashboard/orders" class="btn">View Equipment Checklist →</a>
    </div>
  `

  return sendMail({
    to: userEmail,
    subject: `[RentalOS] Equipment Picked Up — Order #${orderNumber}`,
    html: emailWrapper(`Equipment Picked Up #${orderNumber}`, content),
  })
}

// ── 3. Return & Deposit Settlement Email (Customer & Admin) ───
export async function sendReturnSettlementEmail({
  userEmail,
  userName,
  orderNumber,
  status,
  lateFee,
  damageDeduction,
  depositRefunded,
  depositHeld,
}: {
  userEmail: string
  userName: string
  orderNumber: string
  status: string
  lateFee: number
  damageDeduction: number
  depositRefunded: number
  depositHeld: number
}) {
  const isLate = status === 'RETURNED_LATE' || lateFee > 0

  const content = `
    <span class="badge ${isLate ? 'badge-red' : 'badge-green'}">${status.replace(/_/g, ' ')}</span>
    <h1 class="heading" style="margin-top: 12px;">Deposit Settlement: Order #${orderNumber}</h1>
    <p class="subheading">Hello ${userName}, your return inspection is complete and deposit has been reconciled.</p>

    <div class="card">
      <div style="font-size: 12px; color: #888888; margin-bottom: 12px;">DEPOSIT RECONCILIATION SUMMARY</div>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="color: #888888; padding: 4px 0;">Initial Deposit Held</td>
          <td style="text-align: right; color: #FFFFFF; font-weight: 600;">₹${depositHeld.toLocaleString()}</td>
        </tr>
        ${
          lateFee > 0
            ? `<tr>
                <td style="color: #ef4444; padding: 4px 0;">Late Fee Deduction</td>
                <td style="text-align: right; color: #ef4444; font-weight: 600;">-₹${lateFee.toLocaleString()}</td>
              </tr>`
            : ''
        }
        ${
          damageDeduction > 0
            ? `<tr>
                <td style="color: #f97316; padding: 4px 0;">Damage Cost Deduction</td>
                <td style="text-align: right; color: #f97316; font-weight: 600;">-₹${damageDeduction.toLocaleString()}</td>
              </tr>`
            : ''
        }
        <tr style="border-top: 1px solid #333333;">
          <td style="color: #22c55e; padding: 12px 0 4px 0; font-weight: bold;">Refund Amount Credited</td>
          <td style="text-align: right; color: #22c55e; font-size: 18px; font-weight: bold; padding-top: 12px;">₹${depositRefunded.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:3000/dashboard/orders" class="btn">View Settlement Ledger →</a>
    </div>
  `

  return sendMail({
    to: userEmail,
    subject: `[RentalOS] Deposit Settlement & Inspection Completed #${orderNumber}`,
    html: emailWrapper(`Deposit Settlement #${orderNumber}`, content),
  })
}

// ── 4. Quotation Proposal Email (to Customer) ──────────────────
export async function sendQuotationEmail({
  userEmail,
  userName,
  quoteNumber,
  totalAmount,
  depositAmount,
  validUntil,
}: {
  userEmail: string
  userName: string
  quoteNumber: string
  totalAmount: number
  depositAmount: number
  validUntil: string
}) {
  const content = `
    <span class="badge badge-orange">Rental Proposal</span>
    <h1 class="heading" style="margin-top: 12px;">Quotation Proposal #${quoteNumber}</h1>
    <p class="subheading">Hello ${userName}, a custom rental proposal has been created for your review.</p>

    <div class="card">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="color: #888888;">Proposed Total Amount</td>
          <td style="text-align: right; color: #F26522; font-weight: bold; font-size: 16px;">₹${totalAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="color: #888888; padding-top: 8px;">Required Deposit</td>
          <td style="text-align: right; color: #FFFFFF; font-weight: 600; padding-top: 8px;">₹${depositAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="color: #888888; padding-top: 8px;">Proposal Valid Until</td>
          <td style="text-align: right; color: #eab308; padding-top: 8px;">${new Date(validUntil).toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:3000/dashboard/quotations" class="btn">Review & Accept Proposal →</a>
    </div>
  `

  return sendMail({
    to: userEmail,
    subject: `[RentalOS] Custom Rental Proposal #${quoteNumber}`,
    html: emailWrapper(`Rental Proposal #${quoteNumber}`, content),
  })
}

// ── 5. Maintenance Alert Email (to Admin & Staff) ──────────────
export async function sendMaintenanceTicketEmail({
  adminEmail,
  ticketNumber,
  productName,
  title,
  priority,
}: {
  adminEmail: string
  ticketNumber: string
  productName: string
  title: string
  priority: string
}) {
  const content = `
    <span class="badge badge-red">${priority} Priority Issue</span>
    <h1 class="heading" style="margin-top: 12px;">Maintenance Ticket #${ticketNumber}</h1>
    <p class="subheading">Equipment issue reported requiring inspection/repair.</p>

    <div class="card">
      <div style="font-size: 12px; color: #888888; margin-bottom: 4px;">EQUIPMENT & ISSUE</div>
      <div style="font-size: 16px; font-weight: bold; color: #FFFFFF; margin-bottom: 8px;">${productName}</div>
      <div style="font-size: 14px; color: #DDDDDD;">${title}</div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:3000/dashboard/maintenance" class="btn">Manage Maintenance Ticket →</a>
    </div>
  `

  return sendMail({
    to: adminEmail,
    subject: `[RentalOS Maintenance] Ticket #${ticketNumber} (${priority}) — ${productName}`,
    html: emailWrapper(`Maintenance #${ticketNumber}`, content),
  })
}
