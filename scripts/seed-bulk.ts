// scripts/seed-bulk.ts — Run with: npx tsx scripts/seed-bulk.ts
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
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

/**
 * Bulk insert with chunking for large datasets
 */
async function bulkInsert<T>(
  model: mongoose.Model<T>,
  documents: unknown[],
  chunkSize = 1000
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0
  let errors = 0

  for (let i = 0; i < documents.length; i += chunkSize) {
    const chunk = documents.slice(i, i + chunkSize)
    try {
      const result = await model.insertMany(chunk, { ordered: false })
      inserted += result.length
    } catch (error: any) {
      // Partial success with ordered: false
      if (error.insertedDocs) {
        inserted += error.insertedDocs.length
      }
      errors += chunk.length - (error.insertedDocs?.length || 0)
    }
  }

  return { inserted, errors }
}

function mapProductType(category: string, name: string): string {
  const catLower = (category || '').toLowerCase()
  const nameLower = (name || '').toLowerCase()

  if (catLower.includes('camera') || nameLower.includes('camera')) return 'camera'
  if (catLower.includes('lens') || nameLower.includes('lens')) return 'lens'
  if (catLower.includes('audio') || nameLower.includes('sound') || nameLower.includes('mic')) return 'audio'
  if (catLower.includes('light') || nameLower.includes('led') || nameLower.includes('light')) return 'lighting'
  if (catLower.includes('vehicle') || nameLower.includes('car') || nameLower.includes('truck')) return 'vehicle'
  if (catLower.includes('monitor') || nameLower.includes('screen') || nameLower.includes('display')) return 'monitor'
  if (catLower.includes('support') || nameLower.includes('gimbal') || nameLower.includes('tripod')) return 'support'
  if (catLower.includes('furniture') || nameLower.includes('chair') || nameLower.includes('table')) return 'furniture'
  return 'other'
}

async function run() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 100,
    minPoolSize: 10,
  })
  console.log('Connected!')

  const dataPath = path.resolve(process.cwd(), 'scripts/bulk-data.json')
  if (!fs.existsSync(dataPath)) {
    console.error('scripts/bulk-data.json not found!')
    process.exit(1)
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8')
  const rawProducts = JSON.parse(rawData)

  console.log(`Processing ${rawProducts.length} products...`)

  // Process all products first
  const processedProducts = rawProducts.map((raw: any, i: number) => {
    const productType = raw.productType || mapProductType(raw.category, raw.name)
    const baseDeposit = raw.baseDepositAmt || 500
    const dailyRate = raw.dailyRate || Math.max(300, Math.round(baseDeposit * 0.4))
    const weeklyRate = raw.weeklyRate || Math.round(dailyRate * 7 * 0.9)
    const monthlyRate = raw.monthlyRate || Math.round(dailyRate * 30 * 0.7)

    // Extract condition from variants if available
    let condition = raw.condition || 'EXCELLENT'
    if (raw.variants && Array.isArray(raw.variants)) {
      const condVariant = raw.variants.find((v: any) => v.attribute?.toLowerCase() === 'condition')
      if (condVariant?.value) {
        const valUpper = condVariant.value.toUpperCase()
        if (valUpper.includes('NEW')) condition = 'NEW'
        else if (valUpper.includes('EXCELLENT')) condition = 'EXCELLENT'
        else if (valUpper.includes('GOOD')) condition = 'GOOD'
        else if (valUpper.includes('FAIR')) condition = 'FAIR'
      }
    }

    const sku = raw.sku || `SKU-BULK-${i + 1}`
    const slug = raw.slug || (raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${i + 1}`)

    const tags = raw.tags || Array.from(new Set([
      raw.brand?.toLowerCase(),
      raw.category?.toLowerCase(),
      productType,
    ].filter(Boolean)))

    return {
      name: raw.name,
      slug,
      description: raw.description || `High-performance rental ${raw.name} from ${raw.brand || 'top brands'}.`,
      imageUrl: raw.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
      productType,
      category: raw.category || 'Equipment',
      brand: raw.brand || 'Generic',
      sku,
      condition,
      totalStock: raw.totalStock ?? 5,
      availableStock: raw.availableStock ?? raw.totalStock ?? 5,
      dailyRate,
      weeklyRate,
      monthlyRate,
      baseDepositAmt: baseDeposit,
      depositIsPercent: raw.depositIsPercent ?? false,
      accessoryList: raw.accessoryList || ['Power Cable', 'Carrying Case'],
      tags,
      isPublished: raw.isPublished ?? true,
      isArchived: false,
      variants: raw.variants || [],
    }
  })

  // Use bulk insert for better performance
  console.log('Starting bulk insert with chunking...')
  const result = await bulkInsert(Product, processedProducts, 500)

  console.log(`\n🎉 Bulk Seeding Completed!`)
  console.log(`- Inserted: ${result.inserted} products`)
  console.log(`- Errors: ${result.errors}`)

  const totalInDb = await Product.countDocuments({ isArchived: { $ne: true } })
  console.log(`- Total Active Products in MongoDB: ${totalInDb}`)

  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
