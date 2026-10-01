# 📮 2U Postal — Letters to Your Future Self

> *Compose a heartfelt message today. Choose when to open it — six months, a year, or a decade from now.*

[![Built with TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?style=flat-square)](https://tanstack.com/start)
[![Database Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square)](https://supabase.com)
[![Auth Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)](https://clerk.com)
[![Security AES--256--GCM](https://img.shields.io/badge/Security-AES--256--GCM-blue?style=flat-square)]()
[![Deployed on Vercel](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square)](https://vercel.com)

---

## ✨ Features

- ✒ **Distraction-Free Letter Studio**: Compose rich personal reflections or upload scanned photos of handwritten notes.
- 🔒 **AES-256-GCM Privacy Encryption**: All letter contents, titles, and scanned image URLs are cryptographically encrypted before being stored in the database.
- ⏳ **Sealed Time Capsules**: Letters remain locked and unreadable until their scheduled delivery date, featuring live countdown timers and wax seal monograms.
- 📬 **Automated Email Dispatch**: Integrated with Vercel Cron (`/api/cron`) to dispatch unlocked letters directly to the author's inbox via **Resend** or **Gmail SMTP**.
- 👤 **Seamless Authentication & Quotas**: Managed user profiles via **Clerk**, enforcing a 5-slot in-transit letter allowance per user.
- 🎨 **Editorial Aesthetics**: Minimalist postal design system built with DM Serif Display, vintage postmarks, paper-lined textareas, and fluid responsive layouts.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (Full-stack React + Vite + Nitro) |
| **Routing & SSR** | [TanStack Router](https://tanstack.com/router) |
| **Authentication** | [Clerk](https://clerk.com) |
| **Database** | [Supabase](https://supabase.com) (PostgreSQL via HTTPS REST SDK) |
| **Image Storage** | [Cloudinary](https://cloudinary.com) |
| **Email Service** | [Resend](https://resend.com) & [Nodemailer](https://nodemailer.com) |
| **Encryption** | Node.js `crypto` (AES-256-GCM authenticated cipher) |
| **Styling** | Vanilla CSS Design System with Google Fonts (`DM Serif Display` & `Inter`) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+` or `v20+`
- A free [Clerk](https://clerk.com) application
- A free [Supabase](https://supabase.com) project
- A [Cloudinary](https://cloudinary.com) cloud account (for handwritten scans)
- A [Resend](https://resend.com) API key or Gmail App Password for email dispatch

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/srijankulal/2u.git
cd 2u
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Clerk Auth
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres:...@...pooler.supabase.com:6543/postgres

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Encryption Secret (Used for AES-256-GCM letter encryption)
ENCRYPTION_SECRET=your-secure-random-32-byte-passphrase

# Email Service (Resend or Gmail SMTP)
RESEND_API_KEY=re_...
# Optional Gmail SMTP fallback:
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password

# Cron Security Secret (Optional for securing /api/cron)
CRON_SECRET=your-cron-secret
```

### 3. Initialize the Database Schema

Run the SQL script located in [`supabase_schema.sql`](file:///c:/Codes/Projects/2u/supabase_schema.sql) within the **Supabase SQL Editor**:

```sql
-- Users Table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- Letters Table
create table if not exists letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  content text,
  image_url text,
  type text not null default 'typed',
  deliver_at timestamptz not null,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes for high performance querying
create index if not exists idx_letters_user_id on letters(user_id);
create index if not exists idx_letters_deliver on letters(deliver_at, delivered_at);
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```
├── public/                     # Static assets (favicons, logos, hero artwork)
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── AuthProvider.tsx    # Clerk & User context provider
│   │   └── ToastProvider.tsx   # Custom notification toasts
│   ├── lib/
│   │   ├── crypto.ts           # AES-256-GCM encryption & decryption
│   │   ├── email.ts            # Email delivery router (Resend / SMTP)
│   │   ├── supabase.ts         # Supabase client initializer
│   │   └── cloudinary.ts       # Cloudinary unsigned/signed uploader
│   ├── routes/
│   │   ├── __root.tsx          # Root HTML layout, headers, and meta
│   │   ├── index.tsx           # Landing page with dynamic user state
│   │   ├── login.tsx           # Clerk Sign-In portal
│   │   ├── register.tsx        # Clerk Sign-Up portal
│   │   ├── app.tsx             # Mailbox dashboard shell & responsive sidebar
│   │   ├── app/
│   │   │   ├── index.tsx       # Mailbox letter listing, stats & filter tabs
│   │   │   ├── compose.tsx     # Letter composition studio (Typed & Scanned)
│   │   │   └── letters.$id.tsx # Letter envelope & time-capsule unlocker
│   │   └── api/
│   │       ├── cron.ts         # Scheduled automated delivery handler
│   │       ├── upload.ts       # Image upload endpoint
│   │       └── user.ts         # Current authenticated user resolver
│   ├── server/
│   │   └── letters.ts          # Server functions (CRUD, encryption, quotas)
│   ├── styles.css              # Editorial postal design system
│   └── start.ts                # TanStack Start SSR entry point
├── supabase_schema.sql         # Supabase database DDL schema
├── vercel.json                 # Vercel deployment configuration & Cron triggers
└── vite.config.ts              # Vite & Nitro server configuration
```

---

## ⏰ Automated Delivery (Cron)

2U Postal uses **Vercel Cron** configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "* * * * *"
    }
  ]
}
```

When `/api/cron` executes:
1. It queries Supabase for all sealed letters where `deliver_at <= NOW()` and `delivered_at IS NULL`.
2. Decrypts the secret letter contents and images using `decryptText()`.
3. Dispatches a formatted HTML letter email to the recipient.
4. Marks `delivered_at = NOW()` to complete the delivery cycle.

---

## 🔒 Security & Privacy

- **Zero Clear-Text Storage**: Letters written by users cannot be read in plaintext by database administrators or third parties.
- **Unique IV & Auth Tag**: Every encrypted record uses a fresh 12-byte initialization vector (IV) and a 16-byte authentication tag ensuring integrity and tamper prevention.
- **Server-Side Decryption**: Decryption only occurs in server functions when an authenticated user requests their own letter.

---

## 🚢 Deployment

The project is optimized for deployment on **Vercel** with Nitro:

```bash
npm run build
```

Deploy directly using the Vercel CLI or connecting the GitHub repository to the Vercel dashboard.

---

## 📄 License

MIT © [Srijan Kulal](https://github.com/srijankulal)
