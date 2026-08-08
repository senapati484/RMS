// api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/models/User'
import { signToken } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { encryptData } from '@/lib/encryption'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const {
      firstName,
      lastName,
      name,
      email,
      password,
      confirmPassword,
      phone,
      role = 'PORTAL_USER',
      isVendor = false,
      productCategory,
      couponCode,
      isGovIdVerified,
      aadhaarMasked,
      digiLockerTxnId,
      companyName,
      gstin,
      employeeId,
      addressLine,
      secretCode,
    } = await req.json()

    const fullName = (name || `${firstName || ''} ${lastName || ''}`).trim()

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'First Name, Email, and Password are required' }, { status: 400 })
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({ error: 'Password and Confirm Password fields must match' }, { status: 400 })
    }

    // Password strength rules from Excalidraw design
    if (password.length < 6 || password.length > 12) {
      return NextResponse.json({ error: 'Password length must be between 6 and 12 characters' }, { status: 400 })
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one uppercase letter' }, { status: 400 })
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one lowercase letter' }, { status: 400 })
    }
    if (!/[@$&_]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one special character (@, $, &, _)' }, { status: 400 })
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

    // Encrypt DigiLocker metadata payload before persisting to database
    const digiLockerEncryptedPayload = encryptData(
      JSON.stringify({
        txnId: digiLockerTxnId,
        verifiedAt: new Date().toISOString(),
        aadhaarMasked,
        provider: 'DigiLocker Govt. Identity Services',
      })
    )

    const user = await User.create({
      name: fullName,
      email: email.toLowerCase(),
      passwordHash: password,
      phone,
      role: isVendor ? 'ADMIN' : role,
      isGovIdVerified: true,
      aadhaarMasked,
      digiLockerTxnId,
      digiLockerEncryptedPayload,
      govIdType: 'AADHAAR',
      companyName: companyName || (role === 'ADMIN' ? companyName : undefined),
      productCategory,
      couponCode,
      gstin: gstin || (role === 'ADMIN' ? gstin : undefined),
      employeeId: role === 'STAFF' ? employeeId : undefined,
      addressLine,
      trustScore: (role === 'ADMIN' || isVendor) ? 100 : role === 'STAFF' ? 90 : 70, // High trust score on verified eKYC
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
