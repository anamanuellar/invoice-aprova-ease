-- Criar tabela de histórico de solicitações
CREATE TABLE public.solicitacao_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes_nf(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo text NOT NULL,
  usuario_id uuid,
  usuario_nome text NOT NULL DEFAULT 'Sistema',
  comentario text,
  motivo_rejeicao text,
  dias_para_vencimento integer,
  tempo_no_status_anterior interval,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_historico_solicitacao_id ON public.solicitacao_historico(solicitacao_id);
CREATE INDEX idx_historico_created_at ON public.solicitacao_historico(created_at);
CREATE INDEX idx_historico_status_novo ON public.solicitacao_historico(status_novo);

-- Habilitar RLS
ALTER TABLE public.solicitacao_historico ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Admins e financeiros podem ver todo histórico"
  ON public.solicitacao_historico FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "Gestores podem ver histórico da sua empresa"
  ON public.solicitacao_historico FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.solicitacoes_nf s 
    WHERE s.id = solicitacao_id 
    AND s.empresa_id IS NOT NULL
    AND has_role_in_company(auth.uid(), 'gestor', s.empresa_id)
  ));

CREATE POLICY "Solicitantes podem ver histórico das próprias solicitações"
  ON public.solicitacao_historico FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.solicitacoes_nf s 
    WHERE s.id = solicitacao_id AND s.solicitante_id = auth.uid()
  ));

-- Função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION public.registrar_historico_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nome_usuario text;
  ultimo_registro timestamptz;
  tempo_anterior interval;
  dias_venc integer;
BEGIN
  -- Só registra se o status mudou
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Buscar nome do usuário atual
    SELECT name INTO nome_usuario 
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    -- Buscar último registro de histórico para calcular tempo no status anterior
    SELECT created_at INTO ultimo_registro 
    FROM public.solicitacao_historico 
    WHERE solicitacao_id = NEW.id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Calcular tempo no status anterior
    IF ultimo_registro IS NOT NULL THEN
      tempo_anterior := now() - ultimo_registro;
    ELSE
      tempo_anterior := now() - OLD.created_at;
    END IF;
    
    -- Calcular dias para vencimento (data_vencimento - data_emissao)
    IF NEW.data_vencimento IS NOT NULL AND NEW.data_emissao IS NOT NULL THEN
      dias_venc := NEW.data_vencimento - NEW.data_emissao;
    ELSE
      dias_venc := NULL;
    END IF;
    
    -- Inserir registro de histórico
    INSERT INTO public.solicitacao_historico (
      solicitacao_id,
      status_anterior,
      status_novo,
      usuario_id,
      usuario_nome,
      comentario,
      motivo_rejeicao,
      dias_para_vencimento,
      tempo_no_status_anterior
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      COALESCE(nome_usuario, 'Sistema'),
      CASE 
        WHEN NEW.status LIKE 'Rejeitada%' THEN COALESCE(NEW.comentario_gestor, NEW.comentario_financeiro)
        ELSE NULL
      END,
      CASE 
        WHEN NEW.status LIKE 'Rejeitada%' THEN 'Pendente classificação'
        ELSE NULL
      END,
      dias_venc,
      tempo_anterior
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela solicitacoes_nf
CREATE TRIGGER trg_registrar_historico_status
  AFTER UPDATE ON public.solicitacoes_nf
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_historico_status();

-- Função para registrar criação da solicitação
CREATE OR REPLACE FUNCTION public.registrar_historico_criacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nome_usuario text;
  dias_venc integer;
BEGIN
  -- Buscar nome do usuário
  SELECT name INTO nome_usuario 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Calcular dias para vencimento
  IF NEW.data_vencimento IS NOT NULL AND NEW.data_emissao IS NOT NULL THEN
    dias_venc := NEW.data_vencimento - NEW.data_emissao;
  ELSE
    dias_venc := NULL;
  END IF;
  
  -- Inserir registro inicial
  INSERT INTO public.solicitacao_historico (
    solicitacao_id,
    status_anterior,
    status_novo,
    usuario_id,
    usuario_nome,
    dias_para_vencimento
  ) VALUES (
    NEW.id,
    NULL,
    NEW.status,
    auth.uid(),
    COALESCE(nome_usuario, NEW.nome_solicitante),
    dias_venc
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar criação
CREATE TRIGGER trg_registrar_historico_criacao
  AFTER INSERT ON public.solicitacoes_nf
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_historico_criacao();