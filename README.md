# 🏫 School Management System (SMS) — Ghana K-12 & SHS Edition

A production-grade, full-stack **School Management System (SMS)** built for K–12 (basic + Senior High Schools) in Ghana. The system digitizes student admissions, 3-term academic setup, attendance registers, WAEC grading with PDF report card generation, fee invoicing in GHS (₵), Mobile Money payment tracking, timetable scheduling, announcements, and multi-role dashboards.

---

## 🌟 Key Features & Core Modules

### 🔐 1. Multi-Role Access Control (RBAC)
Supports 8 distinct user roles with role-aware navigation and API guards:
- **Super Admin**: Full system setup, user administration, and academic year configuration.
- **Registrar Admin**: Student admissions, staff management, and class stream assignments.
- **Subject Teacher**: Class mark entry, subject timetable schedule, and continuous assessment.
- **Form / Homeroom Teacher**: Homeroom overview, student remarks, class position rank computation, and attendance.
- **Bursar / Accountant**: Fee structure setup in GHS, bulk invoicing, Mobile Money (MTN MoMo, Telecel Cash, AT Money) payment recording, receipts, and defaulters tracking.
- **Student**: View personalized timetable, WAEC grades, attendance history, and fee balance.
- **Parent / Guardian**: Multi-child ward linking, SMS absence alerts, fee balance, and report card access.
- **Librarian**: Book inventory catalog, ISBN records, and borrowing tracking.

### 🇬🇭 2. Ghana Regional & Academic Customizations
- **3-Term Structure**: Term 1, Term 2, Term 3 under Academic Year (e.g. 2025/2026).
- **WAEC / GES Standard Grading Scale**: Auto-computes weighted scores (Class Score 30% + Terminal Exam 70%) and assigns letter grades (A1, B2, B3, C4, C5, C6, D7, E8, F9) and position ranks in class.
- **Official Branded PDF Report Cards**: Achimota School header, motto ("Ut Omnes Unum Sint"), logo, GHS badge, subject marksheet, and printable PDF preview.
- **Ghanaian Currency (GHS ₵) & Mobile Money Payments**: MTN MoMo, Telecel Cash, AT Money, Cash, Bank Transfer, and printable fee receipts.
- **Automated Parent SMS Broadcasts**: SMS gateway alerts for student absences and PTA notices via Hubtel/Twilio APIs.

### 📅 3. Timetable Builder & Conflict Engine
- Weekly matrix grid (Monday - Friday, 8 daily periods).
- **Teacher Double-Booking & Room Conflict Engine**: Real-time validation preventing double-booking across streams.

---

## 🛠 Tech Stack

- **Frontend**: Vite + React 18 + TypeScript, Tailwind CSS, Lucide React icons, TanStack Query (React Query), Zustand, React Router v6, Recharts.
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, SQLite (local dev) / PostgreSQL, JWT Authentication with RBAC middleware, Zod validation.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/Collins-Munufie/SMS.git
cd SMS

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Migration & Ghana Seeding
```bash
cd backend
npm run db:push
npm run db:seed
```

### 4. Run Development Servers

**Option A: Running from Root Directory**
```bash
npm run dev:backend
# In a new terminal tab:
npm run dev:frontend
```

**Option B: Running in Individual Folders**
- Backend API (`http://localhost:5000` or `5004`):
  ```bash
  cd backend
  npm run dev
  ```
- Frontend App (`http://localhost:5173` or `5174`):
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🔑 Demo Login Accounts

All demo accounts use the default password: `Password123!`

| Role | Demo Email | Key Access |
|---|---|---|
| **Super Admin** | `superadmin@achimota.edu.gh` | Full System Configuration |
| **Registrar Admin** | `registrar@achimota.edu.gh` | Admissions & Staff Allocations |
| **Subject Teacher** | `kwaku.browning@achimota.edu.gh` | Mathematics Grade Entry |
| **Form Teacher** | `abena.mensah@achimota.edu.gh` | JHS 1 Gold Homeroom & Remarks |
| **Bursar / Accountant** | `accountant@achimota.edu.gh` | GHS Invoices & MoMo Receipts |
| **Student** | `kwame.osei@student.achimota.edu.gh` | Student Index `SMS-2025-001` |
| **Parent** | `kofi.osei@parent.com` | Linked Ward: Kwame Osei |
| **Librarian** | `librarian@achimota.edu.gh` | Library Inventory |

*(Tip: Use the **Role Switcher Dropdown** in the top right header to instantly switch between roles during development!)*

---

## 📄 License
This project is licensed under the ISC License.
