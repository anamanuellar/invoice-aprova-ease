-- Tornar centro_custo_id opcional
ALTER TABLE public.solicitacoes_nf ALTER COLUMN centro_custo_id DROP NOT NULL;