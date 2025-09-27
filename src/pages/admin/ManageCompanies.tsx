import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Search, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ManageCompanies() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with real data from Supabase
  const companies = [
    {
      id: "1",
      codigo: "ABC001",
      nome: "Empresa ABC Ltda",
      usuariosAtivos: 25,
      solicitacoesMes: 45,
      status: "active",
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      codigo: "XYZ002", 
      nome: "XYZ Corporação",
      usuariosAtivos: 12,
      solicitacoesMes: 23,
      status: "active",
      createdAt: "2024-02-10"
    }
  ];

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
              <h1 className="text-3xl font-bold">Gerenciar Empresas</h1>
              <p className="text-muted-foreground">Gerencie empresas e setores cadastrados no sistema</p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Empresa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input id="codigo" placeholder="Código da empresa" />
                </div>
                <div>
                  <Label htmlFor="nome">Nome da Empresa</Label>
                  <Input id="nome" placeholder="Nome completo da empresa" />
                </div>
                <Button className="w-full">Criar Empresa</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">2</div>
              <p className="text-sm text-muted-foreground">Empresas Ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">37</div>
              <p className="text-sm text-muted-foreground">Usuários Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">68</div>
              <p className="text-sm text-muted-foreground">Solicitações/Mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">5</div>
              <p className="text-sm text-muted-foreground">Setores Cadastrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Empresas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome da Empresa</TableHead>
                  <TableHead>Usuários Ativos</TableHead>
                  <TableHead>Solicitações/Mês</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-mono">{company.codigo}</TableCell>
                    <TableCell className="font-medium">{company.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{company.usuariosAtivos}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.solicitacoesMes}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                        {company.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sectors Management */}
        <Card>
          <CardHeader>
            <CardTitle>Setores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-blue-100 text-blue-800">Tecnologia</Badge>
                <Badge className="bg-green-100 text-green-800">Recursos Humanos</Badge>
                <Badge className="bg-purple-100 text-purple-800">Financeiro</Badge>
                <Badge className="bg-orange-100 text-orange-800">Marketing</Badge>
                <Badge className="bg-red-100 text-red-800">Operações</Badge>
              </div>
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Gerenciar Setores
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}