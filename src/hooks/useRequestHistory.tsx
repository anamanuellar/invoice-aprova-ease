import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HistoryRecord {
  id: string;
  solicitacao_id: string;
  status_anterior: string | null;
  status_novo: string;
  usuario_id: string | null;
  usuario_nome: string;
  comentario: string | null;
  motivo_rejeicao: string | null;
  dias_para_vencimento: number | null;
  tempo_no_status_anterior: string | null;
  created_at: string;
}

export const useRequestHistory = (solicitacaoId: string | null) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!solicitacaoId) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("solicitacao_historico")
          .select("*")
          .eq("solicitacao_id", solicitacaoId)
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;
        // Cast the data to handle PostgreSQL interval type
        const formattedData = (data || []).map(record => ({
          ...record,
          tempo_no_status_anterior: record.tempo_no_status_anterior as string | null
        }));
        setHistory(formattedData);
      } catch (err: any) {
        console.error("Erro ao buscar histórico:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [solicitacaoId]);

  return { history, loading, error };
};
