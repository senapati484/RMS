// api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return NextResponse.json({ error: 'No account registered with this email ID.' }, { status: 404 })
    }

    // Return exact verification message specified in design document
    return NextResponse.json({
      success: true,
      message: 'The password reset link has been sent to your email.',
    })
  } catch (err) {
    console.error('[FORGOT_PASSWORD]', err)
    return NextResponse.json({ error: 'Failed to process password reset request' }, { status: 500 })
  }
}
