import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole = 'ADMIN' | 'STAFF' | 'PORTAL_USER'

export type DLStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  name: string
  phone?: string
  role: UserRole
  profileImage?: string
  trustScore: number
  isGovIdVerified: boolean
  aadhaarMasked?: string
  digiLockerTxnId?: string
  govIdType?: string
  companyName?: string
  gstin?: string
  employeeId?: string
  addressLine?: string
  // Driving License KYC (required for vehicle rentals)
  drivingLicense: {
    number?: string
    expiry?: string
    status: DLStatus
    docUrl?: string
    rejectionReason?: string
    submittedAt?: Date
    verifiedAt?: Date
  }
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String },
    role: { type: String, enum: ['ADMIN', 'STAFF', 'PORTAL_USER'], default: 'PORTAL_USER' },
    profileImage: { type: String },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    isGovIdVerified: { type: Boolean, default: false },
    aadhaarMasked: { type: String },
    digiLockerTxnId: { type: String },
    govIdType: { type: String, default: 'AADHAAR' },
    companyName: { type: String },
    gstin: { type: String },
    employeeId: { type: String },
    addressLine: { type: String },
    drivingLicense: {
      number: { type: String },
      expiry: { type: String },
      status: {
        type: String,
        enum: ['NOT_SUBMITTED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED'],
        default: 'NOT_SUBMITTED',
      },
      docUrl: { type: String },
      rejectionReason: { type: String },
      submittedAt: { type: Date },
      verifiedAt: { type: Date },
    },
  },
  { timestamps: true }
)

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  next()
})

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash)
}

UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
