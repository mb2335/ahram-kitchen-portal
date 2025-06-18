
-- Enable public read access to delivery_rules table for all users (authenticated and anonymous)
-- This allows customers to check delivery eligibility based on active rules
CREATE POLICY "Public read access to active delivery rules" 
ON public.delivery_rules 
FOR SELECT 
USING (true);

-- Note: This only allows reading delivery rules, not modifying them
-- Vendors/admins will still need proper authentication to create/update/delete rules
