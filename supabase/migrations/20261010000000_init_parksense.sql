-- =============================================================================
-- PARKSENSE — SMART PARKING MONITORING SYSTEM
-- Migration: 20261010000000_init_parksense.sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Associated with Supabase auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- -----------------------------------------------------------------------------
-- 2. PARKING SLOTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL UNIQUE,
    zone TEXT NOT NULL,
    slot_type TEXT NOT NULL DEFAULT 'standard',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    occupancy_status TEXT NOT NULL DEFAULT 'available' 
        CHECK (occupancy_status IN ('available', 'occupied', 'reserved', 'maintenance')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_slots_zone ON public.parking_slots(zone);
CREATE INDEX IF NOT EXISTS idx_parking_slots_status ON public.parking_slots(occupancy_status);
CREATE INDEX IF NOT EXISTS idx_parking_slots_active ON public.parking_slots(is_active);

-- -----------------------------------------------------------------------------
-- 3. BOOKINGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parking_slot_id UUID NOT NULL REFERENCES public.parking_slots(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' 
        CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    vehicle_plate TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_booking_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON public.bookings(parking_slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON public.bookings(start_time, end_time);

-- Exclusion constraint to guarantee NO conflicting active bookings exist at DB level
-- Active bookings with status 'confirmed' cannot overlap on the same parking slot.
-- Note: Cancelled bookings do NOT block future reservations.
ALTER TABLE public.bookings
    DROP CONSTRAINT IF EXISTS exclude_overlapping_confirmed_bookings;

ALTER TABLE public.bookings
    ADD CONSTRAINT exclude_overlapping_confirmed_bookings
    EXCLUDE USING gist (
        parking_slot_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    )
    WHERE (status = 'confirmed');

-- -----------------------------------------------------------------------------
-- 4. PARKING EVENTS / AUDIT LOG TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    parking_slot_id UUID REFERENCES public.parking_slots(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_slot ON public.parking_events(parking_slot_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON public.parking_events(created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. AUTOMATIC PROFILE CREATION TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'user' -- Strictly enforce ordinary user role upon registration
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. SECURITY HELPER: CHECK IF CURRENT CALLER IS ADMIN
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- -----------------------------------------------------------------------------
-- 7. CONCURRENCY-SAFE TRANSACTIONAL BOOKING CREATION RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_booking(
    p_slot_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_vehicle_plate TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_slot RECORD;
    v_new_booking RECORD;
BEGIN
    -- Authenticate user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to create a reservation.';
    END IF;

    -- Validate time bounds
    IF p_start_time <= NOW() - INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'Reservation start time must be in the future.';
    END IF;

    IF p_end_time <= p_start_time THEN
        RAISE EXCEPTION 'End time must be after the reservation start time.';
    END IF;

    -- Lock the target slot row to serialize concurrent reservations
    SELECT * INTO v_slot
    FROM public.parking_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Selected parking slot does not exist.';
    END IF;

    IF NOT v_slot.is_active THEN
        RAISE EXCEPTION 'This parking space is currently out of service.';
    END IF;

    -- Check for overlapping confirmed bookings
    IF EXISTS (
        SELECT 1 FROM public.bookings
        WHERE parking_slot_id = p_slot_id
          AND status = 'confirmed'
          AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time)
    ) THEN
        RAISE EXCEPTION 'This parking space has already been reserved for the requested time.';
    END IF;

    -- Insert confirmed booking
    INSERT INTO public.bookings (
        user_id,
        parking_slot_id,
        start_time,
        end_time,
        status,
        vehicle_plate,
        notes
    )
    VALUES (
        v_user_id,
        p_slot_id,
        p_start_time,
        p_end_time,
        'confirmed',
        p_vehicle_plate,
        p_notes
    )
    RETURNING * INTO v_new_booking;

    -- If booking starts within 30 minutes, mark slot as reserved
    IF p_start_time <= NOW() + INTERVAL '30 minutes' AND v_slot.occupancy_status = 'available' THEN
        UPDATE public.parking_slots
        SET occupancy_status = 'reserved', updated_at = NOW()
        WHERE id = p_slot_id;
    END IF;

    -- Record audit event
    INSERT INTO public.parking_events (
        actor_id,
        parking_slot_id,
        booking_id,
        event_type,
        metadata
    )
    VALUES (
        v_user_id,
        p_slot_id,
        v_new_booking.id,
        'booking_created',
        jsonb_build_object(
            'slot_label', v_slot.label,
            'start_time', p_start_time,
            'end_time', p_end_time
        )
    );

    RETURN to_jsonb(v_new_booking);
END;
$$;

-- -----------------------------------------------------------------------------
-- 8. TRANSACTIONAL BOOKING CANCELLATION RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_booking RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Lock booking row
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- Ensure caller owns booking or is admin
    IF v_booking.user_id <> v_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'You are not authorized to cancel this reservation.';
    END IF;

    IF v_booking.status <> 'confirmed' THEN
        RAISE EXCEPTION 'Only confirmed bookings can be cancelled.';
    END IF;

    -- Update booking status
    UPDATE public.bookings
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_booking_id;

    -- If the slot was marked reserved for this window, restore availability
    UPDATE public.parking_slots
    SET occupancy_status = 'available', updated_at = NOW()
    WHERE id = v_booking.parking_slot_id
      AND occupancy_status = 'reserved';

    -- Record audit event
    INSERT INTO public.parking_events (
        actor_id,
        parking_slot_id,
        booking_id,
        event_type,
        metadata
    )
    VALUES (
        v_user_id,
        v_booking.parking_slot_id,
        p_booking_id,
        'booking_cancelled',
        jsonb_build_object('booking_id', p_booking_id)
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 9. ADMIN SIMULATE OCCUPANCY CHANGE RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_slot_occupancy(
    p_slot_id UUID,
    p_new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_old_status TEXT;
BEGIN
    v_user_id := auth.uid();
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required to change slot occupancy.';
    END IF;

    IF p_new_status NOT IN ('available', 'occupied', 'reserved', 'maintenance') THEN
        RAISE EXCEPTION 'Invalid occupancy status value.';
    END IF;

    SELECT occupancy_status INTO v_old_status
    FROM public.parking_slots
    WHERE id = p_slot_id;

    UPDATE public.parking_slots
    SET occupancy_status = p_new_status, updated_at = NOW()
    WHERE id = p_slot_id;

    -- Audit event
    INSERT INTO public.parking_events (
        actor_id,
        parking_slot_id,
        event_type,
        metadata
    )
    VALUES (
        v_user_id,
        p_slot_id,
        CASE
            WHEN p_new_status = 'occupied' THEN 'slot_occupied'
            WHEN p_new_status = 'available' THEN 'slot_vacated'
            ELSE 'slot_status_changed'
        END,
        jsonb_build_object(
            'previous_status', v_old_status,
            'new_status', p_new_status,
            'is_simulated', true
        )
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_events ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;
CREATE POLICY "Public can view basic profiles"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update their own display_name only" ON public.profiles;
CREATE POLICY "Users can update their own display_name only"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Role cannot be changed by user
    );

-- PARKING SLOTS POLICIES
DROP POLICY IF EXISTS "Anyone can view parking slots" ON public.parking_slots;
CREATE POLICY "Anyone can view parking slots"
    ON public.parking_slots FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can insert parking slots" ON public.parking_slots;
CREATE POLICY "Admins can insert parking slots"
    ON public.parking_slots FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update parking slots" ON public.parking_slots;
CREATE POLICY "Admins can update parking slots"
    ON public.parking_slots FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- BOOKINGS POLICIES
DROP POLICY IF EXISTS "Users can read own bookings or admin read all" ON public.bookings;
CREATE POLICY "Users can read own bookings or admin read all"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;
CREATE POLICY "Admins can update any booking"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- PARKING EVENTS POLICIES
DROP POLICY IF EXISTS "Authenticated users can read recent events" ON public.parking_events;
CREATE POLICY "Authenticated users can read recent events"
    ON public.parking_events FOR SELECT
    TO authenticated
    USING (true);

-- -----------------------------------------------------------------------------
-- 11. SUPABASE REALTIME REPLICATION CONFIGURATION
-- -----------------------------------------------------------------------------
-- Enable Realtime publication for tables so updates push to subscribed clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'parking_slots'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_slots;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'parking_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_events;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Realtime publication setup skipped or already enabled.';
END;
$$;
