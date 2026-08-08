// lib/pdf-generator.ts
// Server-side PDF Tax Invoice generator using jsPDF
import { jsPDF } from 'jspdf'

export interface PdfInvoiceOptions {
  orderNumber: string
  invoiceNumber: string
  orderDate: string
  customerName: string
  customerEmail: string
  customerAddress: string
  vendorAddress: string
  items: Array<{
    productName: string
    sku: string
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
  paymentMethod?: string
}

export function generateInvoicePdfBuffer(opts: PdfInvoiceOptions): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const primaryColor = [242, 101, 34] // #F26522 Lease360 Orange
  const darkBg = [26, 26, 26]
  const textDark = [30, 30, 30]
  const textMuted = [100, 100, 100]

  // Top Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 28, 'F')

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text('Lease360', 14, 18)

  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')
  doc.text('OFFICIAL TAX INVOICE & PROOF OF PAYMENT', 210 - 14, 18, { align: 'right' })

  let y = 38

  // Invoice & Order References Box
  doc.setFillColor(245, 245, 245)
  doc.rect(14, y, 182, 22, 'F')

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(textDark[0], textDark[1], textDark[2])
  doc.text(`Tax Invoice No: ${opts.invoiceNumber}`, 18, y + 8)
  doc.text(`Order No: #${opts.orderNumber}`, 18, y + 15)

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
  doc.text(`Date Issued: ${opts.orderDate}`, 210 - 18, y + 8, { align: 'right' })
  doc.text(`Payment Status: PAID (${opts.paymentMethod || 'UPI / Card'})`, 210 - 18, y + 15, { align: 'right' })

  y += 30

  // Two Column Addresses: Vendor & Billed To Customer
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('BILLED BY (VENDOR)', 14, y)
  doc.text('BILLED TO (CUSTOMER)', 110, y)

  y += 5
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(textDark[0], textDark[1], textDark[2])
  doc.text('Lease360 Central Vendor Warehouse HQ', 14, y)
  doc.text(opts.customerName, 110, y)

  y += 5
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
  doc.text('GSTIN: 27AAAAA0000A1Z5 | MIDC Tech Park', 14, y)
  doc.text(`Email: ${opts.customerEmail}`, 110, y)

  y += 4.5
  doc.text('Gate 4, MIDC Area, Mumbai, MH - 400050', 14, y)

  const addressLines = doc.splitTextToSize(opts.customerAddress, 85)
  doc.text(addressLines, 110, y)

  y += Math.max(12, addressLines.length * 4.5 + 4)

  // Rental Duration Callout Box
  doc.setFillColor(254, 243, 235) // Light Orange tint
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(14, y, 182, 14, 'FD')

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('RENTAL DURATION:', 18, y + 9)

  doc.setFont('Helvetica', 'normal')
  doc.setTextColor(textDark[0], textDark[1], textDark[2])
  doc.text(
    `${new Date(opts.rentalStart).toLocaleString('en-IN')}  to  ${new Date(opts.rentalEnd).toLocaleString('en-IN')}`,
    55,
    y + 9
  )

  y += 20

  // Items Table Header
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2])
  doc.rect(14, y, 182, 8, 'F')

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text('EQUIPMENT ITEM & SPECIFICATION', 18, y + 5.5)
  doc.text('QTY', 125, y + 5.5, { align: 'center' })
  doc.text('UNIT PRICE', 155, y + 5.5, { align: 'right' })
  doc.text('TOTAL', 190, y + 5.5, { align: 'right' })

  y += 8

  // Item Rows
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(textDark[0], textDark[1], textDark[2])

  opts.items.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250)
      doc.rect(14, y, 182, 9, 'F')
    }

    doc.setFont('Helvetica', 'bold')
    doc.text(item.productName, 18, y + 6)
    doc.setFont('Helvetica', 'normal')

    doc.text(String(item.quantity), 125, y + 6, { align: 'center' })
    doc.text(`Rs. ${item.unitPrice.toLocaleString('en-IN')}`, 155, y + 6, { align: 'right' })
    doc.text(`Rs. ${item.total.toLocaleString('en-IN')}`, 190, y + 6, { align: 'right' })

    y += 9
  })

  doc.setDrawColor(220, 220, 220)
  doc.line(14, y, 196, y)
  y += 6

  // Financial Totals Section
  const rightX = 190
  const labelX = 135

  doc.setFontSize(9)
  doc.setFont('Helvetica', 'normal')
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])

  doc.text('Rental Subtotal:', labelX, y)
  doc.text(`Rs. ${opts.subtotal.toLocaleString('en-IN')}`, rightX, y, { align: 'right' })
  y += 5.5

  doc.text('GST (18% Included):', labelX, y)
  doc.text(`Rs. ${opts.taxAmount.toLocaleString('en-IN')}`, rightX, y, { align: 'right' })
  y += 5.5

  doc.text('Refundable Security Deposit:', labelX, y)
  doc.text(`Rs. ${opts.depositAmount.toLocaleString('en-IN')}`, rightX, y, { align: 'right' })
  y += 7

  doc.setFillColor(245, 245, 245)
  doc.rect(130, y - 4, 66, 10, 'F')

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('TOTAL PAID:', labelX, y + 2.5)
  doc.text(`Rs. ${opts.totalPaid.toLocaleString('en-IN')}`, rightX, y + 2.5, { align: 'right' })

  y += 18

  // Computer-Generated Legal Footer
  doc.setFillColor(245, 245, 245)
  doc.rect(14, y, 182, 16, 'F')

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
  doc.text('This is an official computer-generated Tax Invoice issued under Indian GST regulations.', 18, y + 6)
  doc.text('No physical signature is required. Equipment serial numbers & return verification logs are tracked digitally.', 18, y + 11)

  // ArrayBuffer output converted to Node Buffer
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
