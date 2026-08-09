// scripts/seed-100-products.ts
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env.local')

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    imageUrl: { type: String },
    productType: { type: String, default: 'other' },
    itemKind: { type: String, default: 'GOODS' },
    category: { type: String, required: true },
    brand: { type: String },
    sku: { type: String, required: true, unique: true },
    condition: { type: String, default: 'EXCELLENT' },
    totalStock: { type: Number, default: 1, min: 0 },
    availableStock: { type: Number, default: 1, min: 0 },
    dailyRate: { type: Number, default: 500, min: 0 },
    weeklyRate: { type: Number, default: 3150 },
    monthlyRate: { type: Number, default: 10500 },
    costPrice: { type: Number, default: 0 },
    salesPrice: { type: Number },
    baseDepositAmt: { type: Number, default: 0 },
    depositIsPercent: { type: Boolean, default: false },
    accessoryList: [{ type: String }],
    tags: [{ type: String }],
    specifications: { type: Map, of: String, default: {} },
    isPublished: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

const CATEGORIES = [
  'Cameras & Imaging',
  'Lenses & Optics',
  'Audio & Microphones',
  'Lighting & Studio',
  'Drones & Aerial',
  'Laptops & Computing',
  'Gaming & VR',
  'Event & Stage Tech',
  'Power & Mobility',
  'Heavy Machinery & Tools',
]

const BRANDS: Record<string, string[]> = {
  'Cameras & Imaging': ['Sony', 'Canon', 'Nikon', 'RED', 'ARRI', 'Fujifilm', 'Panasonic', 'Blackmagic'],
  'Lenses & Optics': ['Sigma', 'Tamron', 'Zeiss', 'Canon', 'Sony', 'Samyang', 'Fujinon'],
  'Audio & Microphones': ['Sennheiser', 'Røde', 'Shure', 'Zoom', 'Audio-Technica', 'Neumann', 'DJI'],
  'Lighting & Studio': ['Aputure', 'Nanlite', 'Godox', 'Profoto', 'Arri', 'Amaran'],
  'Drones & Aerial': ['DJI', 'Autel', 'Skydio', 'Freefly'],
  'Laptops & Computing': ['Apple', 'Dell', 'Lenovo', 'Asus', 'Razer', 'HP', 'MSI'],
  'Gaming & VR': ['Meta', 'Sony', 'HTC', 'Valve', 'Nintendo'],
  'Event & Stage Tech': ['JBL', 'Pioneer DJ', 'Chauvet', 'Yamaha', 'QSC', 'Shure'],
  'Power & Mobility': ['EcoFlow', 'Jackery', 'Anker', 'Segway', 'Goal Zero'],
  'Heavy Machinery & Tools': ['Bosch', 'DeWalt', 'Makita', 'Milwaukee', 'Hilti', 'Stihl'],
}

const IMAGES: Record<string, string[]> = {
  'Cameras & Imaging': [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800&q=80',
  ],
  'Lenses & Optics': [
    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80',
    'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=800&q=80',
    'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800&q=80',
  ],
  'Audio & Microphones': [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
  ],
  'Lighting & Studio': [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
  ],
  'Drones & Aerial': [
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80',
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80',
  ],
  'Laptops & Computing': [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
  ],
  'Gaming & VR': [
    'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=800&q=80',
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80',
  ],
  'Event & Stage Tech': [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  ],
  'Power & Mobility': [
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80',
    'https://images.unsplash.com/photo-1558441719-6772a5a54b3a?w=800&q=80',
  ],
  'Heavy Machinery & Tools': [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
  ],
}

const PRODUCT_NOUNS: Record<string, string[]> = {
  'Cameras & Imaging': ['Alpha 7 IV Mirrorless', 'EOS R5 Cinema Kit', 'Z9 Flagship Body', 'KOMODO 6K Rig', 'FX3 Full-Frame Cinema', 'X-T5 Creator Kit', 'LUMIX S5 II Pro'],
  'Lenses & Optics': ['24-70mm f/2.8 GM II', '70-200mm f/2.8 IS III', '50mm f/1.2 Prime', '16-35mm f/2.8 Wide Angle', '85mm f/1.4 Portrait Lens', '100mm f/2.8 Macro'],
  'Audio & Microphones': ['MKH 416 Shotgun Mic', 'Wireless GO II Dual Kit', 'SM7B Vocal Setup', 'H6 All-Black Recorder', 'EW 112P G4 Wireless', 'NTG5 Moisture-Resistant'],
  'Lighting & Studio': ['Light Storm 600d Pro', 'Pavotube 30C 4ft RGB', 'VL300 LED Video Light', 'B10X Plus Flash Head', 'Amaran 200x Bi-Color', '600x Pro Bowens Mount'],
  'Drones & Aerial': ['Mavic 3 Cine Premium Combo', 'Inspire 3 8K Cinema Drone', 'EVO II Dual 640T Thermal', 'FPV Explorer Drone Kit', 'Mini 4 Pro Fly More'],
  'Laptops & Computing': ['MacBook Pro 16" M3 Max', 'XPS 15 Touch OLED', 'ThinkPad P1 Gen 6 Workstation', 'ROG Zephyrus G16 Gaming', 'Blade 16 Creator Studio'],
  'Gaming & VR': ['Quest 3 512GB VR Headset', 'PlayStation VR2 Horizon Bundle', 'VIVE XR Elite Standalone', 'Valve Index Full Kit', 'Switch OLED Entertainment Rig'],
  'Event & Stage Tech': ['EON715 1300W Powered Speaker', 'DDJ-FLX10 4-Channel DJ Deck', 'Intimidator Spot 375Z LED', 'StagePAS 1K MkII Column PA', 'TouchMix-16 Compact Mixer'],
  'Power & Mobility': ['DELTA Pro 3600Wh Power Station', 'Explorer 2000 Pro Generator', '767 PowerHouse 2048Wh', 'Ninebot Max G2 E-Scooter', 'Yeti 1500X Solar Generator'],
  'Heavy Machinery & Tools': ['GBH 18V-26 Rotary Hammer', '20V MAX XR Brushless Combo', 'LXT 18V Cordless Saw Set', 'M18 Fuel Surge Impact Kit', 'TE 6-A22 Rotary Drill System'],
}

async function run() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB for seeding 100 products...')

  const existingSkus = new Set(await Product.distinct('sku'))
  const existingSlugs = new Set(await Product.distinct('slug'))

  const productsToInsert = []
  const timestamp = Date.now()

  for (let i = 1; i <= 100; i++) {
    const category = CATEGORIES[(i - 1) % CATEGORIES.length]
    const brands = BRANDS[category] || ['Generic']
    const brand = brands[(i - 1) % brands.length]
    const nouns = PRODUCT_NOUNS[category] || ['Equipment Unit']
    const noun = nouns[(i - 1) % nouns.length]

    const name = `${brand} ${noun} ${i > 20 ? `#${i}` : 'Pro'}`
    
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let slug = baseSlug
    let counter = 1
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`
    }
    existingSlugs.add(slug)

    let sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${1000 + i}`
    let skuCounter = 1
    while (existingSkus.has(sku)) {
      sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${1000 + i}-${skuCounter++}`
    }
    existingSkus.add(sku)

    const domainImgs = IMAGES[category] || IMAGES['Cameras & Imaging']
    const imageUrl = domainImgs[(i - 1) % domainImgs.length]

    const totalStock = Math.floor(Math.random() * 15) + 3
    const availableStock = Math.floor(totalStock * (0.6 + Math.random() * 0.4))
    const dailyRate = Math.floor(350 + Math.random() * 3000)
    const weeklyRate = Math.floor(dailyRate * 5.5)
    const monthlyRate = Math.floor(dailyRate * 18)
    const baseDepositAmt = Math.floor(dailyRate * 2.5)

    productsToInsert.push({
      name,
      slug,
      description: `High-performance enterprise-grade ${name} designed for professional deployment, field rental, and studio workflows. Maintained and inspected under Lease360 quality standards.`,
      imageUrl,
      productType: category === 'Heavy Machinery & Tools' ? 'machine' : 'other',
      itemKind: 'GOODS',
      category,
      brand,
      sku,
      condition: i % 5 === 0 ? 'LIKE_NEW' : i % 3 === 0 ? 'NEW' : 'EXCELLENT',
      totalStock,
      availableStock,
      dailyRate,
      weeklyRate,
      monthlyRate,
      costPrice: Math.floor(dailyRate * 12),
      salesPrice: Math.floor(dailyRate * 25),
      baseDepositAmt,
      depositIsPercent: false,
      accessoryList: ['Protective Carrying Case', 'Power Cable', 'User Manual / QC Sheet'],
      tags: [category.toLowerCase(), brand.toLowerCase(), 'rental-ready', 'pro-equipment'],
      specifications: {
        'Warranty': '12 Months Lease360 Guard',
        'QC Status': 'Certified Tested',
        'Condition Grade': 'A+',
      },
      isPublished: true,
      isArchived: false,
    })
  }

  const result = await Product.insertMany(productsToInsert)
  console.log(`✅ Successfully fed ${result.length} new products into database!`)

  const totalCount = await Product.countDocuments()
  console.log(`📊 Total products in database now: ${totalCount}`)

  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Error seeding products:', err)
  process.exit(1)
})
