import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Solicitacao {
  id: string;
  numero_nf: string;
  nome_fornecedor: string;
  valor_total: number;
  data_vencimento: string;
  status: string;
}

export default function ApprovePaymentsBatch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  const fetchSolicitacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_nf')
        .select('id, numero_nf, nome_fornecedor, valor_total, data_vencimento, status')
        .eq('status', 'Em análise financeira')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setSolicitacoes(data || []);
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

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === solicitacoes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(solicitacoes.map(s => s.id)));
    }
  };

  const handleApproveBatch = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "Aviso",
        description: "Selecione ao menos uma solicitação",
        variant: "destructive",
      });
      return;
    }

    setApproving(true);
    try {
      const { error } = await supabase
        .from('solicitacoes_nf')
        .update({
          status: 'Aprovada',
          comentario_financeiro: 'Aprovada em lote',
          data_analise_financeira: new Date().toISOString()
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedIds.size} solicitação(ões) aprovada(s) com sucesso`,
      });

      setSelectedIds(new Set());
      fetchSolicitacoes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  const totalSelected = Array.from(selectedIds)
    .reduce((sum, id) => {
      const sol = solicitacoes.find(s => s.id === id);
      return sum + (sol?.valor_total || 0);
    }, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Aprovar Pagamentos em Lote</h1>
              <p className="text-muted-foreground">Selecione múltiplas solicitações para aprovar</p>
            </div>
          </div>
          <Button 
            onClick={handleApproveBatch} 
            disabled={selectedIds.size === 0 || approving}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Aprovar Selecionadas ({selectedIds.size})
          </Button>
        </div>

        {selectedIds.size > 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <p className="text-green-800 font-semibold">
                Total selecionado: R$ {totalSelected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Solicitações Pendentes ({solicitacoes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : solicitacoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma solicitação pendente de aprovação
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedIds.size === solicitacoes.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>NF</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitacoes.map((sol) => (
                    <TableRow key={sol.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.has(sol.id)}
                          onCheckedChange={() => toggleSelection(sol.id)}
                        />
                      </TableCell>
                      <TableCell>{sol.numero_nf}</TableCell>
                      <TableCell>{sol.nome_fornecedor}</TableCell>
                      <TableCell>R$ {sol.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{new Date(sol.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
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