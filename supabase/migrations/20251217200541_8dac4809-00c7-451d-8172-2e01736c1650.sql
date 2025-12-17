-- Fix multi-tenant data isolation for gestores and financeiros
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Solicitantes can view own requests" ON solicitacoes_nf;

-- Create new company-scoped request access policy
CREATE POLICY "Company-scoped request access"
ON solicitacoes_nf FOR SELECT
USING (
  -- Owner can always view their own requests
  (auth.uid() = solicitante_id AND EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.active = true
  )) OR
  -- Admin sees all requests
  has_role(auth.uid(), 'admin') OR
  -- Gestor only sees requests from their company
  (
    empresa_id IS NOT NULL AND
    has_role_in_company(auth.uid(), 'gestor', empresa_id)
  ) OR
  -- Financeiro only sees requests from their company
  (
    empresa_id IS NOT NULL AND
    has_role_in_company(auth.uid(), 'financeiro', empresa_id)
  )
);