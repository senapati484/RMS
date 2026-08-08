// api/products/bulk/route.ts
import { NextRequest } from 'next/server'
import { Product } from '@/models/Product'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'
import { bulkInsert, bulkUpdate } from '@/lib/pagination'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()

  try {
    const body = await req.json()
    const { operation, data } = body

    if (operation === 'insert') {
      if (!Array.isArray(data) || data.length === 0) {
        return apiError('Data must be a non-empty array for bulk insert', 400)
      }

      // Auto-generate slugs and SKUs if not provided
      const processedData = data.map((item: any) => {
        if (!item.slug && item.name) {
          item.slug = item.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            + '-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
        }
        
        if (!item.category && item.productType) {
          item.category = item.productType.charAt(0).toUpperCase() + item.productType.slice(1)
        }

        // Generate SKU if not provided
        if (!item.sku && item.name) {
          const skuPrefix = item.productType ? item.productType.substring(0, 3).toUpperCase() : 'PRD'
          const skuSuffix = Math.random().toString(36).substr(2, 8).toUpperCase()
          item.sku = `${skuPrefix}-${skuSuffix}`
        }

        return item
      })

      const result = await bulkInsert(Product, processedData)

      return apiOk({
        message: 'Bulk insert completed',
        inserted: result.inserted,
        errors: result.errors,
        total: data.length,
      })
    }

    if (operation === 'update') {
      if (!Array.isArray(data) || data.length === 0) {
        return apiError('Data must be a non-empty array for bulk update', 400)
      }

      const updates = data.map((item: any) => ({
        filter: { _id: item._id },
        update: { $set: item },
      }))

      const result = await bulkUpdate(Product, updates)

      return apiOk({
        message: 'Bulk update completed',
        modified: result.modified,
        errors: result.errors,
        total: data.length,
      })
    }

    return apiError('Invalid operation. Use "insert" or "update"', 400)
  } catch (err: unknown) {
    console.error('[BULK PRODUCTS ERROR]', err)
    return apiError('Failed to perform bulk operation')
  }
}
