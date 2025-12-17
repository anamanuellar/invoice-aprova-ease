import { useRequestHistory, HistoryRecord } from "@/hooks/useRequestHistory";
import { format, formatDistanceStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText,
  CreditCard,
  DollarSign,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestTimelineProps {
  solicitacaoId: string | null;
  className?: string;
}

const statusIcons: Record<string, React.ElementType> = {
  "Aguardando aprovação do gestor": Clock,
  "Em análise financeira": AlertCircle,
  "Aprovada": CheckCircle,
  "Pagamento programado": CreditCard,
  "Pago": DollarSign,
  "Rejeitada pelo gestor": XCircle,
  "Rejeitada pelo financeiro": XCircle,
};

const statusColors: Record<string, string> = {
  "Aguardando aprovação do gestor": "text-yellow-600 bg-yellow-100 border-yellow-300",
  "Em análise financeira": "text-blue-600 bg-blue-100 border-blue-300",
  "Aprovada": "text-green-600 bg-green-100 border-green-300",
  "Pagamento programado": "text-purple-600 bg-purple-100 border-purple-300",
  "Pago": "text-emerald-700 bg-emerald-100 border-emerald-300",
  "Rejeitada pelo gestor": "text-red-600 bg-red-100 border-red-300",
  "Rejeitada pelo financeiro": "text-red-600 bg-red-100 border-red-300",
};

const formatDuration = (intervalString: string | null): string => {
  if (!intervalString) return "";
  
  // Parse PostgreSQL interval format (e.g., "2 days 03:45:12")
  const parts = intervalString.match(/(?:(\d+) days?)?\s*(?:(\d{2}):(\d{2}):(\d{2}))?/);
  if (!parts) return intervalString;

  const days = parseInt(parts[1] || "0");
  const hours = parseInt(parts[2] || "0");
  const minutes = parseInt(parts[3] || "0");

  const segments: string[] = [];
  if (days > 0) segments.push(`${days}d`);
  if (hours > 0) segments.push(`${hours}h`);
  if (minutes > 0 && days === 0) segments.push(`${minutes}min`);

  return segments.length > 0 ? segments.join(" ") : "< 1min";
};

export const RequestTimeline = ({ solicitacaoId, className }: RequestTimelineProps) => {
  const { history, loading, error } = useRequestHistory(solicitacaoId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>Não foi possível carregar o histórico.</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum histórico disponível.</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Linha vertical de conexão */}
      <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-border" />

      <div className="space-y-4">
        {history.map((record, index) => {
          const Icon = statusIcons[record.status_novo] || Clock;
          const colorClass = statusColors[record.status_novo] || "text-muted-foreground bg-muted border-border";
          const isFirst = index === 0;
          const isLast = index === history.length - 1;

          return (
            <div key={record.id} className="relative flex gap-4">
              {/* Ícone circular */}
              <div className={cn(
                "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0",
                colorClass
              )}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Conteúdo */}
              <div className={cn(
                "flex-1 pb-4",
                isLast && "pb-0"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h4 className="font-medium text-foreground">
                      {isFirst && !record.status_anterior 
                        ? "Solicitação criada" 
                        : record.status_novo}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      por {record.usuario_nome}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <p>{format(new Date(record.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    {record.tempo_no_status_anterior && !isFirst && (
                      <p className="text-xs opacity-70">
                        {formatDuration(record.tempo_no_status_anterior)} no status anterior
                      </p>
                    )}
                  </div>
                </div>

                {/* Informações adicionais */}
                {record.comentario && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm">
                    <p className="font-medium text-xs text-muted-foreground mb-1">Comentário:</p>
                    <p>{record.comentario}</p>
                  </div>
                )}

                {record.motivo_rejeicao && (
                  <div className="mt-2 p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                    <p className="font-medium text-xs mb-1">Motivo da rejeição:</p>
                    <p>{record.motivo_rejeicao}</p>
                  </div>
                )}

                {isFirst && record.dias_para_vencimento !== null && (
                  <div className="mt-2 text-xs">
                    <span className={cn(
                      "px-2 py-1 rounded-full",
                      record.dias_para_vencimento < 25 
                        ? "bg-red-100 text-red-700" 
                        : record.dias_para_vencimento <= 30 
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                    )}>
                      Prazo para vencimento: {record.dias_para_vencimento} dias
                      {record.dias_para_vencimento < 25 && " (curto)"}
                      {record.dias_para_vencimento >= 25 && record.dias_para_vencimento <= 30 && " (ideal)"}
                      {record.dias_para_vencimento > 30 && " (bom)"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
