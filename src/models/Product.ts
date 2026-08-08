import mongoose, { Schema, Document, Model } from 'mongoose'

export type ProductType =
  | 'camera' | 'lens' | 'audio' | 'lighting' | 'monitor'
  | 'vehicle' | 'support' | 'furniture' | 'event' | 'other'

export type ProductCondition = 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR'

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string
  imageUrl?: string
  productType: ProductType
  itemKind: 'GOODS' | 'SERVICE'
  category: string       // derived from productType, kept for backwards compat
  brand?: string
  sku: string
  condition: ProductCondition
  totalStock: number
  availableStock: number
  dailyRate: number
  costPrice?: number
  salesPrice?: number
  baseDepositAmt: number
  depositIsPercent: boolean
  periodicity?: 'HOURLY' | 'DAILY' | 'NIGHTLY' | 'WEEKLY'
  paddingTimeHours?: number
  pickupTime?: string
  returnTime?: string
  lateFeePerHour?: number
  accessoryList: string[]
  tags: string[]
  specifications: Map<string, string>  // type-specific key-value specs
  isPublished: boolean
  variants: Array<{ attribute: string; value: string }>
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400' },
    productType: {
      type: String,
      enum: ['camera', 'lens', 'audio', 'lighting', 'monitor', 'vehicle', 'support', 'furniture', 'event', 'other'],
      default: 'other',
    },
    itemKind: {
      type: String,
      enum: ['GOODS', 'SERVICE'],
      default: 'GOODS',
    },
    category: { type: String, required: true },
    brand: { type: String },
    sku: { type: String, required: true, unique: true },
    condition: {
      type: String,
      enum: ['NEW', 'EXCELLENT', 'GOOD', 'FAIR'],
      default: 'EXCELLENT',
    },
    totalStock: { type: Number, default: 1, min: 0 },
    availableStock: { type: Number, default: 1, min: 0 },
    dailyRate: { type: Number, default: 500, min: 0 },
    costPrice: { type: Number, default: 0 },
    salesPrice: { type: Number, default: 500 },
    baseDepositAmt: { type: Number, default: 0 },
    depositIsPercent: { type: Boolean, default: false },
    periodicity: { type: String, enum: ['HOURLY', 'DAILY', 'NIGHTLY', 'WEEKLY'], default: 'DAILY' },
    paddingTimeHours: { type: Number, default: 2 },
    pickupTime: { type: String, default: '10:00' },
    returnTime: { type: String, default: '19:00' },
    lateFeePerHour: { type: Number, default: 100 },
    accessoryList: [{ type: String }],
    tags: [{ type: String }],
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    isPublished: { type: Boolean, default: true },
    variants: [
      {
        attribute: { type: String },
        value: { type: String },
      },
    ],
  },
  { timestamps: true }
)

ProductSchema.index({ category: 1, isPublished: 1 })
ProductSchema.index({ productType: 1, isPublished: 1 })
ProductSchema.index({ tags: 1 })
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' })

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
