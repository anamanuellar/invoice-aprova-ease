-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to manage companies
CREATE POLICY "Admins can insert companies"
ON public.empresas
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update companies"
ON public.empresas
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete companies"
ON public.empresas
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to manage sectors
CREATE POLICY "Admins can insert sectors"
ON public.setores
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update sectors"
ON public.setores
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete sectors"
ON public.setores
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to manage cost centers
CREATE POLICY "Admins can insert cost centers"
ON public.centros_custo
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update cost centers"
ON public.centros_custo
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete cost centers"
ON public.centros_custo
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);