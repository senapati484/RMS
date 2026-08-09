// scripts/seed-200-products.ts
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
  'Cameras & Imaging': ['Sony', 'Canon', 'Nikon', 'RED', 'ARRI', 'Fujifilm', 'Panasonic', 'Blackmagic', 'Hasselblad', 'Leica'],
  'Lenses & Optics': ['Sigma', 'Tamron', 'Zeiss', 'Canon', 'Sony', 'Samyang', 'Fujinon', 'Tokina', 'Voigtländer'],
  'Audio & Microphones': ['Sennheiser', 'Røde', 'Shure', 'Zoom', 'Audio-Technica', 'Neumann', 'DJI', 'AKG', 'Beyerdynamic'],
  'Lighting & Studio': ['Aputure', 'Nanlite', 'Godox', 'Profoto', 'Arri', 'Amaran', 'Broncolor', 'Kino Flo'],
  'Drones & Aerial': ['DJI', 'Autel', 'Skydio', 'Freefly', 'Yuneec'],
  'Laptops & Computing': ['Apple', 'Dell', 'Lenovo', 'Asus', 'Razer', 'HP', 'MSI', 'Acer', 'Microsoft'],
  'Gaming & VR': ['Meta', 'Sony', 'HTC', 'Valve', 'Nintendo', 'Pico', 'Varjo'],
  'Event & Stage Tech': ['JBL', 'Pioneer DJ', 'Chauvet', 'Yamaha', 'QSC', 'Shure', 'Electro-Voice', 'Allen & Heath'],
  'Power & Mobility': ['EcoFlow', 'Jackery', 'Anker', 'Segway', 'Goal Zero', 'Bluetti', 'Niu'],
  'Heavy Machinery & Tools': ['Bosch', 'DeWalt', 'Makita', 'Milwaukee', 'Hilti', 'Stihl', 'Husqvarna', 'Festool'],
}

const IMAGES: Record<string, string[]> = {
  'Cameras & Imaging': [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
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
  'Cameras & Imaging': ['FX6 Cinema Line', 'V-RAPTOR 8K VV', 'EOS R3 Body', 'Z8 Mirrorless', 'X2D 100C Medium Format', 'SL2 Full Frame', 'Lumix GH6 Pro', 'Pocket Cinema 6K G2'],
  'Lenses & Optics': ['14-24mm f/2.8 Art', '35mm f/1.4 GM', '50mm f/1.2 L USM', '70-200mm f/2.8 S-Line', 'Otus 85mm f/1.4', '24mm T1.5 Cine Prime', '100-400mm Telephoto'],
  'Audio & Microphones': ['KMS 105 Stage Mic', 'DT 990 Pro Studio Headphones', 'Wireless PRO Dual Receiver', 'MixPre-6 II Field Recorder', 'C414 XLII Condenser', 'NTH-100 Monitoring Set'],
  'Lighting & Studio': ['Para 222 FB Reflector', 'Freelite 2000W Head', 'Aero 100 RGB Panel', 'Evoke 1200 LED Spotlight', 'Force 300 Light Rig', 'PavoBulb 10C 12-Light Kit'],
  'Drones & Aerial': ['Matrice 350 RTK Enterprise', 'EVO Max 4T Tactical Drone', 'Abrasive Blast UAV System', 'Freefly Alta X Heavy Lifter', 'Air 3 Fly More Combo'],
  'Laptops & Computing': ['Mac Studio M2 Ultra', 'Surface Laptop Studio 2', 'Legion Pro 7i Gen 9', 'Precision 7780 Mobile Workstation', 'ZBook Fury 16 G10'],
  'Gaming & VR': ['Apple Vision Pro 512GB', 'Varjo XR-4 Enterprise Edition', 'Pico 4 Enterprise VR', 'HTC VIVE Focus 3 XR', 'PlayStation 5 Digital Edition'],
  'Event & Stage Tech': ['SQ-5 48-Channel Digital Console', 'ETX-15P 2000W Powered Speaker', 'Rogue R2X Wash LED Head', 'L-Acoustics K2 Array Module', 'CDJ-3000 Multi Player'],
  'Power & Mobility': ['EP500Pro 5100Wh Power Station', 'PowerRoam 1200 Solar Pack', 'Onewheel GT S-Series', 'Super73-RX Electric Bike', 'Delta Pro Ultra Expansion Unit'],
  'Heavy Machinery & Tools': ['K 770 Oil Cut-Off Saw', 'TS 55 FEQ Plunge Cut Track Saw', 'Hilti TE 3000-AVR Breaker', 'Milwaukee MX FUEL Core Drill', 'Bosch GRL 900-20 HV Rotary Laser'],
}

async function run() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB for feeding 200 products...')

  const existingSkus = new Set(await Product.distinct('sku'))
  const existingSlugs = new Set(await Product.distinct('slug'))

  const productsToInsert = []
  const timestamp = Date.now()

  for (let i = 1; i <= 200; i++) {
    const category = CATEGORIES[(i - 1) % CATEGORIES.length]
    const brands = BRANDS[category] || ['Generic']
    const brand = brands[(i - 1) % brands.length]
    const nouns = PRODUCT_NOUNS[category] || ['Equipment Unit']
    const noun = nouns[(i - 1) % nouns.length]

    const name = `${brand} ${noun} ${i > 50 ? `V${Math.floor(i / 10)}` : 'Edition'}`
    
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let slug = baseSlug
    let counter = 1
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`
    }
    existingSlugs.add(slug)

    let sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${3000 + i}`
    let skuCounter = 1
    while (existingSkus.has(sku)) {
      sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${3000 + i}-${skuCounter++}`
    }
    existingSkus.add(sku)

    const domainImgs = IMAGES[category] || IMAGES['Cameras & Imaging']
    const imageUrl = domainImgs[(i - 1) % domainImgs.length]

    const totalStock = Math.floor(Math.random() * 20) + 2
    const availableStock = Math.floor(totalStock * (0.5 + Math.random() * 0.5))
    const dailyRate = Math.floor(400 + Math.random() * 4500)
    const weeklyRate = Math.floor(dailyRate * 5.5)
    const monthlyRate = Math.floor(dailyRate * 18)
    const baseDepositAmt = Math.floor(dailyRate * 2.5)

    productsToInsert.push({
      name,
      slug,
      description: `Premium grade ${name} engineered for high-availability enterprise rentals, studio setups, and demanding field missions. Verified under Lease360 strict QA protocols.`,
      imageUrl,
      productType: category === 'Heavy Machinery & Tools' ? 'machine' : 'other',
      itemKind: 'GOODS',
      category,
      brand,
      sku,
      condition: i % 4 === 0 ? 'LIKE_NEW' : i % 2 === 0 ? 'NEW' : 'EXCELLENT',
      totalStock,
      availableStock,
      dailyRate,
      weeklyRate,
      monthlyRate,
      costPrice: Math.floor(dailyRate * 12),
      salesPrice: Math.floor(dailyRate * 25),
      baseDepositAmt,
      depositIsPercent: false,
      accessoryList: ['Hard Pelican Transport Case', 'AC Power Adapter', 'Lease360 Inspection Certificate'],
      tags: [category.toLowerCase(), brand.toLowerCase(), 'enterprise-tier', 'verified-stock'],
      specifications: {
        'Warranty': '24 Months Lease360 Care',
        'QC Status': 'Pass / Factory Spec',
        'Condition Grade': 'A++',
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
