import mongoose, { Schema, Document, Model } from 'mongoose'

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type TicketCategory = 'DAMAGE' | 'CLEANING' | 'CALIBRATION' | 'REPAIR' | 'INSPECTION' | 'OTHER'

export interface IMaintenanceTicket extends Document {
  _id: mongoose.Types.ObjectId
  ticketNumber: string
  productId: mongoose.Types.ObjectId
  reportedById: mongoose.Types.ObjectId
  assignedToId?: mongoose.Types.ObjectId
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
}

const MaintenanceTicketSchema = new Schema<IMaintenanceTicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    reportedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    category: {
      type: String,
      enum: ['DAMAGE', 'CLEANING', 'CALIBRATION', 'REPAIR', 'INSPECTION', 'OTHER'],
      default: 'OTHER',
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
)

MaintenanceTicketSchema.index({ productId: 1 })
MaintenanceTicketSchema.index({ status: 1 })

export const MaintenanceTicket: Model<IMaintenanceTicket> =
  mongoose.models.MaintenanceTicket || mongoose.model<IMaintenanceTicket>('MaintenanceTicket', MaintenanceTicketSchema)
