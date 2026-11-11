# CampusEquip | College Equipment Borrowing & Inventory System

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](https://github.com)
[![Full-Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20React%20%7C%20SQLite-blue.svg)](https://github.com)
[![Security](https://img.shields.io/badge/Auth-JWT%20%7C%20bcryptjs%20%7C%20RBAC-purple.svg)](https://github.com)
[![Test Coverage](https://img.shields.io/badge/Integration%20Tests-20%2F20%20Passing-success.svg)](https://github.com)

CampusEquip is an enterprise-grade, full-stack web application designed for universities, colleges, and laboratory facilities to automate the complete academic lifecycle of equipment borrowing, inventory auditing, custodian approvals, counter dispatch, and physical return inspections.

---

## 🎯 Scope & Core Features

Based on the **College Equipment Borrowing System** specification:
- **Equipment Inventory**: Real-time stock counts (`available_quantity` vs `total_quantity`), category classification, asset tags, lab locations, condition assessments (Excellent, Good, Fair, Maintenance), and loan limits.
- **Borrowing Workflow**: Multi-criteria catalog search, live availability checking, academic purpose submission, loan duration validation, and duplicate request prevention.
- **Custodian Approval & Handover**: Request review queue with approve/reject workflows, counter dispatching, inventory deduction, and digital loan slips with barcodes.
- **Physical Return & Inspection**: Condition inspection at check-in (checking for wear, damage, missing accessories), fine/charge remarks, automated stock restoration, and immutable audit logs.
- **Security & Roles**: Granular Role-Based Access Control (`borrower`, `staff`, `admin`), salted password hashing, JWT authentication, and SQL injection protection.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies | Rationale |
| :--- | :--- | :--- |
| **Backend API** | Node.js (v24), Express.js | High-throughput asynchronous RESTful API architecture |
| **Database** | High-Performance SQLite (`DatabaseSync`) | Zero external daemon latency, ACID compliance, foreign keys & WAL journal mode |
| **Frontend** | React 18, Vite 5, Tailwind CSS | Lightning-fast HMR, responsive glassmorphism UI, accessible typography |
| **Icons & UI** | Lucide React, Canvas Confetti | Modern iconography & micro-interactions |
| **Security** | `bcryptjs`, `jsonwebtoken` (JWT) | Cryptographic password hashing & stateless RBAC authorization |

---

## 🎓 Academic Departments Configured

The system is configured specifically for the following 4 academic programs:
1. **Bachelor Science of information technology(BSIT)**
2. **Bachelor Science of hospitality Management(BSHM)**
3. **Bachelor Science of Criminology(BSCRIM)**
4. **Bachelor Science of Education**

All equipment, categories, borrower profiles, and checkout requests are tailored to these college curricula.

---

## ⚡ Transfer Data to Your Supabase

You can migrate all tables, constraints, security policies, and records directly into your Supabase project using either of the two turnkey methods below:

### Method 1: Instant SQL Editor (1-Click - Recommended)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and navigate to your project.
2. In the left sidebar, click on **SQL Editor** -> **New query**.
3. Copy the entire contents of [`supabase_schema_and_data.sql`](file:///c:/borrow_system/supabase_schema_and_data.sql) from the root of this project.
4. Paste it into the SQL Editor and click **Run**.
5. All 6 tables (`categories`, `users`, `equipment`, `borrow_requests`, `notifications`, `audit_logs`), Row Level Security policies, indexes, and seeded data across BSIT, BSHM, BSCRIM, and BSED will be instantly created and populated!

---

### Method 2: Automated Node.js CLI Transfer Script
To transfer the data programmatically using the official `@supabase/supabase-js` client:

1. Obtain your **Project URL** and **Service Role Key** (or anon key) from:
   `Supabase Dashboard` -> `Project Settings` -> `API`.
2. Run the automated migration command:
   ```bash
   node server/scripts/transfer_to_supabase.js <YOUR_SUPABASE_URL> <YOUR_SERVICE_ROLE_KEY>
   ```
   *Or* set them in `server/.env`:
   ```env
   SUPABASE_URL=https://xyzcompany.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
   and execute:
   ```bash
   npm run transfer:supabase
   ```

---

## 👥 User Roles & Demo Credentials

The system includes pre-seeded demo personas for instant one-click or manual evaluation:

| Role | Email | Password | Department / Intended Workflow |
| :--- | :--- | :--- | :--- |
| **Student (BSIT)** | `student@campusequip.edu` | `student123` | Bachelor Science of information technology(BSIT) • Active loan for Fluke Cable Verifier |
| **Student (BSCRIM)** | `maria.santos@campusequip.edu` | `student123` | Bachelor Science of Criminology(BSCRIM) • Overdue loan for Evidence Camera Kit |
| **Student (BSHM)** | `gabriel.ramos@campusequip.edu` | `student123` | Bachelor Science of hospitality Management(BSHM) • Pending Sous-Vide request |
| **Student (Education)** | `claire.mendoza@campusequip.edu` | `student123` | Bachelor Science of Education • Approved request for Document Camera |
| **Faculty Member** | `dr.reyes@campusequip.edu` | `password123` | Bachelor Science of information technology(BSIT) • Returned Switch record |
| **Lab Custodian / Staff** | `custodian@campusequip.edu` | `staff123` | Review pending queue, approve/reject, release/dispatch, inspect returns & restock |
| **System Administrator** | `admin@campusequip.edu` | `admin123` | Master inventory CRUD, category management, role assignments, audit logs & analytics |

*(Note: The navigation bar includes an instant **"Switch Role"** pill to switch personas without retyping credentials.)*

---

## 📂 Project Structure

```
c:\borrow_system
├── client/                     # Vite React Tailwind Frontend
│   ├── dist/                   # Production build output
│   ├── src/
│   │   ├── components/
│   │   │   ├── Badge.jsx               # Status, Condition, & Role pills
│   │   │   ├── Navbar.jsx              # Responsive header, persona switcher, alerts
│   │   │   ├── BorrowRequestModal.jsx  # Interactive loan request with date validation
│   │   │   ├── ApprovalModal.jsx       # Custodian approve/reject review modal
│   │   │   ├── ReturnInspectionModal.jsx # Check-in & condition assessment modal
│   │   │   └── DigitalBorrowSlip.jsx   # Printable official loan receipt with barcode
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Global user state, JWT tokens, notifications
│   │   ├── pages/
│   │   │   ├── CatalogPage.jsx         # Live search, multi-filter catalog & stock meter
│   │   │   ├── BorrowerDashboard.jsx   # Student portal: active loans & slips
│   │   │   ├── StaffDashboard.jsx      # Custodian portal: approvals, dispatch, returns
│   │   │   ├── AdminDashboard.jsx      # Master inventory CRUD, users, charts, audit
│   │   │   ├── LoginPage.jsx           # Sign in with one-click demo credentials
│   │   │   ├── RegisterPage.jsx        # Account registration with student/faculty ID
│   │   │   └── ProfilePage.jsx         # Account settings and password change
│   │   ├── services/
│   │   │   └── api.js                  # Centralized API fetch client with JWT interceptor
│   │   ├── App.jsx                     # Root application routing
│   │   ├── main.jsx                    # React entry point
│   │   └── index.css                   # Tailwind directives & print styling
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Express REST API & Database
│   ├── controllers/
│   │   ├── authController.js           # Register, login, profile, stats
│   │   ├── equipmentController.js      # Inventory search, filter, CRUD
│   │   ├── borrowController.js         # Request submission, approval, dispatch, return
│   │   ├── categoryController.js       # Classification CRUD
│   │   ├── userController.js           # Account administration & roles
│   │   ├── statsController.js          # Aggregated metrics & analytics
│   │   ├── notificationController.js   # In-app user notifications
│   │   └── auditController.js          # Security audit trail
│   ├── db/
│   │   ├── database.js                 # SQLite schema, indices, helpers
│   │   └── seed.js                     # High-fidelity realistic university seeder
│   ├── middleware/
│   │   ├── auth.js                     # JWT verification & RBAC guard
│   │   └── errorHandler.js             # Centralized 404 & error handlers
│   ├── routes/                         # Modular Express routers
│   ├── tests/
│   │   ├── test_api.js                 # 20 automated integration tests
│   │   └── verify_frontend_and_api.js  # Production frontend delivery verification
│   ├── data/
│   │   └── campusequip.db              # SQLite Database file (auto-created)
│   ├── package.json
│   └── server.js                       # Primary server entry & static SPA host
├── package.json                # Root package configuration
├── .env.example                # Environment variable reference
└── README.md                   # Full documentation
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v24 LTS recommended)
- **npm**: v9.0.0 or higher

### 2. Quick Setup & Start (Production Mode)
Running the entire application on port `5000` (serving both the REST API and the React single-page frontend):

```bash
# 1. Seed the database with sample university equipment & accounts
npm run seed

# 2. Build the client frontend (already pre-built in repository)
npm run build

# 3. Start the production server
npm start
```
Open your browser to: **`http://localhost:5000`**

---

### 3. Development Mode (with Live Hot-Reload)

To run the backend API and the Vite frontend with Hot-Module-Replacement simultaneously:

**Terminal 1 (Backend API):**
```bash
npm run dev:server
# Starts API on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
# Starts Vite HMR on http://localhost:5173 (proxies /api to 5000)
```
Open your browser to: **`http://localhost:5173`**

---

## 🧪 Testing & Verification

The application features automated integration test suites validating all API endpoints, database state transitions, inventory race conditions, and frontend delivery:

```bash
# Run the 20-step API & database lifecycle test suite:
npm test

# Run the complete test suite including production SPA delivery:
npm run test:all
```

**Test Suite Coverage:**
- ✅ Server health check
- ✅ User login (student, custodian, admin)
- ✅ Token verification & `/api/auth/me`
- ✅ Registration & duplicate email prevention
- ✅ Equipment catalog search & multi-category filtering
- ✅ Admin equipment creation & deletion
- ✅ Role-based permission enforcement (403 on unauthorized borrower creation)
- ✅ Borrow request submission & reference code generation
- ✅ Custodian request approval
- ✅ Physical dispatch & handover (inventory stock decrements from 3 to 2)
- ✅ Physical return & condition inspection (inventory stock restored back to 3)
- ✅ In-app notifications delivery
- ✅ Live system summary metrics & analytics charts
- ✅ SPA fallback routing & index.html delivery

---

## 🔒 Security Architecture

1. **Password Hashing**: `bcryptjs` with salt rounds = 10. Passwords are never stored or logged in plain text.
2. **Stateless JWT Authentication**: Tokens signed with high-entropy secret; verified per request.
3. **Role-Based Access Control (RBAC)**: Middleware strictly validates role permissions (`admin`, `staff`, `borrower`) before allowing mutations.
4. **SQL Injection Defense**: 100% parameterization using SQLite prepared statements (`db.prepare('... WHERE id = ?').get(id)`).
5. **Inventory Integrity**: Stock adjustments are atomically executed inside database transactions, ensuring available inventory cannot drop below zero.
6. **Immutable Audit Trail**: All checkouts, approvals, condition inspections, and equipment adjustments record the actor, timestamp, and metadata into `audit_logs`.

---

## 📄 License
This project is released under the MIT License.

#   e q u i p m e n t _ b o r r o w i n g  
 

## Production deployment (Render)

CampusEquip can run as **one Render Web Service**: Render builds the React/Vite frontend, then the Express server serves the frontend and API from the same domain. This keeps deployment simple and avoids frontend CORS configuration.

### Render setup

1. Push this repository to GitHub and open [Render](https://render.com).
2. Choose **New + → Blueprint** and connect this repository. Render will read the root-level `render.yaml`.
3. Review the Blueprint. It creates one Node.js Web Service and a **1 GB persistent disk** mounted at `/var/data`.
4. SQLite needs a persistent disk. Render persistent disks require a paid service plan; a free web service has an ephemeral filesystem and is **not suitable for storing real CampusEquip records**.
5. For this single-service setup, leave `CLIENT_URL` unset.
6. Deploy. Render builds with `npm install && npm run build:client` and starts with `npm start`.
7. When deployment finishes, open `https://YOUR-SERVICE.onrender.com/api/health`. It should return JSON containing `"status":"healthy"`.

### Render environment variables

The Blueprint configures these values:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_PATH` | `/var/data/campusequip.db` |
| `JWT_SECRET` | Generated securely by Render |
| `CLIENT_URL` | Optional; leave unset for the unified frontend/API domain |

Do not expose `JWT_SECRET` in frontend variables or share it publicly.

### Important database and security notes

- The backend currently uses SQLite directly. The persistent disk is essential because Render's normal service filesystem is ephemeral. Keep the disk mounted at `/var/data` and do not change `DATABASE_PATH` unless you also change the disk mount.
- The existing Supabase schema and transfer script do **not** switch the live API to PostgreSQL just by setting `SUPABASE_URL`.
- The existing `supabase_schema_and_data.sql` starts by dropping six tables. **Do not run it on a Supabase project containing data unless you intentionally want those tables and records deleted.** Back up and review it first.
- The startup script seeds demo data only when the database has no users. Do not run the standalone seed command against a production database with real users or transactions; the seed script may clear existing data.
- Change or remove all demo accounts/passwords before inviting real users. Keep `JWT_SECRET` private.

### Smoke test

Test borrower registration/login, staff approval/dispatch/return workflows, admin inventory/category/user management, audit logs, nested-page refresh, and persistence after a Render redeploy. Confirm records remain after redeployment before opening the system to real users.

### Optional: separate frontend hosting

The recommended setup serves both frontend and backend from one Render Web Service. If you later host the frontend separately, set `VITE_API_URL` to the backend service origin (without `/api`) and set the backend's `CLIENT_URL` to the frontend origin. Do not put backend secrets in any `VITE_*` variable.
