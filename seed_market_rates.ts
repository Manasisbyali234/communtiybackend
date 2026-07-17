import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CROPS = [
  {
    name: 'Coffee',
    markets: [
      { market: 'Chikmagalur APMC', district: 'Chikmagalur', state: 'Karnataka', variety: 'Arabica', grade: 'A', base: 18000 },
      { market: 'Hassan APMC', district: 'Hassan', state: 'Karnataka', variety: 'Robusta', grade: 'FAQ', base: 15000 },
      { market: 'Kodagu APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Arabica', grade: 'B', base: 17500 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Robusta', grade: 'FAQ', base: 16800 },
      { market: 'Virajpet APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Arabica', grade: 'A', base: 17200 },
    ],
  },
  {
    name: 'Black Pepper',
    markets: [
      { market: 'Wayanad APMC', district: 'Wayanad', state: 'Kerala', variety: 'Malabar', grade: 'FAQ', base: 45000 },
      { market: 'Kozhikode APMC', district: 'Kozhikode', state: 'Kerala', variety: 'Malabar', grade: 'A', base: 46000 },
      { market: 'Kodagu APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Coorg', grade: 'FAQ', base: 44000 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Coorg', grade: 'A', base: 43500 },
      { market: 'Virajpet APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Coorg', grade: 'FAQ', base: 43000 },
    ],
  },
  {
    name: 'Cardamom',
    markets: [
      { market: 'Idukki APMC', district: 'Idukki', state: 'Kerala', variety: 'Green', grade: 'Bold', base: 120000 },
      { market: 'Spices Board Bodinayakanur', district: 'Theni', state: 'Tamil Nadu', variety: 'Green', grade: 'FAQ', base: 115000 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Green', grade: 'FAQ', base: 112000 },
    ],
  },
  {
    name: 'Arecanut',
    markets: [
      { market: 'Shimoga APMC', district: 'Shimoga', state: 'Karnataka', variety: 'Rashi', grade: 'FAQ', base: 42000 },
      { market: 'Sirsi APMC', district: 'Uttara Kannada', state: 'Karnataka', variety: 'Rashi', grade: 'A', base: 43500 },
      { market: 'Mangalore APMC', district: 'Dakshina Kannada', state: 'Karnataka', variety: 'Chali', grade: 'FAQ', base: 40000 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Rashi', grade: 'FAQ', base: 41000 },
      { market: 'Virajpet APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Chali', grade: 'FAQ', base: 40500 },
    ],
  },
  {
    name: 'Coconut',
    markets: [
      { market: 'Tumkur APMC', district: 'Tumkur', state: 'Karnataka', variety: 'Tall', grade: 'FAQ', base: 2800 },
      { market: 'Mandya APMC', district: 'Mandya', state: 'Karnataka', variety: 'Hybrid', grade: 'A', base: 3000 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Tall', grade: 'FAQ', base: 2900 },
    ],
  },
  {
    name: 'Paddy (Rice)',
    markets: [
      { market: 'Mandya APMC', district: 'Mandya', state: 'Karnataka', variety: 'Sona Masuri', grade: 'FAQ', base: 2200 },
      { market: 'Mysuru APMC', district: 'Mysuru', state: 'Karnataka', variety: 'BPT', grade: 'FAQ', base: 2100 },
      { market: 'Hassan APMC', district: 'Hassan', state: 'Karnataka', variety: 'Sona Masuri', grade: 'A', base: 2300 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Sona Masuri', grade: 'FAQ', base: 2150 },
    ],
  },
  {
    name: 'Banana',
    markets: [
      { market: 'Davangere APMC', district: 'Davangere', state: 'Karnataka', variety: 'Robusta', grade: 'A', base: 1800 },
      { market: 'Hubli APMC', district: 'Dharwad', state: 'Karnataka', variety: 'Nendran', grade: 'FAQ', base: 2200 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Nendran', grade: 'A', base: 2100 },
      { market: 'Virajpet APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Robusta', grade: 'FAQ', base: 1900 },
    ],
  },
  {
    name: 'Mango',
    markets: [
      { market: 'Ramanagara APMC', district: 'Ramanagara', state: 'Karnataka', variety: 'Alphonso', grade: 'A', base: 8000 },
      { market: 'Kolar APMC', district: 'Kolar', state: 'Karnataka', variety: 'Totapuri', grade: 'FAQ', base: 5000 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Totapuri', grade: 'FAQ', base: 5200 },
    ],
  },
  {
    name: 'Tea',
    markets: [
      { market: 'Coonoor APMC', district: 'Nilgiris', state: 'Tamil Nadu', variety: 'CTC', grade: 'BOP', base: 180 },
      { market: 'Munnar APMC', district: 'Idukki', state: 'Kerala', variety: 'Orthodox', grade: 'FBOP', base: 220 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'CTC', grade: 'BOP', base: 175 },
    ],
  },
  {
    name: 'Vanilla',
    markets: [
      { market: 'Thrissur APMC', district: 'Thrissur', state: 'Kerala', variety: 'Planifolia', grade: 'A', base: 40000 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Planifolia', grade: 'A', base: 38000 },
    ],
  },
  {
    name: 'Cinnamon',
    markets: [
      { market: 'Kottayam APMC', district: 'Kottayam', state: 'Kerala', variety: 'True', grade: 'FAQ', base: 25000 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'True', grade: 'FAQ', base: 24000 },
    ],
  },
  {
    name: 'Orange',
    markets: [
      { market: 'Nagpur APMC', district: 'Nagpur', state: 'Maharashtra', variety: 'Nagpuri', grade: 'A', base: 4500 },
      { market: 'Coorg APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Coorg', grade: 'FAQ', base: 3800 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Coorg', grade: 'A', base: 4000 },
      { market: 'Virajpet APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Coorg', grade: 'FAQ', base: 3700 },
    ],
  },
  {
    name: 'Jackfruit',
    markets: [
      { market: 'Mangalore APMC', district: 'Dakshina Kannada', state: 'Karnataka', variety: 'Local', grade: 'FAQ', base: 1500 },
      { market: 'Udupi APMC', district: 'Udupi', state: 'Karnataka', variety: 'Local', grade: 'A', base: 1800 },
      { market: 'Madikeri APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Local', grade: 'FAQ', base: 1600 },
      { market: 'Virajpet APMC', district: 'Kodagu', state: 'Karnataka', variety: 'Local', grade: 'A', base: 1700 },
    ],
  },
];

// Generate a price with ±5% daily variation
function vary(base: number, dayOffset: number, marketIndex: number): { min: number; modal: number; max: number } {
  const seed = (dayOffset * 7 + marketIndex * 3) % 10;
  const factor = 1 + (seed - 5) * 0.01; // ±5%
  const modal = Math.round(base * factor);
  const min = Math.round(modal * 0.95);
  const max = Math.round(modal * 1.05);
  return { min, modal, max };
}

async function main() {
  console.log('🌱 Seeding market rates for 7 days...');

  // Delete existing market rates
  await prisma.marketRate.deleteMany();

  const records: any[] = [];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - dayOffset);

    for (const crop of CROPS) {
      crop.markets.forEach((m, mi) => {
        const { min, modal, max } = vary(m.base, dayOffset, mi);
        records.push({
          cropName: crop.name,
          marketName: m.market,
          district: m.district,
          state: m.state,
          arrivalDate: date,
          variety: m.variety,
          grade: m.grade,
          minPrice: min,
          modalPrice: modal,
          maxPrice: max,
        });
      });
    }
  }

  await prisma.marketRate.createMany({ data: records });

  console.log(`✅ Inserted ${records.length} market rate records across 7 days for ${CROPS.length} crops.`);
}

main()
  .catch((e) => { console.error('❌ Failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
