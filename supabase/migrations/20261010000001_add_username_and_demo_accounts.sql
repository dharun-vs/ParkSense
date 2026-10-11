-- =============================================================================
-- PARKSENSE — SMART PARKING MONITORING SYSTEM
-- Migration: 20261010000001_add_username_and_demo_accounts.sql
-- =============================================================================

-- Enable pgcrypto for password hashing if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ADD USERNAME COLUMN TO PROFILES TABLE
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username TEXT;

-- Create case-insensitive unique index for usernames
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
    ON public.profiles(LOWER(username))
    WHERE username IS NOT NULL;

-- 2. UPDATE TRIGGER FUNCTION TO SUPPORT USERNAME
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, username, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        LOWER(NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '')),
        'user' -- Strictly enforce ordinary user role upon registration
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        username = COALESCE(public.profiles.username, EXCLUDED.username);
    RETURN NEW;
END;
$$;

-- =============================================================================
-- 3. DEMO ACCOUNTS PROVISIONING PROCEDURE (For Supabase SQL Editor)
--
-- Administrator: admin@parksense.demo (password: admin) -> role: 'admin'
-- Customer:      customer@parksense.demo (password: 1234) -> role: 'user'
-- =============================================================================

DO $$
DECLARE
    v_admin_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    v_customer_id UUID := '00000000-0000-0000-0000-000000000002'::UUID;
BEGIN
    -- Check if auth.users table exists (standard Supabase Auth schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        -- ---------------------------------------------------------------------
        -- A. PROVISION DEMO ADMINISTRATOR (admin / admin)
        -- ---------------------------------------------------------------------
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@parksense.demo') THEN
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                role,
                aud
            ) VALUES (
                v_admin_id,
                '00000000-0000-0000-0000-000000000000',
                'admin@parksense.demo',
                crypt('admin', gen_salt('bf')),
                NOW(),
                '{"provider":"email","providers":["email"]}',
                '{"display_name":"System Administrator","username":"admin"}',
                NOW(),
                NOW(),
                'authenticated',
                'authenticated'
            );
        END IF;

        -- Ensure profile exists with role 'admin'
        INSERT INTO public.profiles (id, display_name, username, role)
        VALUES (
            (SELECT id FROM auth.users WHERE email = 'admin@parksense.demo'),
            'System Administrator',
            'admin',
            'admin'
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            username = 'admin',
            updated_at = NOW();

        -- ---------------------------------------------------------------------
        -- B. PROVISION DEMO CUSTOMER (customer / 1234)
        -- ---------------------------------------------------------------------
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'customer@parksense.demo') THEN
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                role,
                aud
            ) VALUES (
                v_customer_id,
                '00000000-0000-0000-0000-000000000000',
                'customer@parksense.demo',
                crypt('1234', gen_salt('bf')),
                NOW(),
                '{"provider":"email","providers":["email"]}',
                '{"display_name":"Demo Driver","username":"customer"}',
                NOW(),
                NOW(),
                'authenticated',
                'authenticated'
            );
        END IF;

        -- Ensure profile exists with role 'user'
        INSERT INTO public.profiles (id, display_name, username, role)
        VALUES (
            (SELECT id FROM auth.users WHERE email = 'customer@parksense.demo'),
            'Demo Driver',
            'customer',
            'user'
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'user',
            username = 'customer',
            updated_at = NOW();

    END IF;
END $$;
