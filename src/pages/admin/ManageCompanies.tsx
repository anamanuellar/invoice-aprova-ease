import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, Search, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompanyData } from "@/hooks/useCompanyData";

export default function ManageCompanies() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [sectorDialogOpen, setSectorDialogOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({ codigo: "", nome: "" });
  const [newSectorData, setNewSectorData] = useState({ nome: "" });
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isCreatingSector, setIsCreatingSector] = useState(false);

  const { companies, sectors, loading, createCompany, createSector } = useCompanyData();

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => 
      company.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  const handleCreateCompany = async () => {
    if (!newCompanyData.codigo || !newCompanyData.nome) return;

    setIsCreatingCompany(true);
    const result = await createCompany(newCompanyData);
    setIsCreatingCompany(false);

    if (result.success) {
      setCompanyDialogOpen(false);
      setNewCompanyData({ codigo: "", nome: "" });
    }
  };

  const handleCreateSector = async () => {
    if (!newSectorData.nome) return;

    setIsCreatingSector(true);
    const result = await createSector(newSectorData);
    setIsCreatingSector(false);

    if (result.success) {
      setSectorDialogOpen(false);
      setNewSectorData({ nome: "" });
    }
  };

  // Calculate statistics
  const totalUsers = companies.reduce((sum, company) => sum + (company.usuariosAtivos || 0), 0);
  const totalRequests = companies.reduce((sum, company) => sum + (company.solicitacoesMes || 0), 0);

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
          <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
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
                  <Input 
                    id="codigo" 
                    placeholder="Código da empresa"
                    value={newCompanyData.codigo}
                    onChange={(e) => setNewCompanyData({...newCompanyData, codigo: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nome">Nome da Empresa</Label>
                  <Input 
                    id="nome" 
                    placeholder="Nome completo da empresa"
                    value={newCompanyData.nome}
                    onChange={(e) => setNewCompanyData({...newCompanyData, nome: e.target.value})}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateCompany}
                  disabled={isCreatingCompany}
                >
                  {isCreatingCompany ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Empresa"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
              <p className="text-sm text-muted-foreground">Empresas Ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{totalUsers}</div>
              <p className="text-sm text-muted-foreground">Usuários Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{totalRequests}</div>
              <p className="text-sm text-muted-foreground">Solicitações/Mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{sectors.length}</div>
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
            <CardTitle>
              Empresas Cadastradas
              {!loading && <span className="text-sm font-normal text-muted-foreground ml-2">({filteredCompanies.length} empresas)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-12 w-[100px]" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 
                  "Nenhuma empresa encontrada com os filtros aplicados." :
                  "Nenhuma empresa cadastrada no sistema."
                }
              </div>
            ) : (
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
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-mono">{company.codigo}</TableCell>
                      <TableCell className="font-medium">{company.nome}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{company.usuariosAtivos || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.solicitacoesMes || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Ativa</Badge>
                      </TableCell>
                      <TableCell>{new Date(company.created_at).toLocaleDateString('pt-BR')}</TableCell>
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
            )}
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
                {sectors.map((sector, index) => (
                  <Badge key={sector.id} variant="secondary">
                    {sector.nome}
                  </Badge>
                ))}
                {sectors.length === 0 && (
                  <p className="text-muted-foreground text-sm">Nenhum setor cadastrado</p>
                )}
              </div>
              <Dialog open={sectorDialogOpen} onOpenChange={setSectorDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Setor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Setor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sector-name">Nome do Setor</Label>
                      <Input 
                        id="sector-name" 
                        placeholder="Nome do setor"
                        value={newSectorData.nome}
                        onChange={(e) => setNewSectorData({nome: e.target.value})}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleCreateSector}
                      disabled={isCreatingSector}
                    >
                      {isCreatingSector ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Setor"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}