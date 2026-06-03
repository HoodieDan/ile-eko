export interface RolePermission {
  id: string;
  propertyId: string;
  caretakerUserId: string;
  invitedBy: string;
  canLogPayments: boolean;
  canEditTenants: boolean;
  canUploadImages: boolean;
  canViewRevenue: boolean;
  canMarkVacancy: boolean;
  createdAt: string;
  updatedAt: string;
}
