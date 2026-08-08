// api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/models/User'
import { signToken } from '@/lib/auth'
import { connectDB } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const {
      name,
      email,
      password,
      phone,
      role = 'PORTAL_USER',
      isGovIdVerified,
      aadhaarMasked,
      digiLockerTxnId,
      companyName,
      gstin,
      employeeId,
      addressLine,
      secretCode,
    } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // Mandatory Government eKYC / DigiLocker Verification Check
    if (!isGovIdVerified || !aadhaarMasked || !digiLockerTxnId) {
      return NextResponse.json(
        { error: 'Government ID & DigiLocker Aadhaar Verification is mandatory to create an account' },
        { status: 422 }
      )
    }

    // Secret Key authorization for Staff / Admin creation
    if (role === 'STAFF' && secretCode !== 'LEASE360-STAFF' && secretCode !== 'staff123') {
      return NextResponse.json({ error: 'Invalid Staff Organization Access Code' }, { status: 403 })
    }
    if (role === 'ADMIN' && secretCode !== 'LEASE360-ADMIN' && secretCode !== 'admin123') {
      return NextResponse.json({ error: 'Invalid Admin Security Key' }, { status: 403 })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: 'Email address is already registered' }, { status: 409 })
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      phone,
      role,
      isGovIdVerified: true,
      aadhaarMasked,
      digiLockerTxnId,
      govIdType: 'AADHAAR',
      companyName: role === 'ADMIN' ? companyName : undefined,
      gstin: role === 'ADMIN' ? gstin : undefined,
      employeeId: role === 'STAFF' ? employeeId : undefined,
      addressLine,
      trustScore: role === 'ADMIN' ? 100 : role === 'STAFF' ? 90 : 70, // High trust score on verified eKYC
    })

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    })

    const res = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isGovIdVerified: user.isGovIdVerified,
          aadhaarMasked: user.aadhaarMasked,
        },
      },
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
    return NextResponse.json({ error: 'Failed to complete registration' }, { status: 500 })
  }
}
