// scripts/fix-images.ts — Run with: npx tsx scripts/fix-images.ts
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env.local')

// Correct image URLs for each product by SKU
const IMAGE_FIXES: Record<string, string> = {
  // Sony FE 70-200mm f/2.8 GM OSS II Lens — large telephoto zoom lens (was 404)
  'LENS-SONY-70200-GM2':
    'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=800&q=80',
  // Sigma 24-70mm f/2.8 Art Lens
  'LENS-SIGMA-2470':
    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80',
  // Canon RF 50mm f/1.2L
  'LENS-CANON-50-F12':
    'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=800&q=80',
  // DJI Ronin 4D — was showing sneakers!
  'GIMBAL-DJI-RONIN4D-6K':
    'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&q=80',
  // Aputure LS 600d Pro LED — was broken/404
  'LIGHT-APUT-600D':
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&q=80',
  // ARRI Skypanel S60-C — was showing neon sign!
  'LIGHT-ARRI-SKYPANEL-S60C':
    'https://images.unsplash.com/photo-1533683013754-9d4bc1d4a5e6?w=800&q=80',
  // Sound Devices 833 Field Recorder — was showing guitar studio!
  'AUD-SD-833-REC':
    'https://images.unsplash.com/photo-1593698054498-56c2ef5bff9c?w=800&q=80',
  // Sennheiser MKH 416 Shotgun Mic
  'AUD-SENN-MKH416':
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80',
  // DJI Inspire 3 8K Drone
  'DRONE-DJI-INSPIRE3-8K':
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80',
  // Nanlite Pavotube II 30C
  'LIGHT-NAN-PAVO30C-4K':
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
}

async function fixImages() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected\n')

  const Product = mongoose.model('Product', new mongoose.Schema({
    sku: String, imageUrl: String, name: String,
  }, { strict: false }))

  let fixed = 0

  for (const [sku, imageUrl] of Object.entries(IMAGE_FIXES)) {
    const result = await Product.findOneAndUpdate(
      { sku },
      { $set: { imageUrl } },
      { new: true }
    )
    if (result) {
      console.log(`Fixed [${sku}]: ${result.name}`)
      fixed++
    } else {
      console.log(`Not found: ${sku}`)
    }
  }

  console.log(`\nDone. Fixed ${fixed} products.`)
  await mongoose.disconnect()
}

fixImages().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
