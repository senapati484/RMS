import { Request, Response, NextFunction } from 'express'
import { jwtVerify } from 'jose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const JWT_SECRET = process.env.JWT_SECRET || 'lease360-enterprise-jwt-secret-key-2026-production'
const secret = new TextEncoder().encode(JWT_SECRET)

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role: 'ADMIN' | 'STAFF' | 'PORTAL_USER'
    name: string
  }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (req.cookies && req.cookies['auth-token']) {
    token = req.cookies['auth-token']
  }

  if (!token) {
    return next()
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    req.user = payload as unknown as AuthRequest['user']
  } catch {
    // Invalid token — leave req.user undefined
  }

  next()
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}
