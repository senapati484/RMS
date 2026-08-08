import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  plan: 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE'
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  trialEndsAt?: Date
  aiEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: ['TRIAL', 'STARTER', 'PRO', 'ENTERPRISE'], default: 'TRIAL' },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
    trialEndsAt: { type: Date },
    aiEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema)
