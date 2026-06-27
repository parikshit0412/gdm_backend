# JobNest Backend API (`gdm_backend`)

The robust, scalable backend REST API powering the JobNest recruitment and marketplace platform. Built with a modern Node.js stack, it handles authentication, user roles, job postings, business promotions, and platform subscriptions.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL (Hosted on [Neon](https://neon.tech))
- **ORM:** Drizzle ORM
- **Authentication:** JWT (JSON Web Tokens) + Passport.js (Google OAuth)
- **Validation:** Zod
- **Security:** bcryptjs, cookie-parser, CORS

## 🏗️ Architecture & Features

- **Role-Based Access Control (RBAC):** Supports distinct user flows for Job Seekers, Employers (Job Posters), Business Promoters, and Super Admins.
- **OAuth 2.0 Integration:** Secure login via Google alongside standard Email/Password authentication.
- **Type-Safe Database:** Full TypeScript integration from API routes down to the Postgres schema using Drizzle.
- **Comprehensive API:** Endpoints for profile management, job listings, career resources, and subscription handling.

## ⚙️ Local Development Setup

### 1. Prerequisites
Ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/parikshit0412/gdm_backend.git
cd gdm_backend
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and configure the following variables:
```env
# Database
DATABASE_URL="postgresql://user:password@neon-host.neon.tech/neondb?sslmode=require"

# Server
PORT=5000
NODE_ENV=development

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# OAuth (Google)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Database Setup
Push the Drizzle schema to your Neon PostgreSQL database and seed the initial roles:
```bash
npm run db:push
npm run db:seed
```

### 5. Running the Server
Start the development server (uses `tsx` for hot-reloading):
```bash
npm run dev
```
The API will be available at `http://localhost:5000`.

## 📂 Project Structure

```
├── src/
│   ├── controllers/      # Route handlers and business logic
│   ├── db/
│   │   ├── schema/       # Drizzle table definitions
│   │   └── index.ts      # Database connection instance
│   ├── middleware/       # Express middlewares (Auth, Error Handling, Passport)
│   ├── routes/           # Express route definitions
│   ├── validators/       # Zod schemas for request validation
│   └── server.ts         # Express app initialization
├── drizzle.config.ts     # Drizzle ORM configuration
├── seed.ts               # Database seeder script
└── package.json
```

## 📜 Available Scripts

- `npm run dev` — Starts the development server with hot-reload.
- `npm run build` — Compiles TypeScript into the `dist/` folder for production.
- `npm run start` — Runs the compiled production code.
- `npm run db:push` — Pushes schema changes directly to the database.
- `npm run db:studio` — Opens Drizzle Studio to view and edit database rows locally.
- `npm run db:seed` — Populates the database with required default data (e.g., user roles).
