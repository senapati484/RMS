import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPriceListItem {
  productId: mongoose.Types.ObjectId
  productName: string
  rentalPeriodId: mongoose.Types.ObjectId
  rentalPeriodLabel: string
  price: number
}

export interface IPriceList extends Document {
  name: string
  isDefault: boolean
  validFrom?: Date
  validTo?: Date
  items: IPriceListItem[]
  createdAt: Date
  updatedAt: Date
}

const PriceListSchema = new Schema<IPriceList>(
  {
    name: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    validFrom: Date,
    validTo: Date,
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: String,
        rentalPeriodId: { type: Schema.Types.ObjectId, ref: 'RentalPeriod', required: true },
        rentalPeriodLabel: String,
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
)

export const PriceList: Model<IPriceList> =
  mongoose.models.PriceList || mongoose.model<IPriceList>('PriceList', PriceListSchema)

// ── RentalPeriod ──────────────────────────────────────────────
export interface IRentalPeriod extends Document {
  label: string
  unit: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  durationValue: number
  sortOrder: number
}

const RentalPeriodSchema = new Schema<IRentalPeriod>({
  label: { type: String, required: true },
  unit: { type: String, enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'], required: true },
  durationValue: { type: Number, required: true },
  sortOrder: { type: Number, default: 0 },
})

export const RentalPeriod: Model<IRentalPeriod> =
  mongoose.models.RentalPeriod || mongoose.model<IRentalPeriod>('RentalPeriod', RentalPeriodSchema)

// ── LateFeeRule ───────────────────────────────────────────────
export interface ILateFeeRule extends Document {
  name: string
  unit: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ratePerUnit: number
  gracePeriodMins: number
  maxFeeCap?: number
  isActive: boolean
}

const LateFeeRuleSchema = new Schema<ILateFeeRule>({
  name: { type: String, required: true },
  unit: { type: String, enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'], default: 'DAILY' },
  ratePerUnit: { type: Number, required: true },
  gracePeriodMins: { type: Number, default: 60 },
  maxFeeCap: Number,
  isActive: { type: Boolean, default: true },
})

export const LateFeeRule: Model<ILateFeeRule> =
  mongoose.models.LateFeeRule || mongoose.model<ILateFeeRule>('LateFeeRule', LateFeeRuleSchema)
