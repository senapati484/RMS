// api/products/route.ts
import { NextRequest } from 'next/server'
import { Product } from '@/models/Product'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  await connectDB()

  const user = await getUserFromRequest(req)
  const isAdminOrStaff = user && (user.role === 'ADMIN' || user.role === 'STAFF')

  const { searchParams } = new URL(req.url)
  const category      = searchParams.get('category')
  const productType   = searchParams.get('productType')
  const q             = searchParams.get('q')
  const showAll       = searchParams.get('showAll') === '1' && isAdminOrStaff
  const page          = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit         = Math.min(50, parseInt(searchParams.get('limit') || '20'))

  const filter: Record<string, unknown> = {}

  // Admins/Staff see drafts when showAll=1 or by default; clients only see published
  if (!isAdminOrStaff) {
    filter.isPublished = { $ne: false }
  } else if (!showAll) {
    filter.isPublished = { $ne: false }
  }

  if (category && category !== 'All') filter.category = category
  if (productType && productType !== 'all') filter.productType = productType
  if (q) {
    const sanitized = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim()
    if (sanitized) {
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { tags: { $regex: sanitized, $options: 'i' } },
        { brand: { $regex: sanitized, $options: 'i' } },
      ]
    }
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ isPublished: -1, availableStock: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ])

  return apiOk({ products, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  try {
    const body = await req.json()

    // Auto-generate slug if not provided
    if (!body.slug && body.name) {
      body.slug = body.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        + '-' + Date.now().toString(36)
    }

    // Derive category from productType if not set
    if (!body.category && body.productType) {
      body.category = body.productType.charAt(0).toUpperCase() + body.productType.slice(1)
    }

    const product = await Product.create(body)
    return apiOk(product, 201)
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string }
    if (e.code === 11000) return apiError('SKU or slug already exists', 409)
    console.error('[PRODUCT CREATE]', err)
    return apiError('Failed to create product')
  }
}
