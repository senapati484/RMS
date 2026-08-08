// scripts/seed.ts — Run with: npx tsx scripts/seed.ts
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env.local')

// ---- Inline schemas (avoids TS path alias issues in script context) ----

const UserSchema = new mongoose.Schema({
  name: String, email: String, passwordHash: String,
  role: { type: String, enum: ['ADMIN', 'STAFF', 'PORTAL_USER'], default: 'PORTAL_USER' },
  phone: String, isActive: { type: Boolean, default: true },
  trustScore: { type: Number, default: 50 },
}, { timestamps: true })

const ProductSchema = new mongoose.Schema({
  name: String, slug: String, description: String,
  imageUrl: String, category: String, brand: String, sku: String,
  totalStock: Number, availableStock: Number,
  baseDepositAmt: Number, depositIsPercent: Boolean,
  accessoryList: [String], isPublished: { type: Boolean, default: true },
  variants: [{ attribute: String, value: String }],
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

const PRODUCTS = [
  {
    name: 'Sony A7III Mirrorless Camera', slug: 'sony-a7iii',
    description: 'Full-frame mirrorless with 24.2MP sensor, 4K video, and excellent low-light performance.',
    imageUrl: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=600&q=80',
    category: 'Camera', brand: 'Sony', sku: 'CAM-SONY-A7III',
    totalStock: 5, availableStock: 5, dailyRate: 1500, baseDepositAmt: 5000, depositIsPercent: false,
    accessoryList: ['Battery ×2', 'Charger', 'Body Cap', 'Strap'],
  },
  {
    name: 'Canon EF 50mm f/1.4 Lens', slug: 'canon-50mm-f14',
    description: 'Classic nifty fifty prime lens with beautiful bokeh and fast aperture.',
    imageUrl: 'https://images.unsplash.com/photo-1617805856772-7fa2f97ed7e5?w=600&q=80',
    category: 'Lens', brand: 'Canon', sku: 'LENS-CANON-50F14',
    totalStock: 8, availableStock: 8, dailyRate: 400, baseDepositAmt: 1500, depositIsPercent: false,
    accessoryList: ['Front Cap', 'Rear Cap', 'Case'],
  },
  {
    name: 'Godox SL-60W LED Light', slug: 'godox-sl60w',
    description: '60W daylight-balanced continuous LED light for photography and video.',
    imageUrl: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&q=80',
    category: 'Lighting', brand: 'Godox', sku: 'LIGHT-GODOX-SL60',
    totalStock: 10, availableStock: 10, dailyRate: 300, baseDepositAmt: 1000, depositIsPercent: false,
    accessoryList: ['Power Cable', 'Barn Doors', 'Carry Bag'],
  },
  {
    name: 'Rode VideoMic Pro+', slug: 'rode-vmicpro',
    description: 'On-camera directional microphone with built-in rechargeable battery.',
    imageUrl: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=600&q=80',
    category: 'Audio', brand: 'Rode', sku: 'AUD-RODE-VMICPRO',
    totalStock: 6, availableStock: 6, dailyRate: 350, baseDepositAmt: 800, depositIsPercent: false,
    accessoryList: ['Windshield', 'Dead Cat', '3.5mm Cable', 'USB-C Cable'],
  },
  {
    name: 'Manfrotto MT055 Tripod', slug: 'manfrotto-mt055',
    description: 'Professional aluminum tripod with centre column that tilts 90°.',
    imageUrl: 'https://images.unsplash.com/photo-1582591539899-95878ab4e0c5?w=600&q=80',
    category: 'Support', brand: 'Manfrotto', sku: 'SUPP-MANF-MT055',
    totalStock: 12, availableStock: 12, dailyRate: 250, baseDepositAmt: 600, depositIsPercent: false,
    accessoryList: ['Ball Head', 'Carry Bag', 'Quick Release Plate'],
  },
  {
    name: 'DJI Ronin-SC Gimbal', slug: 'dji-ronin-sc',
    description: 'Lightweight 3-axis stabilizer for mirrorless cameras up to 2kg payload.',
    imageUrl: 'https://images.unsplash.com/photo-1527090526205-beaac8dc3c62?w=600&q=80',
    category: 'Support', brand: 'DJI', sku: 'SUPP-DJI-RONINSC',
    totalStock: 4, availableStock: 4, dailyRate: 800, baseDepositAmt: 3000, depositIsPercent: false,
    accessoryList: ['Charging Cable', 'Phone Holder', 'Focus Motor'],
  },
  {
    name: 'Sigma 24-70mm f/2.8 DG', slug: 'sigma-24-70-f28',
    description: 'Professional zoom lens with constant f/2.8 aperture for versatile shooting.',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
    category: 'Lens', brand: 'Sigma', sku: 'LENS-SIGMA-2470',
    totalStock: 3, availableStock: 3, dailyRate: 900, baseDepositAmt: 2500, depositIsPercent: false,
    accessoryList: ['Front Cap', 'Rear Cap', 'UV Filter', 'Case'],
  },
  {
    name: 'Atomos Ninja V Monitor', slug: 'atomos-ninja-v',
    description: '5" HDR monitor-recorder for 4K ProRes recording from camera HDMI out.',
    imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600&q=80',
    category: 'Camera', brand: 'Atomos', sku: 'CAM-ATOM-NINJAV',
    totalStock: 4, availableStock: 4, dailyRate: 700, baseDepositAmt: 2000, depositIsPercent: false,
    accessoryList: ['SSD Drive', 'HDMI Cable', 'Battery', 'Mounting Arm'],
  },
]

const USERS = [
  { name: 'Admin User', email: 'admin@lease360.ai', password: 'admin123', role: 'ADMIN', phone: '+91-9876543210' },
  { name: 'Staff Member', email: 'staff@lease360.ai', password: 'staff123', role: 'STAFF', phone: '+91-9876543211' },
  { name: 'Aryan Sharma', email: 'user@lease360.ai', password: 'user123', role: 'PORTAL_USER', phone: '+91-9876543212' },
  { name: 'Priya Nair', email: 'priya@lease360.ai', password: 'user123', role: 'PORTAL_USER', phone: '+91-9876543213' },
]

async function seed() {
  console.log('🌱 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected')

  // Clear
  await User.deleteMany({})
  await Product.deleteMany({})
  console.log('🗑  Cleared existing data')

  // Users
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10)
    await User.create({ ...u, password: undefined, passwordHash: hashed })
    console.log(`👤 Created user: ${u.email} (${u.role})`)
  }

  // Products
  for (const p of PRODUCTS) {
    await Product.create(p)
    console.log(`📦 Created product: ${p.name}`)
  }

  console.log('\n✅ Seed complete!')
  console.log('\n🔑 Login credentials:')
  console.log('  Admin:  admin@lease360.ai / admin123')
  console.log('  Staff:  staff@lease360.ai / staff123')
  console.log('  Portal: user@lease360.ai  / user123')
  console.log('\n🚀 Start the app: npm run dev')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
