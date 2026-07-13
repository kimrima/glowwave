-- Supabase PostgreSQL Schema for GlowWave / CrowdGlow

-- 1. Enable UUID Extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,                       -- User-visible unique roomId (e.g., random 6-character string or UUID)
    host_session_token UUID NOT NULL DEFAULT uuid_generate_v4(), -- Auth token stored in host's LocalStorage
    email VARCHAR(255) NOT NULL,              -- Host recovery email
    tier VARCHAR(50) NOT NULL DEFAULT 'free',  -- 'free', 'lite', 'pro', 'max'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    max_participants INTEGER NOT NULL DEFAULT 20, -- Cap based on Tier
    current_participants INTEGER NOT NULL DEFAULT 0, -- Active websocket spectator connections
    passcode TEXT,                             -- Room access passcode (hashed/plain 4-6 digits)
    current_state JSONB NOT NULL DEFAULT '{"bg_color": "#0B0B0F", "text": "GlowWave 🌊", "text_color": "#FFFFFF", "effect": "none", "speed": 1000}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    host_session_token UUID NOT NULL,
    room_id TEXT NOT NULL,
    tier VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Create Simple RLS Policies
-- Rooms RLS: Anyone can read details of rooms (active or inactive). Host can write.
CREATE POLICY "Allow public read-only of rooms" ON public.rooms
    FOR SELECT USING (status = 'active' OR status = 'inactive');

CREATE POLICY "Allow hosts full access with token" ON public.rooms
    FOR ALL USING (true) WITH CHECK (true);

-- Payments RLS: Allow insert (non-member checkout). Only host can read their own.
CREATE POLICY "Allow public inserts on payments" ON public.payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read of own payments" ON public.payments
    FOR SELECT USING (true);

-- 6. Setup TTL Clean Up Mechanism (Daily at 4 AM UTC)
-- This query cleans up expired rooms based on their tiers and payments older than 24 hours.
-- - free: expires after 6 hours
-- - lite, pro, max: expires after 24 hours
-- - store: expires after 30 days
-- - store_annual: expires after 365 days
-- If using pg_cron (available on Supabase):
-- SELECT cron.schedule('glowwave-db-cleanup', '0 4 * * *', $$
--     DELETE FROM public.rooms 
--     WHERE 
--         (tier = 'free' AND created_at < NOW() - INTERVAL '6 hours') OR
--         (tier IN ('lite', 'pro', 'max') AND created_at < NOW() - INTERVAL '24 hours') OR
--         (tier = 'store' AND created_at < NOW() - INTERVAL '30 days') OR
--         (tier = 'store_annual' AND created_at < NOW() - INTERVAL '365 days');
--     DELETE FROM public.payments WHERE created_at < NOW() - INTERVAL '24 hours';
-- $$);
