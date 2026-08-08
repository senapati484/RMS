// api/admin/archive/route.ts
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { getUserFromRequest, requireAdmin, apiOk, apiError } from '@/lib/api-helpers'
import { runAllArchiving, getArchiveStats } from '@/lib/archiver'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()

  try {
    const body = await req.json()
    const { 
      cutoffMonths = 6, 
      dryRun = false 
    } = body

    // Calculate cutoff date (default: 6 months ago)
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - cutoffMonths)

    // Run archiving
    const results = await runAllArchiving(cutoffDate, dryRun)

    return apiOk({
      message: dryRun ? 'Archiving dry run completed' : 'Archiving completed',
      cutoffDate: cutoffDate.toISOString(),
      cutoffMonths,
      dryRun,
      results,
    })
  } catch (err) {
    console.error('[ARCHIVE ERROR]', err)
    return apiError('Failed to run archiving operation')
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()

  try {
    const stats = await getArchiveStats()

    return apiOk({
      stats,
      message: 'Archive statistics retrieved successfully',
    })
  } catch (err) {
    console.error('[ARCHIVE STATS ERROR]', err)
    return apiError('Failed to retrieve archive statistics')
  }
}
