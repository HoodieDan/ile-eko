import type { PaymentFrequency, PropertyStatus, PropertyType } from './role';

export interface Property {
  id: string;
  landlordId: string;
  propertyTitle: string;
  address: string;
  area: string;
  lga: string;
  propertyType: PropertyType;
  description: string;
  images: string[];
  hasUnits: boolean;
  paymentFrequency: PaymentFrequency;
  status: PropertyStatus;
  rentAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  label: string;
  status: PropertyStatus;
  rentAmount: number;
  paymentFrequency: PaymentFrequency;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}
