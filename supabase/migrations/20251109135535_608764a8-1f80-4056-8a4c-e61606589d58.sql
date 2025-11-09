-- Garantir que o bucket 'invoices' seja público para facilitar o acesso
UPDATE storage.buckets
SET public = true
WHERE id = 'invoices';

-- Criar tabela de logs de ações do sistema
CREATE TABLE IF NOT EXISTS public.action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS na tabela de logs
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

-- Policy para admins verem todos os logs
CREATE POLICY "Admins can view all logs"
ON public.action_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy para inserir logs (todos autenticados)
CREATE POLICY "Authenticated users can insert logs"
ON public.action_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Adicionar trigger para registrar exclusões de solicitações
CREATE OR REPLACE FUNCTION public.log_solicitacao_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.action_logs (
    user_id,
    action_type,
    table_name,
    record_id,
    old_data,
    description
  ) VALUES (
    auth.uid(),
    'DELETE',
    'solicitacoes_nf',
    OLD.id,
    to_jsonb(OLD),
    'Solicitação excluída: NF ' || OLD.numero_nf
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER solicitacao_deletion_log
BEFORE DELETE ON public.solicitacoes_nf
FOR EACH ROW
EXECUTE FUNCTION public.log_solicitacao_deletion();

-- Adicionar policy para permitir solicitantes excluírem suas próprias solicitações
CREATE POLICY "Solicitantes can delete own requests"
ON public.solicitacoes_nf
FOR DELETE
USING (
  auth.uid() = solicitante_id AND 
  status = 'Aguardando aprovação do gestor'
);