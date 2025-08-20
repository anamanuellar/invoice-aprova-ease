-- Criar tabela de empresas
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir as empresas padrão
INSERT INTO public.empresas (nome, codigo) VALUES 
  ('Hotéis Design', 'HOTEIS_DESIGN'),
  ('Restaurante Adamastor', 'RESTAURANTE_ADAMASTOR'),
  ('Barroquinha Estacionamento', 'BARROQUINHA_ESTACIONAMENTO');

-- Habilitar RLS na tabela empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam todas as empresas
CREATE POLICY "Authenticated users can view companies" 
ON public.empresas 
FOR SELECT 
USING (true);

-- Adicionar novos campos à tabela solicitacoes_nf
ALTER TABLE public.solicitacoes_nf 
ADD COLUMN empresa_id UUID REFERENCES public.empresas(id),
ADD COLUMN justificativa_vencimento_antecipado TEXT,
ADD COLUMN forma_pagamento TEXT CHECK (forma_pagamento IN ('deposito_bancario', 'boleto')),
ADD COLUMN arquivo_boleto_url TEXT,
ADD COLUMN banco TEXT,
ADD COLUMN agencia TEXT,
ADD COLUMN conta_corrente TEXT,
ADD COLUMN chave_pix TEXT,
ADD COLUMN cnpj_cpf_titular TEXT,
ADD COLUMN nome_titular_conta TEXT,
ADD COLUMN justificativa_divergencia_titular TEXT;