// api/users/[id]/route.ts
import { NextRequest } from 'next/server'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    return apiError('Forbidden', 403)
  }

  await connectDB()
  const { id } = await params
  const targetUser = await User.findById(id).select('-passwordHash').lean()
  if (!targetUser) return apiError('User not found', 404)

  return apiOk(targetUser)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  const body = await req.json()
  const { trustScore, role, isGovIdVerified } = body

  const updates: Record<string, unknown> = {}
  if (typeof trustScore === 'number') {
    updates.trustScore = Math.min(100, Math.max(0, trustScore))
  }
  if (role) updates.role = role
  if (typeof isGovIdVerified === 'boolean') updates.isGovIdVerified = isGovIdVerified

  const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true })
    .select('-passwordHash')
    .lean()

  if (!updatedUser) return apiError('User not found', 404)

  return apiOk(updatedUser)
}
