import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/odoo-final'

export async function connectDB(): Promise<mongoose.Connection> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection
  }

  const opts = {
    bufferCommands: false,
    maxPoolSize: 100, // Connection pool size for peak loads
    minPoolSize: 10,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    retryReads: true,
  }

  console.log('⚡ [Express Backend] Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI, opts)
  console.log('✅ [Express Backend] MongoDB Connected Successfully!')
  return mongoose.connection
}
