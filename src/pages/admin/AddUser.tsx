import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "@/hooks/useUsers";
import { useCompanies } from "@/hooks/useCompanies";
import { useToast } from "@/hooks/use-toast";

export default function AddUser() {
  const navigate = useNavigate();
  const { createUser, loading: usersLoading } = useUsers();
  const { companies, loading: companiesLoading } = useCompanies();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "", 
    password: "",
    confirmPassword: "",
    roles: [] as string[],
    empresaId: "",
    sendWelcomeEmail: true
  });

  const availableRoles = [
    { id: 'solicitante', label: 'Solicitante', description: 'Pode criar e visualizar próprias solicitações' },
    { id: 'gestor', label: 'Gestor', description: 'Pode aprovar/rejeitar solicitações do setor' },
    { id: 'financeiro', label: 'Financeiro', description: 'Pode processar pagamentos e análises financeiras' },
    { id: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' }
  ];

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, roleId]
        : prev.roles.filter(r => r !== roleId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem!",
        variant: "destructive",
      });
      return;
    }

    if (formData.roles.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um papel para o usuário!",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Creating user:", formData);
      
      await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roles: formData.roles,
        empresaId: formData.empresaId || null,
      });

      toast({
        title: "Sucesso!",
        description: "Usuário criado com sucesso!",
      });
      
      navigate("/admin/manage-users");
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Adicionar Novo Usuário</h1>
            <p className="text-muted-foreground">Cadastre um novo usuário no sistema</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Acesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password">Senha Temporária *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirme a senha"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader>
              <CardTitle>Papéis e Permissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableRoles.map((role) => (
                <div key={role.id} className="flex items-start space-x-2 p-3 border rounded">
                  <Checkbox
                    id={role.id}
                    checked={formData.roles.includes(role.id)}
                    onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={role.id} className="font-medium cursor-pointer">
                      {role.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Company Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="company">Empresa (Opcional)</Label>
                <Select 
                  value={formData.empresaId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, empresaId: value }))}
                  disabled={companiesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={companiesLoading ? "Carregando empresas..." : "Selecione uma empresa específica"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as empresas</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Deixe vazio para acesso a todas as empresas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Options */}
          <Card>
            <CardHeader>
              <CardTitle>Opções Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="welcome-email"
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, sendWelcomeEmail: checked as boolean }))
                  }
                />
                <div>
                  <Label htmlFor="welcome-email" className="cursor-pointer">
                    Enviar email de boas-vindas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    O usuário receberá instruções de acesso por email
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/manage-users")} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || usersLoading}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}