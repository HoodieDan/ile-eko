/**
 * Ilé Èkó Homes — tenant marketplace mock data (vacant listings only), ported
 * from the design prototype's homes/data.js. Pure data + helpers; no React.
 * Screens import via `@/data/mock`.
 */
import type { IconName } from '@ile-eko/ui';

export const naira = (n: number): string => '₦' + n.toLocaleString('en-NG');
export const nairaShort = (n: number): string => {
  if (n >= 1e6) return '₦' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + 'M';
  if (n >= 1e3) return '₦' + Math.round(n / 1e3) + 'k';
  return '₦' + n;
};

export type AmenityKey = 'water' | 'power' | 'security' | 'parking' | 'furnished' | 'kitchen' | 'wifi';

export const AM: Record<AmenityKey, { ic: IconName; label: string }> = {
  water: { ic: 'droplet', label: 'Borehole / water' },
  power: { ic: 'bolt', label: '24/7 power' },
  security: { ic: 'shield', label: 'Security' },
  parking: { ic: 'car', label: 'Parking' },
  furnished: { ic: 'sofa', label: 'Furnished' },
  kitchen: { ic: 'home', label: 'Fitted kitchen' },
  wifi: { ic: 'wifi', label: 'Wi-Fi ready' },
};

export interface Listing {
  id: string;
  title: string;
  area: string;
  lga: string;
  rent: number;
  beds: number;
  baths: number;
  size: number;
  type: string;
  tone: number;
  landlord: string;
  verified: boolean;
  recommended: boolean;
  postedAgo: string;
  views: number;
  amenities: AmenityKey[];
  desc: string;
}

export const listings: Listing[] = [
  { id: 'l1', title: 'Renovated 3-bedroom flat', area: 'Gbagada', lga: 'Kosofe', rent: 950000, beds: 3, baths: 3, size: 120, type: 'Flat', tone: 88, landlord: 'Adeola Balogun', verified: true, recommended: true, postedAgo: '3 days ago', views: 142, amenities: ['water', 'power', 'security', 'parking'], desc: 'A freshly renovated 3-bedroom flat on a quiet street in Gbagada. New POP ceilings, fitted kitchen and a gated compound with a borehole. Close to the third mainland bridge.' },
  { id: 'l2', title: 'Spacious 3-bedroom in a gated block', area: 'Magodo', lga: 'Kosofe', rent: 2000000, beds: 3, baths: 3, size: 140, type: 'Flat', tone: 328, landlord: 'Adeola Balogun', verified: true, recommended: false, postedAgo: '2 weeks ago', views: 88, amenities: ['water', 'power', 'security', 'parking'], desc: 'Top-floor 3-bedroom in Harmony Court, a modern four-flat block off CMD Road. 24/7 security, borehole and ample parking.' },
  { id: 'l3', title: 'Cosy 2-bedroom flat near Unilag', area: 'Yaba', lga: 'Lagos Mainland', rent: 1200000, beds: 2, baths: 2, size: 85, type: 'Flat', tone: 268, landlord: 'Funmi Adebayo', verified: true, recommended: true, postedAgo: '1 day ago', views: 64, amenities: ['water', 'power', 'security', 'wifi'], desc: 'Bright 2-bedroom walking distance to Unilag and Sabo market. Ideal for young professionals; prepaid meter and reliable water.' },
  { id: 'l4', title: 'Self-contain studio', area: 'Surulere', lga: 'Surulere', rent: 450000, beds: 1, baths: 1, size: 35, type: 'Self-contain', tone: 148, landlord: 'Tunde Bakare', verified: true, recommended: false, postedAgo: '5 days ago', views: 51, amenities: ['water', 'power', 'security'], desc: 'Neat self-contained studio in a serviced compound. All rooms en-suite, prepaid meter, secure gate.' },
  { id: 'l5', title: 'Modern 3-bedroom apartment', area: 'Lekki Phase 1', lga: 'Eti-Osa', rent: 2500000, beds: 3, baths: 4, size: 160, type: 'Flat', tone: 198, landlord: 'Ngozi Eze', verified: true, recommended: false, postedAgo: '1 week ago', views: 173, amenities: ['water', 'power', 'security', 'parking', 'furnished', 'kitchen'], desc: 'Serviced 3-bedroom apartment with a gym and pool in the estate. Fully fitted kitchen, ample parking and 24/7 power.' },
  { id: 'l6', title: 'Tastefully finished 2-bedroom', area: 'Ikeja GRA', lga: 'Ikeja', rent: 1500000, beds: 2, baths: 2, size: 95, type: 'Flat', tone: 58, landlord: 'Chidi Okeke', verified: true, recommended: false, postedAgo: '4 days ago', views: 97, amenities: ['water', 'power', 'security', 'parking'], desc: 'Quiet, leafy GRA street. Two large bedrooms, generous living area and a private balcony.' },
  { id: 'l7', title: 'Newly built 2-bedroom', area: 'Ajah', lga: 'Eti-Osa', rent: 800000, beds: 2, baths: 2, size: 78, type: 'Flat', tone: 18, landlord: 'Bola Martins', verified: true, recommended: true, postedAgo: 'Today', views: 39, amenities: ['water', 'power', 'security', 'parking'], desc: 'Brand-new 2-bedroom in a small estate off the Lekki-Epe expressway. Borehole, estate security and dedicated parking.' },
  { id: 'l8', title: '1-bedroom mini flat', area: 'Maryland', lga: 'Kosofe', rent: 600000, beds: 1, baths: 1, size: 45, type: 'Mini flat', tone: 108, landlord: 'Grace Effiong', verified: true, recommended: false, postedAgo: '6 days ago', views: 72, amenities: ['water', 'power', 'security'], desc: 'Compact mini-flat close to Maryland Mall and the BRT. Prepaid meter and steady water supply.' },
  { id: 'l9', title: 'Luxury 4-bedroom duplex', area: 'Ikoyi', lga: 'Eti-Osa', rent: 4500000, beds: 4, baths: 5, size: 240, type: 'Duplex', tone: 28, landlord: 'Aliyu Sani', verified: true, recommended: false, postedAgo: '2 weeks ago', views: 210, amenities: ['water', 'power', 'security', 'parking', 'furnished', 'kitchen', 'wifi'], desc: 'Fully detached 4-bedroom duplex with a BQ, private compound and inverter backup. Premium Ikoyi address.' },
];

export const getListing = (id: string): Listing | undefined => listings.find((l) => l.id === id);

export const areas = [
  'Lekki Phase 1',
  'Yaba',
  'Surulere',
  'Gbagada',
  'Ikoyi',
  'Ikeja GRA',
  'Magodo',
  'Ajah',
  'Maryland',
  'Victoria Island',
];

export interface TenantProfile {
  name: string;
  initials: string;
  email: string;
  phone: string;
  budgetMin: number;
  budgetMax: number;
  areas: string[];
  size: string;
}

export const profile: TenantProfile = {
  name: 'Adaeze Obi',
  initials: 'AO',
  email: 'adaeze.obi@gmail.com',
  phone: '0805 ••• 9930',
  budgetMin: 600000,
  budgetMax: 1200000,
  areas: ['Yaba', 'Gbagada', 'Surulere', 'Ajah'],
  size: '2–3 bedroom',
};

export const savedIds: string[] = ['l1', 'l3'];

export interface SentEnquiry {
  id: string;
  listingId: string;
  message: string;
  when: string;
  status: 'sent' | 'replied';
  reply?: string;
}

export const sentEnquiries: SentEnquiry[] = [
  { id: 'se1', listingId: 'l1', message: 'Good day. Is the 3-bedroom still available? I can move in by the end of June and pay annually.', when: '1h ago', status: 'sent' },
  { id: 'se2', listingId: 'l3', message: 'Hi, please can I schedule an inspection this Saturday?', when: 'Yesterday', status: 'replied', reply: "Yes, Saturday works. Come by 11am — I'll send the address." },
];
