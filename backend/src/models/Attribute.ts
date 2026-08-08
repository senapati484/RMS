import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAttributeValue {
  name: string
  extraPrice?: number
}

export interface IAttribute extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  values: IAttributeValue[]
  createdAt: Date
  updatedAt: Date
}

const AttributeSchema = new Schema<IAttribute>(
  {
    name: { type: String, required: true, unique: true },
    values: [
      {
        name: { type: String, required: true },
        extraPrice: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
)

export const Attribute: Model<IAttribute> =
  mongoose.models.Attribute || mongoose.model<IAttribute>('Attribute', AttributeSchema)
