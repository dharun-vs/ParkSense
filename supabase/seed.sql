-- =============================================================================
-- PARKSENSE — SMART PARKING MONITORING SYSTEM
-- Seed Script: supabase/seed.sql
-- Seeds 28 realistic parking spaces across 3 Zones (A, B, C)
-- Safe to re-run (ON CONFLICT (label) DO NOTHING)
-- =============================================================================

INSERT INTO public.parking_slots (label, zone, slot_type, is_active, occupancy_status, notes)
VALUES
    -- ZONE A (Ground Floor / Premium & EV)
    ('A01', 'A', 'ev', true, 'available', 'Equipped with 22kW AC Level-2 EV Charger'),
    ('A02', 'A', 'ev', true, 'occupied', 'Equipped with 22kW AC Level-2 EV Charger'),
    ('A03', 'A', 'accessible', true, 'available', 'Extra wide clearance near elevator entrance'),
    ('A04', 'A', 'accessible', true, 'reserved', 'Reserved for accessibility permit driver'),
    ('A05', 'A', 'standard', true, 'available', 'Close to main entrance terminal'),
    ('A06', 'A', 'standard', true, 'occupied', 'Close to main entrance terminal'),
    ('A07', 'A', 'standard', true, 'available', 'Direct access to pedestrian walkway'),
    ('A08', 'A', 'standard', true, 'available', 'Direct access to pedestrian walkway'),
    ('A09', 'A', 'compact', true, 'available', 'Suitable for hatchback or compact sedan'),
    ('A10', 'A', 'standard', false, 'maintenance', 'Sensor calibration in progress'),

    -- ZONE B (Level 1 / General Fleet Parking)
    ('B01', 'B', 'standard', true, 'available', 'North wing bay'),
    ('B02', 'B', 'standard', true, 'available', 'North wing bay'),
    ('B03', 'B', 'standard', true, 'occupied', 'North wing bay'),
    ('B04', 'B', 'standard', true, 'available', 'North wing bay'),
    ('B05', 'B', 'standard', true, 'available', 'Central aisle bay'),
    ('B06', 'B', 'compact', true, 'occupied', 'Central aisle bay'),
    ('B07', 'B', 'standard', true, 'available', 'Central aisle bay'),
    ('B08', 'B', 'standard', true, 'reserved', 'Reserved for scheduled afternoon slot'),
    ('B09', 'B', 'standard', true, 'available', 'South wing bay'),
    ('B10', 'B', 'compact', true, 'available', 'South wing bay'),

    -- ZONE C (Level 2 / Extended Stay & Economy)
    ('C01', 'C', 'standard', true, 'available', 'Economy long-term bay'),
    ('C02', 'C', 'standard', true, 'available', 'Economy long-term bay'),
    ('C03', 'C', 'standard', true, 'available', 'Economy long-term bay'),
    ('C04', 'C', 'standard', true, 'occupied', 'Economy long-term bay'),
    ('C05', 'C', 'compact', true, 'available', 'West corridor bay'),
    ('C06', 'C', 'standard', true, 'available', 'West corridor bay'),
    ('C07', 'C', 'standard', false, 'maintenance', 'CCTV camera inspection underway'),
    ('C08', 'C', 'standard', true, 'available', 'East corridor bay')
ON CONFLICT (label) DO NOTHING;

-- Initial activity log entries to demonstrate live audit feed
INSERT INTO public.parking_events (event_type, metadata, created_at)
VALUES
    ('slot_created', '{"description": "Facility initialized with 28 managed bays"}'::jsonb, NOW() - INTERVAL '2 hours'),
    ('slot_occupied', '{"slot_label": "A02", "is_simulated": true}'::jsonb, NOW() - INTERVAL '45 minutes'),
    ('slot_occupied', '{"slot_label": "A06", "is_simulated": true}'::jsonb, NOW() - INTERVAL '30 minutes'),
    ('slot_occupied', '{"slot_label": "B03", "is_simulated": true}'::jsonb, NOW() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;
