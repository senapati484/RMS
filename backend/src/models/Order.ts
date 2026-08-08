import mongoose, { Schema, Document, Model } from 'mongoose'

export type OrderStatus =
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'PICKED_UP'
  | 'RETURN_PENDING'
  | 'RETURNED_ON_TIME'
  | 'RETURNED_LATE'
  | 'CANCELLED'

export interface IOrderItem {
  productId: mongoose.Types.ObjectId
  productName: string
  productImage?: string
  rentalPeriodLabel: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId
  orderNumber: string
  userId: mongoose.Types.ObjectId
  status: OrderStatus
  rentalStart: Date
  rentalEnd: Date
  items: IOrderItem[]
  subtotal: number
  depositAmount: number
  totalAmount: number
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productImage: { type: String },
    rentalPeriodLabel: { type: String, default: '1 Day' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'QUOTATION', 'CONFIRMED', 'PICKED_UP', 'RETURN_PENDING', 'RETURNED_ON_TIME', 'RETURNED_LATE', 'CANCELLED'],
      default: 'CONFIRMED',
    },
    rentalStart: { type: Date, required: true },
    rentalEnd: { type: Date, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

OrderSchema.index({ userId: 1, createdAt: -1 })
OrderSchema.index({ status: 1, createdAt: -1 })

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
