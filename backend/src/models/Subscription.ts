// models/Subscription.ts
// Billing & plan state: every account starts with a 90-day FREE trial that
// includes platform + AI access. Afterwards the user pays for the platform
// (PLATFORM) and optionally the AI add-on (AI) — or takes the PRO bundle.
import mongoose, { Schema, Document, Model } from 'mongoose'

export type SubscriptionPlan = 'FREE_TRIAL' | 'PLATFORM' | 'PRO'
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED'
export type SubscriptionTier = 'PLATFORM' | 'AI' | 'PRO'

export interface ISubscriptionPayment {
  tier: SubscriptionTier
  amount: number
  method: 'UPI'
  paidAt: Date
}

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  plan: SubscriptionPlan
  status: SubscriptionStatus
  trialStart: Date
  trialEndsAt: Date
  platformRenewalDue?: Date
  aiEnabled: boolean
  payments: ISubscriptionPayment[]
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: {
      type: String,
      enum: ['FREE_TRIAL', 'PLATFORM', 'PRO'],
      default: 'FREE_TRIAL',
    },
    status: {
      type: String,
      enum: ['TRIAL', 'ACTIVE', 'EXPIRED'],
      default: 'TRIAL',
    },
    trialStart: { type: Date, required: true },
    trialEndsAt: { type: Date, required: true },
    platformRenewalDue: { type: Date },
    aiEnabled: { type: Boolean, default: true }, // true during trial, paid after
    payments: [
      {
        tier: { type: String, enum: ['PLATFORM', 'AI', 'PRO'], required: true },
        amount: { type: Number, required: true },
        method: { type: String, enum: ['UPI'], default: 'UPI' },
        paidAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

SubscriptionSchema.index({ status: 1, trialEndsAt: 1 })

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema)
