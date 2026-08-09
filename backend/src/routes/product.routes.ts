import { Router, Response, Request } from 'express'
import mongoose from 'mongoose'
import { Product } from '../models/Product'
import { Order } from '../models/Order'
import { Quotation } from '../models/Quotation'
import { MaintenanceTicket } from '../models/MaintenanceTicket'
import { AuthRequest } from '../middleware/auth'
import { paginateWithCursor, bulkInsert, bulkUpdate } from '../lib/pagination'
import { cache, CacheKeys, CacheTTL } from '../lib/cache'

const router = Router()

// ─── Helper: send success JSON ─────────────────────────────────────────────
function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ data, success: true })
}
function fail(res: Response, msg: string, status = 400) {
  return res.status(status).json({ error: msg, success: false })
}

// ─── ALLOWED_FIELDS whitelist for PUT/PATCH ──────────────────────────────────
const ALLOWED_FIELDS = new Set([
  'name', 'slug', 'description', 'imageUrl', 'productType', 'itemKind', 'category',
  'brand', 'sku', 'condition', 'totalStock', 'availableStock', 'dailyRate',
  'weeklyRate', 'monthlyRate', 'costPrice', 'salesPrice', 'baseDepositAmt',
  'depositIsPercent', 'periodicity', 'paddingTimeHours', 'pickupTime',
  'returnTime', 'lateFeePerHour', 'accessoryList', 'tags', 'variants',
  'specifications', 'isPublished', 'isArchived',
])

const MONEY_FIELDS = ['dailyRate', 'weeklyRate', 'monthlyRate', 'costPrice', 'baseDepositAmt', 'lateFeePerHour']

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

// ─── GET /api/products ─────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'))
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '12')))
    const productType = req.query.productType as string
    const category = req.query.category as string
    const q = req.query.q as string
    const showAll = req.query.showAll === '1' && (req.user?.role === 'ADMIN' || req.user?.role === 'STAFF')
    const sortBy = req.query.sortBy as string
    const inStockOnly = req.query.inStockOnly === 'true' || req.query.inStockOnly === '1'
    const brand = req.query.brand as string
    const useCursor = req.query.cursor !== undefined
    const cursor = req.query.cursor as string | undefined
    const full = req.query.full === '1'

    const filter: Record<string, unknown> = {}

    if (!showAll) {
      filter.isPublished = { $ne: false }
      filter.isArchived = { $ne: true }
    }

    if (category && category !== 'All' && category !== 'all') filter.category = category
    if (productType && productType !== 'all') filter.productType = productType
    if (inStockOnly) filter.availableStock = { $gt: 0 }
    if (brand && brand !== 'ALL' && brand !== 'all') filter.brand = brand

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

    let sortOption: Record<string, 1 | -1> = { isPublished: -1, availableStock: -1, createdAt: -1 }
    if (sortBy === 'PRICE_LOW') sortOption = { dailyRate: 1 }
    else if (sortBy === 'PRICE_HIGH') sortOption = { dailyRate: -1 }
    else if (sortBy === 'AVAILABILITY') sortOption = { availableStock: -1 }

    const fields = full
      ? ''
      : 'name slug description imageUrl productType category brand sku condition totalStock availableStock dailyRate weeklyRate monthlyRate baseDepositAmt isPublished isArchived tags createdAt'

    const brandQueryFilter: Record<string, unknown> = { isPublished: { $ne: false }, isArchived: { $ne: true } }
    if (productType && productType !== 'all') brandQueryFilter.productType = productType

    if (useCursor) {
      const result = await paginateWithCursor(Product, { limit, cursor, sortField: 'createdAt', sortOrder: 'desc' })
      res.setHeader('Cache-Control', 'no-store')
      return res.json({ products: result.data, nextCursor: result.nextCursor, hasMore: result.hasMore, paginationType: 'cursor' })
    }

    // Try cache for non-search, non-cursor
    const cacheKey = CacheKeys.products(`list:${page}:${limit}:${showAll}:${category}:${productType}:${sortBy}`)
    if (!q) {
      const cached = cache.get<{ products: unknown; total: number; pages: number; brands: string[] }>(cacheKey)
      if (cached) {
        res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
        return res.json({ ...cached, page, limit, paginationType: 'offset' })
      }
    }

    const [products, total, distinctBrands] = await Promise.all([
      Product.find(filter).select(fields).sort(sortOption).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
      Product.distinct('brand', brandQueryFilter),
    ])

    const pages = Math.ceil(total / limit) || 1
    const hasMore = page < pages
    const brands = (distinctBrands as string[]).filter(Boolean).sort()

    if (!q) cache.set(cacheKey, { products, total, pages, brands }, 5000)

    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
    return res.json({ products, total, page, limit, pages, hasMore, brands, paginationType: 'offset' })
  } catch (err) {
    console.error('[EXPRESS GET PRODUCTS ERROR]', err)
    return fail(res, 'Internal server error', 500)
  }
})

// ─── GET /api/products/export ──────────────────────────────────────────────
router.get('/export', async (req: AuthRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  try {
    const format = (req.query.format as string) || 'json'
    const batchLimit = Math.min(1000, Math.max(1, parseInt((req.query.limit as string) || '100')))

    let allProducts: any[] = []
    let cursor: string | undefined = undefined
    let hasMore = true

    while (hasMore) {
      const result: Awaited<ReturnType<typeof paginateWithCursor>> = await paginateWithCursor(Product, { limit: batchLimit, cursor, sortField: 'createdAt', sortOrder: 'desc' })
      allProducts = [...allProducts, ...result.data]
      hasMore = result.hasMore
      cursor = result.nextCursor || undefined
      if (allProducts.length >= 10000) hasMore = false
    }

    if (format === 'csv') {
      const headers = ['name', 'slug', 'sku', 'productType', 'category', 'brand', 'condition', 'totalStock', 'availableStock', 'dailyRate', 'weeklyRate', 'monthlyRate', 'salesPrice', 'baseDepositAmt', 'isPublished', 'isArchived', 'createdAt']
      const csvRows = [headers.join(',')]
      for (const p of allProducts) {
        const row = headers.map(h => {
          const val = (p as Record<string, unknown>)[h]
          return val instanceof Date ? val.toISOString() : val !== undefined ? `"${String(val).replace(/"/g, '""')}"` : ''
        })
        csvRows.push(row.join(','))
      }
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="products-${Date.now()}.csv"`)
      return res.send(csvRows.join('\n'))
    }

    return res.json({ products: allProducts, total: allProducts.length, exportedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[EXPORT PRODUCTS ERROR]', err)
    return fail(res, 'Export failed', 500)
  }
})

// ─── POST /api/products/bulk ───────────────────────────────────────────────
router.post('/bulk', async (req: AuthRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  try {
    const { operation, data, ids, action, value } = req.body

    // Bulk status/archive action (e.g., archive multiple, publish multiple)
    if (action && Array.isArray(ids)) {
      const validActions: Record<string, Record<string, unknown>> = {
        archive: { isArchived: true, isPublished: false },
        unarchive: { isArchived: false },
        publish: { isPublished: true },
        unpublish: { isPublished: false },
      }
      const update = validActions[action]
      if (!update) return fail(res, `Unknown bulk action "${action}"`, 400)

      const result = await Product.updateMany({ _id: { $in: ids } }, { $set: update })
      cache.invalidatePattern('products:list:.*')
      return ok(res, { modified: result.modifiedCount, action })
    }

    if (operation === 'insert') {
      if (!Array.isArray(data) || data.length === 0) return fail(res, 'Data must be non-empty array', 400)
      const result = await bulkInsert(Product, data)
      cache.invalidatePattern('products:list:.*')
      return ok(res, { message: 'Bulk insert completed', inserted: result.inserted, errors: result.errors, total: data.length })
    }

    if (operation === 'update') {
      if (!Array.isArray(data) || data.length === 0) return fail(res, 'Data must be non-empty array', 400)
      const updates = data.map((item: any) => ({ filter: { _id: item._id }, update: { $set: item } }))
      const result = await bulkUpdate(Product, updates)
      cache.invalidatePattern('products:list:.*')
      return ok(res, { message: 'Bulk update completed', modified: result.modified, errors: result.errors })
    }

    return fail(res, 'Invalid operation. Use "insert" or "update" or specify action+ids', 400)
  } catch (err) {
    console.error('[BULK PRODUCTS ERROR]', err)
    return fail(res, 'Bulk operation failed', 500)
  }
})

// ─── GET /api/products/:id ─────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id }
    const product = await Product.findOne(query).lean()
    if (!product) return fail(res, 'Product not found', 404)
    return res.json(product)
  } catch (err) {
    console.error('[EXPRESS GET PRODUCT BY ID ERROR]', err)
    return fail(res, 'Internal server error', 500)
  }
})

// ─── POST /api/products ────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  try {
    const body = req.body
    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36)
    }
    if (!body.category && body.productType) {
      body.category = body.productType.charAt(0).toUpperCase() + body.productType.slice(1)
    }
    const product = await Product.create(body)
    cache.invalidatePattern('products:list:.*')
    return ok(res, product, 201)
  } catch (err: any) {
    if (err.code === 11000) return fail(res, 'SKU or slug already exists', 409)
    console.error('[PRODUCT CREATE]', err)
    return fail(res, 'Failed to create product', 500)
  }
})

// ─── PUT /api/products/:id ─────────────────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return fail(res, 'Product not found', 404)
    const product = await Product.findById(id)
    if (!product) return fail(res, 'Product not found', 404)

    const { $set, $unset } = buildSetPayload(req.body)

    // Clamp stock values
    const total = Number($set.totalStock ?? product.totalStock)
    const available = Number($set.availableStock ?? product.availableStock)
    if ('totalStock' in $set || 'availableStock' in $set) {
      $set.totalStock = Math.max(0, Math.floor(total))
      $set.availableStock = Math.min(Math.max(0, Math.floor(available)), $set.totalStock as number)
    }

    if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
      return fail(res, 'No valid fields to update', 400)
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
      { new: true, runValidators: false }
    )
    cache.invalidatePattern('products:list:.*')
    return ok(res, updated)
  } catch (err) {
    console.error('[PRODUCT UPDATE]', err)
    return fail(res, 'Failed to update product', 500)
  }
})

// ─── PATCH /api/products/:id ───────────────────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return fail(res, 'Product not found', 404)

    const { $set, $unset } = buildSetPayload(req.body)
    if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
      return fail(res, 'No valid fields to update', 400)
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
      { new: true, runValidators: false }
    )
    if (!updated) return fail(res, 'Product not found', 404)
    cache.invalidatePattern('products:list:.*')
    return ok(res, updated)
  } catch (err) {
    console.error('[PRODUCT PATCH]', err)
    return fail(res, 'Failed to update product', 500)
  }
})

// ─── DELETE /api/products/:id ──────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return fail(res, 'Forbidden', 403)
  }
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return fail(res, 'Product not found', 404)
    const product = await Product.findById(id)
    if (!product) return fail(res, 'Product not found', 404)

    const [activeOrders, pendingQuotes, openTickets] = await Promise.all([
      Order.exists({ 'items.productId': product._id, status: { $in: ['DRAFT', 'QUOTATION', 'CONFIRMED', 'PICKED_UP', 'RETURN_PENDING'] } }),
      Quotation.exists({ 'items.productId': product._id, status: { $in: ['DRAFT', 'SENT', 'ACCEPTED'] } }),
      MaintenanceTicket.exists({ productId: product._id, status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
    ])

    if (activeOrders) return fail(res, 'Cannot remove: this product is on active rental orders. Complete or cancel those orders first.', 409)
    if (pendingQuotes) return fail(res, 'Cannot remove: this product is on pending quotations. Expire or reject them first.', 409)
    if (openTickets) return fail(res, 'Cannot remove: this product has open maintenance tickets. Resolve them first.', 409)

    await Product.findByIdAndUpdate(id, { $set: { isArchived: true, isPublished: false } })
    cache.invalidatePattern('products:list:.*')
    return ok(res, { success: true, archived: true })
  } catch (err) {
    console.error('[PRODUCT DELETE]', err)
    return fail(res, 'Failed to delete product', 500)
  }
})

export default router
