# FinFlow — Private Finance Management
> Product by MSR Solutions

A production-ready, full-stack web-based ERP engineered specifically for private finance, syndication deals, multi-party investor capital pools, automated repayment waterfall splits, and double-entry accounting journals.

---

## 🏛️ System Architecture

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query + React Hook Form + Recharts + Lucide Icons (Deployable on Vercel)
- **Backend**: Node.js + Express.js + TypeScript + REST API + JWT Authentication + RBAC (Deployable on Render)
- **Database & ORM**: PostgreSQL + Prisma ORM with arbitrary precision `Prisma.Decimal` arithmetic
- **Financial Subsystem**:
  - **Repayment Schedule Generator**: Flat, Reducing Balance (EMI), and Custom with Weekly/Bi-Weekly/Monthly/Daily frequencies
  - **Syndicate Funding Allocation Engine**: Pro-rata capital contribution verification (Company, Partners, Outside Investors)
  - **Repayment Waterfall & Distribution Engine**: Automated principal settlement, interest collection, investor ROI payouts, company management commissions, and partner profit allocations
  - **Internal Double-Entry Ledger**: Balanced Debit/Credit journal with automated Chart of Accounts integration
  - **Immutable Audit Trail & In-App Notification Center**
  - **Two Payment Schedules**: Client Payment Schedule (client letterhead) and Investor Payment Statement (individual ROI & WhatsApp text)

---

## 🚀 Quick Start Guide

### 1. Database & Backend Setup

```bash
cd server
npm install
npx prisma generate
# To run migrations or seed:
# npx prisma migrate dev
npm run prisma:seed
npm run dev
```
Backend will start on: `http://localhost:5000`

---

### 2. Frontend Client Setup

```bash
cd client
npm install
npm run dev
```
Frontend will start on: `http://localhost:5173`

---

## 🔐 Default Operator Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@financeerp.com` | `Admin@123456` |
| **Finance Manager** | `manager@financeerp.com` | `Manager@123456` |
| **Staff** | `staff@financeerp.com` | `Staff@123456` |
