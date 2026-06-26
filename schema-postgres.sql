-- E-Procurement System Database Schema
-- PostgreSQL Database

-- =============================================
-- ROLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PERMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  module VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ROLE PERMISSIONS (MANY-TO-MANY)
-- =============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(36) NOT NULL,
  permission_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- =============================================
-- ORGANIZATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  logo VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  avatar VARCHAR(500),
  role_id VARCHAR(36) NOT NULL,
  organization_id VARCHAR(36),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  refresh_token TEXT,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- =============================================
-- SUPPLIERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  tin_number VARCHAR(100),
  vat_number VARCHAR(100),
  business_license_number VARCHAR(100),
  contact_person VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  physical_address TEXT,
  postal_address VARCHAR(255),
  country VARCHAR(100),
  region VARCHAR(100),
  district VARCHAR(100),
  bank_name VARCHAR(255),
  account_number VARCHAR(100),
  account_name VARCHAR(255),
  categories TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLACKLISTED')),
  rejection_reason TEXT,
  approved_by VARCHAR(36),
  approved_at TIMESTAMP,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  blacklist_reason TEXT,
  performance_score DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =============================================
-- SUPPLIER DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_documents (
  id VARCHAR(36) PRIMARY KEY,
  supplier_id VARCHAR(36) NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('BUSINESS_LICENSE', 'TAX_CLEARANCE', 'REGISTRATION_CERT', 'TIN_CERT', 'VAT_CERT', 'EXPERIENCE_DOCS', 'FINANCIAL_STATEMENTS', 'OTHER')),
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- =============================================
-- PROCUREMENT CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS procurement_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id VARCHAR(36),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES procurement_categories(id)
);

-- =============================================
-- PROCUREMENT REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS procurement_requests (
  id VARCHAR(36) PRIMARY KEY,
  request_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id VARCHAR(36),
  estimated_budget DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'TZS',
  priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_HOD', 'HOD_APPROVED', 'HOD_REJECTED', 'PENDING_PROCUREMENT', 'PROCUREMENT_APPROVED', 'PROCUREMENT_REJECTED', 'PENDING_FINANCE', 'PENDING_ACCOUNTING', 'FINANCE_APPROVED', 'FINANCE_REJECTED', 'APPROVED', 'TENDER_CREATED', 'CANCELLED')),
  requested_by VARCHAR(36) NOT NULL,
  organization_id VARCHAR(36) NOT NULL,
  department VARCHAR(100),
  justification TEXT,
  delivery_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES procurement_categories(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- =============================================
-- PROCUREMENT REQUEST DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS procurement_request_documents (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE
);

-- =============================================
-- REQUEST APPROVALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS request_approvals (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  approver_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('APPROVED', 'REJECTED', 'RETURNED')),
  comments TEXT,
  financial_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- =============================================
-- TENDER CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tender_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TENDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tenders (
  id VARCHAR(36) PRIMARY KEY,
  tender_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id VARCHAR(36),
  procurement_request_id VARCHAR(36),
  procurement_method VARCHAR(30) DEFAULT 'OPEN' CHECK (procurement_method IN ('OPEN', 'RESTRICTED', 'DIRECT', 'REQUEST_FOR_QUOTATION')),
  budget_estimate DECIMAL(20,2),
  currency VARCHAR(10) DEFAULT 'TZS',
  submission_deadline TIMESTAMP NOT NULL,
  opening_date TIMESTAMP NOT NULL,
  closing_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED', 'UNDER_EVALUATION', 'EVALUATION_COMPLETE', 'AWARDED', 'CANCELLED')),
  evaluation_criteria TEXT,
  organization_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES tender_categories(id),
  FOREIGN KEY (procurement_request_id) REFERENCES procurement_requests(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- TENDER DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tender_documents (
  id VARCHAR(36) PRIMARY KEY,
  tender_id VARCHAR(36) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_public BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- =============================================
-- BIDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bids (
  id VARCHAR(36) PRIMARY KEY,
  bid_number VARCHAR(50) NOT NULL UNIQUE,
  tender_id VARCHAR(36) NOT NULL,
  supplier_id VARCHAR(36) NOT NULL,
  bid_amount DECIMAL(20,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TZS',
  technical_score DECIMAL(5,2) DEFAULT 0,
  financial_score DECIMAL(5,2) DEFAULT 0,
  experience_score DECIMAL(5,2) DEFAULT 0,
  compliance_score DECIMAL(5,2) DEFAULT 0,
  total_score DECIMAL(5,2) DEFAULT 0,
  rank INTEGER,
  status VARCHAR(20) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'EVALUATED', 'AWARDED', 'REJECTED', 'DISQUALIFIED')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  evaluated_at TIMESTAMP,
  contract_signing_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- =============================================
-- BID DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bid_documents (
  id VARCHAR(36) PRIMARY KEY,
  bid_id VARCHAR(36) NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('TECHNICAL_PROPOSAL', 'FINANCIAL_PROPOSAL', 'SUPPORTING_DOCUMENT')),
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE
);

-- =============================================
-- EVALUATION RESULTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS evaluation_results (
  id VARCHAR(36) PRIMARY KEY,
  tender_id VARCHAR(36) NOT NULL,
  committee_id VARCHAR(36),
  evaluation_document_url VARCHAR(500),
  winner_bid_id VARCHAR(36),
  remarks TEXT,
  evaluated_by VARCHAR(36) NOT NULL,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
  FOREIGN KEY (committee_id) REFERENCES evaluation_committees(id),
  FOREIGN KEY (winner_bid_id) REFERENCES bids(id),
  FOREIGN KEY (evaluated_by) REFERENCES users(id)
);

-- =============================================
-- EVALUATION COMMITTEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS evaluation_committees (
  id VARCHAR(36) PRIMARY KEY,
  tender_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- EVALUATION COMMITTEE MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS evaluation_committee_members (
  id VARCHAR(36) PRIMARY KEY,
  committee_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (committee_id) REFERENCES evaluation_committees(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- EVALUATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS evaluations (
  id VARCHAR(36) PRIMARY KEY,
  bid_id VARCHAR(36) NOT NULL,
  evaluator_id VARCHAR(36) NOT NULL,
  committee_id VARCHAR(36),
  technical_score DECIMAL(5,2) DEFAULT 0,
  financial_score DECIMAL(5,2) DEFAULT 0,
  experience_score DECIMAL(5,2) DEFAULT 0,
  compliance_score DECIMAL(5,2) DEFAULT 0,
  total_score DECIMAL(5,2) DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluator_id) REFERENCES users(id),
  FOREIGN KEY (committee_id) REFERENCES evaluation_committees(id)
);

-- =============================================
-- CONTRACTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(36) PRIMARY KEY,
  contract_number VARCHAR(50) NOT NULL UNIQUE,
  tender_id VARCHAR(36) NOT NULL,
  supplier_id VARCHAR(36) NOT NULL,
  bid_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contract_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TZS',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  signing_date DATE,
  completion_date DATE,
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'TERMINATED')),
  terms_and_conditions TEXT,
  organization_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tender_id) REFERENCES tenders(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (bid_id) REFERENCES bids(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- CONTRACT DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contract_documents (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- =============================================
-- SUPPLIER RATINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_ratings (
  id VARCHAR(36) PRIMARY KEY,
  supplier_id VARCHAR(36) NOT NULL,
  contract_id VARCHAR(36) NOT NULL,
  rated_by VARCHAR(36) NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  delivery_score INTEGER NOT NULL CHECK (delivery_score BETWEEN 1 AND 5),
  compliance_score INTEGER NOT NULL CHECK (compliance_score BETWEEN 1 AND 5),
  communication_score INTEGER NOT NULL CHECK (communication_score BETWEEN 1 AND 5),
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
  average_score DECIMAL(3,2) NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (rated_by) REFERENCES users(id)
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'INFO' CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
  category VARCHAR(50),
  reference_id VARCHAR(36),
  reference_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  is_email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  parent_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES messages(id)
);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  old_values TEXT,
  new_values TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- SYSTEM SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id VARCHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- EMAIL TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  variables TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_status ON procurement_requests(status);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_org ON procurement_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_org ON tenders(organization_id);
CREATE INDEX IF NOT EXISTS idx_bids_tender ON bids(tender_id);
CREATE INDEX IF NOT EXISTS idx_bids_supplier ON bids(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
