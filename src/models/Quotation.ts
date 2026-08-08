// models/Quotation.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface IQuotationItem {
  productId: mongoose.Types.ObjectId
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  rentalPeriodLabel: string
  lineTotal: number
}

export interface IQuotation extends Document {
  _id: mongoose.Types.ObjectId
  quoteNumber: string
  userId: mongoose.Types.ObjectId
  status: QuoteStatus
  items: IQuotationItem[]
  subTotal: number
  depositAmount: number
  totalAmount: number
  rentalStart: Date
  rentalEnd: Date
  validUntil: Date
  deliveryMode: 'STORE_PICKUP' | 'SHIPPING'
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  adminNotes?: string
  customerNotes?: string
  convertedToOrderId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const QuotationSchema = new Schema<IQuotation>(
  {
    quoteNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'DRAFT',
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        productImage: { type: String },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        rentalPeriodLabel: { type: String, required: true },
        lineTotal: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    rentalStart: { type: Date, required: true },
    rentalEnd: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    deliveryMode: { type: String, enum: ['STORE_PICKUP', 'SHIPPING'], default: 'STORE_PICKUP' },
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    adminNotes: String,
    customerNotes: String,
    convertedToOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
)

QuotationSchema.index({ userId: 1 })
QuotationSchema.index({ status: 1 })
QuotationSchema.index({ validUntil: 1 })
// Optimized indexes for large dataset queries
QuotationSchema.index({ userId: 1, status: 1, createdAt: -1 }, { name: 'user_status_created_idx' })
QuotationSchema.index({ status: 1, validUntil: 1, createdAt: -1 }, { name: 'status_valid_created_idx' })
QuotationSchema.index({ userId: 1, validUntil: 1 }, { name: 'user_valid_idx' })
QuotationSchema.index({ createdAt: -1, status: 1 }, { name: 'created_status_idx' })
QuotationSchema.index({ quoteNumber: 1 }, { unique: true, name: 'quote_number_unique_idx' })

export const Quotation: Model<IQuotation> =
  mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema)
