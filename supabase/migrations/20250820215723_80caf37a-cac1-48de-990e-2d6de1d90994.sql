-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create sectors table
CREATE TABLE public.setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for sectors
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

-- Create policy for sectors (readable by all authenticated users)
CREATE POLICY "Authenticated users can view sectors" 
ON public.setores 
FOR SELECT 
TO authenticated
USING (true);

-- Create cost centers table
CREATE TABLE public.centros_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for cost centers
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;

-- Create policy for cost centers (readable by all authenticated users)
CREATE POLICY "Authenticated users can view cost centers" 
ON public.centros_custo 
FOR SELECT 
TO authenticated
USING (true);

-- Create invoice requests table
CREATE TABLE public.solicitacoes_nf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitante_id UUID NOT NULL REFERENCES public.profiles(user_id),
  nome_solicitante TEXT NOT NULL,
  setor_id UUID NOT NULL REFERENCES public.setores(id),
  nome_fornecedor TEXT NOT NULL,
  cnpj_fornecedor TEXT NOT NULL,
  numero_nf TEXT NOT NULL,
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  produto_servico TEXT NOT NULL,
  centro_custo_id UUID NOT NULL REFERENCES public.centros_custo(id),
  valor_total DECIMAL(10,2) NOT NULL,
  arquivo_nf_url TEXT,
  status TEXT NOT NULL DEFAULT 'Aguardando aprovação do gestor',
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  comentario_gestor TEXT,
  comentario_financeiro TEXT,
  data_aprovacao_gestor TIMESTAMP WITH TIME ZONE,
  data_analise_financeira TIMESTAMP WITH TIME ZONE,
  previsao_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for invoice requests
ALTER TABLE public.solicitacoes_nf ENABLE ROW LEVEL SECURITY;

-- Create policies for invoice requests
CREATE POLICY "Users can view their own requests" 
ON public.solicitacoes_nf 
FOR SELECT 
USING (auth.uid() = solicitante_id);

CREATE POLICY "Users can create their own requests" 
ON public.solicitacoes_nf 
FOR INSERT 
WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Users can update their own requests" 
ON public.solicitacoes_nf 
FOR UPDATE 
USING (auth.uid() = solicitante_id);

-- Create storage bucket for invoice files
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Create storage policies for invoice files
CREATE POLICY "Users can upload their own invoice files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own invoice files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert sample sectors
INSERT INTO public.setores (nome) VALUES 
('Financeiro'),
('Recursos Humanos'),
('Tecnologia da Informação'),
('Marketing'),
('Vendas'),
('Operações'),
('Compras'),
('Jurídico');

-- Insert sample cost centers
INSERT INTO public.centros_custo (nome, codigo) VALUES 
('Administrativo', 'ADM001'),
('Marketing Digital', 'MKT001'),
('Desenvolvimento de Sistemas', 'TI001'),
('Vendas Região Sul', 'VND001'),
('Vendas Região Norte', 'VND002'),
('Operações Logística', 'OPR001'),
('Recursos Humanos', 'RH001'),
('Jurídico Corporativo', 'JUR001');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solicitacoes_nf_updated_at
  BEFORE UPDATE ON public.solicitacoes_nf
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();