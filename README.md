# 📦 Stock Manager

A modern, full-stack, offline-first inventory and sales management system. Built with a fast **React 19 & Tailwind CSS v4** frontend, a scalable **Node.js Express** backend API powered by **Prisma** & **PostgreSQL**, an integrated **AdminJS Back-office CMS**, and native mobile capabilities compiled via **Capacitor** into an Android APK.

---

## 🗺️ System Architecture

The following diagram illustrates how the system's components interact with each other:

```mermaid
graph TD
    subgraph Client Space
        ReactClient["React 19 Frontend Client<br>(Vite + Tailwind v4)"]
        CapacitorWrapper["Capacitor Native Android Wrapper<br>(com.psr.stockmanager)"]
        CapacitorWrapper -.->|Wraps & Bundles| ReactClient
    end

    subgraph Server Space
        ExpressServer["Express Node.js API Server<br>(Port 5001)"]
        AdminCMS["AdminJS CMS Dashboard<br>(Route: /admin)"]
        ExpressServer --- AdminCMS
    end

    subgraph Data Space
        DB[(PostgreSQL Database)]
    end

    ReactClient -->|REST API & JSON Sync| ExpressServer
    ExpressServer -->|Prisma ORM Client| DB
    AdminCMS -->|Manage Entities Directly| DB
```

---

## ✨ Features

- **📊 Comprehensive Dashboard**: Real-time Key Performance Indicators (KPIs), visual charts comparing sales and purchases, low-stock warnings, and recent transaction logs.
- **📦 Inventory Catalog (Items)**: Manage products with customizable names, descriptions, and low-stock notification thresholds.
- **💼 Transactions**:
  - **Purchases (Stock-In)**: Record inventory incoming from suppliers, complete with dates, quantities, and audit notes.
  - **Sales (Stock-Out)**: Record product sales to customers with validation rules to prevent selling below available inventory levels.
- **🤝 Partner Directories**:
  - **Suppliers**: Complete registry of vendor names, contact people, telephone numbers, emails, and physical addresses.
  - **Customers**: Complete registry of clients purchasing items from the inventory system.
- **🔄 Sync Pipeline**: Backend `/api/sync/pull` and `/api/sync/push` endpoints designed to enable local database synchronization, conflict checking, and offline availability.
- **🔒 Integrated Authentication**: Robust backend middleware using JWT-based tokens, bcryptjs password hashing, and cookie-supported sessions.
- **🛡️ Headless CMS (AdminJS)**: A powerful administrator portal hosted at `/admin` offering full-fledged database CRUD tools, secure password hashing on create/edit, and branding customizers.
- **🤖 Native Android Support**: Built-in Capacitor config file and a PowerShell automation script to fetch tools, accept SDK licenses, compile Gradle targets, and output a clean debug APK.

---

## 🛠️ Technology Stack

### Frontend Client
- **Framework**: React 19.1 (TypeScript)
- **Bundler**: Vite 7.3
- **Styling**: Tailwind CSS v4.0 + `@tailwindcss/typography`
- **UI & Primitives**: Radix UI + Custom theme variables + Lucide Icons + Framer Motion
- **Router**: Wouter (Lightweight client routing)
- **Data Fetching**: TanStack React Query v5 + Axios
- **Forms**: React Hook Form + Zod validation
- **Mobile Integration**: Capacitor 8.4 + Android SDK wrappers

### Backend Server
- **Platform**: Node.js & TypeScript (ES Modules)
- **Web Server**: Express.js v5.2 (Next-gen HTTP middleware wrapper)
- **ORM & Database**: Prisma Client v6.4 targeting a **PostgreSQL** database
- **CMS Admin Interface**: AdminJS v7.8 + `@adminjs/express` + `@adminjs/prisma`
- **Log System**: Pino + Pino Http + Pino Pretty
- **Validation**: Zod (API schema guards)
- **Security**: JWT (`jsonwebtoken`) + Cookie Parser + BcryptJS

---

## 📂 Project Structure

```text
sms/
├── backend/                       # Node.js Server Application
│   ├── prisma/
│   │   └── schema.prisma          # Prisma Schema Definition (PostgreSQL)
│   ├── src/
│   │   ├── api/                   # REST Endpoints (items, sales, sync, etc.)
│   │   │   ├── sync/              # Pull/Push local sync logic
│   │   │   └── api.router.ts      # Core API router
│   │   ├── cms/
│   │   │   └── admin.ts           # AdminJS Setup & Authentication router
│   │   ├── middleware/            # JWT authentication middleware
│   │   ├── lib/                   # Database instance, logger, and seed script
│   │   ├── app.ts                 # Express configuration and routes mounting
│   │   └── index.ts               # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                      # React SPA Client & Capacitor Code
│   ├── android/                   # Native Android Studio Project
│   ├── src/
│   │   ├── components/            # Shared UI components (Layout, inputs)
│   │   ├── hooks/                 # React custom hooks (Auth, API query wrappers)
│   │   ├── lib/                   # Axioms, API configurations, and type contracts
│   │   ├── pages/                 # UI Views (Dashboard, Items, Sales, etc.)
│   │   ├── App.tsx                # Client Routing and Providers
│   │   └── main.tsx               # Client bootstrap code
│   ├── capacitor.config.json      # Capacitor Configuration (com.psr.stockmanager)
│   ├── setup-and-build.ps1        # SDK auto-installer & APK compile script
│   ├── package.json
│   └── vite.config.ts             # Vite bundle & proxy settings
│
└── android-sdk/                   # Auto-created by build script for local builds
```

---

## 🚀 Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- A running [PostgreSQL](https://www.postgresql.org/) database
- PowerShell (if you wish to compile the Android APK on Windows)

### 1. Environment Configurations

Create a `.env` file inside the `backend` directory matching the variables below:

```ini
# Database URL (Prisma connection string)
DATABASE_URL="postgres://username:password@localhost:5432/stock_sync?sslmode=require"

# Port (Optional: Defaults to 5001 if omitted)
PORT=5001

# AdminJS Administrator Configuration
CMS_PASSWORD=admin_cms
CMS_COOKIE_PASSWORD=supersecretcookiepasswordmustbe32charslong
```

### 2. Backend Setup

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Deploy the Prisma database schema:
   ```bash
   npx prisma db push
   ```
3. Generate the Prisma Client types:
   ```bash
   npx prisma generate
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will boot on port `5001`, seed the default database administrator, and mount the AdminJS panel at `/admin`.*

### 3. Frontend Setup

1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
2. Start the Vite dev client:
   ```bash
   npm run dev
   ```
   *The client will boot on port `3000`. By default, Vite proxies requests from `/api` to the backend server running at `http://localhost:5001`.*

---

## 🔒 Credentials & Portals

### Web Portal Login
- **URL**: `http://localhost:3000`
- **Username**: `admin`
- **Password**: `admin123`
*Seeded automatically on server boot by `seedAdminUser`.*

### AdminJS Backoffice Dashboard
- **URL**: `http://localhost:5001/admin`
- **Email**: *(Any valid email format)*
- **Password**: `admin_cms` (or the value set in `CMS_PASSWORD` inside the `.env` configuration)
*Allows administrative table edits, row deletions, database status checks, and password modifications.*

---

## 🤖 Building the Android APK

The repository includes a PowerShell automation script `setup-and-build.ps1` inside the `frontend` folder. It provides a one-click setup that installs the Android SDK tools locally inside the workspace, eliminating complex global environment setups.

### Execution Steps
1. Open a PowerShell terminal in administrator mode.
2. Navigate to the script location:
   ```powershell
   cd frontend
   ```
3. Execute the script:
   ```powershell
   .\setup-and-build.ps1
   ```

### What the script does:
1. **Creates `android-sdk/` folder** in the root workspace directory.
2. **Downloads Android Command Line Tools** and extracts them automatically.
3. **Downloads and Installs OpenJDK 21** locally, matching version standards for Gradle compilations.
4. **Agrees to Android SDK licenses** programmatically.
5. **Downloads Platform Tools** (SDK-34 platform targets and Build Tools 34.0.0).
6. **Configures the local properties** file for Gradle.
7. **Initiates the Vite production build** and syncs compiled assets with the Android directory (`npx cap sync`).
8. **Compiles the Debug APK** utilizing Gradle.
9. **Moves the artifact** to the frontend root folder as `Stock-Manager.apk` (approx. 4.3 MB).

---

## 📊 Database Schema Reference

The database models defined in `backend/prisma/schema.prisma` comprise the following key entities:

| Model | Fields | Description |
| :--- | :--- | :--- |
| **Customer** | `id`, `name`, `contactName`, `phone`, `email`, `address`, `createdAt` | Buyers of inventory products. |
| **Supplier** | `id`, `name`, `contactName`, `phone`, `email`, `address`, `createdAt` | Registry of wholesale vendors. |
| **Item** | `id`, `name`, `description`, `currentStock`, `lowStockThreshold`, `createdAt`, `updatedAt` | Inventory items containing stock-out indicators. |
| **Purchase** | `id`, `itemId`, `supplierId`, `quantity`, `notes`, `date`, `createdAt` | Record of stock replenishment transactions. |
| **Sale** | `id`, `itemId`, `customerId`, `quantity`, `notes`, `date`, `createdAt` | Record of client stock sales. |
| **User** | `id`, `username`, `password`, `name`, `createdAt` | Login accounts for dashboard operators. |

---

## 🔄 Sync Operations

The client-server sync relies on a custom batch syncing mechanism:
- **Pull Sync (`GET /api/sync/pull`)**: Allows clients to pull all current items, suppliers, customers, and incremental sales/purchases created since a specific timestamp (`since`).
- **Push Sync (`POST /api/sync/push`)**: Sends batches of client-side local edits (items, suppliers, customers, transactions) to the backend. It resolves naming conflicts by searching for duplicate names and updates fields accordingly, ensuring the integrity of the data store.
