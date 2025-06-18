
-- Create a table to track delivery time slot bookings
CREATE TABLE public.delivery_time_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_date DATE NOT NULL,
  time_slot TIME NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure each time slot on a given date can only be booked once
  UNIQUE(delivery_date, time_slot)
);

-- Enable RLS for the booking table
ALTER TABLE public.delivery_time_bookings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view bookings (needed to check availability)
CREATE POLICY "Anyone can view delivery bookings" 
  ON public.delivery_time_bookings 
  FOR SELECT 
  USING (true);

-- Create policy to allow inserting bookings (will be handled by backend validation)
CREATE POLICY "Allow booking insertion" 
  ON public.delivery_time_bookings 
  FOR INSERT 
  WITH CHECK (true);

-- Enable realtime for immediate UI updates
ALTER TABLE public.delivery_time_bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_time_bookings;
