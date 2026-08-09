import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import path from 'path'
import { connectDB } from './db'
import { authMiddleware } from './middleware/auth'
import authRoutes from './routes/auth.routes'
import productRoutes from './routes/product.routes'
import orderRoutes from './routes/order.routes'
import quotationRoutes from './routes/quotation.routes'
import adminRoutes from './routes/admin.routes'
import userRoutes from './routes/user.routes'
import attributeRoutes from './routes/attribute.routes'
import notificationRoutes from './routes/notification.routes'
import maintenanceRoutes from './routes/maintenance.routes'
import profileRoutes from './routes/profile.routes'
import pricelistRoutes from './routes/pricelist.routes'
import checkoutRoutes from './routes/checkout.routes'

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const app = express()
app.disable('x-powered-by')
const PORT = process.env.EXPRESS_PORT || 5001

// Security & Utility Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())   // Parse auth-token cookie forwarded by Next.js proxy
app.use(authMiddleware)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/quotations', quotationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/attributes', attributeRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/maintenance', maintenanceRoutes)
// User profile, subscriptions
app.use('/api/user', profileRoutes)
app.use('/api/subscriptions', profileRoutes)
app.use('/api/pricelists', pricelistRoutes)
app.use('/api/checkout', checkoutRoutes)

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
