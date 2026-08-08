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
  category: string       // derived from productType, kept for backwards compat
  brand?: string
  sku: string
  condition: ProductCondition
  totalStock: number
  availableStock: number
  dailyRate: number
  baseDepositAmt: number
  depositIsPercent: boolean
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
    baseDepositAmt: { type: Number, default: 0 },
    depositIsPercent: { type: Boolean, default: false },
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
ProductSchema.index({ slug: 1 })
ProductSchema.index({ sku: 1 })
ProductSchema.index({ tags: 1 })
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' })

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
