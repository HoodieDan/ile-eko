export type Role = 'landlord' | 'caretaker' | 'tenant' | 'admin';

export type PaymentFrequency = 'monthly' | 'quarterly' | 'biannual' | 'annual';

export type PropertyType =
  | 'self-contained'
  | 'mini-flat'
  | 'one-bedroom'
  | 'two-bedroom'
  | 'three-bedroom'
  | 'duplex'
  | 'shop'
  | 'office'
  | 'other';

export type PropertyStatus = 'vacant' | 'occupied' | 'partial' | 'pending';

export type PaymentStatus = 'confirmed' | 'pending' | 'overdue' | 'partial';

export type EnquiryStatus = 'new' | 'replied' | 'closed';
