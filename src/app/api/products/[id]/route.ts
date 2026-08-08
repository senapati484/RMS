// api/products/[id]/route.ts
import { NextRequest } from 'next/server'
import mongoose from 'mongoose'
import { Product } from '@/models/Product'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params

  const query = mongoose.isValidObjectId(id)
    ? { _id: id }
    : { slug: id }

  const product = await Product.findOne(query).lean()
  if (!product) return apiError('Product not found', 404)
  return apiOk(product)
}

// Build a proper $set payload — handles specifications (Map field) correctly
function buildSetPayload(body: Record<string, unknown>) {
  const { specifications, ...rest } = body
  const $set: Record<string, unknown> = { ...rest }

  // Replace the entire specifications map at once
  if (specifications !== undefined) {
    $set['specifications'] = specifications ?? {}
  }

  return { $set }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  const body = await req.json()

  try {
    const updated = await Product.findByIdAndUpdate(id, buildSetPayload(body), { new: true, runValidators: false })
    if (!updated) return apiError('Product not found', 404)
    return apiOk(updated.toObject())
  } catch (err) {
    console.error('[PRODUCT UPDATE]', err)
    return apiError('Failed to update product')
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  const body = await req.json()

  try {
    const updated = await Product.findByIdAndUpdate(id, buildSetPayload(body), { new: true, runValidators: false })
    if (!updated) return apiError('Product not found', 404)
    return apiOk(updated.toObject())
  } catch (err) {
    console.error('[PRODUCT PATCH]', err)
    return apiError('Failed to update product')
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  await Product.findByIdAndUpdate(id, { $set: { isPublished: false } })
  return apiOk({ success: true })
}
