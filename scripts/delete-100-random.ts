// scripts/delete-100-random.ts — Run with: npx tsx scripts/delete-100-random.ts
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

async function deleteRandom100() {
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

  const deleteCount = Math.min(100, totalBefore)

  // Use MongoDB $sample aggregation to select 100 random products
  const randomProducts = await Product.aggregate([
    { $sample: { size: deleteCount } },
    { $project: { _id: 1, name: 1, sku: 1 } },
  ])

  const targetIds = randomProducts.map((p) => p._id)

  console.log(`🗑️ Deleting ${targetIds.length} randomly selected product documents...`)

  const deleteResult = await Product.deleteMany({ _id: { $in: targetIds } })

  const totalAfter = await Product.countDocuments()

  console.log('\n----------------------------------------')
  console.log(`✅ Successfully deleted ${deleteResult.deletedCount} random product documents.`)
  console.log(`📊 Total Products Before Deletion: ${totalBefore}`)
  console.log(`📊 Remaining Products in Database: ${totalAfter}`)
  console.log('----------------------------------------\n')

  await mongoose.disconnect()
  process.exit(0)
}

deleteRandom100().catch((err) => {
  console.error('❌ Error during 100 random product deletion:', err)
  process.exit(1)
})
