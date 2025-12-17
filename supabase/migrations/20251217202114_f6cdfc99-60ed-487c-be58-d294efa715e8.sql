-- Fix the notify_status_change function to use pg_net extension properly
-- The http_response type doesn't exist, we need to use net.http_post from pg_net

CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  email_solicitante text;
  request_body text;
begin
  -- Only if status changed
  if new.status is distinct from old.status then
    -- Get requester email from profiles
    select email into email_solicitante
    from public.profiles
    where user_id = new.solicitante_id;

    -- If no email found, return without doing anything
    if email_solicitante is null then
      return new;
    end if;

    -- Build request body as JSON string
    request_body := json_build_object(
      'email', email_solicitante,
      'nome', new.nome_solicitante,
      'status', new.status,
      'nome_do_fornecedor', new.nome_fornecedor,
      'numero_documento', new.numero_nf,
      'tipo_documento', new.produto_servico
    )::text;

    -- Use pg_net extension for async HTTP call (fire and forget)
    -- This won't block the main transaction
    BEGIN
      PERFORM net.http_post(
        url := 'https://wwvdhpsxsnvsqifuslnu.supabase.co/functions/v1/enviarEmailStatus',
        body := request_body::jsonb,
        headers := jsonb_build_object('Content-Type', 'application/json')
      );
    EXCEPTION WHEN OTHERS THEN
      -- If it fails, just log and continue (don't block the main operation)
      RAISE NOTICE 'Error sending notification: %', SQLERRM;
    END;
  end if;

  return new;
end;
$function$;