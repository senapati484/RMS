import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPricelistRule {
  applyOn: 'ALL' | 'CATEGORY' | 'PRODUCT'
  categoryName?: string
  productId?: mongoose.Types.ObjectId
  productName?: string
  priceType: 'DISCOUNT' | 'FIXED'
  discountPercent?: number
  fixedPrice?: number
  minQty: number
  validFrom?: Date
  validTo?: Date
  selectable: boolean
}

export interface IPricelist extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  selectable: boolean
  rules: IPricelistRule[]
  createdAt: Date
  updatedAt: Date
}

const PricelistRuleSchema = new Schema<IPricelistRule>({
  applyOn: { type: String, enum: ['ALL', 'CATEGORY', 'PRODUCT'], default: 'ALL' },
  categoryName: { type: String },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String },
  priceType: { type: String, enum: ['DISCOUNT', 'FIXED'], default: 'DISCOUNT' },
  discountPercent: { type: Number, default: 0 },
  fixedPrice: { type: Number, default: 0 },
  minQty: { type: Number, default: 0 },
  validFrom: { type: Date },
  validTo: { type: Date },
  selectable: { type: Boolean, default: true },
})

const PricelistSchema = new Schema<IPricelist>(
  {
    name: { type: String, required: true, trim: true },
    selectable: { type: Boolean, default: true },
    rules: [PricelistRuleSchema],
  },
  { timestamps: true }
)

export const Pricelist: Model<IPricelist> =
  mongoose.models.Pricelist || mongoose.model<IPricelist>('Pricelist', PricelistSchema)
