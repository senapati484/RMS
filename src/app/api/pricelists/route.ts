import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Pricelist } from '@/models/Pricelist'

export async function GET() {
  await connectDB()
  const pricelists = await Pricelist.find({}).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ pricelists })
}

export async function POST(req: NextRequest) {
  await connectDB()
  try {
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ error: 'Pricelist name is required' }, { status: 400 })
    }

    let pricelist
    if (body._id) {
      pricelist = await Pricelist.findByIdAndUpdate(body._id, body, { new: true })
    } else {
      pricelist = await Pricelist.create(body)
    }

    return NextResponse.json(pricelist, { status: 201 })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to save pricelist'
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  }
}
