-- E-Procurement System Seed Data
-- MySQL Database

USE e_procurement;

-- =============================================
-- ROLES
-- =============================================
INSERT INTO roles (id, name, description) VALUES
('role-001', 'SUPER_ADMIN', 'System administrator with full access'),
('role-002', 'ADMIN', 'Organization administrator'),
('role-003', 'STAFF', 'Regular staff member'),
('role-004', 'HOD', 'Head of Department'),
('role-005', 'PROCUREMENT_OFFICER', 'Procurement officer'),
('role-006', 'ACCOUNTING_OFFICER', 'Accounting/Finance officer'),
('role-007', 'SUPPLIER', 'External supplier'),
('role-008', 'EVALUATION_OFFICER', 'Bid evaluation committee member');

-- =============================================
-- PERMISSIONS
-- =============================================
INSERT INTO permissions (id, name, description, module) VALUES
('perm-001', 'MANAGE_USERS', 'Manage system users', 'users'),
('perm-002', 'MANAGE_ORGANIZATIONS', 'Manage organizations', 'organizations'),
('perm-003', 'MANAGE_SUPPLIERS', 'Manage suppliers', 'suppliers'),
('perm-004', 'MANAGE_TENDERS', 'Manage tenders', 'tenders'),
('perm-005', 'SUBMIT_BIDS', 'Submit bids', 'bids'),
('perm-006', 'EVALUATE_BIDS', 'Evaluate bids', 'evaluations'),
('perm-007', 'MANAGE_CONTRACTS', 'Manage contracts', 'contracts'),
('perm-008', 'VIEW_REPORTS', 'View reports', 'reports'),
('perm-009', 'MANAGE_SETTINGS', 'Manage system settings', 'settings'),
('perm-010', 'MANAGE_EMAIL_TEMPLATES', 'Manage email templates', 'email_templates');

-- =============================================
-- ROLE PERMISSIONS
-- =============================================
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- SUPER_ADMIN - All permissions
('role-001', 'perm-001'),
('role-001', 'perm-002'),
('role-001', 'perm-003'),
('role-001', 'perm-004'),
('role-001', 'perm-005'),
('role-001', 'perm-006'),
('role-001', 'perm-007'),
('role-001', 'perm-008'),
('role-001', 'perm-009'),
('role-001', 'perm-010'),
-- ADMIN - Most permissions except settings
('role-002', 'perm-001'),
('role-002', 'perm-002'),
('role-002', 'perm-003'),
('role-002', 'perm-004'),
('role-002', 'perm-008'),
-- PROCUREMENT_OFFICER
('role-005', 'perm-004'),
('role-005', 'perm-006'),
('role-005', 'perm-007'),
('role-005', 'perm-008'),
-- SUPPLIER
('role-007', 'perm-005'),
('role-007', 'perm-008');

-- =============================================
-- ORGANIZATIONS
-- =============================================
INSERT INTO organizations (id, name, code, email, phone, address, city, country, is_active) VALUES
('org-001', 'Ministry of Health', 'MOH', 'info@moh.go.tz', '+255-22-2110000', 'Dodoma, Tanzania', 'Dodoma', 'Tanzania', TRUE),
('org-002', 'Ministry of Education', 'MOE', 'info@moe.go.tz', '+255-22-2110001', 'Dodoma, Tanzania', 'Dodoma', 'Tanzania', TRUE),
('org-003', 'Tanzania Revenue Authority', 'TRA', 'info@tra.go.tz', '+255-22-2110002', 'Dar es Salaam, Tanzania', 'Dar es Salaam', 'Tanzania', TRUE);

-- =============================================
-- USERS
-- =============================================
-- Passwords are hashed with bcrypt (password: hansco123)
INSERT INTO users (id, email, password, first_name, last_name, phone, role_id, organization_id, department, is_active, email_verified) VALUES
('user-001', 'superadmin@e-procurement.go.tz', '$2b$10$dkIeJZPtiQuViho8TtY6j.cxKC/KXAwbdhzZzsz/VxZxKYy7.ortm', 'Super', 'Admin', '+255-700-000001', 'role-001', NULL, NULL, TRUE, TRUE),
('user-002', 'admin@moh.go.tz', '$2b$10$dkIeJZPtiQuViho8TtY6j.cxKC/KXAwbdhzZzsz/VxZxKYy7.ortm', 'John', 'Admin', '+255-700-000002', 'role-002', 'org-001', 'Administration', TRUE, TRUE),
('user-003', 'staff@moh.go.tz', '$2b$10$dkIeJZPtiQuViho8TtY6j.cxKC/KXAwbdhzZzsz/VxZxKYy7.ortm', 'Jane', 'Staff', '+255-700-000003', 'role-003', 'org-001', 'Procurement', TRUE, TRUE),
('user-004', 'hod@moh.go.tz', '$2b$10$dkIeJZPtiQuViho8TtY6j.cxKC/KXAwbdhzZzsz/VxZxKYy7.ortm', 'Michael', 'Director', '+255-700-000004', 'role-004', 'org-001', 'Procurement Department', TRUE, TRUE),
('user-005', 'procurement@moh.go.tz', '$2b$10$dkIeJZPtiQuViho8TtY6j.cxKC/KXAwbdhzZzsz/VxZxKYy7.ortm', 'Sarah', 'Officer', '+255-700-000005', 'role-005', 'org-001', 'Procurement', TRUE, TRUE),
('user-006', 'finance@moh.go.tz', '$2b$10$dkIeJZPtiQuViho8TtY6j.cxKC/KXAwbdhzZzsz/VxZxKYy7.ortm', 'David', 'Accountant', '+255-700-000006', 'role-006', 'org-001', 'Finance', TRUE, TRUE),
('user-007', 'supplier1@company.com', '$2b$10$dkIeJZPtiQuViho8TtY6j.cxKC/KXAwbdhzZzsz/VxZxKYy7.ortm', 'James', 'Mwangi', '+255-700-000007', 'role-007', NULL, NULL, TRUE, TRUE),
('user-008', 'supplier2@company.com', '$2b$10$dkIeJZPtiQuViho8TtY6j.cxKC/KXAwbdhzZzsz/VxZxKYy7.ortm', 'Grace', 'Ochieng', '+255-700-000008', 'role-007', NULL, NULL, TRUE, TRUE),
('user-009', 'evaluation@moh.go.tz', '$2b$10$NUxxn47Sh/iO7KOjBmkMb.aUqYcsk0OYGv2qDUPywZFeLU8PcB42W', 'Peter', 'Evaluator', '+255-700-000009', 'role-008', 'org-001', 'Evaluation Committee', TRUE, TRUE);

-- =============================================
-- SUPPLIERS
-- =============================================
INSERT INTO suppliers (id, user_id, company_name, registration_number, tin_number, contact_person, phone, email, physical_address, country, region, district, categories, status, performance_score) VALUES
('sup-001', 'user-007', 'Tech Solutions Ltd', 'REG-2023-001', 'TIN-10001', 'James Mwangi', '+255-700-000007', 'supplier1@company.com', 'Dar es Salaam, Tanzania', 'Tanzania', 'Dar es Salaam', 'Ilala', 'IT_EQUIPMENT,SOFTWARE', 'APPROVED', 4.50),
('sup-002', 'user-008', 'Medical Supplies Co', 'REG-2023-002', 'TIN-10002', 'Grace Ochieng', '+255-700-000008', 'supplier2@company.com', 'Arusha, Tanzania', 'Tanzania', 'Arusha', 'Arusha', 'MEDICAL_EQUIPMENT,PHARMACEUTICALS', 'APPROVED', 4.20);

-- =============================================
-- PROCUREMENT CATEGORIES
-- =============================================
INSERT INTO procurement_categories (id, name, description) VALUES
('cat-001', 'IT Equipment', 'Computers, servers, networking equipment'),
('cat-002', 'Medical Equipment', 'Hospital and medical equipment'),
('cat-003', 'Pharmaceuticals', 'Medicines and drugs'),
('cat-004', 'Office Supplies', 'Stationery and office materials'),
('cat-005', 'Construction', 'Building and construction materials'),
('cat-006', 'Consulting Services', 'Professional consulting services');

-- =============================================
-- TENDER CATEGORIES
-- =============================================
INSERT INTO tender_categories (id, name, description) VALUES
('tcat-001', 'Goods', 'Physical goods and equipment'),
('tcat-002', 'Works', 'Construction and infrastructure'),
('tcat-003', 'Services', 'Professional and consulting services');

-- =============================================
-- PROCUREMENT REQUESTS
-- =============================================
INSERT INTO procurement_requests (id, request_number, title, description, category_id, estimated_budget, currency, priority, status, requested_by, organization_id, department, justification) VALUES
('pr-001', 'PR-2023-001', 'Office Computers', 'Purchase of 50 desktop computers for the ministry', 'cat-001', 75000000.00, 'TZS', 'HIGH', 'APPROVED', 'user-003', 'org-001', 'IT Department', 'Current computers are outdated and need replacement'),
('pr-002', 'PR-2023-002', 'Medical Equipment', 'Purchase of X-ray machines for regional hospitals', 'cat-002', 250000000.00, 'TZS', 'URGENT', 'APPROVED', 'user-003', 'org-001', 'Medical Services', 'Regional hospitals lack essential diagnostic equipment'),
('pr-003', 'PR-2023-003', 'Office Supplies', 'Quarterly office supplies procurement', 'cat-004', 5000000.00, 'TZS', 'MEDIUM', 'APPROVED', 'user-003', 'org-001', 'Administration', 'Regular quarterly procurement');

-- =============================================
-- TENDERS
-- =============================================
INSERT INTO tenders (id, tender_number, title, description, category_id, procurement_request_id, procurement_method, budget_estimate, currency, submission_deadline, opening_date, closing_date, status, organization_id, created_by) VALUES
('tender-001', 'TN-2023-001', 'Supply of Desktop Computers', 'Supply and delivery of 50 desktop computers with specifications as per tender document', 'tcat-001', 'pr-001', 'OPEN', 75000000.00, 'TZS', '2024-12-31 23:59:59', '2024-01-15 09:00:00', '2024-12-31 17:00:00', 'PUBLISHED', 'org-001', 'user-005'),
('tender-002', 'TN-2023-002', 'Supply of Medical Equipment', 'Supply and installation of X-ray machines for regional hospitals', 'tcat-001', 'pr-002', 'OPEN', 250000000.00, 'TZS', '2024-12-31 23:59:59', '2024-01-15 09:00:00', '2024-12-31 17:00:00', 'PUBLISHED', 'org-001', 'user-005'),
('tender-003', 'TN-2023-003', 'Office Supplies Tender', 'Quarterly supply of office stationery and materials', 'tcat-001', 'pr-003', 'OPEN', 5000000.00, 'TZS', '2024-12-31 23:59:59', '2024-01-15 09:00:00', '2024-12-31 17:00:00', 'PUBLISHED', 'org-001', 'user-005');

-- =============================================
-- BIDS
-- =============================================
INSERT INTO bids (id, bid_number, tender_id, supplier_id, bid_amount, currency, status) VALUES
('bid-001', 'BD-2023-001', 'tender-001', 'sup-001', 72000000.00, 'TZS', 'SUBMITTED'),
('bid-002', 'BD-2023-002', 'tender-001', 'sup-002', 74000000.00, 'TZS', 'SUBMITTED'),
('bid-003', 'BD-2023-003', 'tender-002', 'sup-002', 245000000.00, 'TZS', 'SUBMITTED'),
('bid-004', 'BD-2023-004', 'tender-003', 'sup-001', 4800000.00, 'TZS', 'SUBMITTED');

-- =============================================
-- EVALUATION COMMITTEES
-- =============================================
INSERT INTO evaluation_committees (id, tender_id, name, created_by) VALUES
('ec-001', 'tender-001', 'Computer Tender Evaluation Committee', 'user-005'),
('ec-002', 'tender-002', 'Medical Equipment Evaluation Committee', 'user-005');

-- =============================================
-- EVALUATION COMMITTEE MEMBERS
-- =============================================
INSERT INTO evaluation_committee_members (id, committee_id, user_id, role) VALUES
('ecm-001', 'ec-001', 'user-004', 'CHAIR'),
('ecm-002', 'ec-001', 'user-005', 'MEMBER'),
('ecm-003', 'ec-001', 'user-006', 'MEMBER'),
('ecm-004', 'ec-002', 'user-004', 'CHAIR'),
('ecm-005', 'ec-002', 'user-005', 'MEMBER');

-- =============================================
-- EVALUATIONS
-- =============================================
INSERT INTO evaluations (id, bid_id, evaluator_id, committee_id, technical_score, financial_score, experience_score, compliance_score, total_score) VALUES
('eval-001', 'bid-001', 'user-004', 'ec-001', 85.00, 90.00, 80.00, 95.00, 87.50),
('eval-002', 'bid-002', 'user-004', 'ec-001', 80.00, 85.00, 75.00, 90.00, 82.50);

-- =============================================
-- CONTRACTS
-- =============================================
INSERT INTO contracts (id, contract_number, tender_id, supplier_id, bid_id, title, contract_amount, currency, start_date, end_date, status, organization_id, created_by) VALUES
('contract-001', 'CT-2023-001', 'tender-001', 'sup-001', 'bid-001', 'Supply of Desktop Computers', 72000000.00, 'TZS', '2024-02-01', '2024-04-30', 'ACTIVE', 'org-001', 'user-005');

-- =============================================
-- SUPPLIER RATINGS
-- =============================================
INSERT INTO supplier_ratings (id, supplier_id, contract_id, rated_by, quality_score, delivery_score, compliance_score, communication_score, overall_score, average_score, comments) VALUES
('rating-001', 'sup-001', 'contract-001', 'user-005', 4, 5, 4, 5, 4, 4.50, 'Excellent service and timely delivery');

-- =============================================
-- SYSTEM SETTINGS
-- =============================================
INSERT INTO system_settings (id, setting_key, setting_value, description) VALUES
('setting-001', 'system_name', 'E-Procurement System', 'System name'),
('setting-002', 'default_currency', 'TZS', 'Default currency'),
('setting-003', 'tender_default_duration_days', '30', 'Default tender duration in days'),
('setting-004', 'bid_submission_deadline_hours', '72', 'Bid submission deadline in hours'),
('setting-005', 'email_notifications_enabled', 'true', 'Enable email notifications'),
('setting-006', 'max_file_size_mb', '10', 'Maximum file upload size in MB');

-- =============================================
-- EMAIL TEMPLATES
-- =============================================
INSERT INTO email_templates (id, name, subject, body, variables, is_active) VALUES
('email-001', 'TENDER_PUBLISHED', 'New Tender Published: {{tender_title}}', 'Dear {{recipient_name}},\n\nA new tender has been published:\n\nTender Number: {{tender_number}}\nTitle: {{tender_title}}\nSubmission Deadline: {{submission_deadline}}\n\nPlease log in to view details and submit your bid.\n\nBest regards,\nE-Procurement Team', 'recipient_name,tender_number,tender_title,submission_deadline', TRUE),
('email-002', 'BID_AWARDED', 'Congratulations! Your bid has been awarded', 'Dear {{recipient_name}},\n\nCongratulations! Your bid for tender {{tender_number}} has been awarded.\n\nContract Number: {{contract_number}}\nContract Amount: {{contract_amount}}\n\nPlease log in to view contract details.\n\nBest regards,\nE-Procurement Team', 'recipient_name,tender_number,contract_number,contract_amount', TRUE),
('email-003', 'SUPPLIER_APPROVED', 'Your supplier registration has been approved', 'Dear {{recipient_name}},\n\nYour supplier registration has been approved.\n\nYou can now participate in tender opportunities.\n\nBest regards,\nE-Procurement Team', 'recipient_name', TRUE);

-- =============================================
-- NOTIFICATIONS
-- =============================================
INSERT INTO notifications (id, user_id, title, message, type, category, reference_id, reference_type) VALUES
('notif-001', 'user-007', 'New Tender Available', 'A new tender "Supply of Desktop Computers" is now available for bidding.', 'INFO', 'TENDER', 'tender-001', 'TENDER'),
('notif-002', 'user-008', 'New Tender Available', 'A new tender "Supply of Medical Equipment" is now available for bidding.', 'INFO', 'TENDER', 'tender-002', 'TENDER'),
('notif-003', 'user-005', 'Bid Submitted', 'Bid BD-2023-001 has been submitted successfully.', 'SUCCESS', 'BID', 'bid-001', 'BID');

-- =============================================
-- MESSAGES
-- =============================================
INSERT INTO messages (id, sender_id, receiver_id, subject, body) VALUES
('msg-001', 'user-007', 'user-005', 'Inquiry about Tender TN-2023-001', 'Dear Procurement Officer,\n\nI would like to inquire about the technical specifications for the desktop computers tender.\n\nRegards,\nJames Mwangi'),
('msg-002', 'user-005', 'user-007', 'Re: Inquiry about Tender TN-2023-001', 'Dear James,\n\nPlease find the detailed specifications in the tender document attached to the tender page.\n\nRegards,\nSarah Officer');
