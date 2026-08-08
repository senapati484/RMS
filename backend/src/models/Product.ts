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
  category: string
  brand?: string
  sku: string
  condition: ProductCondition
  totalStock: number
  availableStock: number
  dailyRate: number
  weeklyRate?: number
  monthlyRate?: number
  costPrice?: number
  salesPrice?: number
  baseDepositAmt: number
  depositIsPercent: boolean
  accessoryList: string[]
  tags: string[]
  isPublished: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
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
    category: { type: String, required: true, default: 'Electronics' },
    brand: { type: String, trim: true },
    sku: { type: String, required: true, trim: true },
    condition: {
      type: String,
      enum: ['NEW', 'EXCELLENT', 'GOOD', 'FAIR'],
      default: 'EXCELLENT',
    },
    totalStock: { type: Number, default: 1, min: 0 },
    availableStock: { type: Number, default: 1, min: 0 },
    dailyRate: { type: Number, default: 50, min: 0 },
    weeklyRate: { type: Number },
    monthlyRate: { type: Number },
    costPrice: { type: Number },
    salesPrice: { type: Number },
    baseDepositAmt: { type: Number, default: 200, min: 0 },
    depositIsPercent: { type: Boolean, default: false },
    accessoryList: [{ type: String }],
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
)

ProductSchema.index({ isPublished: 1, isArchived: 1, productType: 1 })
ProductSchema.index({ brand: 1 })
ProductSchema.index({ dailyRate: 1 })
ProductSchema.index({ availableStock: 1 })

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
