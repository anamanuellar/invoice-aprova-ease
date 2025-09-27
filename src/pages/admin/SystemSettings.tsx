import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Settings, Mail, Shield, Database, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SystemSettings() {
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoApproval, setAutoApproval] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
              <p className="text-muted-foreground">Configure parâmetros e preferências do sistema</p>
            </div>
          </div>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">Nome da Organização</Label>
                <Input id="company-name" defaultValue="Sistema de Solicitações" />
              </div>
              <div>
                <Label htmlFor="system-version">Versão do Sistema</Label>
                <Input id="system-version" defaultValue="1.0.0" disabled />
              </div>
            </div>
            <div>
              <Label htmlFor="system-description">Descrição do Sistema</Label>
              <Textarea 
                id="system-description" 
                placeholder="Descrição do sistema de solicitações..."
                defaultValue="Sistema integrado para gerenciamento de solicitações de notas fiscais e aprovações."
              />
            </div>
            <div>
              <Label htmlFor="default-language">Idioma Padrão</Label>
              <Select defaultValue="pt-br">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configurações de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp-server">Servidor SMTP</Label>
                <Input id="smtp-server" placeholder="smtp.exemplo.com" />
              </div>
              <div>
                <Label htmlFor="smtp-port">Porta SMTP</Label>
                <Input id="smtp-port" placeholder="587" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email-user">Usuário Email</Label>
                <Input id="email-user" placeholder="sistema@empresa.com" />
              </div>
              <div>
                <Label htmlFor="email-password">Senha Email</Label>
                <Input id="email-password" type="password" placeholder="••••••••" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">Enviar notificações automáticas por email</p>
              </div>
              <Switch 
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configurações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
              <Input id="session-timeout" type="number" defaultValue="30" />
            </div>
            <div>
              <Label htmlFor="max-login-attempts">Máximo Tentativas de Login</Label>
              <Input id="max-login-attempts" type="number" defaultValue="5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-2fa">Autenticação de Dois Fatores</Label>
                <p className="text-sm text-muted-foreground">Exigir 2FA para todos os usuários</p>
              </div>
              <Switch id="require-2fa" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="password-complexity">Complexidade de Senha</Label>
                <p className="text-sm text-muted-foreground">Exigir senhas complexas</p>
              </div>
              <Switch id="password-complexity" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Workflow Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configurações de Fluxo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="auto-approval-limit">Limite Auto-Aprovação (R$)</Label>
              <Input id="auto-approval-limit" type="number" placeholder="1000.00" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-approval">Auto-Aprovação Ativa</Label>
                <p className="text-sm text-muted-foreground">Aprovar automaticamente valores baixos</p>
              </div>
              <Switch 
                id="auto-approval"
                checked={autoApproval}
                onCheckedChange={setAutoApproval}
              />
            </div>
            <div>
              <Label htmlFor="escalation-days">Escalonamento Automático (dias)</Label>
              <Input id="escalation-days" type="number" defaultValue="3" />
            </div>
            <div>
              <Label htmlFor="reminder-frequency">Frequência de Lembretes</Label>
              <Select defaultValue="daily">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Nunca</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Manutenção do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance-mode">Modo Manutenção</Label>
                <p className="text-sm text-muted-foreground">Bloquear acesso ao sistema para manutenção</p>
              </div>
              <Switch 
                id="maintenance-mode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Backup Manual
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Limpar Cache
              </Button>
            </div>
            <div>
              <Label>Último Backup</Label>
              <p className="text-sm text-muted-foreground">25/01/2024 às 03:00</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg">
            <Save className="h-4 w-4 mr-2" />
            Salvar Todas as Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}