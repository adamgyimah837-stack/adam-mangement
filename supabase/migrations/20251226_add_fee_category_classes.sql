-- Create fee_category_classes mapping table to associate fee categories with classes
CREATE TABLE IF NOT EXISTS public.fee_category_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fee_category_id, class_id)
);

-- Enable RLS and basic policies
ALTER TABLE public.fee_category_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee category mappings"
ON public.fee_category_classes FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view fee category mappings"
ON public.fee_category_classes FOR SELECT
USING (auth.uid() IS NOT NULL);
