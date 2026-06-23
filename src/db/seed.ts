import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'e_procurement',
    multipleStatements: true,
  });

  try {
    console.log('Seeding database...');

    // Create Roles
    const roles = [
      { id: uuidv4(), name: 'SUPER_ADMIN', description: 'Highest system authority' },
      { id: uuidv4(), name: 'ADMIN', description: 'System administrator' },
      { id: uuidv4(), name: 'STAFF', description: 'Organization staff member' },
      { id: uuidv4(), name: 'HOD', description: 'Head of Department' },
      { id: uuidv4(), name: 'PROCUREMENT_OFFICER', description: 'Procurement Officer' },
      { id: uuidv4(), name: 'ACCOUNTING_OFFICER', description: 'Accounting Officer' },
      { id: uuidv4(), name: 'SUPPLIER', description: 'Supplier user' },
    ];

    for (const role of roles) {
      await connection.execute(
        'INSERT IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)',
        [role.id, role.name, role.description]
      );
    }
    console.log('Roles seeded.');

    // Create Permissions
    const permissions = [
      // User Management
      { name: 'users.create', module: 'users', description: 'Create users' },
      { name: 'users.read', module: 'users', description: 'View users' },
      { name: 'users.update', module: 'users', description: 'Update users' },
      { name: 'users.delete', module: 'users', description: 'Delete users' },
      { name: 'users.suspend', module: 'users', description: 'Suspend users' },
      // Organization Management
      { name: 'organizations.create', module: 'organizations', description: 'Create organizations' },
      { name: 'organizations.read', module: 'organizations', description: 'View organizations' },
      { name: 'organizations.update', module: 'organizations', description: 'Update organizations' },
      // Supplier Management
      { name: 'suppliers.read', module: 'suppliers', description: 'View suppliers' },
      { name: 'suppliers.approve', module: 'suppliers', description: 'Approve suppliers' },
      { name: 'suppliers.reject', module: 'suppliers', description: 'Reject suppliers' },
      { name: 'suppliers.blacklist', module: 'suppliers', description: 'Blacklist suppliers' },
      // Procurement Requests
      { name: 'requests.create', module: 'procurement', description: 'Create procurement requests' },
      { name: 'requests.read', module: 'procurement', description: 'View procurement requests' },
      { name: 'requests.approve', module: 'procurement', description: 'Approve procurement requests' },
      // Tenders
      { name: 'tenders.create', module: 'tenders', description: 'Create tenders' },
      { name: 'tenders.read', module: 'tenders', description: 'View tenders' },
      { name: 'tenders.publish', module: 'tenders', description: 'Publish tenders' },
      { name: 'tenders.evaluate', module: 'tenders', description: 'Evaluate tenders' },
      { name: 'tenders.award', module: 'tenders', description: 'Award tenders' },
      // Contracts
      { name: 'contracts.create', module: 'contracts', description: 'Create contracts' },
      { name: 'contracts.read', module: 'contracts', description: 'View contracts' },
      { name: 'contracts.manage', module: 'contracts', description: 'Manage contracts' },
      // Reports
      { name: 'reports.view', module: 'reports', description: 'View reports' },
      { name: 'reports.generate', module: 'reports', description: 'Generate reports' },
      // Audit
      { name: 'audit.view', module: 'audit', description: 'View audit logs' },
      // Settings
      { name: 'settings.manage', module: 'settings', description: 'Manage system settings' },
    ];

    for (const perm of permissions) {
      const permId = uuidv4();
      await connection.execute(
        'INSERT IGNORE INTO permissions (id, name, module, description) VALUES (?, ?, ?, ?)',
        [permId, perm.name, perm.module, perm.description]
      );
    }
    console.log('Permissions seeded.');

    // Create default Organization
    const orgId = uuidv4();
    await connection.execute(
      'INSERT IGNORE INTO organizations (id, name, code, email, phone, address, city, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orgId, 'Default Organization', 'DEF-ORG', 'admin@organization.com', '+255700000000', '123 Main Street', 'Dar es Salaam', 'Tanzania']
    );
    console.log('Default organization seeded.');

    // Create Super Admin User
    const [superAdminRole] = await connection.execute(
      'SELECT id FROM roles WHERE name = ?', ['SUPER_ADMIN']
    ) as any[];
    
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    const superAdminId = uuidv4();
    
    await connection.execute(
      `INSERT IGNORE INTO users (id, email, password, first_name, last_name, phone, role_id, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [superAdminId, 'superadmin@eprocurement.com', hashedPassword, 'Super', 'Admin', '+255700000001', superAdminRole[0].id, true, true]
    );
    console.log('Super Admin user seeded.');

    // Create Admin User
    const [adminRole] = await connection.execute(
      'SELECT id FROM roles WHERE name = ?', ['ADMIN']
    ) as any[];
    
    const adminId = uuidv4();
    await connection.execute(
      `INSERT IGNORE INTO users (id, email, password, first_name, last_name, phone, role_id, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [adminId, 'admin@eprocurement.com', hashedPassword, 'System', 'Admin', '+255700000002', adminRole[0].id, true, true]
    );
    console.log('Admin user seeded.');

    // Create Sample Organization Users
    const [staffRole] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['STAFF']) as any[];
    const [hodRole] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['HOD']) as any[];
    const [procRole] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['PROCUREMENT_OFFICER']) as any[];
    const [accRole] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['ACCOUNTING_OFFICER']) as any[];

    await connection.execute(
      `INSERT IGNORE INTO users (id, email, password, first_name, last_name, phone, role_id, organization_id, department, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'staff@eprocurement.com', hashedPassword, 'John', 'Staff', '+255700000003', staffRole[0].id, orgId, 'IT Department', true, true]
    );

    await connection.execute(
      `INSERT IGNORE INTO users (id, email, password, first_name, last_name, phone, role_id, organization_id, department, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'hod@eprocurement.com', hashedPassword, 'Jane', 'HOD', '+255700000004', hodRole[0].id, orgId, 'IT Department', true, true]
    );

    await connection.execute(
      `INSERT IGNORE INTO users (id, email, password, first_name, last_name, phone, role_id, organization_id, department, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'procurement@eprocurement.com', hashedPassword, 'James', 'Procurement', '+255700000005', procRole[0].id, orgId, 'Procurement', true, true]
    );

    await connection.execute(
      `INSERT IGNORE INTO users (id, email, password, first_name, last_name, phone, role_id, organization_id, department, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'accounting@eprocurement.com', hashedPassword, 'Mary', 'Accounting', '+255700000006', accRole[0].id, orgId, 'Finance', true, true]
    );

    console.log('Sample users seeded.');

    // Create Procurement Categories
    const categories = [
      'Office Supplies', 'IT Equipment', 'Furniture', 'Construction Materials',
      'Consulting Services', 'Maintenance Services', 'Transportation', 'Medical Supplies'
    ];

    for (const cat of categories) {
      await connection.execute(
        'INSERT IGNORE INTO procurement_categories (id, name, is_active) VALUES (?, ?, ?)',
        [uuidv4(), cat, true]
      );
    }
    console.log('Procurement categories seeded.');

    // Create Tender Categories
    const tenderCats = ['Goods', 'Works', 'Services', 'Consultancy'];
    for (const cat of tenderCats) {
      await connection.execute(
        'INSERT IGNORE INTO tender_categories (id, name, is_active) VALUES (?, ?, ?)',
        [uuidv4(), cat, true]
      );
    }
    console.log('Tender categories seeded.');

    // Create Email Templates
    const emailTemplates = [
      {
        name: 'supplier_approved',
        subject: 'Supplier Registration Approved',
        body: '<h2>Congratulations!</h2><p>Dear {{contact_person}},</p><p>Your supplier registration for {{company_name}} has been approved. You can now login to access the supplier portal.</p>',
      },
      {
        name: 'supplier_rejected',
        subject: 'Supplier Registration Rejected',
        body: '<h2>Registration Update</h2><p>Dear {{contact_person}},</p><p>Your supplier registration for {{company_name}} has been rejected.</p><p>Reason: {{reason}}</p>',
      },
      {
        name: 'tender_published',
        subject: 'New Tender Published: {{tender_title}}',
        body: '<h2>New Tender Opportunity</h2><p>A new tender has been published.</p><p>Title: {{tender_title}}</p><p>Deadline: {{submission_deadline}}</p>',
      },
      {
        name: 'bid_awarded',
        subject: 'Congratulations! Your Bid Has Been Awarded',
        body: '<h2>Congratulations!</h2><p>Dear {{contact_person}},</p><p>Your bid for {{tender_title}} has been awarded.</p>',
      },
      {
        name: 'bid_unsuccessful',
        subject: 'Bid Result Notification',
        body: '<p>Dear {{contact_person}},</p><p>Your bid for {{tender_title}} was unsuccessful. Thank you for your participation.</p>',
      },
      {
        name: 'contract_signing',
        subject: 'Contract Signing Scheduled',
        body: '<p>Dear {{contact_person}},</p><p>Contract signing for {{contract_title}} has been scheduled for {{signing_date}}.</p>',
      },
    ];

    for (const template of emailTemplates) {
      await connection.execute(
        'INSERT IGNORE INTO email_templates (id, name, subject, body, is_active) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), template.name, template.subject, template.body, true]
      );
    }
    console.log('Email templates seeded.');

    console.log('\nSeeding completed successfully!');
    console.log('\nDefault Login Credentials:');
    console.log('Super Admin: superadmin@eprocurement.com / Admin@123');
    console.log('Admin: admin@eprocurement.com / Admin@123');
    console.log('Staff: staff@eprocurement.com / Admin@123');
    console.log('HOD: hod@eprocurement.com / Admin@123');
    console.log('Procurement: procurement@eprocurement.com / Admin@123');
    console.log('Accounting: accounting@eprocurement.com / Admin@123');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
