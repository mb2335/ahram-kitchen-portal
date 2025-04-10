
-- Create delivery schedules table
CREATE TABLE IF NOT EXISTS delivery_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_slots JSONB[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create delivery time bookings table
CREATE TABLE IF NOT EXISTS delivery_time_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  time_slot_id TEXT NOT NULL,
  booking_date TEXT NOT NULL, -- Format: YYYY-MM-DD
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add delivery_time_slot_id to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_time_slot_id TEXT;

-- Create index for faster queries on bookings
CREATE INDEX IF NOT EXISTS idx_delivery_time_bookings_date
ON delivery_time_bookings(booking_date);

-- Create index for bookings by time slot
CREATE INDEX IF NOT EXISTS idx_delivery_time_bookings_slot
ON delivery_time_bookings(time_slot_id);
