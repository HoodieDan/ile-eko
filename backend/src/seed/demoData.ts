import type { PaymentFrequency, PropertyType } from '../contracts';

export interface DemoImage {
  id: string;
  url: string;
  sourcePage: string;
  credit: string;
}

const unsplash = (photo: string) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1600&q=82`;

/**
 * Free Unsplash images used only by the screenshot/demo dataset. Source pages
 * are retained alongside delivery URLs so the fixtures remain auditable.
 */
export const DEMO_IMAGES: DemoImage[] = [
  {
    id: 'exterior-concrete-balconies',
    url: unsplash('photo-1768638687896-35bde623d532'),
    sourcePage: 'https://unsplash.com/photos/1iGG6k4Ci4E',
    credit: 'Maximilian Bungart',
  },
  {
    id: 'exterior-green-balconies',
    url: unsplash('photo-1781156210502-8fa724f3f64c'),
    sourcePage: 'https://unsplash.com/photos/FO7uEVpFdzE',
    credit: 'Declan Sun',
  },
  {
    id: 'exterior-white-balconies',
    url: unsplash('photo-1759277700809-2b544c0f4261'),
    sourcePage: 'https://unsplash.com/photos/IVa6IO000Rw',
    credit: 'Sebastian Schuster',
  },
  {
    id: 'exterior-warm-landscaping',
    url: unsplash('photo-1785620656294-b5effc2ed3bf'),
    sourcePage: 'https://unsplash.com/photos/xN5EFDDBwnQ',
    credit: 'Ibrahim Syed',
  },
  {
    id: 'exterior-dusk',
    url: unsplash('photo-1757780993465-7f1923296763'),
    sourcePage: 'https://unsplash.com/photos/h88Wet8W2hM',
    credit: 'Baruk Granda',
  },
  {
    id: 'exterior-window-balconies',
    url: unsplash('photo-1757970326337-95d7cca56fa1'),
    sourcePage: 'https://unsplash.com/photos/3fPZoXU1zH4',
    credit: 'Sebastian Schuster',
  },
  {
    id: 'exterior-residential-block',
    url: unsplash('photo-1782743273511-fb7300c84088'),
    sourcePage: 'https://unsplash.com/photos/V8v6D2GdbWo',
    credit: 'Jordan Heinz',
  },
  {
    id: 'exterior-red-white',
    url: unsplash('photo-1658612231940-5e1199c45d38'),
    sourcePage: 'https://unsplash.com/photos/BmBck9hFUac',
    credit: 'Pierre Moret',
  },
  {
    id: 'interior-neutral-living',
    url: unsplash('photo-1771888703723-01d85da1dae1'),
    sourcePage: 'https://unsplash.com/photos/e0oJLc5FYsg',
    credit: 'GoodLifeConstruction',
  },
  {
    id: 'interior-green-kitchen',
    url: unsplash('photo-1771287490662-8ea64674ba8a'),
    sourcePage: 'https://unsplash.com/photos/d7R2wHOWRyE',
    credit: 'Franco Debartolo',
  },
  {
    id: 'interior-window-living',
    url: unsplash('photo-1773754532196-014342510e64'),
    sourcePage: 'https://unsplash.com/photos/FL-ZcDK8tMo',
    credit: 'Clay Banks',
  },
  {
    id: 'interior-island-kitchen',
    url: unsplash('photo-1770135878277-73e589248b43'),
    sourcePage: 'https://unsplash.com/photos/J77Yzq9_Hcg',
    credit: 'Clay Banks',
  },
  {
    id: 'interior-wood-kitchen',
    url: unsplash('photo-1761656630581-69a58e4e1c09'),
    sourcePage: 'https://unsplash.com/photos/htmZWzApbJE',
    credit: 'Clay Banks',
  },
  {
    id: 'interior-wheat-living',
    url: unsplash('photo-1767720580810-58be50f89bf8'),
    sourcePage: 'https://unsplash.com/photos/j_S8cdk7yK8',
    credit: 'Abaddy Ghanem',
  },
  {
    id: 'interior-white-kitchen',
    url: unsplash('photo-1770063817031-f3b98dff347f'),
    sourcePage: 'https://unsplash.com/photos/j1XuL3mwi8U',
    credit: 'Clay Banks',
  },
  {
    id: 'interior-blue-bedroom',
    url: unsplash('photo-1772475385404-c39328ea8817'),
    sourcePage: 'https://unsplash.com/photos/pOt4jLzhr8Y',
    credit: 'Caroline Badran',
  },
];

const imageUrls = (...indexes: number[]) => indexes.map((i) => DEMO_IMAGES[i]!.url);

export interface DemoPropertySpec {
  key: string;
  propertyTitle: string;
  address: string;
  area: string;
  lga: string;
  propertyType: PropertyType;
  description: string;
  rentAmount: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  amenities: string[];
  images: string[];
  hasUnits?: boolean;
  listed?: boolean;
  verified?: boolean;
}

export const DEMO_PROPERTIES: DemoPropertySpec[] = [
  {
    key: 'yaba-studio',
    propertyTitle: 'Yaba Studio',
    address: '22 Herbert Macaulay Way',
    area: 'Yaba',
    lga: 'Lagos Mainland',
    propertyType: 'self-contained',
    description: 'A compact, fibre-ready studio close to major transport links and everyday shops.',
    rentAmount: 900_000,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 42,
    amenities: ['water', 'security', 'wifi', 'kitchen'],
    images: imageUrls(0, 8, 9),
  },
  {
    key: 'lekki-mini-flat',
    propertyTitle: 'Lekki Phase 1 Mini-flat',
    address: '8 Admiralty Way',
    area: 'Lekki',
    lga: 'Eti-Osa',
    propertyType: 'mini-flat',
    description:
      'Bright mini-flat with a fitted kitchen, secure parking and dependable water supply.',
    rentAmount: 2_400_000,
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 58,
    amenities: ['water', 'parking', 'security', 'kitchen'],
    images: imageUrls(3, 10, 11),
    listed: true,
    verified: true,
  },
  {
    key: 'yaba-budget-two-bed',
    propertyTitle: 'Yaba Budget Two-Bed',
    address: '14 Hughes Avenue',
    area: 'Yaba',
    lga: 'Lagos Mainland',
    propertyType: 'two-bedroom',
    description:
      'A practical two-bedroom flat with good water and easy access to the university district.',
    rentAmount: 950_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 76,
    amenities: ['water', 'security', 'kitchen'],
    images: imageUrls(7, 8, 14),
    listed: true,
    verified: true,
  },
  {
    key: 'yaba-riverside-flat',
    propertyTitle: 'Yaba Riverside Flat',
    address: '6 Commercial Avenue',
    area: 'Yaba',
    lga: 'Lagos Mainland',
    propertyType: 'two-bedroom',
    description: 'Airy upstairs flat with two en-suite rooms, fitted storage and gated parking.',
    rentAmount: 1_650_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 91,
    amenities: ['water', 'parking', 'security', 'kitchen'],
    images: imageUrls(1, 13, 9),
    listed: true,
  },
  {
    key: 'ikeja-garden-apartment',
    propertyTitle: 'Ikeja Garden Apartment',
    address: '17 Opebi Road',
    area: 'Ikeja',
    lga: 'Ikeja',
    propertyType: 'two-bedroom',
    description:
      'Well-kept apartment in a quiet compound with a generator house and resident security.',
    rentAmount: 1_800_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 88,
    amenities: ['water', 'parking', 'security', 'generator'],
    images: imageUrls(6, 8, 12),
  },
  {
    key: 'surulere-family-flat',
    propertyTitle: 'Surulere Family Flat',
    address: '31 Adeniran Ogunsanya Street',
    area: 'Surulere',
    lga: 'Surulere',
    propertyType: 'three-bedroom',
    description: 'Spacious family flat near schools, shops and reliable public transport.',
    rentAmount: 1_600_000,
    bedrooms: 3,
    bathrooms: 3,
    sizeSqm: 126,
    amenities: ['water', 'parking', 'security'],
    images: imageUrls(5, 10, 15),
  },
  {
    key: 'lekki-palm-residence',
    propertyTitle: 'Lekki Palm Residence',
    address: '12 Fola Osibo Street',
    area: 'Lekki',
    lga: 'Eti-Osa',
    propertyType: 'three-bedroom',
    description:
      'Contemporary three-bedroom home with a fitted kitchen, balcony and controlled access.',
    rentAmount: 2_800_000,
    bedrooms: 3,
    bathrooms: 3,
    sizeSqm: 142,
    amenities: ['water', 'parking', 'security', 'kitchen', 'generator'],
    images: imageUrls(4, 10, 11),
  },
  {
    key: 'ajah-waterfront-duplex',
    propertyTitle: 'Ajah Waterfront Duplex',
    address: '5 Badore Road',
    area: 'Ajah',
    lga: 'Eti-Osa',
    propertyType: 'duplex',
    description: 'Generous duplex with a private compound, family lounge and ample parking.',
    rentAmount: 3_600_000,
    bedrooms: 4,
    bathrooms: 5,
    sizeSqm: 230,
    amenities: ['water', 'parking', 'security', 'kitchen', 'generator'],
    images: imageUrls(3, 8, 15),
    listed: true,
    verified: true,
  },
  {
    key: 'gbagada-terrace',
    propertyTitle: 'Gbagada Terrace',
    address: '19 Diya Street',
    area: 'Gbagada',
    lga: 'Kosofe',
    propertyType: 'three-bedroom',
    description:
      'Clean three-bedroom terrace in a gated close with good road access and steady water.',
    rentAmount: 2_750_000,
    bedrooms: 3,
    bathrooms: 4,
    sizeSqm: 158,
    amenities: ['water', 'parking', 'security', 'kitchen'],
    images: imageUrls(2, 13, 14),
    listed: true,
    verified: true,
  },
  {
    key: 'maryland-courtyard',
    propertyTitle: 'Maryland Courtyard Apartment',
    address: '9 Ajao Road',
    area: 'Maryland',
    lga: 'Ikeja',
    propertyType: 'two-bedroom',
    description: 'Tasteful apartment with cross ventilation, fitted wardrobes and secure parking.',
    rentAmount: 2_200_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 96,
    amenities: ['water', 'parking', 'security', 'kitchen'],
    images: imageUrls(0, 8, 12),
    listed: true,
  },
  {
    key: 'ikoyi-executive',
    propertyTitle: 'Ikoyi Executive Apartment',
    address: '24 Bourdillon Road',
    area: 'Ikoyi',
    lga: 'Eti-Osa',
    propertyType: 'three-bedroom',
    description:
      'Premium serviced apartment with generous rooms, lift access and round-the-clock security.',
    rentAmount: 7_500_000,
    bedrooms: 3,
    bathrooms: 4,
    sizeSqm: 190,
    amenities: ['water', 'parking', 'security', 'power', 'kitchen'],
    images: imageUrls(1, 10, 11),
    listed: true,
    verified: true,
  },
  {
    key: 'vi-city-flat',
    propertyTitle: 'Victoria Island City Flat',
    address: '7 Akin Adesola Street',
    area: 'Victoria Island',
    lga: 'Eti-Osa',
    propertyType: 'two-bedroom',
    description:
      'Central city apartment with modern finishes, secure access and a bright living room.',
    rentAmount: 5_200_000,
    bedrooms: 2,
    bathrooms: 3,
    sizeSqm: 132,
    amenities: ['water', 'parking', 'security', 'power', 'kitchen'],
    images: imageUrls(4, 13, 14),
    listed: true,
    verified: true,
  },
  {
    key: 'magodo-family-duplex',
    propertyTitle: 'Magodo Family Duplex',
    address: '18 Emmanuel Keshi Street',
    area: 'Magodo',
    lga: 'Kosofe',
    propertyType: 'duplex',
    description: 'Detached family duplex with a study, boys’ quarters and a landscaped compound.',
    rentAmount: 5_800_000,
    bedrooms: 4,
    bathrooms: 5,
    sizeSqm: 255,
    amenities: ['water', 'parking', 'security', 'kitchen', 'generator'],
    images: imageUrls(6, 8, 15),
    listed: true,
  },
  {
    key: 'sangotedo-garden-flat',
    propertyTitle: 'Sangotedo Garden Flat',
    address: '11 Monastery Road',
    area: 'Sangotedo',
    lga: 'Eti-Osa',
    propertyType: 'two-bedroom',
    description: 'Newly finished flat in a calm estate with parking, water and resident security.',
    rentAmount: 1_500_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 84,
    amenities: ['water', 'parking', 'security', 'kitchen'],
    images: imageUrls(7, 10, 12),
    listed: true,
  },
  {
    key: 'festac-family-apartment',
    propertyTitle: 'Festac Family Apartment',
    address: '21 Road, Festac Town',
    area: 'Festac',
    lga: 'Amuwo-Odofin',
    propertyType: 'three-bedroom',
    description:
      'Comfortable family apartment with large rooms and quick access to neighbourhood services.',
    rentAmount: 1_850_000,
    bedrooms: 3,
    bathrooms: 2,
    sizeSqm: 118,
    amenities: ['water', 'parking', 'security'],
    images: imageUrls(5, 13, 9),
    listed: true,
  },
  {
    key: 'herbert-macaulay-court',
    propertyTitle: 'Herbert Macaulay Court',
    address: '44 Herbert Macaulay Way',
    area: 'Yaba',
    lga: 'Lagos Mainland',
    propertyType: 'two-bedroom',
    description: 'Four-unit residential block with secure entry, parking and reliable water.',
    rentAmount: 1_800_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 90,
    amenities: ['water', 'parking', 'security', 'kitchen'],
    images: imageUrls(2, 8, 11),
    hasUnits: true,
  },
];

export interface DemoUnitSpec {
  propertyKey: string;
  label: string;
  floor: number;
  rentAmount: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  images: string[];
}

export const DEMO_UNITS: DemoUnitSpec[] = [
  {
    propertyKey: 'herbert-macaulay-court',
    label: 'A1',
    floor: 0,
    rentAmount: 1_750_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 88,
    images: imageUrls(2, 8, 9),
  },
  {
    propertyKey: 'herbert-macaulay-court',
    label: 'A2',
    floor: 0,
    rentAmount: 1_800_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 90,
    images: imageUrls(0, 13, 14),
  },
  {
    propertyKey: 'herbert-macaulay-court',
    label: 'B1',
    floor: 1,
    rentAmount: 1_850_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 92,
    images: imageUrls(1, 10, 12),
  },
  {
    propertyKey: 'herbert-macaulay-court',
    label: 'B2',
    floor: 1,
    rentAmount: 1_900_000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 94,
    images: imageUrls(3, 11, 15),
  },
];

export interface DemoTenantSpec {
  key: string;
  tenantName: string;
  phoneNumber: string;
  email: string;
  notes: string;
  marketplaceAccount?: boolean;
}

export const DEMO_TENANTS: DemoTenantSpec[] = [
  {
    key: 'chinedu',
    tenantName: 'Chinedu Okeke',
    phoneNumber: '+2348012345678',
    email: 'chinedu@example.com',
    notes: 'Prefers reminders by WhatsApp.',
  },
  {
    key: 'amina',
    tenantName: 'Amina Yusuf',
    phoneNumber: '+2348031154421',
    email: 'amina.yusuf@example.com',
    notes: 'Quarterly payment arrangement.',
  },
  {
    key: 'tunde',
    tenantName: 'Tunde Balogun',
    phoneNumber: '+2348062219084',
    email: 'tunde.balogun@example.com',
    notes: 'Part payment received; balance promised before due date.',
  },
  {
    key: 'ngozi',
    tenantName: 'Ngozi Eze',
    phoneNumber: '+2348094402376',
    email: 'ngozi.eze@example.com',
    notes: 'Pays by bank transfer.',
  },
  {
    key: 'bola',
    tenantName: 'Bola Adeyemi',
    phoneNumber: '+2348026703188',
    email: 'bola.adeyemi@example.com',
    notes: 'Rent due within the next month.',
  },
  {
    key: 'samuel',
    tenantName: 'Samuel Udo',
    phoneNumber: '+2348071195502',
    email: 'samuel.udo@example.com',
    notes: 'Long-term tenant; payments up to date.',
  },
  {
    key: 'kemi',
    tenantName: 'Kemi Adebayo',
    phoneNumber: '+2348059021447',
    email: 'tenant@example.com',
    notes: 'Marketplace account linked; currently searching for a new home.',
    marketplaceAccount: true,
  },
];

export interface DemoLeaseSpec {
  tenantKey: string;
  propertyKey: string;
  unitLabel?: string;
  startDate: string;
  endDate: string;
  billingAmount: number;
  schedule: PaymentFrequency;
  paymentAmount?: number;
  paymentDate?: string;
}

export const DEMO_LEASES: DemoLeaseSpec[] = [
  {
    tenantKey: 'chinedu',
    propertyKey: 'yaba-studio',
    startDate: '2026-01-01',
    endDate: '2027-01-01',
    billingAmount: 900_000,
    schedule: 'annual',
  },
  {
    tenantKey: 'amina',
    propertyKey: 'surulere-family-flat',
    startDate: '2026-01-01',
    endDate: '2027-01-01',
    billingAmount: 400_000,
    schedule: 'quarterly',
  },
  {
    tenantKey: 'tunde',
    propertyKey: 'ikeja-garden-apartment',
    startDate: '2026-09-01',
    endDate: '2027-09-01',
    billingAmount: 1_800_000,
    schedule: 'annual',
    paymentAmount: 900_000,
    paymentDate: '2026-08-20',
  },
  {
    tenantKey: 'ngozi',
    propertyKey: 'lekki-palm-residence',
    startDate: '2026-03-01',
    endDate: '2027-03-01',
    billingAmount: 2_800_000,
    schedule: 'annual',
    paymentAmount: 2_800_000,
    paymentDate: '2026-03-01',
  },
  {
    tenantKey: 'bola',
    propertyKey: 'herbert-macaulay-court',
    unitLabel: 'A1',
    startDate: '2026-09-15',
    endDate: '2027-09-15',
    billingAmount: 1_750_000,
    schedule: 'annual',
  },
  {
    tenantKey: 'samuel',
    propertyKey: 'herbert-macaulay-court',
    unitLabel: 'B2',
    startDate: '2026-01-01',
    endDate: '2027-01-01',
    billingAmount: 1_900_000,
    schedule: 'annual',
    paymentAmount: 1_900_000,
    paymentDate: '2026-01-02',
  },
];
