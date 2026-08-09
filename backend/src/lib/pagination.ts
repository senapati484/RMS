import mongoose from 'mongoose'

export interface PaginationParams {
  limit?: number
  cursor?: string
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
  total?: number
}

/**
 * Parse cursor string to extract timestamp and ID
 */
function parseCursor(cursor: string): { timestamp: number; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
    const [timestamp, id] = decoded.split('|')
    return { timestamp: parseInt(timestamp, 10), id }
  } catch {
    return null
  }
}

/**
 * Create cursor from timestamp and ID
 */
function createCursor(timestamp: number, id: string): string {
  const payload = `${timestamp}|${id}`
  return Buffer.from(payload).toString('base64')
}

/**
 * Cursor-based pagination for large datasets
 * More efficient than skip/limit for large collections
 */
export async function paginateWithCursor<T>(
  model: mongoose.Model<T>,
  params: PaginationParams = {}
): Promise<PaginatedResult<T>> {
  const {
    limit = 20,
    cursor,
    sortField = 'createdAt',
    sortOrder = 'desc',
  } = params

  const validLimit = Math.min(100, Math.max(1, limit))
  const sortDirection = sortOrder === 'asc' ? 1 : -1

  // Build query filter based on cursor
  const filter: Record<string, unknown> = {}
  
  if (cursor) {
    const cursorData = parseCursor(cursor)
    if (cursorData) {
      if (sortOrder === 'desc') {
        filter[sortField] = { $lt: new Date(cursorData.timestamp) }
      } else {
        filter[sortField] = { $gt: new Date(cursorData.timestamp) }
      }
    }
  }

  // Execute query with cursor-based filtering
  const data = await model
    .find(filter)
    .sort({ [sortField]: sortDirection, _id: sortDirection })
    .limit(validLimit + 1) // Fetch one extra to determine if there's more
    .lean()

  // Determine if there are more results
  const hasMore = data.length > validLimit
  const paginatedData = hasMore ? data.slice(0, validLimit) : data

  // Create next cursor if there are more results
  let nextCursor: string | null = null
  if (hasMore && paginatedData.length > 0) {
    const lastItem = paginatedData[paginatedData.length - 1] as any
    const timestamp = new Date(lastItem[sortField]).getTime()
    const id = (lastItem._id as mongoose.Types.ObjectId).toString()
    nextCursor = createCursor(timestamp, id)
  }

  return {
    data: paginatedData as T[],
    nextCursor,
    hasMore,
  }
}

/**
 * Traditional offset-based pagination with count
 * Use for smaller datasets or when total count is needed
 */
export async function paginateWithOffset<T>(
  model: mongoose.Model<T>,
  filter: Record<string, unknown> = {},
  params: PaginationParams = {}
): Promise<PaginatedResult<T>> {
  const {
    limit = 20,
    sortField = 'createdAt',
    sortOrder = 'desc',
  } = params

  const page = Math.max(1, parseInt(params.cursor || '1'))
  const validLimit = Math.min(100, Math.max(1, limit))
  const skip = (page - 1) * validLimit
  const sortDirection = sortOrder === 'asc' ? 1 : -1

  const [data, total] = await Promise.all([
    model
      .find(filter)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(validLimit)
      .lean(),
    model.countDocuments(filter),
  ])

  const hasMore = skip + data.length < total

  return {
    data: data as T[],
    nextCursor: hasMore ? (page + 1).toString() : null,
    hasMore,
    total,
  }
}

/**
 * Bulk insert with chunking for large datasets
 */
export async function bulkInsert<T>(
  model: mongoose.Model<T>,
  documents: unknown[],
  chunkSize = 1000
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0
  let errors = 0

  for (let i = 0; i < documents.length; i += chunkSize) {
    const chunk = documents.slice(i, i + chunkSize)
    try {
      const result = await model.insertMany(chunk, { ordered: false })
      inserted += result.length
    } catch (error: any) {
      // Partial success with ordered: false
      if (error.insertedDocs) {
        inserted += error.insertedDocs.length
      }
      errors += chunk.length - (error.insertedDocs?.length || 0)
    }
  }

  return { inserted, errors }
}

/**
 * Bulk update with chunking
 */
export async function bulkUpdate<T>(
  model: mongoose.Model<T>,
  updates: Array<{ filter: Record<string, unknown>; update: Record<string, unknown> }>,
  chunkSize = 500
): Promise<{ modified: number; errors: number }> {
  let modified = 0
  let errors = 0

  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize)
    try {
      const bulkOps = chunk.map(({ filter, update }) => ({
        updateOne: {
          filter,
          update,
        },
      }))

      const result = await model.bulkWrite(bulkOps, { ordered: false })
      modified += result.modifiedCount || 0
    } catch (error: any) {
      errors += chunk.length
    }
  }

  return { modified, errors }
}
