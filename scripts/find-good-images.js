const https = require('https');

// Candidates for each product category / specific item
const candidates = {
  'CAM-SONY-A7III': [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=800&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?w=800&q=80'
  ],
  'CAM-RED-KOMODO6K': [
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80', // video camera filming
    'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&q=80', // movie camera
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80', // cinema operator
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80'  // cinema camera setup
  ],
  'CAM-SONY-FX6': [
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80',
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80',
    'https://images.unsplash.com/photo-1533561052604-c3beb6d55b8d?w=800&q=80'
  ],
  'CAM-CANON-C300M3': [
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80',
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80'
  ],
  'LENS-SIGMA-2470': [
    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80',
    'https://images.unsplash.com/photo-1606986628470-3882f09919f2?w=800&q=80'
  ],
  'LENS-SONY-70200-GM2': [
    'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=800&q=80',
    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80'
  ],
  'LENS-CANON-50-F12': [
    'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'
  ],
  'LIGHT-APUT-600D': [
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    'https://images.unsplash.com/photo-1527066579998-dbbae57f45ce?w=800&q=80' // studio lighting
  ],
  'LIGHT-ARRI-SKYPANEL-S60C': [
    'https://images.unsplash.com/photo-1533683013754-9d4bc1d4a5e6?w=800&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    'https://images.unsplash.com/photo-1527066579998-dbbae57f45ce?w=800&q=80'
  ],
  'LIGHT-NAN-PAVO30C-4K': [
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80'
  ],
  'AUD-SENN-MKH416': [
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80'
  ],
  'AUD-SD-833-REC': [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80'
  ],
  'VEH-TOY-FOR-001': [
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80'
  ],
  'VEH-MAH-THAR-4X4': [
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80'
  ],
  'VEH-MB-VCLASS-VIP': [
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80'
  ],
  'VEH-BMW-X5-MSPORT': [
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80'
  ],
  'DRONE-DJI-INSPIRE3-8K': [
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80',
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80'
  ],
  'GIMBAL-DJI-RONIN4D-6K': [
    'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&q=80', // movie camera gimbal/rig
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80', // cinema setup
    'https://images.unsplash.com/photo-1533561052604-c3beb6d55b8d?w=800&q=80'
  ],
  'FURN-VIP-ARMCHAIR-4': [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80'
  ]
};

async function check() {
  for (const [sku, urls] of Object.entries(candidates)) {
    for (const u of urls) {
      await new Promise(resolve => {
        https.get(u, res => {
          console.log(`[${res.statusCode}] ${sku} -> ${u}`);
          resolve();
        }).on('error', err => {
          console.log(`[ERR] ${sku} -> ${err.message}`);
          resolve();
        });
      });
    }
  }
}

check();
