// models/Notification.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'PICKUP_REMINDER'
  | 'RETURN_DUE'
  | 'OVERDUE_ALERT'
  | 'DEPOSIT_SETTLED'
  | 'MAINTENANCE_UPDATE'
  | 'QUOTATION_READY'
  | 'QUOTATION_EXPIRING'
  | 'SYSTEM'

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  linkHref?: string
  relatedOrderId?: mongoose.Types.ObjectId
  relatedTicketId?: mongoose.Types.ObjectId
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'ORDER_CONFIRMED',
        'PICKUP_REMINDER',
        'RETURN_DUE',
        'OVERDUE_ALERT',
        'DEPOSIT_SETTLED',
        'MAINTENANCE_UPDATE',
        'QUOTATION_READY',
        'QUOTATION_EXPIRING',
        'SYSTEM',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    linkHref: { type: String },
    relatedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    relatedTicketId: { type: Schema.Types.ObjectId, ref: 'MaintenanceTicket' },
  },
  { timestamps: true }
)

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema)
