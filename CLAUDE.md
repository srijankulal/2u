# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development & Build
- `npm run dev` - Start development server on port 3000 (`vite dev --port 3000`)
- `npm run build` - Build for production (`vite build`)
- `npm run preview` - Preview production build (`vite preview`)

### Testing
- `npm run test` - Run tests once with Vitest (`vitest run`)
- `npx vitest` - Run tests in watch mode
- `npx vitest run path/to/file.test.ts` - Run a single test file

### Database (Drizzle ORM & PostgreSQL)
- `npm run db:generate` - Generate Drizzle migration files from schema (`drizzle-kit generate`)
- `npm run db:migrate` - Apply migrations to the database (`drizzle-kit migrate`)
- `npm run db:push` - Directly push schema changes to the database (`drizzle-kit push`)
- `npm run db:studio` - Open Drizzle Studio web UI (`drizzle-kit studio`)

## Architecture & Code Structure

**2u** is a full-stack web application for writing and scheduling letters to be delivered to future dates (supporting typed letters and scanned image letters), built on TanStack Start with SSR.

### Key Tech Stack
- **Framework:** TanStack Start (`@tanstack/react-start`) on Vite + Nitro + React 19
- **Routing:** TanStack Router with file-based routing and auto-generated route tree
- **Database:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`) with PostgreSQL (`postgres` client)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) with Radix UI primitives
- **Content:** Content Collections (`@content-collections/vite`) for markdown collections in `content/`
- **Auth & Security:** JWT tokens (`jose`) stored in cookies/headers, password hashing (`bcryptjs`)
- **Integrations:** Cloudinary for scanned letter image storage, Nodemailer for scheduled letter delivery

### Directory Structure & Conventions
- `src/routes/` - File-based routes for pages and API endpoints
  - `src/routeTree.gen.ts` - **Auto-generated route tree. Do not edit directly.**
  - `src/routes/__root.tsx` - Root layout and HTML document shell
  - `src/routes/app/` - Protected app pages (`index.tsx`, `compose.tsx`, `letters.$id.tsx`)
  - `src/routes/api/` - Backend API endpoints using HTTP method file suffixes (e.g., `auth/login.post.ts`, `cron/deliver.post.ts`, `me.get.ts`, `letters/$id.ts`)
- `src/lib/` - Shared core server/client utilities:
  - `src/lib/db/` - Drizzle database client (`index.ts`) and schema definitions (`schema.ts`)
  - `src/lib/auth/` - JWT verification and token creation (`jwt.ts`)
  - `src/lib/cloudinary.ts` - Cloudinary upload helpers
  - `src/lib/email.ts` - Nodemailer transporter and letter delivery email templates
- `src/components/` - React components, UI primitives (`src/components/ui/`), context providers (`AuthProvider.tsx`, `ToastProvider.tsx`)
- `content/` - Content collections markdown source files configured in `content-collections.ts`

### Path Aliases
- `@/*` resolves to `./src/*` as configured in `tsconfig.json`.
