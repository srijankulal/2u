-- ==============================================================================
-- 2U — Database Schema for Supabase / PostgreSQL
-- Run this in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create letter_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE letter_type AS ENUM ('typed', 'scanned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create letters table
CREATE TABLE IF NOT EXISTS letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    type letter_type NOT NULL,
    deliver_at TIMESTAMP WITH TIME ZONE NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Create indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_letters_user_id ON letters(user_id);
CREATE INDEX IF NOT EXISTS idx_letters_deliver_at ON letters(deliver_at) WHERE delivered_at IS NULL;
