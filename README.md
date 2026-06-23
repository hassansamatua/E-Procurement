# E-Procurement and Supplier Management System

An enterprise-grade E-Procurement System that digitizes procurement processes from resource request initiation to supplier selection, contract management, supplier evaluation, and procurement reporting.

## Technology Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, ShadCN UI, React Hook Form, Zod, Recharts
- **Backend**: Next.js API Routes, TypeScript
- **Database**: MySQL (via mysql2 driver, raw SQL)
- **Authentication**: JWT + Refresh Tokens, Role-Based Access Control (RBAC)
- **Email**: Nodemailer with SMTP
- **File Storage**: Local uploads directory (migration-ready for AWS S3)
- **Reports**: PDF (PDFKit) and Excel (ExcelJS) generation

## User Roles

| Role | Description |
|------|-------------|
| SUPER_ADMIN | Highest authority - manages system, orgs, users, settings |
| ADMIN | Reviews suppliers, monitors tenders, manages categories |
| STAFF | Creates procurement requests, tracks status |
| HOD | Approves/rejects department requests |
| PROCUREMENT_OFFICER | Manages tenders, evaluations, contracts |
| ACCOUNTING_OFFICER | Verifies financial compliance, approves budgets |
| SUPPLIER | Views tenders, submits bids, manages contracts |

## Procurement Workflow

```
Staff (Create Request)
  → HOD (Approve/Reject)
    → Procurement Officer (Review)
      → Accounting Officer (Financial Approval)
        → Procurement Officer (Create Tender)
          → Suppliers (Submit Bids)
            → Evaluation → Award → Contract
```

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8.0+ (XAMPP or standalone)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd e-procurement
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database and SMTP credentials
```

4. **Create MySQL database**
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS e_procurement"
```

5. **Run migrations**
```bash
npm run db:migrate
```

6. **Seed database**
```bash
npm run db:seed
```

7. **Start development server**
```bash
npm run dev
```

8. **Open browser**
Navigate to http://localhost:3000

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@eprocurement.com | Admin@123 |
| Admin | admin@eprocurement.com | Admin@123 |
| Staff | staff@eprocurement.com | Admin@123 |
| HOD | hod@eprocurement.com | Admin@123 |
| Procurement Officer | procurement@eprocurement.com | Admin@123 |
| Accounting Officer | accounting@eprocurement.com | Admin@123 |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Public auth pages (login, register, forgot-password)
│   ├── (dashboard)/     # Protected dashboard pages per role
│   └── api/             # API routes
│       ├── auth/        # Authentication endpoints
│       ├── users/       # User management
│       ├── organizations/
│       ├── suppliers/   # Supplier registration & management
│       ├── procurement-requests/  # Request workflow
│       ├── tenders/     # Tender CRUD & publish
│       ├── bids/        # Bid submission
│       ├── evaluations/ # Bid scoring & award
│       ├── contracts/   # Contract lifecycle
│       ├── notifications/
│       ├── reports/     # PDF/Excel report generation
│       ├── audit-logs/
│       ├── categories/
│       └── dashboard/   # Stats endpoints
├── components/
│   ├── ui/              # Reusable UI components (Button, Card, Table, etc.)
│   ├── layout/          # Sidebar, DashboardLayout
│   └── shared/          # StatsCard, DataTable
├── db/
│   ├── migrations/      # SQL migration files
│   ├── migrate.ts       # Migration runner
│   └── seed.ts          # Seed data
├── hooks/               # React hooks (useAuth with Zustand)
├── lib/                 # Core utilities
│   ├── db.ts            # MySQL connection pool
│   ├── auth.ts          # JWT utilities
│   ├── audit.ts         # Audit logging
│   ├── email.ts         # Email/SMTP service
│   ├── notifications.ts # In-app notification service
│   ├── validations.ts   # Zod schemas
│   └── utils.ts         # Helpers
├── middleware/          # Auth middleware for API routes
└── types/               # TypeScript type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Supplier registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users & Organizations
- `GET/POST /api/users` - List/Create users
- `GET/POST /api/organizations` - List/Create organizations

### Suppliers
- `GET /api/suppliers` - List suppliers
- `PATCH /api/suppliers` - Approve/Reject/Blacklist supplier

### Procurement Requests
- `GET/POST /api/procurement-requests` - List/Create requests
- `PATCH /api/procurement-requests` - Approve/Reject/Return requests

### Tenders
- `GET/POST /api/tenders` - List/Create tenders
- `PATCH /api/tenders` - Publish/Close/Cancel tenders

### Bids
- `GET/POST /api/bids` - List/Submit bids

### Evaluations
- `GET/POST /api/evaluations` - List/Create evaluations
- `PATCH /api/evaluations` - Award tender

### Contracts
- `GET/POST /api/contracts` - List/Create contracts
- `PATCH /api/contracts` - Update contract status

### Other
- `GET /api/dashboard` - Role-based dashboard stats
- `GET /api/notifications` - User notifications
- `GET /api/reports` - Generate reports
- `GET /api/audit-logs` - View audit logs
- `GET/POST /api/categories` - Manage categories

## Security Features

- JWT Authentication with refresh token rotation
- Role-Based Access Control (RBAC) on all endpoints
- Password hashing with bcrypt (12 rounds)
- Input validation with Zod on all endpoints
- SQL injection prevention via parameterized queries
- Audit logging for all critical actions
- File upload validation (type, size)
- CSRF protection via SameSite cookies

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all variables in `.env.example` are configured for production:
- Use strong, unique JWT secrets
- Configure production SMTP credentials
- Set proper database credentials
- Update `NEXT_PUBLIC_APP_URL` to production domain

## License

MIT
