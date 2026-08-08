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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  const body = await req.json()
  const updated = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true })
  if (!updated) return apiError('Product not found', 404)
  return apiOk(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  await Product.findByIdAndUpdate(id, { isPublished: false })
  return apiOk({ success: true })
}
