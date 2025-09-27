import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, BarChart3, TrendingUp, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Reports() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("last30days");
  const [selectedCompany, setSelectedCompany] = useState("all");

  // Mock data - replace with real data from Supabase
  const reportData = {
    totalSolicitacoes: 156,
    aprovadas: 89,
    rejeitadas: 12,
    pendentes: 55,
    valorTotal: "R$ 45.670,89",
    tempoMedioAprovacao: "2.5 dias"
  };

  const topSectors = [
    { name: "Tecnologia", count: 45, percentage: 28.8 },
    { name: "Marketing", count: 32, percentage: 20.5 },
    { name: "Recursos Humanos", count: 28, percentage: 17.9 },
    { name: "Operações", count: 25, percentage: 16.0 },
    { name: "Financeiro", count: 26, percentage: 16.7 }
  ];

  const recentRequests = [
    {
      id: "001",
      fornecedor: "Tech Solutions Ltda",
      valor: "R$ 2.500,00",
      status: "Aprovada",
      data: "2024-01-20"
    },
    {
      id: "002", 
      fornecedor: "Marketing Digital Corp",
      valor: "R$ 1.200,00",
      status: "Pendente",
      data: "2024-01-19"
    },
    {
      id: "003",
      fornecedor: "Consultoria Empresarial",
      valor: "R$ 3.800,00", 
      status: "Rejeitada",
      data: "2024-01-18"
    }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      "Aprovada": "bg-green-100 text-green-800",
      "Pendente": "bg-yellow-100 text-yellow-800",
      "Rejeitada": "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
              <p className="text-muted-foreground">Acompanhe métricas e performance do sistema</p>
            </div>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="last90days">Últimos 90 dias</SelectItem>
                  <SelectItem value="thisyear">Este ano</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  <SelectItem value="empresa-abc">Empresa ABC</SelectItem>
                  <SelectItem value="empresa-xyz">Empresa XYZ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{reportData.totalSolicitacoes}</div>
                  <p className="text-xs text-muted-foreground">Total Solicitações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{reportData.aprovadas}</div>
                  <p className="text-xs text-muted-foreground">Aprovadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{reportData.rejeitadas}</div>
                  <p className="text-xs text-muted-foreground">Rejeitadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{reportData.pendentes}</div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <div className="text-lg font-bold text-green-600">{reportData.valorTotal}</div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <div className="text-lg font-bold">{reportData.tempoMedioAprovacao}</div>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Sectors */}
          <Card>
            <CardHeader>
              <CardTitle>Setores com Mais Solicitações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topSectors.map((sector) => (
                  <div key={sector.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full bg-blue-500" 
                        style={{ backgroundColor: `hsl(${sector.percentage * 3.6}, 70%, 50%)` }}
                      />
                      <span className="font-medium">{sector.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{sector.count}</Badge>
                      <span className="text-sm text-muted-foreground">{sector.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">{request.fornecedor}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{request.valor}</div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Indicadores de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">87%</div>
                <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">2.1</div>
                <p className="text-sm text-muted-foreground">Dias Médio de Processamento</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">95%</div>
                <p className="text-sm text-muted-foreground">Satisfação dos Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}