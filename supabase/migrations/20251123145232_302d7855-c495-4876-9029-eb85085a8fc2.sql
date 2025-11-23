-- Add active status and temporary password flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_password_change boolean NOT NULL DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active);
CREATE INDEX IF NOT EXISTS idx_profiles_requires_password_change ON public.profiles(requires_password_change);

-- Update RLS policies to prevent inactive users from accessing data
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id AND active = true);

-- Allow admins to view all profiles including inactive
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update user status
CREATE POLICY "Admins can update user status"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent inactive users from accessing their requests
DROP POLICY IF EXISTS "Solicitantes can view own requests" ON public.solicitacoes_nf;
CREATE POLICY "Solicitantes can view own requests"
ON public.solicitacoes_nf
FOR SELECT
USING (
  (auth.uid() = solicitante_id AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND active = true))
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Prevent inactive users from creating requests
DROP POLICY IF EXISTS "Solicitantes can create requests" ON public.solicitacoes_nf;
CREATE POLICY "Solicitantes can create requests"
ON public.solicitacoes_nf
FOR INSERT
WITH CHECK (
  auth.uid() = solicitante_id
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND active = true)
  AND (has_role(auth.uid(), 'solicitante'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Prevent inactive users from updating requests
DROP POLICY IF EXISTS "Solicitantes can update own requests in initial status" ON public.solicitacoes_nf;
CREATE POLICY "Solicitantes can update own requests in initial status"
ON public.solicitacoes_nf
FOR UPDATE
USING (
  auth.uid() = solicitante_id
  AND status = 'Aguardando aprovação do gestor'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND active = true)
  AND (has_role(auth.uid(), 'solicitante'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);