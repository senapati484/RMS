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
  isGovIdVerified: { type: Boolean, default: true },
  aadhaarMasked: { type: String, default: 'XXXX-XXXX-1928' },
  digiLockerTxnId: { type: String, default: 'DL-88492019' },
}, { timestamps: true })

const ProductSchema = new mongoose.Schema({
  name: String, slug: String, description: String,
  imageUrl: String,
  productType: { type: String, default: 'other' },
  category: String, brand: String, sku: String,
  condition: { type: String, default: 'EXCELLENT' },
  totalStock: Number, availableStock: Number, dailyRate: Number,
  baseDepositAmt: Number, depositIsPercent: Boolean,
  accessoryList: [String],
  tags: [String],
  specifications: { type: Map, of: String, default: {} },
  isPublished: { type: Boolean, default: true },
  variants: [{ attribute: String, value: String }],
}, { timestamps: true })

const ItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String, productImage: String, rentalPeriodLabel: String,
  quantity: Number, unitPrice: Number, lineTotal: Number,
})

const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'CONFIRMED' },
  deliveryMode: { type: String, default: 'STORE_PICKUP' },
  items: [ItemSchema],
  subTotal: Number, depositAmount: Number, totalAmount: Number,
  rentalStart: Date, rentalEnd: Date,
  deposit: {
    amount: Number, status: { type: String, default: 'HELD' },
    refundedAmount: { type: Number, default: 0 }, deductedAmount: { type: Number, default: 0 },
    transactions: [{ type: { type: String }, amount: Number, note: String, createdAt: { type: Date, default: Date.now } }],
  },
}, { timestamps: true })

const QuotationSchema = new mongoose.Schema({
  quoteNumber: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'DRAFT' },
  deliveryMode: { type: String, default: 'STORE_PICKUP' },
  items: [ItemSchema],
  subTotal: Number, depositAmount: Number, totalAmount: Number,
  rentalStart: Date, rentalEnd: Date, validUntil: Date,
}, { timestamps: true })

if (mongoose.models.Product)   delete mongoose.models.Product
if (mongoose.models.User)      delete mongoose.models.User
if (mongoose.models.Order)     delete mongoose.models.Order
if (mongoose.models.Quotation) delete mongoose.models.Quotation

const User      = mongoose.model('User', UserSchema)
const Product   = mongoose.model('Product', ProductSchema)
const Order     = mongoose.model('Order', OrderSchema)
const Quotation = mongoose.model('Quotation', QuotationSchema)

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-TYPE PRODUCT CATALOG
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  // ── CAMERAS ──────────────────────────────────────────────────────────────
  {
    name: 'Sony A7III Mirrorless Camera', slug: 'sony-a7iii',
    description: 'Full-frame mirrorless with 24.2MP sensor, 4K video, and exceptional low-light performance.',
    imageUrl: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=600&q=80',
    productType: 'camera', category: 'Camera', brand: 'Sony', sku: 'CAM-SONY-A7III', condition: 'EXCELLENT',
    totalStock: 5, availableStock: 5, dailyRate: 1500, baseDepositAmt: 5000, depositIsPercent: false,
    accessoryList: ['Battery ×2', 'Charger', 'Body Cap', 'Strap'],
    tags: ['4k', 'full-frame', 'mirrorless', 'low-light', 'sony'],
    specifications: {
      sensorSize: 'Full Frame (35mm)', resolution: '24.2 MP', mountType: 'Sony E-Mount',
      videoSpec: '4K 30fps / 1080p 120fps', afPoints: '693 Phase-Detect PDAF', isoRange: '100–51200',
    },
  },
  {
    name: 'Atomos Ninja V Monitor-Recorder', slug: 'atomos-ninja-v',
    description: '5" HDR monitor-recorder for ProRes recording from camera HDMI out in the field.',
    imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600&q=80',
    productType: 'monitor', category: 'Monitor', brand: 'Atomos', sku: 'MON-ATOM-NINJAV', condition: 'EXCELLENT',
    totalStock: 4, availableStock: 4, dailyRate: 700, baseDepositAmt: 2000, depositIsPercent: false,
    accessoryList: ['SSD Drive', 'HDMI Cable', 'Battery', 'Mounting Arm'],
    tags: ['4k', 'prores', 'hdr', 'recorder', 'field-monitor'],
    specifications: {
      screenSize: '5"', resolution: '4K UHD (3840×2160)', panelType: 'IPS HDR',
      refreshRate: '60Hz', hdrin: 'HDR10 / HLG', connectivity: 'HDMI 2.0, Micro-SDI',
    },
  },

  // ── LENSES ───────────────────────────────────────────────────────────────
  {
    name: 'Canon EF 50mm f/1.4 USM Lens', slug: 'canon-50mm-f14',
    description: 'Classic nifty-fifty prime with beautiful bokeh and fast aperture for portraits.',
    imageUrl: 'https://images.unsplash.com/photo-1617805856772-7fa2f97ed7e5?w=600&q=80',
    productType: 'lens', category: 'Lens', brand: 'Canon', sku: 'LENS-CANON-50F14', condition: 'GOOD',
    totalStock: 8, availableStock: 8, dailyRate: 400, baseDepositAmt: 1500, depositIsPercent: false,
    accessoryList: ['Front Cap', 'Rear Cap', 'Lens Case'],
    tags: ['portrait', 'bokeh', 'prime', '50mm', 'canon'],
    specifications: {
      focalLength: '50mm', aperture: 'f/1.4', mountType: 'Canon EF',
      filterSize: '58mm', oisStabilizer: 'None', minFocusDist: '0.45m',
    },
  },
  {
    name: 'Sigma 24-70mm f/2.8 DG DN Art', slug: 'sigma-24-70-f28',
    description: 'Professional zoom with constant f/2.8 aperture — the ultimate workhorse lens.',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
    productType: 'lens', category: 'Lens', brand: 'Sigma', sku: 'LENS-SIGMA-2470', condition: 'EXCELLENT',
    totalStock: 3, availableStock: 3, dailyRate: 900, baseDepositAmt: 2500, depositIsPercent: false,
    accessoryList: ['Front Cap', 'Rear Cap', 'UV Filter', 'Hard Case'],
    tags: ['zoom', 'f2.8', 'art', 'sigma', 'wedding', 'event'],
    specifications: {
      focalLength: '24-70mm', aperture: 'f/2.8', mountType: 'Sony E / L-Mount',
      filterSize: '82mm', oisStabilizer: 'None', minFocusDist: '0.34m (W) / 0.38m (T)',
    },
  },

  // ── AUDIO ─────────────────────────────────────────────────────────────────
  {
    name: 'Rode VideoMic Pro+ On-Camera Mic', slug: 'rode-vmicpro',
    description: 'Directional shotgun microphone with auto power and high-pass filter for run-and-gun.',
    imageUrl: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=600&q=80',
    productType: 'audio', category: 'Audio', brand: 'Rode', sku: 'AUD-RODE-VMICPRO', condition: 'EXCELLENT',
    totalStock: 6, availableStock: 6, dailyRate: 350, baseDepositAmt: 800, depositIsPercent: false,
    accessoryList: ['Windshield', 'Dead Cat', '3.5mm TRS', 'USB-C Cable'],
    tags: ['microphone', 'shotgun', 'video', 'rode', 'on-camera'],
    specifications: {
      polarPattern: 'Supercardioid', freqResponse: '20Hz–20kHz',
      connectivity: '3.5mm TRS + USB-C monitor', sensitivity: '-32 dBV/Pa',
      powerReq: 'Internal Lithium / Phantom 48V', spl: '120 dB',
    },
  },

  // ── LIGHTING ──────────────────────────────────────────────────────────────
  {
    name: 'Godox SL-60W LED Video Light', slug: 'godox-sl60w',
    description: '60W daylight-balanced continuous LED light with bowens mount for photography & video.',
    imageUrl: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&q=80',
    productType: 'lighting', category: 'Lighting', brand: 'Godox', sku: 'LIGHT-GODOX-SL60', condition: 'GOOD',
    totalStock: 10, availableStock: 10, dailyRate: 300, baseDepositAmt: 1000, depositIsPercent: false,
    accessoryList: ['Power Cable', 'Barn Doors', 'Remote', 'Carry Bag'],
    tags: ['led', 'continuous', 'daylight', 'godox', 'studio', 'bowens'],
    specifications: {
      wattage: '60W', colorTemp: '5600K Daylight', cri: '95+',
      beamAngle: '120° (with standard reflector)', mountType: 'Bowens S-Type', powerSource: 'AC 100-240V',
    },
  },

  // ── SUPPORT ──────────────────────────────────────────────────────────────
  {
    name: 'Manfrotto MT055CXPRO3 Carbon Tripod', slug: 'manfrotto-mt055',
    description: 'Professional carbon-fibre tripod with 90° centre column tilt and fluid ball head.',
    imageUrl: 'https://images.unsplash.com/photo-1582591539899-95878ab4e0c5?w=600&q=80',
    productType: 'support', category: 'Support', brand: 'Manfrotto', sku: 'SUPP-MANF-MT055', condition: 'EXCELLENT',
    totalStock: 12, availableStock: 12, dailyRate: 250, baseDepositAmt: 600, depositIsPercent: false,
    accessoryList: ['Fluid Ball Head', 'Carry Bag', 'Quick Release Plate ×2'],
    tags: ['tripod', 'carbon', 'manfrotto', 'fluid-head', 'stable'],
    specifications: {
      maxPayload: '8 kg', headType: 'Fluid Ball Head XPRO',
      material: 'Carbon Fibre', maxHeight: '170cm', foldedLen: '55cm', legSections: '3',
    },
  },
  {
    name: 'DJI Ronin-SC 3-Axis Gimbal', slug: 'dji-ronin-sc',
    description: 'Lightweight 3-axis stabilizer for mirrorless cameras up to 2kg with ActiveTrack 3.0.',
    imageUrl: 'https://images.unsplash.com/photo-1527090526205-beaac8dc3c62?w=600&q=80',
    productType: 'support', category: 'Support', brand: 'DJI', sku: 'SUPP-DJI-RONINSC', condition: 'EXCELLENT',
    totalStock: 4, availableStock: 4, dailyRate: 800, baseDepositAmt: 3000, depositIsPercent: false,
    accessoryList: ['USB-C Cable', 'Phone Holder', 'Focus Motor', 'Tripod Adapter'],
    tags: ['gimbal', 'stabilizer', 'dji', 'mirrorless', 'video', '3-axis'],
    specifications: {
      maxPayload: '2 kg', headType: '3-Axis Stabilization',
      material: 'Aluminium Alloy', maxHeight: 'N/A', foldedLen: '28cm (folded)', legSections: 'N/A',
    },
  },

  // ── VEHICLE ───────────────────────────────────────────────────────────────
  {
    name: '2023 Toyota Fortuner 4WD', slug: 'toyota-fortuner-2023',
    description: 'Premium 7-seater SUV with 4WD capability. Perfect for location shoots and equipment transport.',
    imageUrl: 'https://images.unsplash.com/photo-1532581291347-9c39cf10a73c?w=600&q=80',
    productType: 'vehicle', category: 'Vehicle', brand: 'Toyota', sku: 'VEH-TOY-FOR-001', condition: 'EXCELLENT',
    totalStock: 2, availableStock: 2, dailyRate: 4500, baseDepositAmt: 15000, depositIsPercent: false,
    accessoryList: ['Full Tank', 'GPS Navigation', 'Dashcam', 'Toolkit'],
    tags: ['suv', 'toyota', '4wd', 'fortuner', 'crew-vehicle', 'location-shoot'],
    specifications: {
      make: 'Toyota', model: 'Fortuner', year: '2023',
      fuelType: 'Diesel', seats: '7', transmission: 'Automatic',
      registration: 'MH01 BX 4291', insuranceExp: '2026-12-31',
    },
  },

  // ── MONITOR ───────────────────────────────────────────────────────────────
  {
    name: 'ASUS ProArt PA27UCX 27" 4K OLED', slug: 'asus-proart-pa27ucx',
    description: '4K OLED reference monitor with DCI-P3 99.5% coverage for colour-critical grading work.',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
    productType: 'monitor', category: 'Monitor', brand: 'ASUS', sku: 'MON-ASUS-PA27UCX', condition: 'NEW',
    totalStock: 3, availableStock: 3, dailyRate: 1200, baseDepositAmt: 5000, depositIsPercent: false,
    accessoryList: ['Power Cable', 'Thunderbolt 4 Cable', 'USB-C Cable', 'Hood'],
    tags: ['4k', 'oled', 'color-grading', 'reference-monitor', 'asus', 'hdr'],
    specifications: {
      screenSize: '27"', resolution: '4K UHD (3840×2160)', panelType: 'OLED',
      refreshRate: '120Hz', hdrin: 'Dolby Vision / HDR10 / HLG',
      connectivity: 'Thunderbolt 4, HDMI 2.1, DisplayPort 1.4, SDI',
    },
  },
]

const USERS = [
  { name: 'Admin User',    email: 'admin@lease360.ai', password: 'admin123', role: 'ADMIN',       phone: '+91-9876543210' },
  { name: 'Staff Member',  email: 'staff@lease360.ai', password: 'staff123', role: 'STAFF',       phone: '+91-9876543211' },
  { name: 'Aryan Sharma',  email: 'user@lease360.ai',  password: 'user123',  role: 'PORTAL_USER', phone: '+91-9876543212' },
  { name: 'Priya Nair',    email: 'priya@lease360.ai', password: 'user123',  role: 'PORTAL_USER', phone: '+91-9876543213' },
]

async function seed() {
  console.log('🌱 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected\n')

  // Clear all collections
  await Promise.all([
    User.deleteMany({}), Product.deleteMany({}),
    Order.deleteMany({}), Quotation.deleteMany({}),
  ])
  console.log('🗑  Cleared all collections\n')

  // ── Users ────────────────────────────────────────────────────────────────
  const userMap: Record<string, any> = {}
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10)
    const doc = await User.create({ ...u, password: undefined, passwordHash: hashed })
    userMap[u.email] = doc
    console.log(`👤  ${u.role.padEnd(12)} ${u.email}`)
  }
  console.log()

  // ── Products ─────────────────────────────────────────────────────────────
  const createdProducts: any[] = []
  for (const p of PRODUCTS) {
    const prod = await Product.create(p)
    createdProducts.push(prod)
    console.log(`📦  [${p.productType.padEnd(9)}] ${p.name} — ₹${p.dailyRate}/day`)
  }
  console.log()

  // ── Sample Order for Aryan ────────────────────────────────────────────────
  const aryanUser = userMap['user@lease360.ai']
  const sony     = createdProducts.find(p => p.sku === 'CAM-SONY-A7III')
  const canon50  = createdProducts.find(p => p.sku === 'LENS-CANON-50F14')

  const sampleOrder = await Order.create({
    orderNumber: 'ORD-20260808-8829',
    userId: aryanUser._id,
    status: 'CONFIRMED',
    deliveryMode: 'SHIPPING',
    items: [
      { productId: sony._id,    productName: sony.name,   productImage: sony.imageUrl,   rentalPeriodLabel: '3 day(s) · 10% off', quantity: 1, unitPrice: 1350, lineTotal: 4050 },
      { productId: canon50._id, productName: canon50.name, productImage: canon50.imageUrl, rentalPeriodLabel: '3 day(s) · 10% off', quantity: 1, unitPrice: 360,  lineTotal: 1080 },
    ],
    subTotal: 5130, depositAmount: 6500, totalAmount: 11630,
    rentalStart: new Date(),
    rentalEnd: new Date(Date.now() + 3 * 86400000),
    deposit: {
      amount: 6500, status: 'HELD', refundedAmount: 0, deductedAmount: 0,
      transactions: [{ type: 'HOLD', amount: 6500, note: 'Deposit held on confirmation ORD-20260808-8829', createdAt: new Date() }],
    },
  })
  console.log(`🛒  Order: ${sampleOrder.orderNumber} → ${aryanUser.email}`)

  // Deduct stock for the seeded order
  await Product.findByIdAndUpdate(sony._id,    { $inc: { availableStock: -1 } })
  await Product.findByIdAndUpdate(canon50._id, { $inc: { availableStock: -1 } })

  // ── Sample Quotation for Aryan ────────────────────────────────────────────
  const ronin = createdProducts.find(p => p.sku === 'SUPP-DJI-RONINSC')
  const sampleQuote = await Quotation.create({
    quoteNumber: 'QT-20260808-4920',
    userId: aryanUser._id,
    status: 'DRAFT',
    deliveryMode: 'STORE_PICKUP',
    items: [
      { productId: ronin._id, productName: ronin.name, productImage: ronin.imageUrl, rentalPeriodLabel: '7 day(s) · 20% off', quantity: 1, unitPrice: 640, lineTotal: 4480 },
    ],
    subTotal: 4480, depositAmount: 3000, totalAmount: 7480,
    rentalStart: new Date(Date.now() + 2 * 86400000),
    rentalEnd: new Date(Date.now() + 9 * 86400000),
    validUntil: new Date(Date.now() + 7 * 86400000),
  })
  console.log(`📄  Quotation: ${sampleQuote.quoteNumber} → ${aryanUser.email}`)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55))
  console.log('✅  Seed complete!')
  console.log('\n🔑  Login credentials:')
  console.log('   Admin:  admin@lease360.ai / admin123')
  console.log('   Staff:  staff@lease360.ai / staff123')
  console.log('   Portal: user@lease360.ai  / user123')
  console.log('   Portal: priya@lease360.ai / user123')
  console.log('\n📦  Products seeded:')
  console.log('   2 Cameras  ·  2 Lenses  ·  1 Audio  ·  1 Lighting')
  console.log('   2 Support  ·  1 Vehicle ·  2 Monitors')
  console.log('\n🚀  Start the app: npm run dev')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
