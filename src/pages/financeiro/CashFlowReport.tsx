import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface FluxoMensal {
  mes: string;
  previsto: number;
  realizado: number;
}

export default function CashFlowReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fluxoData, setFluxoData] = useState<FluxoMensal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFluxoData();
  }, []);

  const fetchFluxoData = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_nf')
        .select('valor_total, previsao_pagamento, status, data_vencimento');

      if (error) throw error;

      // Agrupar por mês
      const mesesMap: { [key: string]: { previsto: number; realizado: number } } = {};
      
      data?.forEach(sol => {
        const mes = sol.previsao_pagamento 
          ? new Date(sol.previsao_pagamento).toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
          : new Date(sol.data_vencimento).toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
        
        if (!mesesMap[mes]) {
          mesesMap[mes] = { previsto: 0, realizado: 0 };
        }
        
        if (sol.status === 'Pago') {
          mesesMap[mes].realizado += Number(sol.valor_total);
        } else if (sol.status === 'Aprovada' || sol.status === 'Pagamento programado') {
          mesesMap[mes].previsto += Number(sol.valor_total);
        }
      });

      const fluxoArray = Object.entries(mesesMap).map(([mes, valores]) => ({
        mes,
        ...valores
      }));

      setFluxoData(fluxoArray);
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

  const totalPrevisto = fluxoData.reduce((sum, item) => sum + item.previsto, 0);
  const totalRealizado = fluxoData.reduce((sum, item) => sum + item.realizado, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Relatório de Fluxo de Caixa</h1>
              <p className="text-muted-foreground">Visualize pagamentos previstos e realizados</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Previsto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                R$ {totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Realizado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                R$ {totalRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={fluxoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <Legend />
                  <Bar dataKey="previsto" fill="#3b82f6" name="Previsto" />
                  <Bar dataKey="realizado" fill="#22c55e" name="Realizado" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}