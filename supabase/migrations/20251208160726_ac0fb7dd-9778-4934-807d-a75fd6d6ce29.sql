-- Atualizar política para permitir solicitantes editarem solicitações rejeitadas pelo gestor
DROP POLICY IF EXISTS "Solicitantes can update own requests in initial status" ON public.solicitacoes_nf;

CREATE POLICY "Solicitantes can update own pending or rejected requests" 
ON public.solicitacoes_nf 
FOR UPDATE 
USING (
  (auth.uid() = solicitante_id) 
  AND (status IN ('Aguardando aprovação do gestor', 'Rejeitada pelo gestor')) 
  AND (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.active = true
  ))
  AND (has_role(auth.uid(), 'solicitante') OR has_role(auth.uid(), 'admin'))
)
WITH CHECK (
  (auth.uid() = solicitante_id) 
  AND (status = 'Aguardando aprovação do gestor')
  AND (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.active = true
  ))
  AND (has_role(auth.uid(), 'solicitante') OR has_role(auth.uid(), 'admin'))
);