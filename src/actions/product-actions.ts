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
  sortBy?: 'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH' | 'AVAILABILITY'
  inStockOnly?: boolean
  brand?: string
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
  brands: string[]
}

/**
 * Direct Server Action for high-performance, zero-HTTP-overhead product data fetching.
 * Supports full server-side filtering, sorting, and pagination across any dataset size.
 */
export async function getProductsAction(params: GetProductsParams = {}): Promise<GetProductsResult> {
  await connectDB()

  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 10))
  const { productType, category, q, showAll, sortBy = 'NEWEST', inStockOnly, brand } = params

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

  if (inStockOnly) {
    filter.availableStock = { $gt: 0 }
  }

  if (brand && brand !== 'ALL' && brand !== 'all') {
    filter.brand = brand
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

  // Define sort query based on user request
  let sortOption: Record<string, 1 | -1> = { isPublished: -1, createdAt: -1 }
  if (sortBy === 'PRICE_LOW') {
    sortOption = { dailyRate: 1 }
  } else if (sortBy === 'PRICE_HIGH') {
    sortOption = { dailyRate: -1 }
  } else if (sortBy === 'AVAILABILITY') {
    sortOption = { availableStock: -1 }
  } else {
    sortOption = { isPublished: -1, createdAt: -1 }
  }

  const fields = 'name slug description imageUrl productType category brand sku condition totalStock availableStock dailyRate weeklyRate monthlyRate baseDepositAmt isPublished isArchived tags'

  // Fetch distinct brands for filter options across published non-archived products
  const brandQueryFilter: Record<string, unknown> = { isPublished: { $ne: false }, isArchived: { $ne: true } }
  if (productType && productType !== 'all') brandQueryFilter.productType = productType

  const [rawProducts, total, distinctBrands] = await Promise.all([
    Product.find(filter)
      .select(fields)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
    Product.distinct('brand', brandQueryFilter),
  ])

  // Convert BSON ObjectIds and Dates to plain serializable JSON
  const products = JSON.parse(JSON.stringify(rawProducts))
  const brands = (distinctBrands as string[]).filter(Boolean).sort()
  const pages = Math.ceil(total / limit) || 1
  const hasMore = page < pages

  return {
    products,
    total,
    page,
    limit,
    pages,
    hasMore,
    brands,
  }
}
