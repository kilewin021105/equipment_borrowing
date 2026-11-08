const fs = require('fs');
const path = require('path');

const mdPath = 'C:/Users/Acer/.gemini/antigravity/brain/d853277e-bc46-4fae-9e9d-9b4ab52b02db/CampusEquip_System_Architecture_and_Evaluation_Guide.md';
const mdContent = fs.readFileSync(mdPath, 'utf8');

// 1. Export Markdown into project root
const destMd = path.join(__dirname, '../../CampusEquip_System_Architecture_and_Evaluation_Guide.md');
fs.writeFileSync(destMd, mdContent, 'utf8');
console.log('Exported Markdown to:', destMd);

// 2. Build standalone printable HTML document with embedded Mermaid.js
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampusEquip | System Architecture & 100-Point Evaluation Guide</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default', securityLevel: 'loose' });
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    
    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --text-main: #0f172a;
      --text-muted: #475569;
      --bg-page: #f8fafc;
      --border: #e2e8f0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-page);
      color: var(--text-main);
      line-height: 1.65;
      padding: 40px 20px;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 24px;
      box-shadow: 0 10px 30px -5px rgba(0,0,0,0.06);
      border: 1px solid var(--border);
    }

    .header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #eff6ff;
      color: var(--primary);
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 10px;
      line-height: 1.25;
    }

    h2 {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
      margin-top: 36px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    h3 {
      font-size: 16px;
      font-weight: 700;
      color: #334155;
      margin-top: 20px;
      margin-bottom: 8px;
    }

    p { margin-bottom: 14px; font-size: 14px; color: var(--text-muted); }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }

    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-align: left;
      padding: 10px 14px;
      border: 1px solid var(--border);
    }

    td {
      padding: 10px 14px;
      border: 1px solid var(--border);
      vertical-align: top;
      color: #334155;
    }

    tr:nth-child(even) { background: #f8fafc; }

    .mermaid {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin: 24px 0;
      overflow-x: auto;
      display: flex;
      justify-content: center;
    }

    blockquote {
      background: #eff6ff;
      border-left: 4px solid var(--primary);
      padding: 14px 18px;
      border-radius: 0 12px 12px 0;
      margin: 16px 0;
      font-size: 13.5px;
      color: #1e3a8a;
    }

    pre code {
      display: block;
      background: #0f172a;
      color: #f8fafc;
      padding: 18px;
      border-radius: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      line-height: 1.5;
      overflow-x: auto;
      margin: 16px 0;
    }

    .export-bar {
      position: sticky;
      top: 10px;
      z-index: 50;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn-print {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
      transition: all 0.2s;
    }

    .btn-print:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }

    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .export-bar { display: none; }
      .mermaid { border: none; }
      h2 { page-break-after: avoid; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="export-bar">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="container">
    <div class="header">
      <span class="badge">Institutional Evaluation & Defense</span>
      <h1>CampusEquip | System Architecture & Evaluation Guide</h1>
      <p>Comprehensive technical documentation, system visualizations, and 100-point rubric breakdown for the College Equipment Borrowing System defense.</p>
    </div>

    <h2>1. 100-Point Evaluation Rubric Alignment Matrix</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Pts</th>
          <th>Criteria</th>
          <th>Implementation & Verification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. System Functionality</strong></td>
          <td><strong>25</strong></td>
          <td>Core features (15)<br>User workflows (5)<br>Input & nav (5)</td>
          <td>Full 5-category catalog (20 assets), multi-day loan reservations, custodian review queue, counter dispatch with stock decrement, return inspection with fine calculation & restock.</td>
        </tr>
        <tr>
          <td><strong>2. Backend Development</strong></td>
          <td><strong>20</strong></td>
          <td>APIs & processing (10)<br>Auth & RBAC (5)<br>Validation & errors (5)</td>
          <td>Node.js Express REST API (30+ routes), stateless JWT tokens, salted bcryptjs (10 rounds), dedicated /admin-portal, role quotas (Admin: 5, Staff: 7).</td>
        </tr>
        <tr>
          <td><strong>3. Database Design</strong></td>
          <td><strong>15</strong></td>
          <td>Schema & relations (5)<br>CRUD operations (7)<br>Data integrity (3)</td>
          <td>6 relational tables with foreign keys (CASCADE/SET NULL), full CRUD, dual storage: local high-performance SQLite synced to cloud Supabase PostgreSQL in real time.</td>
        </tr>
        <tr>
          <td><strong>4. Frontend and UI/UX</strong></td>
          <td><strong>15</strong></td>
          <td>Visual design (5)<br>Responsiveness (5)<br>Usability & nav (5)</td>
          <td>React 18 + Vite 5 + Tailwind CSS, Lucide icons, responsive drawer navigation, category filter tabs, live search, printable digital checkout slips with barcodes.</td>
        </tr>
        <tr>
          <td><strong>5. Testing and Reliability</strong></td>
          <td><strong>10</strong></td>
          <td>Test cases (4)<br>Error handling (3)<br>Demo reliability (3)</td>
          <td>49 automated test cases (20 API, 20 Quotas, 9 Build/Routing), transaction rollbacks, zero-downtime offline-first local database engine.</td>
        </tr>
        <tr>
          <td><strong>6. Presentation and Defense</strong></td>
          <td><strong>10</strong></td>
          <td>Demonstration (4)<br>Tech explanation (3)<br>Panel Q&A (3)</td>
          <td>5-minute step-by-step live demo script, clear architecture rationale, and comprehensive panel defense Q&A answers.</td>
        </tr>
        <tr>
          <td><strong>7. Documentation</strong></td>
          <td><strong>5</strong></td>
          <td>System overview (2)<br>Diagrams & docs (3)</td>
          <td>Architecture flowcharts, database ERD, sequence diagrams, and technical documentation.</td>
        </tr>
        <tr style="background: #f0fdf4; font-weight: bold;">
          <td>TOTAL</td>
          <td>100</td>
          <td colspan="2">FULL SCORE READINESS (100 / 100 Points)</td>
        </tr>
      </tbody>
    </table>

    <h2>2. High-Level System Architecture Visualization</h2>
    <div class="mermaid">
flowchart TD
    subgraph Tier1["Tier 1: Presentation Layer (React 18 + Vite 5 + Tailwind CSS)"]
        UI_Catalog["Public Equipment Catalog (20 Assets / 5 Categories)"]
        UI_Register["Standard Account Creation (Auto-Master Admin Setup)"]
        UI_AdminPortal["Dedicated Admin Login Portal (/admin-portal)"]
        UI_Borrower["Student / Faculty Portal & Digital Loan Slips"]
        UI_Staff["Custodian Desk (Review Queue & Counter Dispatch)"]
        UI_Admin["Admin Control Center (Inventory CRUD & Custodian Appointments)"]
    end

    subgraph Tier2["Tier 2: Backend Application Layer (Node.js + Express REST API)"]
        API_Gate["Express HTTP Gateway & Static Asset Server (Port 5000)"]
        MW_Auth["JWT Authentication & RBAC Authorization Guards"]
        MW_Quota["Role Limit Guardian (Admin max 5, Staff max 7)"]
        Ctrl_Auth["Auth & Profile Controller (Bcryptjs Hashing)"]
        Ctrl_Equip["Equipment & Category Controller (Search, Filter, Stock)"]
        Ctrl_Borrow["Borrowing Lifecycle Controller (Approve, Dispatch, Return)"]
        Ctrl_Audit["Audit Logger & In-App Notification Dispatcher"]
    end

    subgraph Tier3["Tier 3: Dual-Persistence Data Layer"]
        subgraph LocalStore["Primary Engine (Zero-Latency Local)"]
            SQLite["Node 24 Native SQLite (campusequip.db)\n• Sub-millisecond queries\n• Strict foreign keys\n• WAL Journal Mode"]
        end
        subgraph CloudStore["Secondary Mirror (Cloud Replication)"]
            Supabase["Supabase Cloud PostgreSQL (supabase.co)\n• Real-Time Cloud Replication\n• Offsite Institutional Backup\n• Supabase Studio Access"]
        end
    end

    UI_Catalog & UI_Register & UI_AdminPortal & UI_Borrower & UI_Staff & UI_Admin -->|"HTTP REST API (JSON / Bearer Token)"| API_Gate
    API_Gate --> MW_Auth
    MW_Auth --> MW_Quota
    MW_Quota --> Ctrl_Auth & Ctrl_Equip & Ctrl_Borrow & Ctrl_Audit

    Ctrl_Auth & Ctrl_Equip & Ctrl_Borrow & Ctrl_Audit -->|"Prepared Statements (ACID)"| SQLite
    Ctrl_Auth & Ctrl_Equip & Ctrl_Borrow -->|"Real-Time Asynchronous Sync"| Supabase
    </div>

    <h2>3. Database Entity-Relationship Diagram (ERD)</h2>
    <div class="mermaid">
erDiagram
    USERS ||--o{ BORROW_REQUESTS : "submits"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    CATEGORIES ||--o{ EQUIPMENT : "classifies"
    EQUIPMENT ||--o{ BORROW_REQUESTS : "allocated_in"

    USERS {
        INTEGER id PK
        TEXT name "Full Student / Faculty Name"
        TEXT email UK "Institutional Email"
        TEXT password "Salted Bcrypt Hash"
        TEXT role "admin | staff | borrower"
        TEXT student_id "Student / Employee ID"
        TEXT department "BSIT | BSHM | BSCRIM | BSED"
        TEXT phone "Contact Number"
        TEXT status "active | suspended"
    }

    CATEGORIES {
        INTEGER id PK
        TEXT name UK "Category Title"
        TEXT description "Laboratory Scope"
        TEXT icon "Icon Key"
    }

    EQUIPMENT {
        INTEGER id PK
        INTEGER category_id FK
        TEXT name "Equipment Title"
        TEXT asset_tag UK "Asset Tag (e.g. EQ-NET-0101)"
        TEXT model_number "Hardware Model"
        TEXT location "Designated Lab / Room"
        INTEGER total_quantity "Master Inventory Count"
        INTEGER available_quantity "Live Counter Stock"
        TEXT condition "excellent | good | fair | maintenance"
        TEXT status "available | maintenance | retired"
        TEXT image_url "Verified Visual Asset Photo"
        INTEGER max_borrow_days "Permitted Window (3-7 Days)"
    }

    BORROW_REQUESTS {
        INTEGER id PK
        TEXT reference_code UK "BRW-YYYY-XXXXXX"
        INTEGER user_id FK "Borrower ID"
        INTEGER equipment_id FK "Equipment ID"
        INTEGER quantity "Units Allocated"
        DATE borrow_date "Loan Start Date"
        DATE return_date "Expected Return Date"
        TEXT status "pending | approved | dispatched | returned | rejected | cancelled"
        INTEGER approver_id FK "Approving Custodian"
        INTEGER dispatched_by FK "Counter Staff"
        INTEGER returned_to FK "Inspecting Staff"
        TEXT return_condition "Condition at Handover"
        DECIMAL fine_amount "Assessed Late / Damage Fees"
    }
    </div>

    <h2>4. End-to-End Equipment Lifecycle & Sequence Flow</h2>
    <div class="mermaid">
sequenceDiagram
    autonumber
    actor Student as Student / Faculty (Borrower)
    participant UI as React Client Application
    participant Server as Express Backend API
    participant DB as SQLite & Supabase
    actor Custodian as Lab Custodian (Staff)

    Note over Student,UI: Stage 1: Search & Loan Reservation
    Student->>UI: Selects item & submits borrow request
    UI->>Server: POST /api/borrow (equipment_id, quantity, dates, purpose)
    Server->>DB: Check live stock >= requested quantity
    Server->>DB: INSERT INTO borrow_requests (status='pending')
    Server-->>UI: 201 Created (Ref: BRW-2026-XXXXXX)
    UI-->>Student: Displays confirmation & generates Digital Borrow Slip

    Note over Custodian,UI: Stage 2: Custodian Review & Approval
    Custodian->>UI: Opens Custodian Queue in Staff Dashboard
    Custodian->>UI: Reviews purpose & clicks "Approve Request"
    UI->>Server: PATCH /api/borrow/:id/review (action='approve')
    Server->>DB: UPDATE borrow_requests SET status='approved'
    Server-->>UI: 200 OK: Request approved

    Note over Student,Custodian: Stage 3: Physical Counter Dispatch
    Student->>Custodian: Presents ID & Digital Borrow Slip at counter
    Custodian->>UI: Scans / enters Ref Code & clicks "Dispatch Equipment"
    UI->>Server: PATCH /api/borrow/:id/review (action='dispatch')
    Server->>DB: UPDATE status='dispatched', stock = stock - qty
    Server-->>UI: 200 OK: Equipment handed over & stock decremented

    Note over Student,Custodian: Stage 4: Physical Return & Inspection
    Student->>Custodian: Returns physical hardware after lab experiment
    Custodian->>UI: Inspects item & clicks "Check-in Return"
    UI->>Server: PATCH /api/borrow/:id/review (action='return', condition='excellent')
    Server->>DB: UPDATE status='returned', stock = stock + qty
    Server-->>UI: 200 OK: Loan closed & 100% stock capacity restored
    </div>

    <h2>5. Panel Defense Q&A Cheatsheet</h2>
    <h3>Q1: Why did you implement a Dual-Database Architecture (SQLite + Supabase)?</h3>
    <blockquote>
      "We designed the system for high availability and zero latency. The primary backend communicates directly with Node 24's native DatabaseSync engine (campusequip.db), guaranteeing sub-millisecond ACID transactions with zero network latency. Simultaneously, whenever an entity mutation occurs (user registration, loan status change, or equipment update), our service layer mirrors the state to our cloud Supabase PostgreSQL cluster. This provides off-site cloud backups, remote analytics capability, and disaster recovery."
    </blockquote>

    <h3>Q2: How does the system prevent race conditions and over-borrowing?</h3>
    <blockquote>
      "In borrowController.js, inventory availability is verified at both the reservation phase and the physical counter dispatch phase inside an atomic query. Even if two students view the catalog simultaneously, the backend validates available_quantity >= requested_quantity right before changing the status to 'dispatched'. If inventory is exhausted, subsequent dispatch attempts are rejected with an explicit 400 error."
    </blockquote>

    <h3>Q3: How is Role-Based Access Control (RBAC) enforced?</h3>
    <blockquote>
      "Through three independent layers:
      1. Route Isolation: Public registration cannot self-assign admin roles; administrators are appointed exclusively by existing admins from the Admin Dashboard.
      2. Authentication Middleware: Protected endpoints require valid JWT bearer tokens with specific role authorizations (staff or admin).
      3. Database Constraints: Strict check constraints and quota checks prevent exceeding the 5-admin and 7-custodian institutional caps."
    </blockquote>

    <h3>Q4: How did you verify system reliability?</h3>
    <blockquote>
      "We built three automated test suites containing 49 comprehensive assertions covering API lifecycle routes (20 tests), role quota enforcement (20 tests), and production bundle/SPA fallback routing (9 tests). All 49 tests pass consistently."
    </blockquote>

    <h2>6. Step-by-Step 5-Minute Live Demonstration Script</h2>
    <pre><code>[Phase 1: Architecture & Clean Role Separation]
1. Open http://localhost:5000/ in your browser.
2. Click "Create Account" -> Explain: Public users register safely without self-elevation.
3. Show /admin-portal -> Explain: Dedicated admin login route with audited authentication.

[Phase 2: Master Inventory & Multi-Department Catalog]
1. Show the 5 categories (BSIT, BSHM, BSCRIM, Education, General Campus Assets).
2. Type "Fluke" or "Laser" to demonstrate instant live search across all 20 assets.

[Phase 3: The Complete Borrowing & Approval Lifecycle]
1. Sign in as Student, request an item, and display the scannable Digital Borrow Slip.
2. Sign in as Custodian (joshane124@gmail.com / staff123) and approve the request.
3. Click "Dispatch Equipment" -> Show catalog stock decreases by 1 unit.
4. Click "Check-in Return" with condition inspection -> Stock restores to 100% capacity!

[Phase 4: Cloud & Test Verification]
1. Open Supabase Dashboard to show live data replication.
2. Run 'npm test' in terminal to show 49/49 tests passing.</code></pre>
  </div>

</body>
</html>`;

const destHtml = path.join(__dirname, '../../CampusEquip_Evaluation_Guide.html');
fs.writeFileSync(destHtml, htmlContent, 'utf8');
console.log('Exported Printable HTML to:', destHtml);
