import type { PaymentStatus } from './role';

export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId?: string;
  amount: number;
  amountPaid: number;
  currency: 'NGN';
  status: PaymentStatus;
  paidAt?: string;
  dueAt: string;
  loggedBy: string;
  method?: 'cash' | 'transfer' | 'card' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
