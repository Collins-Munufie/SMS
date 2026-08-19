# 🏫 School Management System (SMS) — Ghana Basic Education Edition (KG 1 – Basic 9)

A production-grade, full-stack **School Management System (SMS)** strictly tailored for the Ghanaian basic education system (Kindergarten, Primary, and Junior High School / JHS). The system digitizes student records, 3-term academic setup, attendance registers, WAEC basic grading, branded PDF report card generation, fee invoicing in GHS (₵), Mobile Money payment tracking, timetable scheduling, announcements, and multi-role dashboards.

---

## 🇬🇭 Ghanaian Basic Education Class Structure

The system is pre-configured for the 11 sequential Ghanaian basic education levels ONLY (SHS is excluded):

1. **Kindergarten (KG)**: `KG 1`, `KG 2`
2. **Primary / Basic**: `Basic 1`, `Basic 2`, `Basic 3`, `Basic 4`, `Basic 5`, `Basic 6`
3. **Junior High School (JHS)**: `Basic 7`, `Basic 8`, `Basic 9` *(Terminal BECE Level)*

Each class level supports multiple streams/sections (*e.g. Basic 4A, Basic 4B, Basic 7 Gold, Basic 9 BECE Candidate Class*). Promotion logic strictly follows this sequential progression, concluding at Basic 9 BECE graduation.

---

## 🌟 Core Modules

### 🔐 1. Multi-Role Access Control (RBAC)
Supports 8 distinct user roles with role-aware navigation and API guards:
- **Super Admin**: Full system setup, user administration, and academic year configuration.
- **Registrar Admin**: Student admissions, staff management, and basic class stream assignments.
- **Subject Teacher**: Class mark entry, subject timetable schedule, and continuous assessment.
- **Form / Homeroom Teacher**: Homeroom overview, student remarks, class position rank computation, and attendance.
- **Bursar / Accountant**: Fee structure setup in GHS, bulk invoicing, Mobile Money (MTN MoMo, Telecel Cash, AT Money) payment recording, receipts, and defaulters tracking.
- **Student**: View personalized timetable, WAEC basic grades, attendance history, and fee balance.
- **Parent / Guardian**: Multi-child ward linking, SMS absence alerts, fee balance, and report card access.
- **Librarian**: Book inventory catalog, ISBN records, and borrowing tracking.

### 📜 2. Grading & Official Branded PDF Report Cards
- **Continuous Assessment (30%) + Terminal Exam (70%)**.
- **WAEC / GES Standard Grading Scale**: Auto-computes weighted total scores and assigns letter grades (A1, B2, B3, C4, C5, C6, D7, E8, F9) and position ranks in class (*1st Out of 35*).
- **Official Branded PDF Report Cards**: Achimota Basic School header, motto ("Knowledge, Character & Excellence"), logo, subject marksheet, and printable PDF preview.

### 💰 3. Ghanaian Currency (GHS ₵) & Mobile Money Payments
- Itemized tuition, canteen, PTA dues, and terminal exam fee structures in GHS (₵).
- **Mobile Money Payment Engine**: MTN MoMo, Telecel Cash, AT Money, Cash, Bank Transfer, and printable fee receipts (*`REC-2025-001`*).

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

### 3. Database Migration & Ghana Basic Seeding
```bash
cd backend
npm run db:push
npm run db:seed
```

### 4. Run Development Servers

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend App):**
```bash
cd frontend
npm run dev
```

---

## 🔑 Demo Login Accounts

All demo accounts use the default password: `Password123!`

| Role | Demo Email | Key Access |
|---|---|---|
| **Super Admin** | `superadmin@achimotabasic.edu.gh` | Full System Configuration |
| **Registrar Admin** | `registrar@achimotabasic.edu.gh` | Admissions & Staff Allocations |
| **Subject Teacher** | `kwaku.browning@achimotabasic.edu.gh` | Mathematics Grade Entry |
| **Form Teacher** | `abena.mensah@achimotabasic.edu.gh` | Basic 7 Homeroom & Remarks |
| **Bursar / Accountant** | `accountant@achimotabasic.edu.gh` | GHS Invoices & MoMo Receipts |
| **Student** | `kwame.osei@student.achimotabasic.edu.gh` | Basic 7 Student `SMS-2025-001` |
| **Parent** | `kofi.osei@parent.com` | Linked Ward: Kwame Osei |
| **Librarian** | `librarian@achimotabasic.edu.gh` | Library Inventory |

---

## 📄 License
This project is licensed under the ISC License.
