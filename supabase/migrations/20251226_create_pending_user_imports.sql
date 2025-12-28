-- Create pending_user_imports table
CREATE TABLE IF NOT EXISTS public.pending_user_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_user_imports_email ON public.pending_user_imports(email);

-- Enable RLS and restrict access to admins (assumes has_role function exists)
ALTER TABLE public.pending_user_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pending imports"
ON public.pending_user_imports FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert pending imports"
ON public.pending_user_imports FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));
