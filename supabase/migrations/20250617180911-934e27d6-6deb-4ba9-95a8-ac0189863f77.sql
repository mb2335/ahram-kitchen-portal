
-- Add logical operator support to delivery rules
ALTER TABLE public.delivery_rules 
ADD COLUMN logical_operator TEXT DEFAULT 'AND' CHECK (logical_operator IN ('AND', 'OR'));

-- Add a rule group concept to allow multiple rule sets
ALTER TABLE public.delivery_rules 
ADD COLUMN rule_group_id UUID DEFAULT gen_random_uuid();

-- Add rule group name for better organization
ALTER TABLE public.delivery_rules 
ADD COLUMN rule_group_name TEXT DEFAULT 'Default Rule Group';

-- Update the unique constraint to allow multiple rules per vendor/category combination
-- but within different rule groups
ALTER TABLE public.delivery_rules 
DROP CONSTRAINT IF EXISTS delivery_rules_vendor_id_category_id_key;

-- Add new unique constraint that includes rule_group_id
ALTER TABLE public.delivery_rules 
ADD CONSTRAINT delivery_rules_vendor_category_group_unique 
UNIQUE(vendor_id, category_id, rule_group_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_rules_vendor_group 
ON public.delivery_rules(vendor_id, rule_group_id);
