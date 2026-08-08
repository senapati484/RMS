// scripts/delete-64-random.ts — Run with: npx tsx scripts/delete-64-random.ts
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in .env.local')

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    sku: String,
  },
  { strict: false }
)

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

async function deleteRandom64() {
  console.log('🌱 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected!\n')

  const totalBefore = await Product.countDocuments()
  console.log(`📊 Initial Total Products in MongoDB: ${totalBefore}`)

  if (totalBefore === 0) {
    console.log('⚠️ No products found to delete.')
    await mongoose.disconnect()
    process.exit(0)
  }

  const deleteCount = Math.min(64, totalBefore)

  // Use MongoDB $sample aggregation to select 64 random products
  const randomProducts = await Product.aggregate([
    { $sample: { size: deleteCount } },
    { $project: { _id: 1, name: 1, sku: 1 } },
  ])

  const idsToDelete = randomProducts.map((p) => p._id)

  console.log(`\n🗑️ Deleting ${idsToDelete.length} random products...`)
  const result = await Product.deleteMany({ _id: { $in: idsToDelete } })

  console.log(`✅ Successfully deleted ${result.deletedCount} products!`)

  console.log('\n📋 Sample Deleted Products:')
  randomProducts.slice(0, 10).forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.sku || 'N/A'}] ${p.name}`)
  })
  if (randomProducts.length > 10) {
    console.log(`  ... and ${randomProducts.length - 10} more.`)
  }

  const totalAfter = await Product.countDocuments()
  console.log(`\n📊 Updated Total Products in MongoDB: ${totalAfter} (Reduced by ${totalBefore - totalAfter})`)

  await mongoose.disconnect()
  process.exit(0)
}

deleteRandom64().catch((err) => {
  console.error('❌ Deletion Error:', err)
  process.exit(1)
})
