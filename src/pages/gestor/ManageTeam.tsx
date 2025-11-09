import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ManageTeam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { primaryRole } = useUserRole();
  const { users, loading, createUser } = useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    roles: ["solicitante"] as string[],
    empresaId: ""
  });

  const handleCreateTeamMember = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
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
        roles: ["solicitante"],
        empresaId: ""
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

  // Filter users based on role
  const filteredUsers = primaryRole === 'admin' 
    ? users 
    : users.filter(u => u.roles.some(r => r.role === 'solicitante'));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Time</h1>
              <p className="text-muted-foreground">
                {primaryRole === 'admin' 
                  ? 'Gerencie todos os usuários do sistema'
                  : 'Adicione membros ao seu time'}
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Membro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha Temporária</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  />
                </div>
                {primaryRole === 'admin' && (
                  <div>
                    <Label>Papéis</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["solicitante", "gestor", "financeiro", "admin"].map((role) => (
                        <label key={role} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newUserData.roles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewUserData({ ...newUserData, roles: [...newUserData.roles, role] });
                              } else {
                                setNewUserData({ ...newUserData, roles: newUserData.roles.filter(r => r !== role) });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="capitalize">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleCreateTeamMember}
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

        <Card>
          <CardHeader>
            <CardTitle>
              {primaryRole === 'admin' ? 'Todos os Usuários' : 'Membros do Time'}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredUsers.length} usuários)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum membro no time
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead>Data Criação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((roleObj, index) => (
                            <Badge key={index} className={getRoleBadgeColor(roleObj.role)}>
                              {roleObj.role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
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