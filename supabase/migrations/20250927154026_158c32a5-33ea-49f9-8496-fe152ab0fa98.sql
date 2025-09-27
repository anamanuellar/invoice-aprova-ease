-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('solicitante', 'gestor', 'financeiro', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id), -- opcional: role por empresa
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role, empresa_id) -- Evita duplicatas
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check role for specific company
CREATE OR REPLACE FUNCTION public.has_role_in_company(_user_id uuid, _role app_role, _empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (empresa_id = _empresa_id OR empresa_id IS NULL)
  )
$$;

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role app_role, empresa_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role, ur.empresa_id
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for solicitacoes_nf table
DROP POLICY IF EXISTS "Users can view their own requests" ON public.solicitacoes_nf;
DROP POLICY IF EXISTS "Users can create their own requests" ON public.solicitacoes_nf;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.solicitacoes_nf;

-- Solicitante: can view and create own requests
CREATE POLICY "Solicitantes can view own requests"
  ON public.solicitacoes_nf
  FOR SELECT
  USING (
    auth.uid() = solicitante_id OR
    public.has_role(auth.uid(), 'gestor') OR
    public.has_role(auth.uid(), 'financeiro') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Solicitantes can create requests"
  ON public.solicitacoes_nf
  FOR INSERT
  WITH CHECK (
    auth.uid() = solicitante_id AND
    (public.has_role(auth.uid(), 'solicitante') OR public.has_role(auth.uid(), 'admin'))
  );

-- Solicitante: can update only in initial status
CREATE POLICY "Solicitantes can update own requests in initial status"
  ON public.solicitacoes_nf
  FOR UPDATE
  USING (
    auth.uid() = solicitante_id AND
    status IN ('Aguardando aprovação do gestor') AND
    (public.has_role(auth.uid(), 'solicitante') OR public.has_role(auth.uid(), 'admin'))
  );

-- Gestor: can update status for approval/rejection
CREATE POLICY "Gestores can update request status"
  ON public.solicitacoes_nf
  FOR UPDATE
  USING (
    (public.has_role(auth.uid(), 'gestor') OR public.has_role(auth.uid(), 'admin')) AND
    status IN ('Aguardando aprovação do gestor', 'Em análise financeira')
  );

-- Financeiro: can update requests in financial analysis
CREATE POLICY "Financeiro can update requests in analysis"
  ON public.solicitacoes_nf
  FOR UPDATE
  USING (
    (public.has_role(auth.uid(), 'financeiro') OR public.has_role(auth.uid(), 'admin')) AND
    status IN ('Em análise financeira', 'Aprovada', 'Rejeitada')
  );

-- Admin: full access (no additional policies needed as admin check is in other policies)

-- Insert default admin user (update with your actual user ID)
-- This is just an example - you'll need to update with actual user IDs
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('your-admin-user-id-here', 'admin');