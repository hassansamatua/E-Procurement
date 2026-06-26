import { z } from 'zod';

// Auth Validations
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
});

// User Validations
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  role_id: z.string().uuid('Invalid role ID'),
  organization_id: z.string().uuid('Invalid organization ID').optional(),
  department: z.string().optional(),
});

export const updateUserSchema = z.object({
  first_name: z.string().min(2).optional(),
  last_name: z.string().min(2).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  role_id: z.string().uuid('Invalid role ID').optional(),
  organization_id: z.string().uuid('Invalid organization ID').optional().nullable(),
  is_active: z.boolean().optional(),
  is_suspended: z.boolean().optional(),
});

// Organization Validations
export const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  code: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

// Supplier Validations
export const supplierRegistrationSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  registration_number: z.string().optional(),
  tin_number: z.string().optional(),
  vat_number: z.string().optional(),
  business_license_number: z.string().optional(),
  contact_person: z.string().min(2, 'Contact person is required'),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  physical_address: z.string().optional(),
  postal_address: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  account_name: z.string().optional(),
  categories: z.array(z.enum(['Goods', 'Works', 'Services'])).min(1, 'Select at least one category'),
});

// Procurement Request Validations
export const procurementRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category_id: z.string().min(1, 'Category ID is required').optional(),
  estimated_budget: z.number().positive('Budget must be positive').optional(),
  currency: z.string().default('TZS'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  justification: z.string().optional(),
  delivery_date: z.string().optional(),
});

// Tender Validations
export const tenderSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category_id: z.string().optional(),
  procurement_request_id: z.string().optional(),
  procurement_method: z.enum(['OPEN', 'RESTRICTED', 'DIRECT', 'REQUEST_FOR_QUOTATION']).default('OPEN'),
  budget_estimate: z.number().positive().optional(),
  currency: z.string().default('TZS'),
  submission_deadline: z.string().min(1, 'Submission deadline is required'),
  opening_date: z.string().min(1, 'Opening date is required'),
  closing_date: z.string().min(1, 'Closing date is required'),
  evaluation_criteria: z.record(z.string(), z.number()).optional(),
});

// Bid Validations
export const bidSchema = z.object({
  tender_id: z.string().uuid('Invalid tender ID'),
  bid_amount: z.number().positive('Bid amount must be positive'),
  currency: z.string().default('TZS'),
  notes: z.string().optional(),
});

// Evaluation Validations
export const evaluationSchema = z.object({
  bid_id: z.string().uuid('Invalid bid ID'),
  technical_score: z.number().min(0).max(100),
  financial_score: z.number().min(0).max(100),
  experience_score: z.number().min(0).max(100),
  compliance_score: z.number().min(0).max(100),
  comments: z.string().optional(),
});

// Contract Validations
export const contractSchema = z.object({
  tender_id: z.string().uuid('Invalid tender ID'),
  supplier_id: z.string().uuid('Invalid supplier ID'),
  bid_id: z.string().uuid().optional(),
  title: z.string().min(5, 'Title is required'),
  description: z.string().optional(),
  contract_amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('TZS'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  signing_date: z.string().optional(),
  terms_and_conditions: z.string().optional(),
});

// Rating Validations
export const ratingSchema = z.object({
  supplier_id: z.string().uuid('Invalid supplier ID'),
  contract_id: z.string().uuid('Invalid contract ID'),
  quality_score: z.number().min(1).max(5),
  delivery_score: z.number().min(1).max(5),
  compliance_score: z.number().min(1).max(5),
  communication_score: z.number().min(1).max(5),
  overall_score: z.number().min(1).max(5),
  comments: z.string().optional(),
});

// Approval Validations
export const approvalSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED', 'RETURNED']),
  comments: z.string().optional(),
  financial_remarks: z.string().optional(),
});
