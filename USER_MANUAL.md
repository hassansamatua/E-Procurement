# E-Procurement System — User Manual

## Table of Contents

1. [System Overview](#system-overview)
2. [Roles & Responsibilities](#roles--responsibilities)
3. [Workflows](#workflows)
   - [Procurement Request Workflow](#procurement-request-workflow)
   - [Tender & Bidding Workflow](#tender--bidding-workflow)
   - [Evaluation & Award Workflow](#evaluation--award-workflow)
   - [Contract Management Workflow](#contract-management-workflow)
   - [Supplier Rating Workflow](#supplier-rating-workflow)
4. [Role-Specific Guides](#role-specific-guides)
   - [Staff](#staff)
   - [Head of Department (HOD)](#head-of-department-hod)
   - [Procurement Officer](#procurement-officer)
   - [Accounting Officer](#accounting-officer)
   - [Supplier](#supplier)
   - [Admin](#admin)
   - [Super Admin](#super-admin)
5. [Common Features](#common-features)
6. [Support](#support)

---

## System Overview

The E-Procurement System is a comprehensive platform that manages the entire procurement lifecycle—from request creation to contract award and supplier performance tracking. It ensures transparency, accountability, and efficiency through role-based access control and automated workflows.

**Key Features:**
- Procurement request creation and approval
- Tender publication and supplier bidding
- Bid evaluation and awarding
- Contract generation and management
- Supplier performance ratings
- Real-time dashboards and reports
- Notification system for all stakeholders

---

## Roles & Responsibilities

| Role | Primary Responsibility | Key Permissions |
|------|----------------------|------------------|
| **Staff** | Initiate procurement requests | Create requests, view own requests, notifications |
| **HOD** | Approve departmental requests | Review/approve/reject requests, view department requests |
| **Procurement Officer** | Manage tenders, bids, evaluations | Create tenders, evaluate bids, award contracts, rate suppliers |
| **Accounting Officer** | Financial approval | Review budget, approve/reject requests financially |
| **Supplier** | Submit bids, manage contracts | View tenders, submit bids, view contracts, manage profile |
| **Admin** | Manage suppliers, categories, tenders | CRUD suppliers, categories, tenders, view reports |
| **Super Admin** | System-wide management | Manage organizations, users, audit logs, system settings |

---

## Workflows

### Procurement Request Workflow

```
Staff (DRAFT)
    ↓
Staff submits → HOD (PENDING_HOD)
    ↓
HOD approves → Procurement Officer (PENDING_PROCUREMENT)
    ↓
Procurement Officer approves → Accounting Officer (PENDING_FINANCE)
    ↓
Accounting Officer approves → APPROVED (Ready for Tender)
    ↓
Procurement Officer creates Tender → Request status: TENDER_CREATED
```

**Approval Paths:**
- **HOD Rejection** → Status: `HOD_REJECTED` (returned to Staff for correction)
- **Procurement Rejection** → Status: `PROCUREMENT_REJECTED`
- **Finance Rejection** → Status: `FINANCE_REJECTED`

---

### Tender & Bidding Workflow

```
Procurement Officer creates Tender (from approved request)
    ↓
Tender status: DRAFT → PUBLISHED
    ↓
Suppliers view open tenders and submit bids
    ↓
Bid status: SUBMITTED
    ↓
Procurement Officer closes tender (after deadline)
    ↓
Tender status: CLOSED → Evaluation Committee formed
```

**Tender Statuses:**
- `DRAFT` — Being prepared
- `PUBLISHED` — Visible to suppliers
- `CLOSED` — Bidding ended, ready for evaluation
- `AWARDED` — Contract awarded
- `CANCELLED` — Tender cancelled

---

### Evaluation & Award Workflow

```
Evaluation Committee evaluates bids (Technical, Financial, Experience, Compliance)
    ↓
Each bid gets a total score
    ↓
Procurement Officer selects winning bid
    ↓
Award action triggers:
  - Winning bid status: AWARDED
  - Other bids status: REJECTED
  - Notifications sent to all suppliers
  - Contract creation initiated
```

**Bid Statuses:**
- `SUBMITTED` — Bid received
- `EVALUATED` — Evaluation completed
- `AWARDED` — Bid won
- `REJECTED` — Bid lost

---

### Contract Management Workflow

```
After award, Procurement Officer creates Contract
    ↓
Contract status: DRAFT → ACTIVE
    ↓
Contract execution and delivery
    ↓
Contract status: COMPLETED
    ↓
Procurement Officer rates supplier (Quality, Delivery, Compliance, Communication)
```

**Contract Statuses:**
- `DRAFT` — Being prepared
- `ACTIVE` — Signed and in progress
- `COMPLETED` — Delivered successfully
- `CANCELLED` — Terminated

---

### Supplier Rating Workflow

```
Contract completed
    ↓
Procurement Officer rates supplier (1–5 scale)
    ↓
Overall score calculated (average of 4 criteria)
    ↓
Supplier rating stored for future reference
```

**Rating Criteria:**
- Quality (1–5)
- Delivery (1–5)
- Compliance (1–5)
- Communication (1–5)

---

## Role-Specific Guides

### Staff

**Dashboard:** View personal request stats and recent activity.

**Create a Procurement Request:**
1. Navigate to **My Requests** → **New Request**
2. Fill in:
   - Title
   - Description
   - Estimated budget
   - Priority (Low, Medium, High)
   - Category
3. Submit as `DRAFT`
4. Submit for approval → status changes to `PENDING_HOD`

**Track Request Status:**
- View in **My Requests** table
- Receive notifications on status changes
- If rejected, view comments and resubmit

**Notifications:**
- View in **Notifications** tab
- Alerts for approvals, rejections, and comments

---

### Head of Department (HOD)

**Dashboard:** View department request stats and pending approvals.

**Review & Approve Requests:**
1. Navigate to **Pending Approvals**
2. Click **View** on a request
3. Review details (title, description, budget, priority)
4. Add comments (optional but recommended for rejection)
5. Choose action:
   - **Approve** → Forwards to Procurement Officer
   - **Reject** → Returns to Staff with comments
   - **Return for Correction** → Sends back to Staff for edits

**View All Department Requests:**
- Navigate to **All Requests**
- Filter by status, priority, date

**Notifications:**
- Alerts for new requests awaiting approval
- Updates on request status changes

---

### Procurement Officer

**Dashboard:** View tender stats, bid stats, contract stats, and pending actions.

**1. Manage Procurement Requests:**
- Navigate to **Requests**
- Two sections:
  - **Requests Awaiting Your Review** (PENDING_PROCUREMENT, HOD_APPROVED)
  - **Approved — Ready for Tender** (APPROVED)

**Approve/Reject Requests:**
1. Click **View** on a pending request
2. Review details
3. Add comments
4. **Approve** → Forwards to Finance
5. **Reject** → Rejects request

**Create Tender from Approved Request:**
1. In **Approved — Ready for Tender**, click **Create Tender**
2. Pre-filled from request:
   - Title, description, budget
   - Linked to request (procurement_request_id)
3. Complete:
   - Category
   - Procurement method (Open, Restricted, Direct, RFQ)
   - Submission deadline
   - Opening date
   - Closing date
4. Submit → Tender created, request status: `TENDER_CREATED`

**2. Manage Tenders:**
- Navigate to **Tenders**
- View all tenders with status badges
- **View Details** — see full tender info, linked request, bids

**Publish Tender:**
- Create tender (status: DRAFT)
- Edit if needed
- Publish (status: PUBLISHED) → visible to suppliers

**Close Tender:**
- After submission deadline
- Close tender (status: CLOSED) → ready for evaluation

**3. Manage Bids:**
- Navigate to **Bids**
- View all bids with status badges
- **View Details** — see bid documents, supplier info, evaluation scores

**4. Evaluation:**
- Navigate to **Evaluations**
- **Bids Awaiting Evaluation** — tenders in CLOSED status
- Click **Evaluate** on a tender
- For each bid, score:
  - Technical (0–100)
  - Financial (0–100)
  - Experience (0–100)
  - Compliance (0–100)
  - Comments
- Submit → Bid status: `EVALUATED`

**5. Award Bid:**
- In **Bids**, click **View** on an evaluated bid
- Click **Award** (only available for EVALUATED bids)
- System:
  - Sets this bid to AWARDED
  - Rejects all other bids for the tender
  - Notifies all suppliers
  - Initiates contract creation

**6. Manage Contracts:**
- Navigate to **Contracts**
- **Create Contract** (after award):
  - Select awarded bid
  - Fill contract details
  - Submit → status: ACTIVE
- Update status to COMPLETED when delivered

**7. Rate Suppliers:**
- Navigate to **Ratings**
- Click **Rate Supplier**
- Select contract (ACTIVE or COMPLETED)
- Score 1–5 for:
  - Quality
  - Delivery
  - Compliance
  - Communication
- Add comments
- Submit → Rating stored, overall score calculated

**8. Evaluation Committees:**
- Navigate to **Evaluation Committees**
- Create committee for tender evaluation
- Assign members

**9. Reports:**
- Navigate to **Reports**
- View procurement analytics

---

### Accounting Officer

**Dashboard:** View pending financial approvals and request stats.

**Review & Approve Requests:**
1. Navigate to **Pending Approvals**
2. Click **View** on a request
3. Review budget and financial details
4. Add financial remarks (optional)
5. Choose action:
   - **Approve** → Request status: APPROVED (ready for tender)
   - **Reject** → Request status: FINANCE_REJECTED

**View All Requests:**
- Navigate to **Requests**
- Filter by status, priority, date

**Notifications:**
- Alerts for requests awaiting financial approval
- Updates on request status

---

### Supplier

**Dashboard:** View available tenders, my bids, contracts, and notifications.

**1. Manage Profile:**
- Navigate to **Profile**
- Update company details
- Upload documents (certifications, licenses)

**2. View Available Tenders:**
- Navigate to **Available Tenders**
- Filter by category, status, deadline
- Click **View** for details
- Download tender documents

**3. Submit Bid:**
- From tender details, click **Submit Bid**
- Fill:
  - Bid amount
  - Technical proposal
  - Financial proposal
  - Attach documents
- Submit → Bid status: SUBMITTED

**4. Track My Bids:**
- Navigate to **My Bids**
- View all bids with status badges
- Statuses: SUBMITTED, EVALUATED, AWARDED, REJECTED
- Click **View** for details

**5. View Contracts:**
- Navigate to **Contracts**
- View awarded contracts
- Track contract status (ACTIVE, COMPLETED)

**6. Notifications:**
- Navigate to **Notifications**
- Alerts for:
  - New tender publications
  - Bid evaluation results
  - Contract awards
  - Contract status changes

---

### Admin

**Dashboard:** View system stats (suppliers, tenders, bids, contracts).

**1. Manage Suppliers:**
- Navigate to **Suppliers**
- **Add Supplier** — create new supplier account
- Edit supplier details
- Deactivate suppliers

**2. Manage Categories:**
- Navigate to **Categories**
- Create/edit procurement categories
- Used in requests and tenders

**3. Manage Tenders:**
- Navigate to **Tenders**
- View all tenders
- View details

**4. Notifications:**
- Navigate to **Notifications**
- View system-wide alerts

**5. Reports:**
- Navigate to **Reports**
- View procurement analytics

---

### Super Admin

**Dashboard:** View system-wide stats and activity.

**1. Manage Organizations:**
- Navigate to **Organizations**
- Create/edit organizations
- Manage organization settings

**2. Manage Users:**
- Navigate to **Users**
- Create/edit users
- Assign roles
- Activate/deactivate accounts

**3. Manage Suppliers:**
- Navigate to **Suppliers**
- Full supplier management across organizations

**4. Manage Categories:**
- Navigate to **Categories**
- Global category management

**5. Audit Logs:**
- Navigate to **Audit Logs**
- View all system actions (who did what, when)
- Filter by user, action, date, module

**6. System Settings:**
- Navigate to **Settings**
- Configure system-wide settings
- Email templates
- System parameters

**7. Reports:**
- Navigate to **Reports**
- Comprehensive analytics

---

## Common Features

### Notifications
- Real-time alerts for actions affecting your role
- Bell icon in header shows unread count
- Click to view notification list
- Notifications link to relevant pages

### Search & Filter
- Most tables support search
- Filter by status, date, category, etc.
- Pagination for large datasets

### Export
- Reports can be exported to Excel/PDF
- Data tables can be exported

### Theme Toggle
- Light/Dark mode
- Click sun/moon icon in header
- Preference saved across sessions

---

## Support

For technical issues or questions:
- Contact your system administrator
- Check audit logs for action history
- Review notifications for status updates

---

## Quick Reference: Status Codes

### Request Statuses
- `DRAFT` — Not yet submitted
- `PENDING_HOD` — Awaiting HOD approval
- `HOD_APPROVED` — Approved by HOD
- `HOD_REJECTED` — Rejected by HOD
- `PENDING_PROCUREMENT` — Awaiting Procurement Officer
- `PROCUREMENT_REJECTED` — Rejected by Procurement
- `PENDING_FINANCE` — Awaiting Finance approval
- `FINANCE_REJECTED` — Rejected by Finance
- `APPROVED` — Fully approved, ready for tender
- `TENDER_CREATED` — Tender created from request
- `COMPLETED` — Request fulfilled

### Tender Statuses
- `DRAFT` — Being prepared
- `PUBLISHED` — Open for bidding
- `CLOSED` — Bidding ended
- `AWARDED` — Contract awarded
- `CANCELLED` — Cancelled

### Bid Statuses
- `SUBMITTED` — Bid received
- `EVALUATED` — Evaluation completed
- `AWARDED` — Bid won
- `REJECTED` — Bid lost

### Contract Statuses
- `DRAFT` — Being prepared
- `ACTIVE` — In progress
- `COMPLETED` — Delivered
- `CANCELLED` — Terminated

---

*Version 1.0 — E-Procurement System*
