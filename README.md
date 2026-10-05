# Food Rescue Network

Food Rescue Network is a fullstack web platform engineered to connect commercial food providers—such as restaurants, supermarkets, and event caterers—with charitable organizations, shelters, and communities in real time. The platform facilitates the redistribution of surplus edible food before it spoils, reducing environmental waste and combating food insecurity.

---

## Core Capabilities

- **Real-Time Surplus Listings**: Donors can publish surplus food listings specifying food type, quantity, approximate servings, pickup windows, and expiry timestamps.
- **Concurrent & Atomic Claiming**: Concurrency-safe claim workflows ensure donations cannot be double-claimed by competing receivers.
- **Handoff Verification via QR Code & PIN**: Secure verification lifecycle featuring digital pickup passes with scannable QR codes and fallback 6-digit cryptographic PINs.
- **Live Notifications**: WebSocket architecture providing immediate, location-aware alerts when donations are posted, claimed, or verified.
- **Interactive Geospatial Mapping**: Map-based visualization powered by Leaflet to locate active food donations geographically.
- **Environmental & Social Impact Analytics**: Automated conversion of rescued food quantities into metrics such as avoided greenhouse gas emissions (CO2e), conserved freshwater, and community economic value, accompanied by downloadable impact certificates.
- **Automated Lifecycle Expiration**: Scheduled cron background worker that automatically transitions unclaimed donations past their consumption window to expired status.

---

## Technical Stack

### Backend Architecture
- **Runtime & Framework**: Node.js, Express, TypeScript
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Real-Time Communication**: Socket.io
- **Security & Middleware**: JSON Web Tokens (JWT), Bcrypt password hashing, Helmet, Express Rate Limiter, CORS protection
- **Data Validation**: Zod schema validation
- **Scheduled Tasks**: node-cron

### Frontend Architecture
- **Framework & Build**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management & Caching**: TanStack React Query (v5)
- **Routing**: React Router (v6)
- **Mapping & Visualization**: Leaflet, React-Leaflet
- **QR Operations**: qrcode.react (generation), html5-qrcode (camera scanning)
- **Icons**: Lucide React

---

## System Architecture & Workflow

```
[ Donors (Restaurants / Caterers) ]
                 │
                 │ 1. Post surplus food listing
                 ▼
      [ Express / Node.js API ]
                 │
                 ├──► [ PostgreSQL (Prisma ORM) ] (Atomic transaction)
                 │
                 ├──► [ Socket.io WebSocket Layer ] (Broadcast alert)
                 │
                 ▼
[ Receivers (Shelters / NGOs / Individuals) ]
                 │
                 │ 2. Claim donation & receive QR pass
                 ▼
[ Donor Verification (Camera Scanner or 6-digit PIN) ]
                 │
                 │ 3. Confirm handoff
                 ▼
      [ Impact Metrics Updated ]
```

---

## Repository Structure

```
food-rescue-network/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Relational database schema models
│   │   └── seed.ts               # Database seed script for development
│   ├── src/
│   │   ├── config/               # Environment & database configuration
│   │   ├── controllers/          # Business logic handlers
│   │   ├── jobs/                 # Cron background jobs
│   │   ├── middleware/           # Authentication, role validation, rate limiting
│   │   ├── routes/               # Express routing layer
│   │   ├── sockets/              # Socket.io connection and event handlers
│   │   ├── utils/                # JWT and helper utilities
│   │   └── index.ts              # Server entry point
│   ├── docker-compose.yml        # Local PostgreSQL container configuration
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/                   # Static branding and background assets
│   ├── src/
│   │   ├── api/                  # Axios HTTP client & Socket.io client
│   │   ├── components/           # Reusable UI components and modal dialogs
│   │   ├── context/              # Authentication and notification contexts
│   │   ├── pages/                # Application views (Browse, Map, Form, Dashboards)
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── App.tsx               # Root component with routing definitions
│   │   └── main.tsx              # Application entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore                    # Root repository ignore rules
└── README.md                     # Project documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Docker & Docker Compose (optional, for local PostgreSQL)

---

### Step 1: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` variables:
   ```env
   NODE_ENV=development
   PORT=4000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/food_rescue?schema=public"
   JWT_SECRET="replace-with-a-long-random-secret-key-at-least-32-chars"
   JWT_EXPIRES_IN="7d"
   CLIENT_URL="http://localhost:5173"
   ```

4. Start PostgreSQL (if using Docker):
   ```bash
   docker-compose up -d
   ```

5. Install dependencies and apply database migrations:
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```

6. Seed initial test accounts and sample listings:
   ```bash
   npm run seed
   ```

7. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:4000`.

---

### Step 2: Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Copy the frontend environment template:
   ```bash
   cp .env.example .env
   ```

3. Ensure `VITE_API_URL` points to your backend:
   ```env
   VITE_API_URL=http://localhost:4000
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The web application will be accessible at `http://localhost:5173`.

---

## Pre-Configured Demonstration Accounts

When seeded via `npm run seed`, the following credentials are ready for evaluation:

| Role | Email | Password | Intended Workflow |
| :--- | :--- | :--- | :--- |
| **Donor** | `donor@greentable.com` | `password123` | Post surplus food, scan receiver QR codes, verify handoff |
| **Receiver** | `receiver@hopeshelter.org` | `password123` | Browse listings, claim food, generate QR pickup pass |

---

## API Reference Overview

### Authentication
- `POST /api/auth/register` - Create a new user account (Donor or Receiver)
- `POST /api/auth/login` - Authenticate user credentials and receive JWT
- `GET /api/auth/me` - Retrieve authenticated user profile

### Donations
- `GET /api/donations` - Query active donations with filtering by status and query
- `POST /api/donations` - Create a new surplus food donation (Donor only)
- `GET /api/donations/mine` - Retrieve donation history for authenticated donor
- `GET /api/donations/:id` - Fetch detailed information for a single donation
- `PATCH /api/donations/:id/cancel` - Cancel an active donation (Donor only)

### Claims & Verification
- `POST /api/claims/:donationId` - Atomically claim an available donation (Receiver only)
- `GET /api/claims/mine` - Retrieve active and completed claims for authenticated receiver
- `POST /api/claims/verify-pickup` - Verify QR code scan or 6-digit PIN (Donor only)
- `PATCH /api/claims/:donationId/picked-up` - Mark item as collected (Receiver fallback)

### Impact & Metrics
- `GET /api/impact/mine` - Calculate personal CO2e, water conservation, and meals rescued
- `GET /api/impact/global` - Retrieve network-wide sustainability metrics

### Notifications
- `GET /api/notifications` - Retrieve in-app alerts for the current user
- `PATCH /api/notifications/:id/read` - Mark a specific alert as read
- `PATCH /api/notifications/read-all` - Mark all user alerts as read

---

## Security Practices

- **Sanitized Secrets**: Environment variables and connection secrets are strictly isolated from source control.
- **Authentication & Role Authorization**: Route-level middleware enforces role permissions (Donor vs. Receiver).
- **Rate Limiting**: Authentication endpoints are protected against brute-force attempts via `express-rate-limit`.
- **Sensitive Data Minimization**: PII such as contact telephone numbers are restricted to active participants of a verified claim.

---

## License

This project is licensed under the MIT License.
