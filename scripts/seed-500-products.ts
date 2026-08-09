// scripts/seed-500-products.ts — Robust Seed Script for 500+ Enterprise Products
// Run with: npx tsx scripts/seed-500-products.ts [count]
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
  'Surveying & Measurement',
  'Medical & Lab Gear',
]

const BRANDS: Record<string, string[]> = {
  'Cameras & Imaging': ['Sony', 'Canon', 'Nikon', 'RED Digital', 'ARRI', 'Fujifilm', 'Panasonic', 'Blackmagic Design', 'Hasselblad', 'Leica'],
  'Lenses & Optics': ['Sigma Art', 'Tamron', 'Zeiss Cinema', 'Canon L-Series', 'Sony G-Master', 'Samyang', 'Fujinon Cine', 'Tokina', 'Voigtländer', 'Cooke'],
  'Audio & Microphones': ['Sennheiser', 'Røde', 'Shure', 'Zoom Audio', 'Audio-Technica', 'Neumann', 'DJI Audio', 'AKG Pro', 'Beyerdynamic', 'Sound Devices'],
  'Lighting & Studio': ['Aputure', 'Nanlite', 'Godox Pro', 'Profoto', 'Arri Light', 'Amaran', 'Broncolor', 'Kino Flo', 'Rotolight'],
  'Drones & Aerial': ['DJI Enterprise', 'Autel Robotics', 'Skydio', 'Freefly Systems', 'Yuneec', 'Parrot'],
  'Laptops & Computing': ['Apple Silicon', 'Dell XPS', 'Lenovo ThinkPad', 'Asus ROG', 'Razer Blade', 'HP ZBook', 'MSI Workstation', 'Microsoft Surface'],
  'Gaming & VR': ['Meta Quest', 'Sony PlayStation', 'HTC Vive Pro', 'Valve Index', 'Pico XR', 'Varjo Reality', 'Nintendo Enterprise'],
  'Event & Stage Tech': ['JBL Professional', 'Pioneer DJ', 'Chauvet Professional', 'Yamaha Commercial', 'QSC Audio', 'Shure Wireless', 'Electro-Voice', 'Allen & Heath'],
  'Power & Mobility': ['EcoFlow Pro', 'Jackery Solar', 'Anker SOLIX', 'Segway Commercial', 'Goal Zero', 'Bluetti Power', 'NIU Mobility'],
  'Heavy Machinery & Tools': ['Bosch Professional', 'DeWalt MAX', 'Makita LXT', 'Milwaukee MX Fuel', 'Hilti Industrial', 'Stihl Commercial', 'Husqvarna Pro', 'Festool'],
  'Surveying & Measurement': ['Trimble GPS', 'Leica Geosystems', 'Topcon Precision', 'FLIR Thermal', 'Tektronix', 'Keysight'],
  'Medical & Lab Gear': ['GE Healthcare', 'Philips Medical', 'Siemens Healthineers', 'Welch Allyn', 'Mindray Pro'],
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
  'Surveying & Measurement': [
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&q=80',
  ],
  'Medical & Lab Gear': [
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80',
  ],
}

const PRODUCT_NOUNS: Record<string, string[]> = {
  'Cameras & Imaging': ['Alpha Cinema Rig', 'V-Raptor 8K', 'EOS Cinema Body', 'Z9 Master Rig', 'Medium Format 100C', 'Full-Frame FX3', 'Blackmagic 6K Pro', 'Lumix S1H Workhorse'],
  'Lenses & Optics': ['24-70mm f/2.8 Prime', '70-200mm f/2.8 Telephoto', '50mm f/1.2 Ultra Fast', '16-35mm Wide Angle', '85mm f/1.4 Portrait Lens', '100mm Macro Cine', 'Anamorphic 50mm T2.1'],
  'Audio & Microphones': ['Shotgun Location Kit', 'Dual Wireless Lavalier Set', 'Broadcast Studio Condenser', 'Multi-Track Field Recorder', 'Studio Reference Headphones', '32-Bit Float Mic System'],
  'Lighting & Studio': ['High Output LED Spotlight', 'RGBWW Tube Light 4-Kit', 'Bi-Color Soft Panel 600W', 'Studio Flash Strobe Pack', 'Fresnel Cinema Light', 'Curved Reflector System'],
  'Drones & Aerial': ['Thermal Inspection UAV', 'Cinematic 8K Drone Rig', 'Enterprise Mapping Drone', 'FPV Racing Explorer', 'Compact Fly-More Quadcopter'],
  'Laptops & Computing': ['16" M3 Max Workstation', 'Touchscreen OLED Laptop', 'Dual-GPU Render Rig', 'Rugged Field Laptop', 'Ultra-Lightweight Creator PC'],
  'Gaming & VR': ['Spatial Computing XR Headset', '4K Enterprise VR Rig', 'Wireless Haptic VR Suite', 'Sim-Racing Force Feedback Rig', 'Portable Gaming Console Array'],
  'Event & Stage Tech': ['32-Channel Digital Mixing Console', 'Active Subwoofer Line Array', 'Moving Head Spot Light', 'Wireless IEM System', 'DMX Lighting Controller'],
  'Power & Mobility': ['3600Wh Portable Power Station', 'Solar Generator Expandable Battery', 'Off-Road Cargo E-Scooter', 'Rugged All-Terrain Electric Cart', '2000W Pure Sine Generator'],
  'Heavy Machinery & Tools': ['Brushless Concrete Rotary Hammer', 'Plunge Track Saw System', 'Demolition Breaker 3000W', 'Industrial Laser Level', 'Mag-Base Core Drilling Press'],
  'Surveying & Measurement': ['GNSS RTK Base & Rover Kit', 'Robotic Total Station 1"', '3D Laser Scanner LiDAR', 'Thermal Thermal Imager 640x480', 'Gigahertz Oscilloscope'],
  'Medical & Lab Gear': ['Portable Diagnostic Ultrasound', 'Patient Vital Signs Monitor', 'Centrifuge High-Speed System', 'Digital Pathology Scanner', 'Surgical LED Headlamp'],
}

const MODEL_SUFFIXES = ['Pro', 'Max', 'Ultra', 'Studio Edition', 'Enterprise', 'V2', 'Gen 3', 'Mk IV', 'Master Series', 'Extreme', 'X-Series', 'Elite']

async function run() {
  const targetCount = parseInt(process.argv[2] || '500', 10)
  console.log(`🚀 Starting robust seeding process for ${targetCount} products...`)

  await mongoose.connect(MONGODB_URI)
  console.log('⚡ Connected to MongoDB cluster!')

  const existingSkus = new Set(await Product.distinct('sku'))
  const existingSlugs = new Set(await Product.distinct('slug'))

  console.log(`📦 Existing database inventory: ${existingSkus.size} products`)

  const productsToInsert: any[] = []
  const batchSize = 100
  let totalInserted = 0

  for (let i = 1; i <= targetCount; i++) {
    const category = CATEGORIES[(i - 1) % CATEGORIES.length]
    const brands = BRANDS[category] || ['Enterprise Brand']
    const brand = brands[(i - 1) % brands.length]
    const nouns = PRODUCT_NOUNS[category] || ['Professional Equipment']
    const noun = nouns[(i - 1) % nouns.length]
    const suffix = MODEL_SUFFIXES[(i - 1) % MODEL_SUFFIXES.length]

    const variantId = Math.floor(Math.random() * 9000 + 1000)
    const name = `${brand} ${noun} ${suffix} (${variantId})`

    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let slug = baseSlug
    let slugCounter = 1
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${slugCounter++}`
    }
    existingSlugs.add(slug)

    let sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${variantId}`
    let skuCounter = 1
    while (existingSkus.has(sku)) {
      sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${variantId}-${skuCounter++}`
    }
    existingSkus.add(sku)

    const domainImgs = IMAGES[category] || IMAGES['Cameras & Imaging']
    const imageUrl = domainImgs[(i - 1) % domainImgs.length]

    const totalStock = Math.floor(Math.random() * 25) + 3
    const availableStock = Math.floor(totalStock * (0.6 + Math.random() * 0.4))
    const dailyRate = Math.floor(350 + Math.random() * 4500)
    const weeklyRate = Math.floor(dailyRate * 5.5)
    const monthlyRate = Math.floor(dailyRate * 18)
    const baseDepositAmt = Math.floor(dailyRate * 2.5)

    const condition = i % 7 === 0 ? 'LIKE_NEW' : i % 4 === 0 ? 'NEW' : 'EXCELLENT'

    productsToInsert.push({
      name,
      slug,
      description: `Enterprise-ready ${name}. Engineered for continuous high-load operations, studio productions, and field deployments. Includes standard Lease360 full inspection, safety verification, and multi-point QC tag.`,
      imageUrl,
      productType: category === 'Heavy Machinery & Tools' ? 'machine' : 'other',
      itemKind: 'GOODS',
      category,
      brand,
      sku,
      condition,
      totalStock,
      availableStock,
      dailyRate,
      weeklyRate,
      monthlyRate,
      costPrice: Math.floor(dailyRate * 12),
      salesPrice: Math.floor(dailyRate * 25),
      baseDepositAmt,
      depositIsPercent: false,
      accessoryList: ['Heavy Duty Transport Case', 'AC Power Cord / Charger', 'Safety Lock / QC Card'],
      tags: [category.toLowerCase(), brand.toLowerCase(), 'enterprise-ready', 'pro-tier'],
      specifications: {
        'Warranty': '12 Months Lease360 Enterprise Shield',
        'QC Certificate': `PASSED-#${variantId}`,
        'Inspection Grade': 'Grade A+',
      },
      isPublished: true,
      isArchived: false,
    })

    // Batch insert every batchSize products to keep memory overhead low and execution ultra-fast
    if (productsToInsert.length >= batchSize) {
      const inserted = await Product.insertMany(productsToInsert)
      totalInserted += inserted.length
      console.log(`  ✓ Inserted batch of ${inserted.length} products (Total inserted so far: ${totalInserted}/${targetCount})`)
      productsToInsert.length = 0
    }
  }

  // Insert remaining
  if (productsToInsert.length > 0) {
    const inserted = await Product.insertMany(productsToInsert)
    totalInserted += inserted.length
    console.log(`  ✓ Inserted final batch of ${inserted.length} products!`)
  }

  const finalTotal = await Product.countDocuments()
  console.log(`\n🎉 Success! Added ${totalInserted} robust new products.`)
  console.log(`📊 Total products in database now: ${finalTotal}`)

  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Error executing robust seed:', err)
  process.exit(1)
})
