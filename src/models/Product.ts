import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string
  imageUrl?: string
  category: string
  brand?: string
  sku: string
  totalStock: number
  availableStock: number
  baseDepositAmt: number
  depositIsPercent: boolean
  accessoryList: string[]
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
    category: { type: String, required: true },
    brand: { type: String },
    sku: { type: String, required: true, unique: true },
    totalStock: { type: Number, default: 1, min: 0 },
    availableStock: { type: Number, default: 1, min: 0 },
    baseDepositAmt: { type: Number, default: 0 },
    depositIsPercent: { type: Boolean, default: false },
    accessoryList: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    variants: [
      {
        attribute: { type: String }, // "Brand", "Color", "Size"
        value: { type: String },
      },
    ],
  },
  { timestamps: true }
)

ProductSchema.index({ category: 1, isPublished: 1 })
ProductSchema.index({ slug: 1 })
ProductSchema.index({ sku: 1 })

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
