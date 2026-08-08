// api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/models/User'
import { signToken } from '@/lib/auth'
import { connectDB } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { name, email, password, phone } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // passwordHash pre-save hook in User model handles hashing
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      phone,
      role: 'PORTAL_USER',
    })

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    })

    const res = NextResponse.json(
      { success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    )
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[REGISTER]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
