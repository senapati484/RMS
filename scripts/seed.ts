// scripts/seed.ts — Run with: npx tsx scripts/seed.ts
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env.local')

const UserSchema = new mongoose.Schema({
  name: String, email: String, passwordHash: String,
  role: { type: String, enum: ['ADMIN', 'STAFF', 'PORTAL_USER'], default: 'PORTAL_USER' },
  phone: String, isActive: { type: Boolean, default: true },
  trustScore: { type: Number, default: 50 },
  isGovIdVerified: { type: Boolean, default: true },
  aadhaarMasked: { type: String, default: 'XXXX-XXXX-1928' },
  digiLockerTxnId: { type: String, default: 'DL-88492019' },
  companyName: String, gstin: String,
}, { timestamps: true })

const ProductSchema = new mongoose.Schema({
  name: String, slug: String, description: String,
  imageUrl: String,
  productType: { type: String, default: 'other' },
  category: String, brand: String, sku: String,
  condition: { type: String, default: 'EXCELLENT' },
  totalStock: Number, availableStock: Number, dailyRate: Number,
  weeklyRate: Number, monthlyRate: Number,
  baseDepositAmt: Number, depositIsPercent: Boolean,
  accessoryList: [String],
  tags: [String],
  specifications: { type: Map, of: String, default: {} },
  isPublished: { type: Boolean, default: true },
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
// ADMIN & USER SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
const USERS = [
  // Super Admin
  { name: 'Lease360 Super Admin', email: 'admin@lease360.ai', password: 'admin123', role: 'ADMIN', phone: '+91-9876543210', companyName: 'Lease360 HQ', gstin: '27AAAAA0000A1Z5' },
  // Domain Specific Admins
  { name: 'CineGear Studio Admin', email: 'admin.camera@lease360.ai', password: 'admin123', role: 'ADMIN', phone: '+91-9876543220', companyName: 'CineGear Pro Rentals', gstin: '27CINEG1234F1Z1' },
  { name: 'LeaseFleet Logistics Admin', email: 'admin.vehicle@lease360.ai', password: 'admin123', role: 'ADMIN', phone: '+91-9876543230', companyName: 'LeaseFleet India Ltd', gstin: '27FLEET5678K1Z3' },
  { name: 'Apex Event & Stage Admin', email: 'admin.event@lease360.ai', password: 'admin123', role: 'ADMIN', phone: '+91-9876543240', companyName: 'Apex Live Productions', gstin: '27APEXE9012M1Z9' },
  // Staff
  { name: 'Rajesh Kumar (Staff)', email: 'staff@lease360.ai', password: 'staff123', role: 'STAFF', phone: '+91-9876543211' },
  // Customers
  { name: 'Aryan Sharma', email: 'user@lease360.ai', password: 'user123', role: 'PORTAL_USER', phone: '+91-9820148291' },
  { name: 'Priya Nair', email: 'priya@lease360.ai', password: 'user123', role: 'PORTAL_USER', phone: '+91-9833411202' },
  { name: 'Vikram Mehta', email: 'vikram@lease360.ai', password: 'user123', role: 'PORTAL_USER', phone: '+91-9811234900' },
]

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT DATA WITH TYPE-SPECIFIC FIELDS
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  // ── CAMERAS ──────────────────────────────────────────────────────────────
  {
    name: 'Sony A7III Mirrorless Camera', slug: 'sony-a7iii',
    description: 'Full-frame mirrorless camera with 24.2MP sensor, 4K video, and 693 AF points.',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    productType: 'camera', category: 'Camera', brand: 'Sony', sku: 'CAM-SONY-A7III', condition: 'EXCELLENT',
    totalStock: 5, availableStock: 5, dailyRate: 1500, weeklyRate: 9450, monthlyRate: 31500, baseDepositAmt: 5000, depositIsPercent: false,
    accessoryList: ['NP-FZ100 Battery ×2', 'Dual Charger', 'Body Cap', '64GB SD Card'],
    tags: ['4k', 'full-frame', 'mirrorless', 'sony', 'video'],
    specifications: {
      sensorType: 'Full Frame Exmor R CMOS (35mm)', resolution: '24.2 MegaPixels',
      lensMount: 'Sony E-Mount', videoResolution: '4K UHD (3840×2160) 30fps',
      isoRange: '100 – 51200 (Expanded 50–204800)', autofocusPoints: '693 Phase-Detection PDAF',
      shutterSpeed: '1/8000 to 30 sec', batteryModel: 'NP-FZ100',
    },
  },
  {
    name: 'RED Komodo 6K Cinema Camera Package', slug: 'red-komodo-6k',
    description: 'Compact 6K global shutter cinema camera with Canon RF mount and REDCODE RAW codec.',
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
    productType: 'camera', category: 'Camera', brand: 'RED Digital Cinema', sku: 'CAM-RED-KOMODO6K', condition: 'NEW',
    totalStock: 2, availableStock: 2, dailyRate: 5000, weeklyRate: 31500, monthlyRate: 105000, baseDepositAmt: 20000, depositIsPercent: false,
    accessoryList: ['Outrigger Handle', '512GB CFAST Card ×2', 'V-Mount Adapter', 'Pelican Case'],
    tags: ['6k', 'cinema', 'red', 'global-shutter', 'raw', 'feature-film'],
    specifications: {
      sensorType: 'Super 35mm Global Shutter CMOS', resolution: '6K (6144 × 3240) @ 40fps',
      lensMount: 'Canon RF Mount (EF Adapter included)', videoResolution: '6K 40fps / 4K 60fps / 2K 120fps',
      isoRange: '800 Native ISO', autofocusPoints: 'Phase-Detection Touch AF',
      shutterSpeed: 'Global Shutter (Zero Distortion)', batteryModel: 'Canon BP-955 / V-Mount',
    },
  },
  {
    name: 'Sony FX6 Full-Frame Cinema Line Camera', slug: 'sony-fx6-cinema',
    description: 'Professional Cinema Line camera with 10.2MP 4K full-frame back-illuminated Exmor R CMOS sensor.',
    imageUrl: 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?w=800&q=80',
    productType: 'camera', category: 'Camera', brand: 'Sony', sku: 'CAM-SONY-FX6-CINE', condition: 'EXCELLENT',
    totalStock: 3, availableStock: 3, dailyRate: 3800, weeklyRate: 23940, monthlyRate: 79800, baseDepositAmt: 15000, depositIsPercent: false,
    accessoryList: ['Top Handle', 'LCD Viewfinder', 'BP-U60 Battery ×2', 'BP-U Charger', 'Pelican Air Case'],
    tags: ['sony', 'fx6', 'cinema-line', 'full-frame', '4k120p', 'electronic-nd'],
    specifications: {
      sensorType: 'Full-Frame 35mm Back-Illuminated CMOS', resolution: '10.2 MegaPixels (4K Video optimized)',
      lensMount: 'Sony E-Mount', videoResolution: '4K DCI (4096×2160) 120fps / XAVC-I 4:2:2 10-bit',
      isoRange: 'Dual Base ISO 800 / 12800', autofocusPoints: '627 Fast Hybrid AF with Real-Time Eye AF',
      shutterSpeed: '1/8000 to 1 sec', batteryModel: 'Sony BP-U Series',
    },
  },
  {
    name: 'Canon EOS C300 Mark III Cinema Camera', slug: 'canon-c300-mk3',
    description: 'Super 35mm Dual Gain Output (DGO) sensor camera with 4K 120p RAW recording and modular body.',
    imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    productType: 'camera', category: 'Camera', brand: 'Canon', sku: 'CAM-CANON-C300M3', condition: 'EXCELLENT',
    totalStock: 2, availableStock: 2, dailyRate: 4200, weeklyRate: 26460, monthlyRate: 88200, baseDepositAmt: 18000, depositIsPercent: false,
    accessoryList: ['GR-V1 Grip Unit', 'LM-V2 4.3" Touchscreen LCD', 'BP-A60 Battery ×2', '512GB CFexpress Card ×2'],
    tags: ['canon', 'c300', 'dgo-sensor', 'cinema', '4k120p', 'cinema-raw-light'],
    specifications: {
      sensorType: 'Super 35mm DGO Dual Gain Output CMOS', resolution: '9.6 MegaPixels (Super 35mm)',
      lensMount: 'Canon EF Mount (User Interchangeable PL)', videoResolution: '4K DCI 120fps Cinema RAW Light',
      isoRange: '160 – 25600 (Expanded 100–102400)', autofocusPoints: 'Dual Pixel CMOS AF',
      shutterSpeed: '1/2000 to 1 sec', batteryModel: 'Canon BP-A60',
    },
  },

  // ── LENSES ───────────────────────────────────────────────────────────────
  {
    name: 'Sigma 24-70mm f/2.8 DG DN Art Lens', slug: 'sigma-24-70-f28',
    description: 'Flagship zoom lens with constant f/2.8 aperture and ultra-sharp optics.',
    imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80',
    productType: 'lens', category: 'Lens', brand: 'Sigma', sku: 'LENS-SIGMA-2470', condition: 'EXCELLENT',
    totalStock: 6, availableStock: 6, dailyRate: 900, weeklyRate: 5670, monthlyRate: 18900, baseDepositAmt: 2500, depositIsPercent: false,
    accessoryList: ['Front Cap', 'Rear Cap', 'Petal Hood', 'Padded Case'],
    tags: ['zoom', 'f2.8', 'art', 'sigma', 'sony-e'],
    specifications: {
      sensorType: 'Full Frame Coverage', resolution: 'Optically Rated for 60MP+',
      lensMount: 'Sony E-Mount', focalLength: '24–70mm Zoom',
      apertureRange: 'f/2.8 to f/22', filterThread: '82mm',
      minFocusDistance: '0.18m (Wide) / 0.38m (Tele)', weight: '835 grams',
    },
  },
  {
    name: 'Sony FE 70-200mm f/2.8 GM OSS II Lens', slug: 'sony-70-200-f28-gmaster',
    description: 'Ultra-lightweight telephoto zoom lens with constant f/2.8 aperture and quad XD linear motors.',
    imageUrl: 'https://images.unsplash.com/photo-1588691819796-690be23ff980?w=800&q=80',
    productType: 'lens', category: 'Lens', brand: 'Sony', sku: 'LENS-SONY-70200-GM2', condition: 'NEW',
    totalStock: 4, availableStock: 4, dailyRate: 1400, weeklyRate: 8820, monthlyRate: 29400, baseDepositAmt: 6000, depositIsPercent: false,
    accessoryList: ['Tripod Collar', 'ALC-SH167 Hood', 'Front Cap', 'Rear Cap', 'Padded Soft Case'],
    tags: ['sony', 'gmaster', '70-200mm', 'telephoto', 'f2.8', 'oss'],
    specifications: {
      sensorType: 'Full Frame Coverage', resolution: 'Optimized for 61MP Exmor R Sensors',
      lensMount: 'Sony E-Mount', focalLength: '70–200mm Telephoto Zoom',
      apertureRange: 'f/2.8 to f/22', filterThread: '77mm',
      minFocusDistance: '0.4m (at 70mm)', weight: '1045 grams (29% lighter than Mk 1)',
    },
  },
  {
    name: 'Canon RF 50mm f/1.2L USM Prime Lens', slug: 'canon-rf-50mm-f12',
    description: 'Ultra-fast L-series prime lens delivering supreme sharpness and incredible bokeh.',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    productType: 'lens', category: 'Lens', brand: 'Canon', sku: 'LENS-CANON-50-F12', condition: 'EXCELLENT',
    totalStock: 3, availableStock: 3, dailyRate: 1100, weeklyRate: 6930, monthlyRate: 23100, baseDepositAmt: 4500, depositIsPercent: false,
    accessoryList: ['Lens Hood ES-83', 'E-95 Front Cap', 'Lens Dust Cap RF', 'Padded Lens Pouch'],
    tags: ['canon', 'rf-mount', '50mm', 'f1.2', 'portrait-prime', 'l-series'],
    specifications: {
      sensorType: 'Full Frame Coverage', resolution: 'Ultra-High Optics Ratings',
      lensMount: 'Canon RF Mount', focalLength: '50mm Prime',
      apertureRange: 'f/1.2 to f/16', filterThread: '95mm',
      minFocusDistance: '0.40m', weight: '950 grams',
    },
  },

  // ── LIGHTING ──────────────────────────────────────────────────────────────
  {
    name: 'Aputure Light Storm LS 600d Pro LED', slug: 'aputure-ls-600d-pro',
    description: 'Monstrous 600W daylight COB LED fixture equivalent to 1200W HMI for professional sets.',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    productType: 'lighting', category: 'Lighting', brand: 'Aputure', sku: 'LIGHT-APUT-600D', condition: 'NEW',
    totalStock: 3, availableStock: 3, dailyRate: 2200, weeklyRate: 13860, monthlyRate: 46200, baseDepositAmt: 8000, depositIsPercent: false,
    accessoryList: ['Control Box', 'Hyper Reflector', 'Weatherproof Head Cable', 'Rolling Case'],
    tags: ['aputure', '600w', 'hmi-equivalent', 'cob-led', 'daylight', 'bowens'],
    specifications: {
      outputWattage: '600W COB LED (1200W HMI Equivalent)', colorTemperature: '5600K Daylight (±200K)',
      criRating: 'CRI 96+ / TLCI 96+ / SSI 72', mountType: 'Bowens S-Type Mount',
      wirelessProtocol: 'Sidus Link App / 2.4G Remote / DMX512', illuminance: '98,500+ Lux @ 1m (with Hyper Reflector)',
    },
  },
  {
    name: 'ARRI Skypanel S60-C RGBW LED Softlight', slug: 'arri-skypanel-s60c',
    description: 'Industry benchmark RGBW LED softlight with fully tuneable correlated color temperature from 2800K to 10,000K.',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    productType: 'lighting', category: 'Lighting', brand: 'ARRI', sku: 'LIGHT-ARRI-SKYPANEL-S60C', condition: 'EXCELLENT',
    totalStock: 2, availableStock: 2, dailyRate: 4500, weeklyRate: 28350, monthlyRate: 94500, baseDepositAmt: 20000, depositIsPercent: false,
    accessoryList: ['S60 Power Supply Unit', 'Header Cable 10m', 'Standard Diffusion Panel', 'Intensity Barndoors', 'Flight Case'],
    tags: ['arri', 'skypanel', 's60c', 'rgbw', 'softlight', 'broadcast-standard'],
    specifications: {
      outputWattage: '450W Nominal Power Draw', colorTemperature: '2,800K – 10,000K Continuously Variable',
      criRating: 'CRI > 95 / TLCI > 90', mountType: '28mm Junior Pin (1-1/8")',
      wirelessProtocol: 'DMX512 / Art-Net / LAN / Onboard Controller', illuminance: '1,280 Lux @ 5m (Standard Diffusion)',
    },
  },
  {
    name: 'Nanlite Pavotube II 30C RGBWW Tube Light Kit (Set of 4)', slug: 'nanlite-pavotube-30c-4kit',
    description: '4-foot RGBWW LED tube light 4-light kit with internal batteries, wireless DMX, and special effects.',
    imageUrl: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&q=80',
    productType: 'lighting', category: 'Lighting', brand: 'Nanlite', sku: 'LIGHT-NAN-PAVO30C-4K', condition: 'NEW',
    totalStock: 4, availableStock: 4, dailyRate: 1600, weeklyRate: 10080, monthlyRate: 33600, baseDepositAmt: 5000, depositIsPercent: false,
    accessoryList: ['PavoTube II 30C ×4', 'Power Adapters ×4', 'Transparent Mounting Clips ×8', 'Steel Safety Wires ×4', 'Padded Carrying Case'],
    tags: ['nanlite', 'pavotube', 'rgbww', 'tube-light', 'practicals', 'music-video'],
    specifications: {
      outputWattage: '70W Per Tube (280W Total System)', colorTemperature: '2700K – 7500K Green/Magenta Adjustment',
      criRating: 'CRI 97 / TLCI 98', mountType: 'T12 Clips / 1/4"-20 Receivers',
      wirelessProtocol: '2.4G / Bluetooth / DMX/RDM', illuminance: '719 Lux @ 1m per tube',
    },
  },

  // ── AUDIO ─────────────────────────────────────────────────────────────────
  {
    name: 'Sennheiser MKH 416 Shotgun Microphone', slug: 'sennheiser-mkh416',
    description: 'Industry-standard broadcast shotgun mic with exceptional directivity and moisture resistance.',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80',
    productType: 'audio', category: 'Audio', brand: 'Sennheiser', sku: 'AUD-SENN-MKH416', condition: 'EXCELLENT',
    totalStock: 4, availableStock: 4, dailyRate: 750, weeklyRate: 4725, monthlyRate: 15750, baseDepositAmt: 2500, depositIsPercent: false,
    accessoryList: ['MZW415 Foam Windscreen', 'MZQ100 Stand Mount', 'Waterproof Hard Case'],
    tags: ['shotgun', 'sennheiser', 'broadcast', 'dialogue', 'location-sound'],
    specifications: {
      polarPattern: 'Supercardioid / Lobar', frequencyResponse: '40 Hz – 20,000 Hz',
      signalToNoise: '81 dB (A-weighted)', connectorType: '3-Pin XLR Male',
      phantomPower: '48V ± 4V Phantom Power', maxSPL: '130 dB SPL',
      impedance: '25 Ohms Nominal', outputSensitivity: '25 mV/Pa ± 1 dB',
    },
  },
  {
    name: 'Sound Devices 833 8-Channel Field Recorder', slug: 'sound-devices-833',
    description: 'Compact 8-channel, 12-track field audio recorder/mixer with 6 ultra-low noise microphone preamps.',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
    productType: 'audio', category: 'Audio', brand: 'Sound Devices', sku: 'AUD-SD-833-REC', condition: 'EXCELLENT',
    totalStock: 2, availableStock: 2, dailyRate: 2800, weeklyRate: 17640, monthlyRate: 58800, baseDepositAmt: 12000, depositIsPercent: false,
    accessoryList: ['XL-1394 Power Supply', 'Dual SanDisk 128GB SD Cards', 'L-Mount Battery Sled', 'Orca Harness Bag'],
    tags: ['sound-devices', '833', 'field-recorder', 'location-sound', '32-bit-float', 'timecode'],
    specifications: {
      polarPattern: '8 Channels / 12 Tracks (6 XLR Preamps)', frequencyResponse: '10 Hz – 80 kHz (±0.5 dB)',
      signalToNoise: '130 dB Dynamic Range', connectorType: 'XLR / TA3 / 3.5mm Headphone',
      phantomPower: '48V Phantom Power per channel', maxSPL: 'Ultra Low Noise Preamps (-131 dBu EIN)',
      impedance: '4k Ohms Preamps', outputSensitivity: '32-Bit Float Recording Capable',
    },
  },

  // ── VEHICLES ──────────────────────────────────────────────────────────────
  {
    name: '2023 Toyota Fortuner 4WD SUV', slug: 'toyota-fortuner-2023',
    description: '7-seater heavy-duty SUV with 4WD capability, leather seats, and high ground clearance.',
    imageUrl: 'https://images.unsplash.com/photo-1532581291347-9c39cf10a73c?w=800&q=80',
    productType: 'vehicle', category: 'Vehicle', brand: 'Toyota', sku: 'VEH-TOY-FOR-001', condition: 'EXCELLENT',
    totalStock: 3, availableStock: 3, dailyRate: 4500, weeklyRate: 28350, monthlyRate: 94500, baseDepositAmt: 15000, depositIsPercent: false,
    accessoryList: ['Full Tank Diesel', 'GPS Tracker', 'Dashcam Dual', 'Spare Wheel & Jack'],
    tags: ['suv', 'toyota', '4wd', 'diesel', 'fortuner', 'location-vehicle'],
    specifications: {
      fuelType: 'Diesel', transmission: 'Automatic', seatingCapacity: '7 Seats',
      registrationNo: 'MH01 BX 4291', vehicleClass: 'SUV 4WD', mileage: '14.2 km/l',
      engineCapacity: '2755 cc', insuranceValidity: '2026-12-31',
    },
  },
  {
    name: 'Mahindra Thar 4x4 Hard Top', slug: 'mahindra-thar-4x4',
    description: 'Iconic 4x4 off-roader with convertible hard top for rugged terrain location shoots.',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
    productType: 'vehicle', category: 'Vehicle', brand: 'Mahindra', sku: 'VEH-MAH-THAR-4X4', condition: 'NEW',
    totalStock: 4, availableStock: 4, dailyRate: 3200, weeklyRate: 20160, monthlyRate: 67200, baseDepositAmt: 10000, depositIsPercent: false,
    accessoryList: ['Offroad Recovery Kit', 'Tow Hook', 'Roof Rack'],
    tags: ['4x4', 'thar', 'offroad', 'mahindra', 'convertible'],
    specifications: {
      fuelType: 'Petrol', transmission: 'Manual', seatingCapacity: '4 Seats',
      registrationNo: 'MH02 CL 8820', vehicleClass: 'Compact SUV 4x4', mileage: '12.8 km/l',
      engineCapacity: '1997 cc mStallion', insuranceValidity: '2027-03-31',
    },
  },
  {
    name: 'Mercedes-Benz V-Class Luxury Crew Van', slug: 'mercedes-v-class-van',
    description: 'Ultra-luxurious VIP crew transport van with executive reclining captain seats and ambient lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80',
    productType: 'vehicle', category: 'Vehicle', brand: 'Mercedes-Benz', sku: 'VEH-MB-VCLASS-VIP', condition: 'EXCELLENT',
    totalStock: 2, availableStock: 2, dailyRate: 8500, weeklyRate: 53550, monthlyRate: 178500, baseDepositAmt: 25000, depositIsPercent: false,
    accessoryList: ['Chauffeur Available', 'Wi-Fi Hotspot', 'Refreshments Bar', 'Privacy Partition'],
    tags: ['luxury', 'van', 'vip', 'mercedes', 'v-class', 'crew-bus'],
    specifications: {
      fuelType: 'Diesel', transmission: '9G-TRONIC Automatic', seatingCapacity: '6 VIP Recliner Seats',
      registrationNo: 'MH01 EC 0007', vehicleClass: 'Luxury Van MPV', mileage: '16.0 km/l',
      engineCapacity: '1950 cc', insuranceValidity: '2026-11-15',
    },
  },
  {
    name: 'BMW X5 xDrive40i M Sport SUV', slug: 'bmw-x5-msport',
    description: 'Luxury performance SUV with 340 HP TwinPower Turbo engine, panoramic sunroof, and air suspension.',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
    productType: 'vehicle', category: 'Vehicle', brand: 'BMW', sku: 'VEH-BMW-X5-MSPORT', condition: 'NEW',
    totalStock: 2, availableStock: 2, dailyRate: 9500, weeklyRate: 59850, monthlyRate: 199500, baseDepositAmt: 30000, depositIsPercent: false,
    accessoryList: ['Chauffeur / Self-Drive Option', 'Full Comprehensive Commercial Cover', 'Child Seat Attachment'],
    tags: ['bmw', 'x5', 'luxury', 'm-sport', 'suv', 'executive'],
    specifications: {
      fuelType: 'Petrol', transmission: '8-Speed Steptronic Sport Automatic', seatingCapacity: '5 Executive Leather Seats',
      registrationNo: 'MH01 DD 9900', vehicleClass: 'Luxury Performance SUV', mileage: '11.2 km/l',
      engineCapacity: '2998 cc Inline-6 Turbo', insuranceValidity: '2027-01-20',
    },
  },

  // ── SUPPORT & DRONES ──────────────────────────────────────────────────────
  {
    name: 'DJI Inspire 3 8K Cinema Drone System', slug: 'dji-inspire-3-8k',
    description: 'Full-frame 8K ProRes RAW aerial cinema drone system with Waypoint Pro and Centimeter-Level RTK positioning.',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80',
    productType: 'support', category: 'Support', brand: 'DJI', sku: 'DRONE-DJI-INSPIRE3-8K', condition: 'NEW',
    totalStock: 2, availableStock: 2, dailyRate: 6500, weeklyRate: 40950, monthlyRate: 136500, baseDepositAmt: 25000, depositIsPercent: false,
    accessoryList: ['Zenmuse X9-8K Air Gimbal Camera', 'RC Plus Remote Controller', 'TB51 Intelligent Battery ×6', 'Charging Hub', 'Pelican Rolling Case'],
    tags: ['dji', 'inspire3', '8k-raw', 'aerial-cinema', 'drone', 'rtk'],
    specifications: {
      payloadCapacity: 'Integrated Zenmuse X9-8K Air', flightTime: '28 Minutes per dual battery set',
      maxRange: '15 km Transmission (O3 Pro)', videoCodec: '8K 75fps ProRes RAW / 8K 25fps CinemaDNG',
      positioningSystem: 'Centimeter-Level RTK Dual Antenna', topSpeed: '94 km/h',
    },
  },
  {
    name: 'DJI Ronin 4D 4-Axis Cinema Camera Gimbal System', slug: 'dji-ronin-4d-6k',
    description: 'Revolutionary 4-axis cinema camera featuring Zenmuse X9 6K full-frame camera and LiDAR focusing.',
    imageUrl: 'https://images.unsplash.com/photo-1527090526205-beaac8dc3c62?w=800&q=80',
    productType: 'support', category: 'Support', brand: 'DJI', sku: 'GIMBAL-DJI-RONIN4D-6K', condition: 'EXCELLENT',
    totalStock: 3, availableStock: 3, dailyRate: 4200, weeklyRate: 26460, monthlyRate: 88200, baseDepositAmt: 15000, depositIsPercent: false,
    accessoryList: ['Zenmuse X9-6K Gimbal Camera', 'LiDAR Range Finder', 'High-Bright Remote Monitor', 'TB50 Battery ×4', 'Hand Grips Kit'],
    tags: ['dji', 'ronin-4d', '4-axis', 'lidar', 'full-frame', '6k'],
    specifications: {
      payloadCapacity: 'Self-Contained Zenmuse X9 System', batteryLife: '150 Minutes per TB50 Battery',
      stabilization: 'Active Z-Axis Vertical Bump Reduction + 3-Axis Gimbal', focusing: 'LiDAR Automated Waveform Focus',
      weight: '4.67 kg (Full Setup)', wirelessVideo: '4K 60fps 20,000ft Range Transmitter',
    },
  },

  // ── FURNITURE / EVENT ─────────────────────────────────────────────────────
  {
    name: 'VIP Leather Executive Lounge Armchair Set', slug: 'vip-leather-lounge-set',
    description: 'Set of 4 premium black Italian leather executive armchairs with chrome legs for VIP green rooms.',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    productType: 'furniture', category: 'Furniture', brand: 'LeaseStyle Studio', sku: 'FURN-VIP-ARMCHAIR-4', condition: 'EXCELLENT',
    totalStock: 5, availableStock: 5, dailyRate: 1800, weeklyRate: 11340, monthlyRate: 37800, baseDepositAmt: 5000, depositIsPercent: false,
    accessoryList: ['Armchair Covers ×4', 'Matching Coffee Table'],
    tags: ['furniture', 'vip', 'lounge', 'greenroom', 'leather', 'armchair'],
    specifications: {
      dimensions: '85cm × 80cm × 75cm per chair', material: 'Top-Grain Italian Leather & Steel',
      weightCapacity: '150 kg per seat', ratingEnv: 'Indoor Use Only',
      seatingCount: '4 Chairs + 1 Table', colorFinish: 'Matte Obsidian Black',
    },
  },
]

async function seed() {
  console.log('🌱 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected\n')

  await Promise.all([
    User.deleteMany({}), Product.deleteMany({}),
    Order.deleteMany({}), Quotation.deleteMany({}),
  ])
  console.log('🗑  Cleared existing data\n')

  // Create Users & Admins
  const userMap: Record<string, any> = {}
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10)
    const doc = await User.create({ ...u, password: undefined, passwordHash: hashed })
    userMap[u.email] = doc
    console.log(`👤  [${u.role.padEnd(11)}] ${u.email} (${u.name})`)
  }
  console.log()

  // Create Products
  const createdProducts: any[] = []
  for (const p of PRODUCTS) {
    const prod = await Product.create(p)
    createdProducts.push(prod)
    console.log(`📦  [${p.productType.padEnd(9)}] ${p.name} — ₹${p.dailyRate}/day`)
  }
  console.log()

  // Create Seeded Orders for Customers
  const aryanUser = userMap['user@lease360.ai']
  const priyaUser = userMap['priya@lease360.ai']
  const fortuner  = createdProducts.find(p => p.sku === 'VEH-TOY-FOR-001')
  const sony      = createdProducts.find(p => p.sku === 'CAM-SONY-A7III')
  const sigma     = createdProducts.find(p => p.sku === 'LENS-SIGMA-2470')

  const order1 = await Order.create({
    orderNumber: 'ORD-20260808-8829',
    userId: aryanUser._id,
    status: 'CONFIRMED',
    deliveryMode: 'SHIPPING',
    items: [
      { productId: fortuner._id, productName: fortuner.name, productImage: fortuner.imageUrl, rentalPeriodLabel: '3 day(s)', quantity: 1, unitPrice: 4500, lineTotal: 13500 },
    ],
    subTotal: 13500, depositAmount: 15000, totalAmount: 28500,
    rentalStart: new Date(),
    rentalEnd: new Date(Date.now() + 3 * 86400000),
    deposit: {
      amount: 15000, status: 'HELD', refundedAmount: 0, deductedAmount: 0,
      transactions: [{ type: 'HOLD', amount: 15000, note: 'Deposit held on order confirmation', createdAt: new Date() }],
    },
  })

  const order2 = await Order.create({
    orderNumber: 'ORD-20260808-9901',
    userId: priyaUser._id,
    status: 'PICKED_UP',
    deliveryMode: 'STORE_PICKUP',
    items: [
      { productId: sony._id, productName: sony.name, productImage: sony.imageUrl, rentalPeriodLabel: '7 day(s) · 10% off', quantity: 1, unitPrice: 1350, lineTotal: 9450 },
      { productId: sigma._id, productName: sigma.name, productImage: sigma.imageUrl, rentalPeriodLabel: '7 day(s) · 10% off', quantity: 1, unitPrice: 810, lineTotal: 5670 },
    ],
    subTotal: 15120, depositAmount: 7500, totalAmount: 22620,
    rentalStart: new Date(Date.now() - 2 * 86400000),
    rentalEnd: new Date(Date.now() + 5 * 86400000),
    deposit: {
      amount: 7500, status: 'HELD', refundedAmount: 0, deductedAmount: 0,
      transactions: [{ type: 'HOLD', amount: 7500, note: 'Deposit held on pickup', createdAt: new Date() }],
    },
  })

  console.log(`🛒  Created Sample Orders: ${order1.orderNumber}, ${order2.orderNumber}`)

  console.log('\n' + '─'.repeat(60))
  console.log('✅  Multi-Admin & Product Domain Seed Complete!')
  console.log('\n🔑  Admin Logins:')
  console.log('   Super Admin:   admin@lease360.ai        / admin123')
  console.log('   Camera Admin:  admin.camera@lease360.ai / admin123')
  console.log('   Vehicle Admin: admin.vehicle@lease360.ai/ admin123')
  console.log('   Event Admin:   admin.event@lease360.ai  / admin123')
  console.log('\n👤  Customer Logins:')
  console.log('   Aryan: user@lease360.ai  / user123')
  console.log('   Priya: priya@lease360.ai / user123')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('❌ Seed error:', err)
  process.exit(1)
})
