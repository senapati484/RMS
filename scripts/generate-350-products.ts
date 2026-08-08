// scripts/generate-350-products.ts — Run with: npx tsx scripts/generate-350-products.ts
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
    variants: [
      {
        attribute: { type: String },
        value: { type: String },
      },
    ],
  },
  { timestamps: true }
)

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

// High-resolution Unsplash photo mapping per category/domain to ensure zero 404s
const DOMAIN_IMAGES: Record<string, string[]> = {
  camera: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
  ],
  lens: [
    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80',
    'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=800&q=80',
    'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800&q=80',
  ],
  audio: [
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
  ],
  lighting: [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
  ],
  monitor: [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&q=80',
  ],
  vehicle: [
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&q=80',
  ],
  support: [
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80',
    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=80',
  ],
  furniture: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
  ],
  event: [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  ],
}

// Product Domain Generators
const DOMAINS = [
  {
    productType: 'camera',
    category: 'Camera',
    brands: ['RED Digital Cinema', 'ARRI', 'Sony', 'Canon', 'Blackmagic Design', 'Nikon', 'Fujifilm', 'Hasselblad', 'Leica', 'Panasonic'],
    models: [
      'V-Raptor XL 8K VV Cinema Package', 'Alexa Mini LF Large Format Set', 'FX9 6K Full-Frame Camera System',
      'EOS C500 Mark II 5.9K Full-Frame', 'URSA Mini Pro 12K Digital Cinema', 'A7S III 4K 120fps Mirrorless Body',
      'FX3 Full-Frame Cinema Line Camera', 'EOS R3 Professional Flagship Body', 'Z9 8K Mirrorless Digital Camera',
      'GFX 100 II Medium Format Cinema', 'SL2 47MP Mirrorless System', 'Lumix S1H 6K Full-Frame Camera',
      'X2D 100C Medium Format Camera', 'Komodo-X 6K S35 Digital Cinema', 'Alexa 35 Super 35 4K Cinema Camera'
    ],
    baseRate: 2500,
  },
  {
    productType: 'lens',
    category: 'Lens',
    brands: ['Cooke', 'Zeiss', 'Leica Cine', 'ARRI', 'Canon Cine', 'Sigma Cine', 'Sony G Master', 'Fujinon', 'Laowa', 'Tokina'],
    models: [
      'Anamorphic/i Full Frame 50mm T2.3 Prime', 'Supreme Prime 35mm T1.5 Large Format', 'Summilux-C 25mm T1.4 Cinema Lens',
      'Signature Prime 85mm T1.8 LPL Mount', 'CN-E 85mm T1.3 L FP Cinema Prime', '18-35mm T2.0 High-Speed Cine Zoom',
      'FE 24-70mm f/2.8 GM II Zoom Lens', 'Premista 28-100mm T2.9 Large Format', '24mm T14 2X Macro Probe Special',
      'Vista Prime 50mm T1.5 Cine Lens', 'FE 50mm f/1.2 GM Prime Lens', 'RF 28-70mm f/2L USM Zoom Lens',
      'Cine 50-100mm T2.0 High-Speed Zoom', 'FE 135mm f/1.8 GM Telephoto Prime', 'Otus 85mm f/1.4 Apo Planar Lens'
    ],
    baseRate: 1500,
  },
  {
    productType: 'audio',
    category: 'Audio',
    brands: ['Sound Devices', 'Sennheiser', 'Lectrosonics', 'Neumann', 'Schoeps', 'DPA Microphones', 'Zoom', 'Shure', 'Rode', 'Genelec'],
    models: [
      'Scorpio 32-Channel Field Recorder Console', 'Digital 6000 Wireless Microphone System', 'Wireless Receiver & Transmitter Combo',
      'U87 Ai Large Diaphragm Studio Condenser', 'CMIT 5U Supercardioid Shotgun Mic', '4017B Shotgun Microphone Package',
      'F8n Pro 8-Field Multitrack Recorder', 'SM7B Dynamic Vocal Studio Mic', 'NTG5 Lightweight Shotgun Mic Kit',
      '8030C Active Studio Monitor Pair', 'Tentacle Sync E MkII Timecode Box Kit', 'MixPre-10 II multitrack Field Recorder',
      'Wireless GO II Dual Channel Mic Kit', 'MKH 8060 Short Shotgun Microphone', 'SM58 Classic Dynamic Stage Mic Kit'
    ],
    baseRate: 1200,
  },
  {
    productType: 'lighting',
    category: 'Lighting',
    brands: ['ARRI', 'Aputure', 'Nanlite', 'Astera', 'Creamsource', 'Litepanels', 'Fiilex', 'K5600', 'Godox', 'Kino Flo'],
    models: [
      'Skypanel S360-C 1500W RGBW LED Softlight', 'Electro Storm CS15 1500W High Output LED', 'Evoke 1200B 1200W Bi-Color LED Spotlight',
      'Titan Tube FP1 8-Light Wireless Tube Set', 'Vortex8 650W High-Power RGBW LED Panel', 'Gemini 2x1 Hard RGBWW LED Soft Panel',
      'Q8 Color 320W 8" Fresnel LED Light', 'Joker-Bug 800W HMI Daylight System', 'KNOWLEDS MG1200Bi Bi-Color LED Spotlight',
      'Celeb 850 DMX LED Center Mount Light', 'Light Storm LS 1200d Pro LED Daylight', 'Pavotube II 60C 8ft RGBWW Tube Set',
      'Hyperlight 300W RGBWW Directional Panel', 'Amaran 300c Full-Color LED Monolight', 'Forza 720B 800W Bi-Color LED Light'
    ],
    baseRate: 2000,
  },
  {
    productType: 'monitor',
    category: 'Monitor',
    brands: ['SmallHD', 'Teradek', 'Flanders Scientific', 'TVLogic', 'Atomos', 'Sony Professional', 'Hollyland', 'Blackmagic Design'],
    models: [
      'Cine 24" 4K High-Bright Production Monitor', 'Bolt 4K LT 750 Wireless Video Receiver Set', 'DM240 24" 10-bit Reference Studio Monitor',
      'LUM-318H 31" 4K HDR Reference Monitor', 'Sumo 19" HDR Production Monitor/Recorder', 'Ninja Ultra 5.2" 8K HDR Monitor-Recorder',
      'Mars 4K Wireless Video Transmitter System', 'Video Assist 7" 12G HDR Recorder', 'Cine 7 Touchscreen Field Monitor Kit',
      'Bolt 4K MAX Zero-Delay Wireless Transceiver', '703 UltraBright 7" On-Camera Monitor', 'Shogun Ultra 7" 4K HDR Monitor-Recorder',
      'Cosmo C1 Wireless Video System 1000ft', 'PVM-X2400 24" 4K TRIMASTER Monitor', 'KLS-170 17" Full HD Field Production Panel'
    ],
    baseRate: 1400,
  },
  {
    productType: 'vehicle',
    category: 'Vehicle',
    brands: ['Mercedes-Benz', 'Ford', 'Porsche', 'Land Rover', 'Chevrolet', 'Toyota', 'GMC', 'BMW', 'Mahindra', 'Volvo'],
    models: [
      'Sprinter 3500 High-Roof Mobile Studio Van', 'F-350 Heavy Duty Production Truck & Liftgate', 'Cayenne Turbo Pursuit Camera Car Setup',
      'Defender 110 Trophy Offroad Production SUV', 'Transit 15-Passenger Crew & Talent Bus', 'Suburban Armored VIP Escort & Gear SUV',
      'Land Cruiser 300 VR6 Armored Film Vehicle', 'Sierra 2500HD Mobile Grip & Rigging Truck', 'V-Class Executive VIP Lounge Van',
      'X5 xDrive40i M Sport Camera Pursuit SUV', 'Thar 4x4 Hard Top Adventure Rig', 'Fortuner 4WD Executive Production SUV',
      'F-150 Lightning All-Electric Power Station Truck', 'XC90 Recharge AWD Production Support SUV', 'Sprinter 2500 Cargo Gear Hauler'
    ],
    baseRate: 5000,
  },
  {
    productType: 'support',
    category: 'Support Gear',
    brands: ['Freefly Systems', 'DJI', 'Steadicam', 'Chapman-Leonard', 'Matthews Studio', 'Sachtler', 'OConnor', 'Technocrane', 'Kessler Crane'],
    models: [
      'Movi Pro Motorized Gimbal Stabilizer Rig', 'Ronin 2 Professional 3-Axis Gimbal System', 'M-2 Modular Steadicam Rig with Volt System',
      'Peewee IV Hydraulic Camera Studio Dolly', 'Hollywood Heavy Duty C-Stand Kit (Set of 10)', 'Cine 150 Heavy Duty Carbon Fiber Tripod',
      'Ultimate 2575D Fluid Head (150mm Bowl)', 'Super Technocrane 30 Telescoping Camera Crane', 'Shuttle Dolly Motorized Track System',
      'Inspire 3 8K Cinema Drone Full Package', 'Ronin 4D 4-Axis Cinema Camera Gimbal Unit', 'Video 20 S1 Fluid Head Tripod System',
      'Matthews Doorway Dolly & Curved Track Set', 'Dana Dolly Portable Camera Slider Kit', 'Flowcine Serene 2-Axis Vibration Isolator'
    ],
    baseRate: 2200,
  },
  {
    productType: 'furniture',
    category: 'Furniture',
    brands: ['LeaseStyle Studio', 'Herman Miller', 'Steelcase', 'FilmSet Pro', 'StageCraft', 'Knoll', 'VIP Greenroom'],
    models: [
      'Italian Leather Sectional VIP Lounge Set', 'Dual-Station LED Studio Makeup Vanity Table', 'Hollywood Director Tall Folding Canvas Chairs (Set of 6)',
      'Executive Production Desk & Ergonomic Mesh Chairs', 'Soundproof Portable Greenroom Partition Walls', 'Craft Service Catering Buffet Table & Warmer Unit',
      'VIP Star Trailer Lounge Sofa & Recliner Set', 'Mobile Costume Wardrobe Racks (Set of 4)', 'Mirrored Dressing Station & Ring Light Setup',
      'Foldable On-Set Talent Lounge Chairs (Set of 8)', 'Acoustic Sound Baffle Panel Dividers (Set of 6)', 'Heavy Duty Utility Worktable System',
      'Leather Swivel Club Armchairs (Pair)', 'Modular Cast Greenroom Couch Set', 'Pro Studio High-Stool Bar Seating Set (Set of 4)'
    ],
    baseRate: 1600,
  },
  {
    productType: 'event',
    category: 'Event',
    brands: ['Absen', 'L-Acoustics', 'Honda Power', 'Prolyte', 'MA Lighting', 'ChamSys', 'Chauvet Professional', 'Robe Lighting'],
    models: [
      '4K Outdoor LED Video Wall Display (5m × 3m)', 'K2 Line Array Stadium Speaker System Package', 'EU7000is Ultra-Quiet Inverter Generator 7000W',
      'Aluminum Stage Truss Rig Structure (10m × 8m)', 'grandMA3 Light DMX Lighting Control Console', 'QuickQ 30 DMX Touchscreen Lighting Desk',
      'Maverick MK3 Wash Moving Head Light (Set of 4)', 'BMFL Blade Spot Moving Head Stage Light Pair', 'DGT 50kW Heavy Power Distribution Generator',
      'Custom Curved Indoor Modular LED Screen 4m × 2m', 'Syva Colinear PA Speaker & Subwoofer System', 'Color STRIKE M Motorized Strobe Light Kit',
      'Low Smoke Heavy Fog Atmospheric Machine', 'Pro Stage Deck Modular Platform 6m × 4m', 'Wireless DMX Transceiver Transmitter System'
    ],
    baseRate: 3500,
  },
  {
    productType: 'other',
    category: 'Electronics',
    brands: ['Apple', 'Dell', 'HP', 'ASUS', 'Acer', 'Lenovo', 'Promise Technology', 'SanDisk Professional', 'EcoFlow', 'RED Digital'],
    models: [
      'MacBook Pro 16" M3 Max 128GB Unified RAM Editing Rig', 'Precision 7780 17.3" Mobile Workstation (RTX 4090)', 'ZBook Studio G10 4K OLED Workstation Laptop',
      'ROG Strix SCAR 18 i9-13980HX 64GB DDR5 Gaming Laptop', 'Aspire 5 Creator Laptop 32GB RAM RTX 3050', 'ThinkPad P16 Gen 2 Workstation Laptop 64GB',
      'Pegasus32 R8 64TB Hardware RAID Storage Array', 'PRO-BLADE Modular SSD System 16TB Transport Pack', 'DELTA Pro 3600Wh Portable Battery Power Station',
      'RED ROCKET-X Video Processing Accelerator Unit', 'Mac Studio M2 Ultra 192GB RAM Video Editing PC', 'Pro Display XDR 32" 6K Retina Reference Display',
      'G-DRIVE Shuttle 8-Bay Thunderbolt 3 112TB RAID', 'Anker Solix F3800 Portable Power Station 3840Wh', 'iPad Pro 12.9" M2 2TB Wireless On-Set Script Unit'
    ],
    baseRate: 1800,
  },
]

const CONDITIONS = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR']

async function generateAndSeed() {
  console.log('🌱 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected!')

  const targetCount = 375
  console.log(`Generating data up to ${targetCount} products...`)

  const productsToUpsert: any[] = []
  let index = 1

  while (productsToUpsert.length < targetCount) {
    for (const domain of DOMAINS) {
      for (const brand of domain.brands) {
        for (const model of domain.models) {
          if (productsToUpsert.length >= targetCount) break

          const name = `${brand} ${model}`
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') + `-${index}`

          const sku = `${domain.category.substring(0, 3).toUpperCase()}-${brand.substring(0, 3).toUpperCase()}-${String(index).padStart(4, '0')}`

          const imageArray = DOMAIN_IMAGES[domain.productType] || DOMAIN_IMAGES['other']
          const imageUrl = imageArray[(index - 1) % imageArray.length]

          const depositBase = Math.round(domain.baseRate * (0.8 + (index % 5) * 0.2))
          const dailyRate = Math.round(depositBase * 0.5)
          const weeklyRate = Math.round(dailyRate * 7 * 0.9)
          const monthlyRate = Math.round(dailyRate * 30 * 0.7)
          const condition = CONDITIONS[(index - 1) % CONDITIONS.length]
          const stock = (index % 8) + 2

          productsToUpsert.push({
            name,
            slug,
            description: `Professional rental-grade ${model} from ${brand}. Inspected and calibrated for production use, live events, studio setups, and corporate deployment.`,
            imageUrl,
            productType: domain.productType,
            itemKind: 'GOODS',
            category: domain.category,
            brand,
            sku,
            condition,
            totalStock: stock,
            availableStock: stock,
            dailyRate,
            weeklyRate,
            monthlyRate,
            baseDepositAmt: depositBase,
            depositIsPercent: false,
            accessoryList: ['User Manual & Quickstart', 'Heavy-Duty Flight Case', 'Power & Connection Cables'],
            tags: [domain.category.toLowerCase(), domain.productType, brand.toLowerCase(), condition.toLowerCase()],
            specifications: {
              brand,
              category: domain.category,
              conditionRating: condition,
              rentalTier: 'Standard Commercial',
            },
            isPublished: true,
            isArchived: false,
            variants: [
              { attribute: 'Condition', value: condition },
              { attribute: 'Tier', value: 'Pro Grade' },
            ],
          })

          index++
        }
      }
    }
  }

  console.log(`Constructed ${productsToUpsert.length} products. Upserting into MongoDB...`)

  const bulkOps = productsToUpsert.map((item) => ({
    updateOne: {
      filter: { sku: item.sku },
      update: { $set: item },
      upsert: true,
    },
  }))

  const result = await Product.bulkWrite(bulkOps)
  console.log(`\n🎉 Successfully bulk upserted products!`)
  console.log(`  • Inserted: ${result.upsertedCount}`)
  console.log(`  • Modified: ${result.modifiedCount}`)

  const totalInDb = await Product.countDocuments({ isArchived: { $ne: true } })
  console.log(`📊 Total Active Products in MongoDB: ${totalInDb}`)

  await mongoose.disconnect()
  process.exit(0)
}

generateAndSeed().catch((err) => {
  console.error('❌ Generation Error:', err)
  process.exit(1)
})
