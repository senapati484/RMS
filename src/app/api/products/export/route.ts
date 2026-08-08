// api/products/export/route.ts
import { NextRequest } from 'next/server'
import { Product } from '@/models/Product'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'
import { paginateWithCursor, PaginatedResult } from '@/lib/pagination'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()

  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json'
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '100')))

    let allProducts: any[] = []
    let cursor: string | undefined = undefined
    let hasMore = true

    // Fetch all products using cursor-based pagination
    while (hasMore) {
      const result: PaginatedResult<any> = await paginateWithCursor(Product, {
        limit,
        cursor,
        sortField: 'createdAt',
        sortOrder: 'desc',
      })

      allProducts = [...allProducts, ...result.data]
      hasMore = result.hasMore
      cursor = result.nextCursor || undefined

      // Safety limit to prevent infinite loops
      if (allProducts.length >= 10000) {
        hasMore = false
      }
    }

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'name', 'slug', 'sku', 'productType', 'category', 'brand',
        'condition', 'totalStock', 'availableStock', 'dailyRate',
        'weeklyRate', 'monthlyRate', 'salesPrice', 'baseDepositAmt',
        'depositIsPercent', 'isPublished', 'isArchived', 'createdAt'
      ]

      const csvRows = [
        headers.join(','),
        ...allProducts.map((product: any) =>
          headers.map(header => {
            const value = product[header]
            // Handle strings with commas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value ?? ''
          }).join(',')
        )
      ]

      return new Response(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="products-export-${Date.now()}.csv"`,
        },
      })
    }

    // Default JSON format
    return apiOk({
      products: allProducts,
      total: allProducts.length,
      exportedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[PRODUCTS EXPORT ERROR]', err)
    return apiError('Failed to export products')
  }
}
