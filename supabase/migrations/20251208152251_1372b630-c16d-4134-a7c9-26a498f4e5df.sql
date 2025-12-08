-- Corrigir a função notify_status_change para usar a assinatura correta de http_post
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  email_solicitante text;
  http_response public.http_response;
  request_body text;
begin
  -- Apenas se o status foi alterado
  if new.status is distinct from old.status then
    -- Buscar o e-mail do solicitante a partir do profiles
    select email into email_solicitante
    from public.profiles
    where user_id = new.solicitante_id;

    -- Se não encontrou email, retorna sem fazer nada
    if email_solicitante is null then
      return new;
    end if;

    -- Montar o body como JSON string
    request_body := json_build_object(
      'email', email_solicitante,
      'nome', new.nome_solicitante,
      'status', new.status,
      'nome_do_fornecedor', new.nome_fornecedor,
      'numero_documento', new.numero_nf,
      'tipo_documento', new.produto_servico
    )::text;

    -- Chamar a função HTTP usando a assinatura correta: http_post(uri, content, content_type)
    BEGIN
      select * into http_response from public.http_post(
        'https://wwvdhpsxsnvsqifuslnu.supabase.co/functions/v1/enviarEmailStatus',
        request_body,
        'application/json'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar, apenas log e continua (não bloqueia a operação principal)
      RAISE NOTICE 'Erro ao enviar notificação: %', SQLERRM;
    END;
  end if;

  return new;
end;
$$;

-- Adicionar política para permitir gestores rejeitarem solicitações
DROP POLICY IF EXISTS "Gestores can reject requests" ON public.solicitacoes_nf;
CREATE POLICY "Gestores can reject requests"
ON public.solicitacoes_nf
FOR UPDATE
USING (
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'))
  AND status = 'Aguardando aprovação do gestor'
)
WITH CHECK (
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'admin'))
  AND status IN ('Em análise financeira', 'Rejeitada pelo gestor')
);