/**
 * Ilé Èkó — landlord mock portfolio (Lagos-authentic), ported from the design
 * prototype's data.js so the rebuilt screens show the same content as the mock.
 * Pure data + helpers; no React. Screens import via `@/data/mock`.
 */

export const naira = (n: number): string => '₦' + n.toLocaleString('en-NG');
export const nairaShort = (n: number): string => {
  if (n >= 1e6) return '₦' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + 'M';
  if (n >= 1e3) return '₦' + Math.round(n / 1e3) + 'k';
  return '₦' + n;
};

export type PropertyStatus = 'paid' | 'due' | 'overdue' | 'vacant';
export type PaymentState = 'paid' | 'due' | 'overdue' | 'late' | 'partial' | 'pending' | 'confirmed';

export interface Landlord {
  name: string;
  first: string;
  location: string;
  diaspora: boolean;
  initials: string;
}

export interface PropertyTenantRef {
  name: string;
  initials: string;
  since: string;
  phone: string;
}

export interface Lease {
  start: string;
  end: string;
  nextDue: string;
  daysToDue: number;
}

export interface PaymentLine {
  label: string;
  amount: number;
  date: string;
  state: PaymentState;
}

export interface Unit {
  id: string;
  label: string;
  beds: number;
  baths: number;
  rent: number;
  status: 'occupied' | 'vacant';
  tenantId: string | null;
}

export interface Property {
  id: string;
  address: string;
  area: string;
  type: string;
  beds?: number;
  baths?: number;
  rent: number;
  cycle?: string;
  status?: PropertyStatus;
  overdueDays?: number;
  vacantDays?: number;
  tone: number;
  tenant?: PropertyTenantRef | null;
  lease?: Lease | null;
  caretaker: string;
  aiPrice: number;
  aiDelta: number;
  aiComps: number;
  risk?: number;
  riskReasons?: string[];
  payments: PaymentLine[];
  lga?: string;
  unitCount?: number;
  occupancy?: 'occupied' | 'vacant' | 'mixed';
  // multi-unit only
  multiUnit?: boolean;
  desc?: string;
  units?: Unit[];
  activity?: { action: string; when: string; icon: string }[];
}

export const landlord: Landlord = {
  name: 'Adeola Balogun',
  first: 'Adeola',
  location: 'London, UK',
  diaspora: true,
  initials: 'AB',
};

const baseProperties: Property[] = [
  {
    id: 'p1',
    address: '14 Admiralty Way',
    area: 'Lekki Phase 1',
    type: '3-bed flat',
    beds: 3,
    baths: 3,
    rent: 2500000,
    cycle: 'year',
    status: 'paid',
    tone: 198,
    tenant: { name: 'Chinedu Okafor', initials: 'CO', since: 'Mar 2023', phone: '0803 •••  4471' },
    lease: { start: 'Mar 2025', end: 'Mar 2026', nextDue: '12 Mar 2026', daysToDue: 283 },
    caretaker: 'Self-managed',
    aiPrice: 2800000,
    aiDelta: 12,
    aiComps: 9,
    risk: 8,
    payments: [
      { label: '2025 – 2026 rent', amount: 2500000, date: '10 Mar 2025', state: 'paid' },
      { label: '2024 – 2025 rent', amount: 2300000, date: '08 Mar 2024', state: 'paid' },
    ],
  },
  {
    id: 'p2',
    address: '12B Raymond Njoku',
    area: 'Ikoyi',
    type: '4-bed duplex',
    beds: 4,
    baths: 5,
    rent: 4500000,
    cycle: 'year',
    status: 'paid',
    tone: 28,
    tenant: { name: 'Funke Adeyemi', initials: 'FA', since: 'Aug 2022', phone: '0817 •••  9203' },
    lease: { start: 'Aug 2025', end: 'Aug 2026', nextDue: '01 Aug 2026', daysToDue: 425 },
    caretaker: 'Musa Ibrahim',
    aiPrice: 5100000,
    aiDelta: 13,
    aiComps: 7,
    risk: 11,
    payments: [
      { label: '2025 – 2026 rent', amount: 4500000, date: '28 Jul 2025', state: 'paid' },
      { label: '2024 – 2025 rent', amount: 4200000, date: '30 Jul 2024', state: 'paid' },
    ],
  },
  {
    id: 'p3',
    address: '8 Herbert Macaulay Way',
    area: 'Yaba',
    type: '2-bed flat',
    beds: 2,
    baths: 2,
    rent: 1200000,
    cycle: 'year',
    status: 'overdue',
    overdueDays: 14,
    tone: 268,
    tenant: { name: 'Tunde Akinola', initials: 'TA', since: 'May 2024', phone: '0809 •••  1182' },
    lease: { start: 'May 2025', end: 'May 2026', nextDue: '19 May 2026', daysToDue: -14 },
    caretaker: 'Musa Ibrahim',
    aiPrice: 1350000,
    aiDelta: 12,
    aiComps: 11,
    risk: 78,
    riskReasons: ['14 days past due', '2 late payments in last 12 months', 'Partial payment Jan 2026'],
    payments: [
      { label: '2025 – 2026 rent', amount: 1200000, date: 'Due 19 May 2026', state: 'overdue' },
      { label: '2024 – 2025 rent', amount: 1100000, date: '02 Jun 2025', state: 'late' },
    ],
  },
  {
    id: 'p4',
    address: '22 Bode Thomas',
    area: 'Surulere',
    type: 'Self-contain',
    beds: 1,
    baths: 1,
    rent: 450000,
    cycle: 'year',
    status: 'due',
    tone: 148,
    tenant: { name: 'Ngozi Eze', initials: 'NE', since: 'Jun 2023', phone: '0806 •••  7754' },
    lease: { start: 'Jun 2025', end: 'Jun 2026', nextDue: '23 Jun 2026', daysToDue: 21 },
    caretaker: 'Musa Ibrahim',
    aiPrice: 520000,
    aiDelta: 16,
    aiComps: 14,
    risk: 24,
    payments: [
      { label: '2025 – 2026 rent', amount: 450000, date: 'Due 23 Jun 2026', state: 'due' },
      { label: '2024 – 2025 rent', amount: 420000, date: '20 Jun 2025', state: 'paid' },
    ],
  },
  {
    id: 'p5',
    address: '5 Diya Street',
    area: 'Gbagada',
    type: '3-bed flat',
    beds: 3,
    baths: 3,
    rent: 800000,
    cycle: 'year',
    status: 'vacant',
    vacantDays: 38,
    tone: 88,
    tenant: null,
    lease: null,
    caretaker: 'Musa Ibrahim',
    aiPrice: 950000,
    aiDelta: 19,
    aiComps: 8,
    risk: 0,
    payments: [{ label: '2023 – 2024 rent', amount: 760000, date: '14 Apr 2023', state: 'paid' }],
  },
];

const LGA: Record<string, string> = {
  'Lekki Phase 1': 'Eti-Osa',
  Ikoyi: 'Eti-Osa',
  Yaba: 'Lagos Mainland',
  Surulere: 'Surulere',
  Gbagada: 'Kosofe',
  Magodo: 'Kosofe',
  Maryland: 'Kosofe',
  Ajah: 'Eti-Osa',
};

export const properties: Property[] = baseProperties.map((p) => ({
  ...p,
  lga: LGA[p.area] ?? 'Lagos',
  unitCount: 1,
  occupancy: p.status === 'vacant' ? 'vacant' : 'occupied',
}));

export const multiUnits: Property[] = [
  {
    id: 'p6',
    address: 'Harmony Court',
    area: 'Magodo',
    lga: 'Kosofe',
    type: 'Block of flats',
    multiUnit: true,
    tone: 328,
    caretaker: 'Musa Ibrahim',
    occupancy: 'mixed',
    unitCount: 4,
    rent: 6500000,
    aiPrice: 2200000,
    aiDelta: 10,
    aiComps: 6,
    desc: 'A modern four-flat block off CMD Road, gated with a borehole and 24/7 security. Two flats on each floor.',
    units: [
      { id: 'u1', label: 'Flat 1', beds: 2, baths: 2, rent: 1500000, status: 'occupied', tenantId: 't6' },
      { id: 'u2', label: 'Flat 2', beds: 2, baths: 2, rent: 1500000, status: 'occupied', tenantId: 't7' },
      { id: 'u3', label: 'Flat 3', beds: 3, baths: 3, rent: 2000000, status: 'vacant', tenantId: null },
      { id: 'u4', label: 'Flat 4', beds: 2, baths: 2, rent: 1500000, status: 'occupied', tenantId: 't8' },
    ],
    payments: [
      { label: 'Flat 1 · 2025 – 2026', amount: 1500000, date: '15 Sep 2025', state: 'paid' },
      { label: 'Flat 2 · part-payment', amount: 750000, date: '20 Oct 2025', state: 'partial' },
      { label: 'Flat 4 · 2025 – 2026', amount: 1500000, date: 'Awaiting confirmation', state: 'pending' },
    ],
    activity: [
      { action: 'Inspection completed · Flat 3', when: '1 day ago', icon: 'doc' },
      { action: 'Generator serviced', when: '5 days ago', icon: 'settings' },
    ],
  },
];

export const allProperties: Property[] = [...properties, ...multiUnits];
export const getProperty = (id: string): Property | undefined => allProperties.find((p) => p.id === id);

export interface Caretaker {
  id: string;
  name: string;
  initials: string;
  since: string;
  status: 'active' | 'pending' | 'revoked';
  areas: string[];
  propertyCount: number;
  phone: string;
  permissions: string[];
}

export const caretakers: Caretaker[] = [
  {
    id: 'ct1',
    name: 'Musa Ibrahim',
    initials: 'MI',
    since: 'Jan 2024',
    status: 'active',
    areas: ['Yaba', 'Surulere', 'Gbagada', 'Ikoyi'],
    propertyCount: 4,
    phone: '0802 ••• 6610',
    permissions: ['Collect rent', 'Log maintenance', 'Message tenants'],
  },
  {
    id: 'ct2',
    name: 'Blessing Okon',
    initials: 'BO',
    since: 'Invited 2 days ago',
    status: 'pending',
    areas: ['Lekki Phase 1'],
    propertyCount: 1,
    phone: '0813 ••• 4490',
    permissions: ['Log payments', 'Upload images'],
  },
  {
    id: 'ct3',
    name: 'Ifeoma Nwankwo',
    initials: 'IN',
    since: 'Removed Apr 2026',
    status: 'revoked',
    areas: ['Maryland'],
    propertyCount: 0,
    phone: '0701 ••• 2218',
    permissions: [],
  },
];

export interface ActivityEntry {
  id: string;
  who: string;
  initials: string;
  type: 'payment' | 'image' | 'maintenance' | 'status' | 'tenant';
  action: string;
  detail: string;
  when: string;
  ago: string;
  propertyId: string;
  flag?: string;
}

export const activityLog: ActivityEntry[] = [
  { id: 'a1', who: 'Musa Ibrahim', initials: 'MI', type: 'payment', action: 'Logged ₦1,500,000 rent payment', detail: 'Flat 1, Harmony Court · Magodo', when: 'Today, 09:24', ago: '2h ago', propertyId: 'p6' },
  { id: 'a2', who: 'Musa Ibrahim', initials: 'MI', type: 'payment', action: 'Logged ₦750,000 part-payment', detail: 'Flat 2, Harmony Court · Magodo', when: 'Today, 08:55', ago: '3h ago', propertyId: 'p6', flag: 'Payment logged without a receipt upload — review.' },
  { id: 'a3', who: 'Musa Ibrahim', initials: 'MI', type: 'image', action: 'Uploaded 4 inspection photos', detail: '5 Diya Street · Gbagada', when: 'Today, 08:10', ago: '4h ago', propertyId: 'p5' },
  { id: 'a4', who: 'Musa Ibrahim', initials: 'MI', type: 'maintenance', action: 'Logged a plumbing repair', detail: '8 Herbert Macaulay Way · Yaba', when: 'Yesterday, 16:42', ago: '1d ago', propertyId: 'p3' },
  { id: 'a5', who: 'Musa Ibrahim', initials: 'MI', type: 'status', action: 'Marked Flat 3 as vacant', detail: 'Harmony Court · Magodo', when: 'Yesterday, 14:05', ago: '1d ago', propertyId: 'p6' },
  { id: 'a6', who: 'Blessing Okon', initials: 'BO', type: 'tenant', action: 'Added tenant Adebayo Williams', detail: '14 Admiralty Way · Lekki Phase 1', when: 'Yesterday, 11:30', ago: '1d ago', propertyId: 'p1', flag: 'Tenant added before lease document uploaded.' },
  { id: 'a7', who: 'Musa Ibrahim', initials: 'MI', type: 'payment', action: 'Confirmed ₦450,000 cash receipt', detail: '22 Bode Thomas · Surulere', when: '2 Jun, 17:20', ago: '2d ago', propertyId: 'p4' },
  { id: 'a8', who: 'Musa Ibrahim', initials: 'MI', type: 'status', action: 'Updated occupancy to occupied', detail: '12B Raymond Njoku · Ikoyi', when: '1 Jun, 10:02', ago: '3d ago', propertyId: 'p2' },
];

export interface NotificationItem {
  id: string;
  type: 'overdue' | 'activity' | 'ai' | 'rent-due' | 'lease';
  title: string;
  body: string;
  when: string;
  group: 'Today' | 'Yesterday' | 'Earlier';
  read: boolean;
  propertyId: string;
}

export const notifications: NotificationItem[] = [
  { id: 'n1', type: 'overdue', title: 'Rent overdue', body: 'Tunde Akinola is 14 days late on ₦1,200,000 — Yaba.', when: '09:10', group: 'Today', read: false, propertyId: 'p3' },
  { id: 'n2', type: 'activity', title: 'Caretaker logged a payment', body: 'Musa Ibrahim logged ₦1,500,000 for Flat 1, Harmony Court.', when: '09:24', group: 'Today', read: false, propertyId: 'p6' },
  { id: 'n3', type: 'ai', title: 'AI flagged an action', body: 'A part-payment was logged without a receipt — review.', when: '08:55', group: 'Today', read: false, propertyId: 'p6' },
  { id: 'n4', type: 'rent-due', title: 'Rent due soon', body: "Ngozi Eze's ₦450,000 is due in 21 days — Surulere.", when: '08:00', group: 'Today', read: true, propertyId: 'p4' },
  { id: 'n5', type: 'activity', title: 'Inspection photos uploaded', body: 'Musa Ibrahim added 4 photos for 5 Diya Street, Gbagada.', when: 'Yesterday', group: 'Yesterday', read: true, propertyId: 'p5' },
  { id: 'n6', type: 'lease', title: 'Lease expiring', body: "Chinedu Okafor's lease in Lekki ends in 30 days.", when: 'Yesterday', group: 'Yesterday', read: true, propertyId: 'p1' },
  { id: 'n7', type: 'lease', title: 'Lease expiring', body: "Tunde Akinola's lease in Yaba ends in 16 days.", when: 'Mon', group: 'Earlier', read: true, propertyId: 'p3' },
];

export interface Enquiry {
  id: string;
  tenant: string;
  initials: string;
  propertyId: string;
  area: string;
  snippet: string;
  message: string;
  when: string;
  group: 'Today' | 'Yesterday' | 'Earlier';
  read: boolean;
}

export const enquiries: Enquiry[] = [
  { id: 'e1', tenant: 'Adaeze Obi', initials: 'AO', propertyId: 'p5', area: 'Gbagada', snippet: 'Is the 3-bedroom still available? I can move in by end of June…', message: "Good day. I saw your 3-bedroom flat at 5 Diya Street on the Ilé Èkó marketplace. Is it still available? I can move in by the end of June and I'm happy to pay annually. Please let me know the next steps.", when: '1h ago', group: 'Today', read: false },
  { id: 'e2', tenant: 'Kelechi Umeh', initials: 'KU', propertyId: 'p5', area: 'Gbagada', snippet: 'Please can I schedule an inspection this Saturday?', message: "Hello, I'm interested in the Gbagada flat. Can I schedule an inspection this Saturday morning? Thank you.", when: '3h ago', group: 'Today', read: false },
  { id: 'e3', tenant: 'Halima Bello', initials: 'HB', propertyId: 'p6', area: 'Magodo', snippet: 'Is Flat 3 furnished? Is the rent negotiable for 2 years?', message: 'Good afternoon. Is Flat 3 at Harmony Court furnished? Also, is the ₦2,000,000 rent negotiable if I take a 2-year lease?', when: 'Yesterday', group: 'Yesterday', read: true },
  { id: 'e4', tenant: 'Segun Alabi', initials: 'SA', propertyId: 'p5', area: 'Gbagada', snippet: 'Does the compound have a borehole and parking?', message: 'Hi, does 5 Diya Street have a borehole and dedicated parking? I have two cars.', when: 'Yesterday', group: 'Yesterday', read: true },
  { id: 'e5', tenant: 'Patience Eze', initials: 'PE', propertyId: 'p6', area: 'Magodo', snippet: 'I submitted my application — any update?', message: 'Hello, I submitted my application for Flat 3 last week and I\'m ready to pay a deposit. Any update on my request?', when: 'Mon', group: 'Earlier', read: true },
];

export const enquiriesForProperty = (pid: string): Enquiry[] => enquiries.filter((e) => e.propertyId === pid);

export interface Listing {
  listed: boolean;
  views: number;
  enquiries: number;
  since: string;
}

export const listings: Record<string, Listing> = {
  p5: { listed: true, views: 142, enquiries: 3, since: '26 Apr 2026' },
  p6: { listed: true, views: 88, enquiries: 2, since: '18 May 2026' },
};

export interface TenantRisk {
  level: 'Low' | 'Watch' | 'High';
  reason: string;
}

export interface TenantHistory {
  period: string;
  amount: number;
  date: string;
  state: PaymentState;
  method: string;
}

export interface Tenant {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  propertyId: string;
  unit: string | null;
  area: string;
  type: string;
  leaseStart: string;
  leaseEnd: string;
  moveIn: string;
  rent: number;
  schedule: string;
  status: 'paid' | 'due' | 'overdue' | 'partial' | 'pending';
  risk: TenantRisk;
  history: TenantHistory[];
}

export const tenants: Tenant[] = [
  { id: 't1', name: 'Chinedu Okafor', initials: 'CO', phone: '0803 ••• 4471', email: 'chinedu.okafor@gmail.com', propertyId: 'p1', unit: null, area: 'Lekki Phase 1', type: '3-bed flat', leaseStart: '10 Mar 2025', leaseEnd: '09 Mar 2026', moveIn: '12 Mar 2025', rent: 2500000, schedule: 'Annual', status: 'paid', risk: { level: 'Low', reason: '5 on-time payments, never late.' }, history: [ { period: '2025 – 2026 rent', amount: 2500000, date: '10 Mar 2025', state: 'confirmed', method: 'Bank transfer' }, { period: '2024 – 2025 rent', amount: 2300000, date: '08 Mar 2024', state: 'confirmed', method: 'Bank transfer' } ] },
  { id: 't2', name: 'Funke Adeyemi', initials: 'FA', phone: '0817 ••• 9203', email: 'funke.adeyemi@yahoo.com', propertyId: 'p2', unit: null, area: 'Ikoyi', type: '4-bed duplex', leaseStart: '28 Jul 2025', leaseEnd: '27 Jul 2026', moveIn: '01 Aug 2025', rent: 4500000, schedule: 'Annual', status: 'paid', risk: { level: 'Low', reason: 'Long-standing tenant since 2022, always pays in advance.' }, history: [ { period: '2025 – 2026 rent', amount: 4500000, date: '28 Jul 2025', state: 'confirmed', method: 'Bank transfer' }, { period: '2024 – 2025 rent', amount: 4200000, date: '30 Jul 2024', state: 'confirmed', method: 'Cheque' } ] },
  { id: 't3', name: 'Tunde Akinola', initials: 'TA', phone: '0809 ••• 1182', email: 'tunde.akinola@gmail.com', propertyId: 'p3', unit: null, area: 'Yaba', type: '2-bed flat', leaseStart: '19 May 2025', leaseEnd: '18 May 2026', moveIn: '20 May 2024', rent: 1200000, schedule: 'Annual', status: 'overdue', risk: { level: 'High', reason: '14 days overdue, 2 late payments in 12 months.' }, history: [ { period: '2025 – 2026 rent', amount: 1200000, date: 'Due 19 May 2026', state: 'overdue', method: '—' }, { period: 'Jan 2026 part-payment', amount: 400000, date: '14 Jan 2026', state: 'partial', method: 'Cash' }, { period: '2024 – 2025 rent', amount: 1100000, date: '02 Jun 2025', state: 'confirmed', method: 'Bank transfer' } ] },
  { id: 't4', name: 'Ngozi Eze', initials: 'NE', phone: '0806 ••• 7754', email: 'ngozi.eze@gmail.com', propertyId: 'p4', unit: null, area: 'Surulere', type: 'Self-contain', leaseStart: '23 Jun 2025', leaseEnd: '22 Jun 2026', moveIn: '25 Jun 2023', rent: 450000, schedule: 'Annual', status: 'due', risk: { level: 'Watch', reason: 'Renewal due in 21 days; one late payment last year.' }, history: [ { period: '2025 – 2026 rent', amount: 450000, date: 'Due 23 Jun 2026', state: 'pending', method: '—' }, { period: '2024 – 2025 rent', amount: 420000, date: '20 Jun 2025', state: 'confirmed', method: 'POS / card' } ] },
  { id: 't6', name: 'Emeka Nwosu', initials: 'EN', phone: '0814 ••• 3320', email: 'emeka.nwosu@gmail.com', propertyId: 'p6', unit: 'Flat 1', area: 'Magodo', type: '2-bed flat', leaseStart: '15 Sep 2025', leaseEnd: '14 Sep 2026', moveIn: '15 Sep 2025', rent: 1500000, schedule: 'Annual', status: 'paid', risk: { level: 'Low', reason: 'Paid full year in advance on move-in.' }, history: [ { period: '2025 – 2026 rent', amount: 1500000, date: '15 Sep 2025', state: 'confirmed', method: 'Bank transfer' } ] },
  { id: 't7', name: 'Bisi Ogunleye', initials: 'BO', phone: '0705 ••• 8841', email: 'bisi.ogunleye@yahoo.com', propertyId: 'p6', unit: 'Flat 2', area: 'Magodo', type: '2-bed flat', leaseStart: '01 Oct 2025', leaseEnd: '30 Sep 2026', moveIn: '01 Oct 2025', rent: 1500000, schedule: 'Bi-annual', status: 'partial', risk: { level: 'Watch', reason: 'Paid ₦750k of ₦1.5M; balance promised by month-end.' }, history: [ { period: 'Oct 2025 – Mar 2026', amount: 750000, date: '20 Oct 2025', state: 'partial', method: 'POS / card' }, { period: 'Balance ₦750,000', amount: 750000, date: 'Awaiting', state: 'pending', method: '—' } ] },
  { id: 't8', name: 'Yusuf Bello', initials: 'YB', phone: '0902 ••• 1175', email: 'yusuf.bello@gmail.com', propertyId: 'p6', unit: 'Flat 4', area: 'Magodo', type: '2-bed flat', leaseStart: '03 Oct 2025', leaseEnd: '02 Oct 2026', moveIn: '03 Oct 2025', rent: 1500000, schedule: 'Annual', status: 'pending', risk: { level: 'Watch', reason: 'Bank transfer logged, awaiting confirmation.' }, history: [ { period: '2025 – 2026 rent', amount: 1500000, date: 'Awaiting confirmation', state: 'pending', method: 'Bank transfer' } ] },
];

export const tenantsForProperty = (pid: string): Tenant[] => tenants.filter((t) => t.propertyId === pid);
export const getTenant = (id: string): Tenant | undefined => tenants.find((t) => t.id === id);

export interface Briefing {
  headline: string;
  points: string[];
}

export const briefing: Briefing = {
  headline: '₦1.65M is outstanding across 2 tenants this cycle.',
  points: [
    'Tunde Akinola (Yaba) is 14 days overdue and has a history of late payment — 78% likely to default. Follow up today.',
    'Your Gbagada flat is vacant and ~19% below market — list it at ₦950,000.',
    "Funke Adeyemi's Ikoyi lease renews in Aug; smart pricing suggests +13%.",
  ],
};

const rollAnnual = properties.reduce((s, p) => s + p.rent, 0);
const collected = properties.filter((p) => p.status === 'paid').reduce((s, p) => s + p.rent, 0);
const overdueAmt = properties.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.rent, 0);
const dueAmt = properties.filter((p) => p.status === 'due').reduce((s, p) => s + p.rent, 0);
const vacantAmt = properties.filter((p) => p.status === 'vacant').reduce((s, p) => s + p.rent, 0);
const occupied = properties.filter((p) => p.status !== 'vacant').length;

export const summary = {
  rollAnnual,
  collected,
  overdueAmt,
  dueAmt,
  vacantAmt,
  occupied,
  total: properties.length,
  occupancyPct: Math.round((occupied / properties.length) * 100),
  collectedPct: Math.round((collected / rollAnnual) * 100),
};
