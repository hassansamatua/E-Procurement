export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'STAFF'
  | 'HOD'
  | 'PROCUREMENT_OFFICER'
  | 'ACCOUNTING_OFFICER'
  | 'FINANCE_OFFICER'
  | 'EVALUATION_OFFICER'
  | 'SUPPLIER';

export type SupplierStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BLACKLISTED';

export type ProcurementRequestStatus = 
  | 'DRAFT'
  | 'PENDING_HOD'
  | 'HOD_APPROVED'
  | 'HOD_REJECTED'
  | 'PENDING_PROCUREMENT'
  | 'PROCUREMENT_APPROVED'
  | 'PROCUREMENT_REJECTED'
  | 'PENDING_FINANCE'
  | 'FINANCE_APPROVED'
  | 'FINANCE_REJECTED'
  | 'APPROVED'
  | 'TENDER_CREATED'
  | 'CANCELLED';

export type TenderStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'UNDER_EVALUATION' | 'AWARDED' | 'CANCELLED';

export type BidStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'EVALUATED' | 'AWARDED' | 'REJECTED' | 'DISQUALIFIED';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ProcurementMethod = 'OPEN' | 'RESTRICTED' | 'DIRECT' | 'REQUEST_FOR_QUOTATION';

export type SupplierCategory = 'Goods' | 'Works' | 'Services';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string;
  role_id: string;
  role_name?: UserRole;
  organization_id?: string;
  organization_name?: string;
  department?: string;
  is_active: boolean;
  is_suspended: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  user_id?: string;
  company_name: string;
  registration_number?: string;
  tin_number?: string;
  vat_number?: string;
  business_license_number?: string;
  contact_person: string;
  phone: string;
  email: string;
  physical_address?: string;
  postal_address?: string;
  country?: string;
  region?: string;
  district?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  categories?: SupplierCategory[];
  status: SupplierStatus;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  performance_score: number;
  created_at: string;
  updated_at: string;
}

export interface ProcurementRequest {
  id: string;
  request_number: string;
  title: string;
  description: string;
  category_id?: string;
  category_name?: string;
  estimated_budget?: number;
  currency: string;
  priority: Priority;
  status: ProcurementRequestStatus;
  requested_by: string;
  requester_name?: string;
  organization_id: string;
  department?: string;
  justification?: string;
  delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Tender {
  id: string;
  tender_number: string;
  title: string;
  description: string;
  category_id?: string;
  category_name?: string;
  procurement_request_id?: string;
  procurement_method: ProcurementMethod;
  budget_estimate?: number;
  currency: string;
  submission_deadline: string;
  opening_date: string;
  closing_date: string;
  status: TenderStatus;
  evaluation_criteria?: Record<string, number>;
  organization_id: string;
  created_by: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  bid_number: string;
  tender_id: string;
  supplier_id: string;
  supplier_name?: string;
  bid_amount: number;
  currency: string;
  technical_score: number;
  financial_score: number;
  experience_score: number;
  compliance_score: number;
  total_score: number;
  rank?: number;
  status: BidStatus;
  submitted_at: string;
  evaluated_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  tender_id: string;
  supplier_id: string;
  bid_id?: string;
  title: string;
  description?: string;
  contract_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  signing_date?: string;
  completion_date?: string;
  status: ContractStatus;
  terms_and_conditions?: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category?: string;
  reference_id?: string;
  reference_type?: string;
  is_read: boolean;
  is_email_sent: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  module: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

export interface DashboardStats {
  totalOrganizations?: number;
  totalSuppliers?: number;
  totalUsers?: number;
  totalTenders?: number;
  totalContracts?: number;
  totalProcurementValue?: number;
  pendingSuppliers?: number;
  approvedSuppliers?: number;
  rejectedSuppliers?: number;
  activeTenders?: number;
  procurementRequests?: number;
  evaluationReports?: number;
  availableTenders?: number;
  submittedBids?: number;
  wonContracts?: number;
  performanceRating?: number;
}
