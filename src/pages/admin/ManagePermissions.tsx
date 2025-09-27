import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Edit, Search, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ManagePermissions() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Mock data - replace with real data from Supabase
  const usersWithPermissions = [
    {
      id: "1",
      name: "João Silva",
      email: "joao@empresa.com",
      roles: ["solicitante"],
      company: "Empresa ABC",
      permissions: {
        create_request: true,
        view_own_requests: true,
        view_all_requests: false,
        approve_requests: false,
        process_payments: false,
        manage_users: false,
        system_admin: false
      }
    },
    {
      id: "2",
      name: "Maria Santos", 
      email: "maria@empresa.com",
      roles: ["gestor", "solicitante"],
      company: "Empresa ABC",
      permissions: {
        create_request: true,
        view_own_requests: true,
        view_all_requests: true,
        approve_requests: true,
        process_payments: false,
        manage_users: false,
        system_admin: false
      }
    }
  ];

  const permissionLabels = {
    create_request: "Criar Solicitações",
    view_own_requests: "Ver Próprias Solicitações", 
    view_all_requests: "Ver Todas Solicitações",
    approve_requests: "Aprovar Solicitações",
    process_payments: "Processar Pagamentos",
    manage_users: "Gerenciar Usuários",
    system_admin: "Administração do Sistema"
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      financeiro: "bg-green-100 text-green-800",
      gestor: "bg-blue-100 text-blue-800", 
      solicitante: "bg-gray-100 text-gray-800"
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    if (!selectedUser) return;
    
    setSelectedUser({
      ...selectedUser,
      permissions: {
        ...selectedUser.permissions,
        [permissionKey]: checked
      }
    });
  };

  const savePermissions = () => {
    // Here would be the actual permission update logic with Supabase
    console.log("Saving permissions for user:", selectedUser);
    alert("Permissões atualizadas com sucesso!");
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Permissões</h1>
            <p className="text-muted-foreground">Configure permissões específicas para cada usuário</p>
          </div>
        </div>

        {/* Permission Matrix Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Permissões por Papel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Permissão</th>
                    <th className="text-center p-2">Solicitante</th>
                    <th className="text-center p-2">Gestor</th>
                    <th className="text-center p-2">Financeiro</th>
                    <th className="text-center p-2">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <tr key={key} className="border-b">
                      <td className="p-2 font-medium">{label}</td>
                      <td className="text-center p-2">
                        {(key === 'create_request' || key === 'view_own_requests') ? '✅' : '❌'}
                      </td>
                      <td className="text-center p-2">
                        {(key !== 'process_payments' && key !== 'manage_users' && key !== 'system_admin') ? '✅' : '❌'}
                      </td>
                      <td className="text-center p-2">
                        {key !== 'system_admin' ? '✅' : '❌'}
                      </td>
                      <td className="text-center p-2">✅</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="solicitante">Solicitante</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários e Permissões</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papéis</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Permissões Ativas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithPermissions.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} className={getRoleBadgeColor(role)}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{user.company}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {Object.values(user.permissions).filter(Boolean).length} ativas
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Permissões - {user.name}</DialogTitle>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                {Object.entries(permissionLabels).map(([key, label]) => (
                                  <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={key}
                                      checked={selectedUser.permissions[key]}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(key, checked as boolean)
                                      }
                                    />
                                    <Label htmlFor={key} className="text-sm cursor-pointer">
                                      {label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                  Cancelar
                                </Button>
                                <Button onClick={savePermissions}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Aplicar Modelo de Permissões
            </Button>
            <Button variant="outline" className="justify-start">
              <Edit className="h-4 w-4 mr-2" />
              Edição em Lote
            </Button>
            <Button variant="outline" className="justify-start">
              <Save className="h-4 w-4 mr-2" />
              Exportar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}