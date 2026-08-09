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

export type DepositStatus =
  | 'PENDING'
  | 'HELD'
  | 'PARTIALLY_REFUNDED'
  | 'FULLY_REFUNDED'
  | 'FORFEITED'

export interface IOrderItem {
  productId: mongoose.Types.ObjectId
  productName: string
  productImage?: string
  rentalPeriodLabel: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface IDepositTransaction {
  type: 'HOLD' | 'LATE_FEE_DEDUCTION' | 'DAMAGE_DEDUCTION' | 'REFUND' | 'FORFEIT'
  amount: number
  note?: string
  createdAt: Date
}

export interface IPickupReturnLog {
  type: 'PICKUP' | 'RETURN'
  scheduledAt: Date
  actualAt?: Date
  conditionScore?: 'EXCELLENT' | 'GOOD' | 'DAMAGED' | 'MAJOR_DAMAGE'
  conditionNote?: string
  missingAccessories: string[]
  damageNoted: boolean
  handledById?: mongoose.Types.ObjectId
  createdAt: Date
}

export interface IPaymentInfo {
  method: 'UPI'
  status: 'PENDING' | 'PAID'
  amount: number
  upiTxnRef?: string
  paidAt?: Date
  note?: string
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId
  orderNumber: string
  userId: mongoose.Types.ObjectId
  status: OrderStatus
  deliveryMode: 'STORE_PICKUP' | 'SHIPPING'
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  items: IOrderItem[]
  subTotal: number
  depositAmount: number
  totalAmount: number
  rentalStart: Date
  rentalEnd: Date
  actualReturnAt?: Date
  lateFeeCharged: number
  payment?: IPaymentInfo
  // Deposit embedded
  deposit: {
    amount: number
    status: DepositStatus
    refundedAmount: number
    deductedAmount: number
    deductionReason?: string
    settledAt?: Date
    transactions: IDepositTransaction[]
  }
  pickupReturnLogs: IPickupReturnLog[]
  adminNotes?: string
  invoiceRef?: string
  fromQuotationId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'QUOTATION', 'CONFIRMED', 'PICKED_UP', 'RETURN_PENDING', 'RETURNED_ON_TIME', 'RETURNED_LATE', 'CANCELLED'],
      default: 'DRAFT',
    },
    deliveryMode: { type: String, enum: ['STORE_PICKUP', 'SHIPPING'], default: 'STORE_PICKUP' },
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        productImage: { type: String },
        rentalPeriodLabel: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        lineTotal: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true },
    depositAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    rentalStart: { type: Date, required: true },
    rentalEnd: { type: Date, required: true },
    actualReturnAt: { type: Date },
    lateFeeCharged: { type: Number, default: 0 },
    payment: {
      method: { type: String, enum: ['UPI'], default: 'UPI' },
      status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
      amount: { type: Number, default: 0 },
      upiTxnRef: String,
      paidAt: Date,
      note: String,
    },
    deposit: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['PENDING', 'HELD', 'PARTIALLY_REFUNDED', 'FULLY_REFUNDED', 'FORFEITED'],
        default: 'PENDING',
      },
      refundedAmount: { type: Number, default: 0 },
      deductedAmount: { type: Number, default: 0 },
      deductionReason: String,
      settledAt: Date,
      transactions: [
        {
          type: {
            type: String,
            enum: ['HOLD', 'LATE_FEE_DEDUCTION', 'DAMAGE_DEDUCTION', 'REFUND', 'FORFEIT'],
          },
          amount: Number,
          note: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    pickupReturnLogs: [
      {
        type: { type: String, enum: ['PICKUP', 'RETURN'] },
        scheduledAt: Date,
        actualAt: Date,
        conditionScore: { type: String, enum: ['EXCELLENT', 'GOOD', 'DAMAGED', 'MAJOR_DAMAGE'] },
        conditionNote: String,
        missingAccessories: [String],
        damageNoted: { type: Boolean, default: false },
        handledById: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    adminNotes: String,
    invoiceRef: String,
    fromQuotationId: { type: Schema.Types.ObjectId, ref: 'Quotation' },
  },
  { timestamps: true }
)

OrderSchema.index({ userId: 1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ rentalEnd: 1 })
OrderSchema.index({ userId: 1, status: 1, createdAt: -1 })
OrderSchema.index({ status: 1, rentalEnd: 1 })
OrderSchema.index({ createdAt: -1 })
OrderSchema.index({ orderNumber: 1 }, { unique: true })
// Optimized indexes for large dataset queries
OrderSchema.index({ userId: 1, createdAt: -1 }, { name: 'user_created_idx' })
OrderSchema.index({ status: 1, createdAt: -1 }, { name: 'status_created_idx' })
OrderSchema.index({ status: 1, rentalEnd: 1, createdAt: -1 }, { name: 'status_rental_created_idx' })
OrderSchema.index({ userId: 1, status: 1, rentalEnd: 1, createdAt: -1 }, { name: 'user_status_rental_idx' })
OrderSchema.index({ createdAt: -1, status: 1 }, { name: 'created_status_idx' })

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
