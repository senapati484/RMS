import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { connectDB } from './db'
import { authMiddleware } from './middleware/auth'
import authRoutes from './routes/auth.routes'
import productRoutes from './routes/product.routes'

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const app = express()
const PORT = process.env.EXPRESS_PORT || 5001

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}))
app.use(express.json())
app.use(authMiddleware)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Lease360 Standalone Express API Server',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  })
})

// Start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 [Express Backend] Server running on http://localhost:${PORT}`)
      console.log(`⚡ [Express Backend] Health Check: http://localhost:${PORT}/api/health`)
    })
  })
  .catch((err) => {
    console.error('❌ [Express Backend] Database connection failed:', err)
    process.exit(1)
  })
