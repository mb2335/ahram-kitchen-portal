
-- Create a table for FAQ entries
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_en TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  question_ko TEXT NOT NULL,
  answer_ko TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add Row Level Security (RLS) to allow vendors to manage FAQs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Create policy that allows vendors to view all FAQs
CREATE POLICY "Vendors can view all FAQs" 
  ON public.faqs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.user_id = auth.uid()
    )
  );

-- Create policy that allows vendors to insert FAQs
CREATE POLICY "Vendors can create FAQs" 
  ON public.faqs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.user_id = auth.uid()
    )
  );

-- Create policy that allows vendors to update FAQs
CREATE POLICY "Vendors can update FAQs" 
  ON public.faqs 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.user_id = auth.uid()
    )
  );

-- Create policy that allows vendors to delete FAQs
CREATE POLICY "Vendors can delete FAQs" 
  ON public.faqs 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.user_id = auth.uid()
    )
  );

-- Create policy for public read access (for the Help page)
CREATE POLICY "Public can view active FAQs" 
  ON public.faqs 
  FOR SELECT 
  USING (is_active = true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at field
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_faqs_updated_at();
