import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, UserPlus, Search, Edit, Trash2, Loader2, Key, UserCheck, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "@/hooks/useUsers";
import { useCompanies } from "@/hooks/useCompanies";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ManageUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    roles: [] as string[],
    empresaId: ""
  });
  const [isCreating, setIsCreating] = useState(false);

  const { users, loading, createUser, refetch } = useUsers();
  const { companies } = useCompanies();

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Filter users based on search and role filter
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === "all" || 
                         user.roles.some(roleObj => roleObj.role === filterRole);
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const handleCreateUser = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password || newUserData.roles.length === 0) {
      return;
    }

    setIsCreating(true);
    const result = await createUser(newUserData);
    setIsCreating(false);

    if (result.success) {
      setDialogOpen(false);
      setNewUserData({
        name: "",
        email: "",
        password: "",
        roles: [],
        empresaId: ""
      });
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: editingUser.name, email: editingUser.email })
        .eq('user_id', editingUser.id);

      if (profileError) throw profileError;

      // Remover roles antigas
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.id);

      // Adicionar novas roles
      const roleInserts = editingUser.roles.map((role: string) => ({
        user_id: editingUser.id,
        role,
        empresa_id: editingUser.empresaId || null
      }));

      const { error: rolesError } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (rolesError) throw rolesError;

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Usuário desativado" : "Usuário ativado",
        description: currentStatus 
          ? "O usuário não poderá mais acessar o sistema." 
          : "O usuário pode acessar o sistema novamente.",
      });

      refetch();
    } catch (err) {
      console.error('Error toggling user status:', err);
      toast({
        title: "Erro ao alterar status",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !temporaryPassword) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma senha temporária",
        variant: "destructive",
      });
      return;
    }

    if (temporaryPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: resetPasswordUser.id,
          temporaryPassword: temporaryPassword,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Senha redefinida",
        description: "A senha temporária foi definida com sucesso",
      });

      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      setTemporaryPassword('');
      refetch();
    } catch (err) {
      console.error('Error resetting password:', err);
      toast({
        title: "Erro ao redefinir senha",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
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
              <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
              <p className="text-muted-foreground">Gerencie usuários e suas permissões no sistema</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input 
                      id="name" 
                      placeholder="Nome completo"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="email@exemplo.com"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Senha Temporária</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Mínimo 8 caracteres"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Papéis (selecione múltiplos)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["solicitante", "gestor", "financeiro", "admin"].map((role) => (
                      <label key={role} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newUserData.roles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUserData({...newUserData, roles: [...newUserData.roles, role]});
                            } else {
                              setNewUserData({...newUserData, roles: newUserData.roles.filter(r => r !== role)});
                            }
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="empresa">Empresa (Opcional)</Label>
                  <Select value={newUserData.empresaId} onValueChange={(value) => 
                    setNewUserData({...newUserData, empresaId: value === "all" ? "" : value})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateUser}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Usuário"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
            <CardTitle>
              Usuários do Sistema
              {!loading && <span className="text-sm font-normal text-muted-foreground ml-2">({filteredUsers.length} usuários)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterRole !== "all" ? 
                  "Nenhum usuário encontrado com os filtros aplicados." :
                  "Nenhum usuário cadastrado no sistema."
                }
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.length > 0 ? user.roles.map((roleObj: any, index: number) => (
                            <Badge key={index} className={getRoleBadgeColor(roleObj.role)}>
                              {roleObj.role}
                            </Badge>
                          )) : (
                            <Badge variant="outline">Sem papel</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "default" : "destructive"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Editar usuário"
                            onClick={() => {
                              setEditingUser({
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                roles: user.roles.map((r: any) => r.role),
                                empresaId: user.roles[0]?.empresa_id || ""
                              });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Redefinir senha"
                            onClick={() => {
                              setResetPasswordUser(user);
                              setResetPasswordDialogOpen(true);
                            }}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title={user.active ? "Desativar usuário" : "Ativar usuário"}
                            onClick={() => handleToggleUserStatus(user.id, user.active)}
                          >
                            {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome Completo</Label>
                    <Input
                      id="edit-name"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Papéis</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["solicitante", "gestor", "financeiro", "admin"].map((role) => (
                      <label key={role} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingUser.roles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingUser({ ...editingUser, roles: [...editingUser.roles, role] });
                            } else {
                              setEditingUser({ ...editingUser, roles: editingUser.roles.filter((r: string) => r !== role) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={handleEditUser}>
                  Salvar Alterações
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
            </DialogHeader>
            {resetPasswordUser && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Defina uma senha temporária para <strong>{resetPasswordUser.name}</strong>. 
                  O usuário será obrigado a alterar a senha no próximo login.
                </p>
                <div>
                  <Label htmlFor="temp-password">Senha Temporária</Label>
                  <Input
                    id="temp-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleResetPassword}>
                  Redefinir Senha
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}