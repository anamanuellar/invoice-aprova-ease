-- Atualizar a função notify_status_change para usar o namespace correto da extensão pg_net
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
declare
  email_solicitante text;
  request_id bigint;
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

    -- Chamar a função HTTP (Edge Function no Supabase) de forma assíncrona
    -- Usando net.http_post do schema extensions
    select http_post(
      url := 'https://wwvdhpsxsnvsqifuslnu.supabase.co/functions/v1/enviarEmailStatus',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'email', email_solicitante,
        'nome', new.nome_solicitante,
        'status', new.status,
        'nome_do_fornecedor', new.nome_fornecedor,
        'numero_documento', new.numero_nf,
        'tipo_documento', new.produto_servico
      )
    ) into request_id;
  end if;

  return new;
end;
$$;