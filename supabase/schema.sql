-- ====================================================================
-- Crown & Blade - Production Database Schema (PostgreSQL / Supabase)
-- ====================================================================

-- 1. Services Table
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cuts', 'shaves', 'color', 'bundles', 'kids')),
    is_bundle BOOLEAN DEFAULT FALSE,
    bundled_service_ids TEXT[] DEFAULT '{}',
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    popular BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Barbers Table
CREATE TABLE IF NOT EXISTS barbers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT NOT NULL,
    bio TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    specialties TEXT[] DEFAULT '{}',
    available BOOLEAN DEFAULT TRUE,
    working_days INTEGER[] DEFAULT '{1, 2, 3, 4, 5, 6}',
    work_start TIME DEFAULT '09:00',
    work_end TIME DEFAULT '19:00',
    break_start TIME DEFAULT '13:00',
    break_end TIME DEFAULT '14:00',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    service_ids TEXT[] NOT NULL,
    service_names TEXT[] NOT NULL,
    barber_id TEXT NOT NULL,
    barber_name TEXT NOT NULL,
    barber_avatar TEXT,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_duration_minutes INTEGER NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for real-time conflict checking
CREATE INDEX IF NOT EXISTS idx_bookings_date_barber ON bookings (booking_date, barber_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings (customer_phone);

-- 4. Shop Settings
CREATE TABLE IF NOT EXISTS shop_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    shop_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    buffer_minutes INTEGER DEFAULT 5,
    slot_interval_minutes INTEGER DEFAULT 15,
    schedule JSONB NOT NULL,
    blocked_dates DATE[] DEFAULT '{}',
    blocked_times JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Public can read services, barbers, and settings
CREATE POLICY "Public read services" ON services FOR SELECT USING (true);
CREATE POLICY "Public read barbers" ON barbers FOR SELECT USING (true);
CREATE POLICY "Public read shop_settings" ON shop_settings FOR SELECT USING (true);

-- Anyone can insert a booking, and read bookings by id or phone
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Public update bookings" ON bookings FOR UPDATE USING (true);
