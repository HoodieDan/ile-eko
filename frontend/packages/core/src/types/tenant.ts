export interface Tenant {
  id: string;
  propertyId: string;
  unitId?: string;
  fullName: string;
  phone: string;
  email?: string;
  moveInDate: string;
  rentAmount: number;
  paymentDueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
