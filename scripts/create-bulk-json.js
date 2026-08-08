const fs = require('fs');

const laptopBrands = ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer'];
const laptopModels = ['Inspiron', 'Pavilion', 'ThinkPad', 'VivoBook', 'Aspire', 'Latitude'];
const cameraBrands = ['Sony', 'Canon', 'Nikon', 'Fujifilm', 'Panasonic'];
const cameraTypes = ['Mirrorless Camera', 'DSLR Camera', 'Prime Lens', 'Zoom Lens', 'Tripod', 'Gimbal', 'LED Light', 'Camera Monitor'];

const products = [];

// 50 Laptops (Matches user's exact JSON pattern)
for (let i = 1; i <= 50; i++) {
  const brand = laptopBrands[(i - 1) % laptopBrands.length];
  const model = laptopModels[(i - 1) % laptopModels.length];
  const condition = (i % 3 === 1) ? 'Excellent' : (i % 3 === 2) ? 'Like New' : 'Good';
  const ram = (i % 3 === 1) ? '8GB' : (i % 3 === 2) ? '16GB' : '32GB';
  const baseDeposit = ( (i % 10 === 0 ? 10 : i % 10) ) * 500;

  products.push({
    name: `${brand} ${model} Laptop ${i}`,
    slug: `${brand.toLowerCase()}-${model.toLowerCase()}-laptop-${i}`,
    description: `Rental-ready ${model.toLowerCase()} laptop from ${brand}, suitable for temporary use, events, offices, homes and professional requirements.`,
    imageUrl: `https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80`,
    category: "Electronics",
    productType: "other",
    brand: brand,
    sku: `E-${String(i).padStart(3, '0')}`,
    totalStock: (i % 10) + 2,
    availableStock: (i % 10) + 2,
    dailyRate: Math.round(baseDeposit * 0.4),
    weeklyRate: Math.round(baseDeposit * 0.4 * 7 * 0.9),
    monthlyRate: Math.round(baseDeposit * 0.4 * 30 * 0.7),
    baseDepositAmt: baseDeposit,
    depositIsPercent: false,
    accessoryList: ["User Manual", "Power Cable", "Laptop Bag"],
    isPublished: true,
    variants: [
      { attribute: "Condition", value: condition },
      { attribute: "RAM", value: ram }
    ]
  });
}

// 20 Cameras & Audio/Lighting Gear (Matches user's second block)
for (let i = 1; i <= 20; i++) {
  const brand = cameraBrands[(i - 1) % cameraBrands.length];
  const type = cameraTypes[(i - 1) % cameraTypes.length];
  const condition = (i % 3 === 1) ? 'Excellent' : (i % 3 === 2) ? 'Like New' : 'Good';
  const baseDeposit = ( (i % 10 === 0 ? 10 : i % 10) ) * 500;
  let pType = 'camera';
  if (type.includes('Lens')) pType = 'lens';
  if (type.includes('Light')) pType = 'lighting';
  if (type.includes('Monitor')) pType = 'monitor';
  if (type.includes('Tripod') || type.includes('Gimbal')) pType = 'support';

  products.push({
    name: `${brand} ${type} ${i}`,
    slug: `${brand.toLowerCase()}-${type.toLowerCase().replace(/\s+/g, '-')}-${i}`,
    description: `Rental-ready ${type.toLowerCase()} from ${brand}, suitable for temporary use, events, productions and professional requirements.`,
    imageUrl: `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80`,
    category: "Cameras & Photography",
    productType: pType,
    brand: brand,
    sku: `CP-${String(i).padStart(3, '0')}`,
    totalStock: (i % 5) + 2,
    availableStock: (i % 5) + 2,
    dailyRate: Math.round(baseDeposit * 0.5),
    weeklyRate: Math.round(baseDeposit * 0.5 * 7 * 0.9),
    monthlyRate: Math.round(baseDeposit * 0.5 * 30 * 0.7),
    baseDepositAmt: baseDeposit,
    depositIsPercent: false,
    accessoryList: ["User Manual", "Power Adapter", "Padded Case"],
    isPublished: true,
    variants: [
      { attribute: "Condition", value: condition }
    ]
  });
}

fs.writeFileSync('/Users/sayansenapati/Desktop/Dev/Hackathon/odoo-final/scripts/bulk-data.json', JSON.stringify(products, null, 2));
console.log(`Generated ${products.length} bulk products in scripts/bulk-data.json`);
