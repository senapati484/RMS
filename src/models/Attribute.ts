import mongoose, { Schema, Document, Model } from 'mongoose'

export type DisplayType = 'Radio' | 'Pills' | 'Check Box' | 'Image'

export interface IAttributeValue {
  value: string
  defaultExtraPrice: number
}

export interface IAttribute extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  displayType: DisplayType
  values: IAttributeValue[]
  createdAt: Date
  updatedAt: Date
}

const AttributeValueSchema = new Schema<IAttributeValue>({
  value: { type: String, required: true },
  defaultExtraPrice: { type: Number, default: 0 },
})

const AttributeSchema = new Schema<IAttribute>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    displayType: {
      type: String,
      enum: ['Radio', 'Pills', 'Check Box', 'Image'],
      default: 'Radio',
    },
    values: [AttributeValueSchema],
  },
  { timestamps: true }
)

export const Attribute: Model<IAttribute> =
  mongoose.models.Attribute || mongoose.model<IAttribute>('Attribute', AttributeSchema)
