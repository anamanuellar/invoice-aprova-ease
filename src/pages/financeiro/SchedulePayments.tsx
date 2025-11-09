import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CalendarIcon, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Solicitacao {
  id: string;
  numero_nf: string;
  nome_fornecedor: string;
  valor_total: number;
  data_vencimento: string;
  previsao_pagamento: string | null;
}

export default function SchedulePayments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<{ [key: string]: Date }>({});

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  const fetchSolicitacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_nf')
        .select('id, numero_nf, nome_fornecedor, valor_total, data_vencimento, previsao_pagamento')
        .eq('status', 'Aprovada')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setSolicitacoes(data || []);
      
      // Initialize dates
      const dates: { [key: string]: Date } = {};
      data?.forEach(sol => {
        if (sol.previsao_pagamento) {
          dates[sol.id] = new Date(sol.previsao_pagamento);
        }
      });
      setSelectedDate(dates);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (id: string) => {
    const date = selectedDate[id];
    if (!date) {
      toast({
        title: "Erro",
        description: "Selecione uma data",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('solicitacoes_nf')
        .update({
          previsao_pagamento: format(date, 'yyyy-MM-dd'),
          status: 'Pagamento programado'
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pagamento agendado com sucesso",
      });
      
      fetchSolicitacoes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Agendar Pagamentos</h1>
            <p className="text-muted-foreground">Defina datas de pagamento para solicitações aprovadas</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Aprovados ({solicitacoes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : solicitacoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma solicitação aprovada para agendamento
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NF</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Previsão Pagamento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitacoes.map((sol) => (
                    <TableRow key={sol.id}>
                      <TableCell>{sol.numero_nf}</TableCell>
                      <TableCell>{sol.nome_fornecedor}</TableCell>
                      <TableCell>R$ {sol.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{new Date(sol.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !selectedDate[sol.id] && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate[sol.id] ? (
                                format(selectedDate[sol.id], "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecionar data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={selectedDate[sol.id]}
                              onSelect={(date) => {
                                if (date) {
                                  setSelectedDate({ ...selectedDate, [sol.id]: date });
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveSchedule(sol.id)}
                          disabled={!selectedDate[sol.id]}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}