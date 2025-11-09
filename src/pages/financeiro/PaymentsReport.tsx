import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Pagamento {
  id: string;
  numero_nf: string;
  nome_fornecedor: string;
  valor_total: number;
  data_vencimento: string;
  previsao_pagamento: string | null;
  status: string;
  forma_pagamento: string | null;
}

export default function PaymentsReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchPagamentos();
  }, []);

  const fetchPagamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_nf')
        .select('id, numero_nf, nome_fornecedor, valor_total, data_vencimento, previsao_pagamento, status, forma_pagamento')
        .in('status', ['Aprovada', 'Pagamento programado', 'Pago'])
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      setPagamentos(data || []);
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

  const filteredPagamentos = filterStatus === "all" 
    ? pagamentos 
    : pagamentos.filter(p => p.status === filterStatus);

  const totalPagamentos = filteredPagamentos.reduce((sum, p) => sum + Number(p.valor_total), 0);

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: { variant: any; className: string } } = {
      'Aprovada': { variant: 'default', className: 'bg-green-500' },
      'Pagamento programado': { variant: 'default', className: 'bg-blue-500' },
      'Pago': { variant: 'default', className: 'bg-purple-500' },
    };
    const config = variants[status] || { variant: 'outline', className: '' };
    return <Badge className={config.className}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Relatório de Pagamentos</h1>
              <p className="text-muted-foreground">Visualize todos os pagamentos do sistema</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        <Card className="bg-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pagamentos</p>
                <p className="text-3xl font-bold">
                  R$ {totalPagamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <FileText className="h-12 w-12 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pagamentos ({filteredPagamentos.length})</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant={filterStatus === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  Todos
                </Button>
                <Button 
                  variant={filterStatus === "Aprovada" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("Aprovada")}
                >
                  Aprovados
                </Button>
                <Button 
                  variant={filterStatus === "Pagamento programado" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("Pagamento programado")}
                >
                  Programados
                </Button>
                <Button 
                  variant={filterStatus === "Pago" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("Pago")}
                >
                  Pagos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : filteredPagamentos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pagamento encontrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NF</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Previsão</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagamentos.map((pag) => (
                    <TableRow key={pag.id}>
                      <TableCell>{pag.numero_nf}</TableCell>
                      <TableCell>{pag.nome_fornecedor}</TableCell>
                      <TableCell>R$ {pag.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{new Date(pag.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        {pag.previsao_pagamento 
                          ? new Date(pag.previsao_pagamento).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="capitalize">{pag.forma_pagamento?.replace('_', ' ') || '-'}</TableCell>
                      <TableCell>{getStatusBadge(pag.status)}</TableCell>
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