import mongoose, { Schema, Document, Model } from 'mongoose'

export type QuotationStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'EXPIRED' | 'CONVERTED'

export interface IQuotation extends Document {
  quoteNumber: string
  status: QuotationStatus
  createdById: mongoose.Types.ObjectId
  customerId?: mongoose.Types.ObjectId
  walkInName?: string
  walkInPhone?: string
  walkInEmail?: string
  termsNotes?: string
  itemsSnapshot: Array<{
    productId: mongoose.Types.ObjectId
    productName: string
    rentalPeriodLabel: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
  rentalStart: Date
  rentalEnd: Date
  subTotal: number
  depositAmount: number
  totalAmount: number
  expiresAt?: Date
  convertedOrderId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const QuotationSchema = new Schema<IQuotation>(
  {
    quoteNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'CONFIRMED', 'EXPIRED', 'CONVERTED'],
      default: 'DRAFT',
    },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    walkInName: String,
    walkInPhone: String,
    walkInEmail: String,
    termsNotes: String,
    itemsSnapshot: [
      {
        productId: Schema.Types.ObjectId,
        productName: String,
        rentalPeriodLabel: String,
        quantity: Number,
        unitPrice: Number,
        lineTotal: Number,
      },
    ],
    rentalStart: { type: Date, required: true },
    rentalEnd: { type: Date, required: true },
    subTotal: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    expiresAt: Date,
    convertedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
)

QuotationSchema.index({ status: 1, createdById: 1 })

export const Quotation: Model<IQuotation> =
  mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema)

// ── Notification ──────────────────────────────────────────────
export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'PICKUP_SCHEDULED'
  | 'RETURN_DUE'
  | 'RETURN_OVERDUE'
  | 'DEPOSIT_SETTLED'
  | 'MAINTENANCE_COMPLETE'
  | 'SYSTEM'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  orderId?: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  aiDrafted: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    type: {
      type: String,
      enum: ['ORDER_CONFIRMED', 'PICKUP_SCHEDULED', 'RETURN_DUE', 'RETURN_OVERDUE', 'DEPOSIT_SETTLED', 'MAINTENANCE_COMPLETE', 'SYSTEM'],
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    aiDrafted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

NotificationSchema.index({ userId: 1, isRead: 1 })

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)

// ── MaintenanceTicket ─────────────────────────────────────────
export interface IMaintenanceTicket extends Document {
  ticketNumber: string
  productId: mongoose.Types.ObjectId
  orderId?: mongoose.Types.ObjectId
  issueNote: string
  status: 'INSPECTION_PENDING' | 'UNDER_REPAIR' | 'REPAIRED' | 'WRITTEN_OFF'
  estimatedCost?: number
  resolvedAt?: Date
  technician?: string
  createdAt: Date
  updatedAt: Date
}

const MaintenanceTicketSchema = new Schema<IMaintenanceTicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    issueNote: { type: String, required: true },
    status: {
      type: String,
      enum: ['INSPECTION_PENDING', 'UNDER_REPAIR', 'REPAIRED', 'WRITTEN_OFF'],
      default: 'INSPECTION_PENDING',
    },
    estimatedCost: Number,
    resolvedAt: Date,
    technician: String,
  },
  { timestamps: true }
)

export const MaintenanceTicket: Model<IMaintenanceTicket> =
  mongoose.models.MaintenanceTicket ||
  mongoose.model<IMaintenanceTicket>('MaintenanceTicket', MaintenanceTicketSchema)

// ── OrgSetting (KV store) ─────────────────────────────────────
export interface IOrgSetting extends Document {
  key: string
  value: string
  updatedAt: Date
}

const OrgSettingSchema = new Schema<IOrgSetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
)

export const OrgSetting: Model<IOrgSetting> =
  mongoose.models.OrgSetting || mongoose.model<IOrgSetting>('OrgSetting', OrgSettingSchema)
