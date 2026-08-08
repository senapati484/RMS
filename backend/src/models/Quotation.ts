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
  adminNotes?: string
  customerNotes?: string
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
    subTotal: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    rentalStart: { type: Date, required: true },
    rentalEnd: { type: Date, required: true },
    validUntil: { type: Date },
    deliveryMode: { type: String, enum: ['STORE_PICKUP', 'SHIPPING'], default: 'STORE_PICKUP' },
    adminNotes: { type: String },
    customerNotes: { type: String },
  },
  { timestamps: true }
)

QuotationSchema.index({ userId: 1, createdAt: -1 })
QuotationSchema.index({ status: 1 })

export const Quotation: Model<IQuotation> =
  mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema)
