# ParkSense — Smart Parking Monitoring System

> **Tagline:** Smart Parking. Simpler Days.  
> **Course Project:** First-Year CSE Design Thinking Engineering Project

---

## 1. Project Overview

**ParkSense** is a full-stack, real-time smart parking management and monitoring platform designed to eliminate parking congestion in modern urban and campus facilities. It enables drivers to browse space availability in real time, inspect bay attributes (EV charging, accessibility), and make concurrency-safe reservations ahead of arrival.

For facility supervisors, ParkSense provides an **Administrator Control Center** equipped with an **Interactive Hardware Sensor Simulator**, live occupancy analytics, and full bay and reservation supervision.

### Core Capabilities
- **Real-Time Interactive Parking Map:** Floor-by-floor layout (Ground Floor, Level 1, Level 2) with entrance/exit driving circulation lanes, two-row bay alignments, and live availability indicators.
- **Mandatory Parking Status Colors:**
  - 🟢 **Available / Free:** Green (`#16A34A`)
  - 🔴 **Occupied:** Red (`#DC2626`)
  - 🔵 **Reserved:** Blue (`#2563EB`)
  - 🟡 **Service / Maintenance:** Yellow / Amber (`#EAB308`)
  - *Strict Rule: An occupied parking space is always red, never green.*
- **Concurrency-Safe Reservation Engine:** PostgreSQL row-level locks and `EXCLUDE USING gist` constraints prevent double-booking collisions, even if two drivers attempt to book the identical slot simultaneously.
- **Out-of-the-Box Local Demo Store:** Runs seamlessly offline using an in-memory & `localStorage`-backed store with cross-tab broadcast synchronization. When Supabase environment variables are provided, seamlessly transitions to cloud database and realtime subscriptions.
- **Hardware Sensor Simulator:** Dedicated admin controls to simulate vehicle arrival and departure events for evaluation and demonstration.
- **Role-Based Access Control (RBAC):** Strict separation between ordinary drivers and facility administrators enforced via route guards and Supabase Row Level Security (RLS) policies.
- **Data-Backed Facility Analytics:** Real metrics computing actual space distribution, booking lifecycles, and floor utilization.

---

## 2. Technology Stack

- **Frontend:** React 18, TypeScript (Strict Mode), Vite
- **Styling:** Tailwind CSS, PostCSS (Tailored navy & clean brand palette)
- **Routing:** React Router v6 with authenticated and administrator route guards
- **Backend & Database:** Supabase PostgreSQL with extensions (`uuid-ossp`, `btree_gist`) + Local fallback demo store
- **Authentication:** Supabase Auth (Email & Password, persistent JWT sessions) + One-click demo roles
- **Realtime:** Supabase Realtime Channels (PostgreSQL WAL subscriptions) + BroadcastChannel cross-tab sync
- **Forms & Validation:** React Hook Form & Zod
- **Icons & Visuals:** Lucide React (accessible SVGs)
- **Charts:** Recharts
- **Testing:** Vitest, React Testing Library, Playwright (End-to-End browser automation)

---

## 3. Prerequisites

- **Node.js:** v18.0.0 or newer (Tested on Node v20+ / v22+)
- **npm:** v9.0.0 or newer
- **Supabase Account (Optional for cloud backend):** Free tier at [supabase.com](https://supabase.com)

---

## 4. Installation & Local Development

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/parksense.git
cd parksense
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables (Optional)
The application works immediately in local demonstration mode without external dependencies.

To connect to a live Supabase cloud project, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(Obtain these from your Supabase Dashboard under **Project Settings → API**).*

### Step 4: Run Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 5. Demonstration Accounts

ParkSense provides two built-in demonstration roles:

| Account Role | Username | Password | Redirect Destination |
|---|---|---|---|
| **Administrator** | `admin` | `admin` | `/admin` |
| **Customer** | `customer` | `1234` | `/dashboard` |

On the login page, you can click **Admin Demo Account** or **Customer Demo Account** for instant one-click login.

---

## 6. Testing & Quality Assurance

ParkSense features comprehensive unit, component, and end-to-end browser test suites:

### Run Unit & Integration Tests (Vitest)
```bash
npm test
```
*Executes all 62 unit and component tests.*

### Run End-to-End Tests (Playwright)
```bash
npm run test:e2e
```
*Executes all 23 browser automation tests covering login, parking reservations, arrival/departure simulations, real-time cross-tab sync, responsive layouts, and status color verification.*

### Run TypeScript Type Check
```bash
npm run type-check
```

### Build Production Bundle
```bash
npm run build
```

---

## 7. Deployment to Vercel

ParkSense is configured for 1-click deployment on [Vercel](https://vercel.com):

1. **Push your code to GitHub** (see GitHub publish instructions).
2. **Import Project into Vercel:**
   - Log in to your Vercel Dashboard.
   - Click **Add New... → Project**.
   - Select your `parksense` repository from GitHub.
3. **Configure Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. **Environment Variables (Optional):**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if connecting to cloud database.
   - If omitted, ParkSense automatically functions in client-side demonstration mode with zero runtime errors.
5. **Client-Side Routing (SPA Fallback):**
   - The repository includes [`vercel.json`](./vercel.json) with SPA rewrites configured so direct links and page refreshes on `/parking`, `/dashboard`, or `/admin` route properly.
6. Click **Deploy**.

---

## 8. Application Route Reference

| Route | Access | Description |
|---|---|---|
| `/` | Public | Automatic redirect to `/dashboard` (if authenticated) or `/parking` |
| `/login` | Public | Authentication with email/username and one-click demo credentials |
| `/register` | Public | Driver account registration |
| `/parking` | Public / Driver | Interactive campus floor layout, bay selection, check-in, advance reservations |
| `/dashboard` | Driver | Personal metrics overview, quick check-in banner, active reservation |
| `/bookings` | Driver | Reservation management and cancellation |
| `/activity` | Driver | Parking session and transaction history |
| `/profile` | Driver / Admin | User profile and system settings |
| `/admin` | Admin Only | Administrator Control Center and operational overview |
| `/admin/parking` | Admin Only | Bay management inventory table and hardware sensor simulator |
| `/admin/bookings` | Admin Only | Global reservation audit and administrative cancellation |
| `/admin/analytics` | Admin Only | Occupancy pie charts, booking lifecycle bars, and zone statistics |

---

## 9. License & Academic Attribution

- **Product:** ParkSense — Smart Parking Monitoring System
- **Engineering:** First-Year CSE Design Thinking Project
- **Built With:** React, TypeScript, Vite, Tailwind CSS, Supabase, Playwright
