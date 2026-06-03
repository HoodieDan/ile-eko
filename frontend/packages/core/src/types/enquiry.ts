import type { EnquiryStatus } from './role';

export interface Enquiry {
  id: string;
  tenantUserId: string;
  propertyId: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}
