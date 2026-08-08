'use server'

import { connectDB } from '@/lib/db'
import { Product } from '@/models/Product'

export interface GetProductsParams {
  page?: number
  limit?: number
  productType?: string
  category?: string
  q?: string
  showAll?: boolean
}

export interface GetProductsResult {
  products: Array<{
    _id: string
    name: string
    slug: string
    description?: string
    imageUrl?: string
    productType: string
    category: string
    brand?: string
    sku: string
    condition?: string
    totalStock: number
    availableStock: number
    dailyRate: number
    weeklyRate?: number
    monthlyRate?: number
    baseDepositAmt?: number
    isPublished: boolean
    isArchived?: boolean
    tags?: string[]
  }>
  total: number
  page: number
  limit: number
  pages: number
  hasMore: boolean
}

/**
 * Direct Server Action for high-performance, zero-HTTP-overhead product data fetching.
 * Runs directly on the Next.js server runtime with MongoDB connection pooling.
 */
export async function getProductsAction(params: GetProductsParams = {}): Promise<GetProductsResult> {
  await connectDB()

  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 10))
  const { productType, category, q, showAll } = params

  const filter: Record<string, unknown> = {}

  if (!showAll) {
    filter.isPublished = { $ne: false }
    filter.isArchived = { $ne: true }
  }

  if (category && category !== 'All' && category !== 'all') {
    filter.category = category
  }

  if (productType && productType !== 'all') {
    filter.productType = productType
  }

  if (q && q.trim()) {
    const sanitized = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim()
    filter.$or = [
      { name: { $regex: sanitized, $options: 'i' } },
      { description: { $regex: sanitized, $options: 'i' } },
      { tags: { $regex: sanitized, $options: 'i' } },
      { brand: { $regex: sanitized, $options: 'i' } },
      { sku: { $regex: sanitized, $options: 'i' } },
    ]
  }

  const fields = 'name slug description imageUrl productType category brand sku condition totalStock availableStock dailyRate weeklyRate monthlyRate baseDepositAmt isPublished isArchived tags'

  const [rawProducts, total] = await Promise.all([
    Product.find(filter)
      .select(fields)
      .sort({ isPublished: -1, availableStock: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ])

  // Convert BSON ObjectIds and Dates to plain serializable JSON
  const products = JSON.parse(JSON.stringify(rawProducts))
  const pages = Math.ceil(total / limit) || 1
  const hasMore = page < pages

  return {
    products,
    total,
    page,
    limit,
    pages,
    hasMore,
  }
}
