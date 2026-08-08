// api/products/[id]/route.ts
import { NextRequest } from 'next/server'
import mongoose from 'mongoose'
import { Product } from '@/models/Product'
import { Order } from '@/models/Order'
import { Quotation } from '@/models/Quotation'
import { MaintenanceTicket } from '@/models/MaintenanceTicket'
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

const ALLOWED_FIELDS = new Set([
  'name', 'slug', 'description', 'imageUrl', 'productType', 'itemKind', 'category',
  'brand', 'sku', 'condition', 'totalStock', 'availableStock', 'dailyRate',
  'weeklyRate', 'monthlyRate', 'costPrice', 'salesPrice', 'baseDepositAmt',
  'depositIsPercent', 'periodicity', 'paddingTimeHours', 'pickupTime',
  'returnTime', 'lateFeePerHour', 'accessoryList', 'tags', 'variants',
  'specifications', 'isPublished', 'isArchived',
])

const MONEY_FIELDS = ['dailyRate', 'weeklyRate', 'monthlyRate', 'costPrice', 'baseDepositAmt', 'lateFeePerHour'] as const

// Build a sanitized $set/$unset payload — only whitelisted fields, money normalized,
// salesPrice blank => $unset so effective rate falls back to dailyRate
function buildSetPayload(body: Record<string, unknown>) {
  const { specifications, salesPrice, ...rest } = body
  const $set: Record<string, unknown> = {}
  const $unset: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(rest)) {
    if (!ALLOWED_FIELDS.has(key) || value === undefined) continue
    $set[key] = value
  }

  if ('salesPrice' in body) {
    if (salesPrice === null || salesPrice === undefined || salesPrice === '' || salesPrice === 0) {
      $unset.salesPrice = ''
    } else {
      $set.salesPrice = Number(salesPrice)
    }
  }

  if (specifications !== undefined) {
    $set.specifications = specifications ?? {}
  }

  for (const key of MONEY_FIELDS) {
    if (key in $set) $set[key] = Math.max(0, Number($set[key]) || 0)
  }

  return { $set, $unset }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return apiError('Product not found', 404)
  const body = await req.json()

  const product = await Product.findById(id)
  if (!product) return apiError('Product not found', 404)

  try {
    const { $set, $unset } = buildSetPayload(body)

    // Stock sanity: availableStock can never exceed totalStock, never negative
    const total = Number($set.totalStock ?? product.totalStock)
    const available = Number($set.availableStock ?? product.availableStock)
    const clampedTotal = Math.max(0, Math.floor(total))
    const clampedAvailable = Math.min(Math.max(0, Math.floor(available)), clampedTotal)
    if ('totalStock' in $set || 'availableStock' in $set) {
      $set.totalStock = clampedTotal
      $set.availableStock = clampedAvailable
    }

    if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
      return apiError('No valid fields to update')
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
      { new: true, runValidators: false }
    )
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
  if (!mongoose.isValidObjectId(id)) return apiError('Product not found', 404)
  const body = await req.json()

  try {
    const { $set, $unset } = buildSetPayload(body)
    if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
      return apiError('No valid fields to update')
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
      { new: true, runValidators: false }
    )
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
  if (!mongoose.isValidObjectId(id)) return apiError('Product not found', 404)

  const product = await Product.findById(id)
  if (!product) return apiError('Product not found', 404)

  // Products referenced by live rentals / pending quotes / open tickets cannot be removed
  const [activeOrders, pendingQuotes, openTickets] = await Promise.all([
    Order.exists({
      'items.productId': product._id,
      status: { $in: ['DRAFT', 'QUOTATION', 'CONFIRMED', 'PICKED_UP', 'RETURN_PENDING'] },
    }),
    Quotation.exists({
      'items.productId': product._id,
      status: { $in: ['DRAFT', 'SENT', 'ACCEPTED'] },
    }),
    MaintenanceTicket.exists({
      productId: product._id,
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
    }),
  ])

  if (activeOrders) {
    return apiError('Cannot remove: this product is on active rental orders. Complete or cancel those orders first.', 409)
  }
  if (pendingQuotes) {
    return apiError('Cannot remove: this product is on pending quotations. Expire or reject them first.', 409)
  }
  if (openTickets) {
    return apiError('Cannot remove: this product has open maintenance tickets. Resolve them first.', 409)
  }

  // Soft-delete: keep the record for order history integrity, hide from storefront
  await Product.findByIdAndUpdate(id, { $set: { isArchived: true, isPublished: false } })
  return apiOk({ success: true, archived: true })
}
