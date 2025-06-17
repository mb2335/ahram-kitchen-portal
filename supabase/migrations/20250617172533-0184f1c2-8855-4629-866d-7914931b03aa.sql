
-- Add delivery rules table to store category-based delivery thresholds
CREATE TABLE IF NOT EXISTS public.delivery_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id),
  category_id UUID REFERENCES public.menu_categories(id),
  minimum_items INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, category_id)
);

-- Enable RLS on delivery_rules
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery_rules
CREATE POLICY "Vendors can manage their delivery rules"
  ON public.delivery_rules
  FOR ALL
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_rules_updated_at
  BEFORE UPDATE ON public.delivery_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_rules_updated_at();
