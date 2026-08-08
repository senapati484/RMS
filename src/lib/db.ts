import mongoose from 'mongoose'

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null }
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectDB(): Promise<mongoose.Connection> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 100, // Increased for handling large dataset operations
      minPoolSize: 10,  // Increased minimum pool size
      maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      // Enable connection monitoring and retry logic
      retryWrites: true,
      retryReads: true,
    }
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m.connection)
  }

  cached.conn = await cached.promise
  return cached.conn
}
