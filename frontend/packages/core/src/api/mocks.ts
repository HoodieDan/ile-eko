import type { Enquiry, Payment, Property, Tenant } from '../types';

export const mockProperties: Property[] = [
  {
    id: 'p_001',
    landlordId: 'u_landlord_1',
    propertyTitle: 'Adeniyi Court',
    address: '14 Adeniyi Jones Avenue',
    area: 'Ikeja',
    lga: 'Ikeja',
    propertyType: 'two-bedroom',
    description: 'A four-unit walk-up with secure parking and 24-hour estate security.',
    images: [],
    hasUnits: true,
    paymentFrequency: 'annual',
    status: 'partial',
    rentAmount: 1_800_000,
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-05-04T10:00:00Z',
  },
  {
    id: 'p_002',
    landlordId: 'u_landlord_1',
    propertyTitle: 'Lekki Phase 1 Mini-flat',
    address: '8 Admiralty Way',
    area: 'Lekki Phase 1',
    lga: 'Eti-Osa',
    propertyType: 'mini-flat',
    description: 'Bright self-contained mini-flat, walking distance to the beach roundabout.',
    images: [],
    hasUnits: false,
    paymentFrequency: 'annual',
    status: 'vacant',
    rentAmount: 2_400_000,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-05-04T10:00:00Z',
  },
  {
    id: 'p_003',
    landlordId: 'u_landlord_1',
    propertyTitle: 'Yaba Studio',
    address: '22 Herbert Macaulay Way',
    area: 'Yaba',
    lga: 'Lagos Mainland',
    propertyType: 'self-contained',
    description: 'Compact studio in the heart of tech-Yaba, fibre internet ready.',
    images: [],
    hasUnits: false,
    paymentFrequency: 'annual',
    status: 'occupied',
    rentAmount: 900_000,
    createdAt: '2025-11-15T10:00:00Z',
    updatedAt: '2026-05-04T10:00:00Z',
  },
];

export const mockTenants: Tenant[] = [
  {
    id: 't_001',
    propertyId: 'p_003',
    fullName: 'Chinedu Okeke',
    phone: '+2348012345678',
    email: 'chinedu@example.com',
    moveInDate: '2025-12-01',
    rentAmount: 900_000,
    paymentDueDate: '2026-12-01',
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2026-05-04T10:00:00Z',
  },
];

export const mockPayments: Payment[] = [
  {
    id: 'pay_001',
    tenantId: 't_001',
    propertyId: 'p_003',
    amount: 900_000,
    amountPaid: 900_000,
    currency: 'NGN',
    status: 'confirmed',
    paidAt: '2025-12-01T09:00:00Z',
    dueAt: '2025-12-01T00:00:00Z',
    loggedBy: 'u_landlord_1',
    method: 'transfer',
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2025-12-01T09:00:00Z',
  },
];

export const mockEnquiries: Enquiry[] = [
  {
    id: 'e_001',
    tenantUserId: 'u_tenant_1',
    propertyId: 'p_002',
    message: 'Hello, is the Lekki Phase 1 mini-flat still available for August move-in?',
    status: 'new',
    createdAt: '2026-05-30T15:42:00Z',
  },
];
