import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Attribute } from '@/models/Attribute'
import { getUserFromRequest, requireAdmin } from '@/lib/api-helpers'

export async function GET() {
  await connectDB()
  const attributes = await Attribute.find({}).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ attributes })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const authErr = requireAdmin(user)
  if (authErr) return authErr

  await connectDB()
  try {
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ error: 'Attribute name is required' }, { status: 400 })
    }

    let attribute
    if (body._id) {
      attribute = await Attribute.findByIdAndUpdate(body._id, body, { new: true })
    } else {
      attribute = await Attribute.create(body)
    }

    return NextResponse.json(attribute, { status: 201 })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to save attribute'
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  }
}
