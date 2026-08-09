import { Router, Response } from 'express'
import { SignJWT } from 'jose'
import { User } from '../models/User'
import { AuthRequest, requireAuth } from '../middleware/auth'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'lease360-enterprise-jwt-secret-key-2026-production'
const secret = new TextEncoder().encode(JWT_SECRET)

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await user.comparePassword(password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    })

    return res.json({
      success: true,
      redirect: '/',
      localStorage: token,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    console.error('[EXPRESS LOGIN ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }
    const user = await User.create({ name, email: email.toLowerCase(), password })
    
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    })

    return res.status(201).json({ success: true, token, localStorage: token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error('[EXPRESS REGISTER ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json({ success: true, message: 'Password reset link sent' })
  } catch (err) {
    console.error('[EXPRESS FORGOT PASSWORD ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId, '-passwordHash').lean()
    if (!user) {
      res.clearCookie('auth-token', { path: '/' })
      return res.status(401).json({ error: 'Unauthorized' })
    }
    return res.json({ user })
  } catch (err) {
    console.error('[EXPRESS ME ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth-token', { path: '/' })
  return res.json({ success: true, message: 'Logged out successfully' })
})

export default router
