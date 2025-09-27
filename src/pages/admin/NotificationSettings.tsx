import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Bell, Mail, MessageSquare, Save, Zap, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const [notificationSettings, setNotificationSettings] = useState({
    newRequest: { email: true, sms: false, push: true },
    requestApproved: { email: true, sms: false, push: true },
    requestRejected: { email: true, sms: true, push: true },
    paymentProcessed: { email: true, sms: false, push: false },
    systemMaintenance: { email: true, sms: false, push: true },
    userRegistration: { email: true, sms: false, push: false }
  });

  const notificationTypes = [
    {
      key: 'newRequest',
      title: 'Nova Solicitação',
      description: 'Quando uma nova solicitação é criada'
    },
    {
      key: 'requestApproved',
      title: 'Solicitação Aprovada',
      description: 'Quando uma solicitação é aprovada por gestor/financeiro'
    },
    {
      key: 'requestRejected', 
      title: 'Solicitação Rejeitada',
      description: 'Quando uma solicitação é rejeitada'
    },
    {
      key: 'paymentProcessed',
      title: 'Pagamento Processado',
      description: 'Quando um pagamento é processado com sucesso'
    },
    {
      key: 'systemMaintenance',
      title: 'Manutenção do Sistema',
      description: 'Notificações sobre manutenção programada'
    },
    {
      key: 'userRegistration',
      title: 'Novo Usuário',
      description: 'Quando um novo usuário se registra no sistema'
    }
  ];

  const updateNotificationSetting = (type: string, channel: string, enabled: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type as keyof typeof prev],
        [channel]: enabled
      }
    }));
  };

  const testNotification = (channel: string) => {
    alert(`Teste de notificação via ${channel} enviado com sucesso!`);
  };

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
              <h1 className="text-3xl font-bold">Configurar Notificações</h1>
              <p className="text-muted-foreground">Configure como e quando as notificações são enviadas</p>
            </div>
          </div>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>

        {/* Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configurações Globais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-global">Email</Label>
                  <p className="text-sm text-muted-foreground">Notificações por email</p>
                </div>
                <Switch 
                  id="email-global"
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-global">SMS</Label>
                  <p className="text-sm text-muted-foreground">Notificações por SMS</p>
                </div>
                <Switch 
                  id="sms-global"
                  checked={smsEnabled}
                  onCheckedChange={setSmsEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-global">Push</Label>
                  <p className="text-sm text-muted-foreground">Notificações push</p>
                </div>
                <Switch 
                  id="push-global"
                  checked={pushEnabled}
                  onCheckedChange={setPushEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuração de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp-server">Servidor SMTP</Label>
                <Input id="smtp-server" placeholder="smtp.gmail.com" defaultValue="smtp.gmail.com" />
              </div>
              <div>
                <Label htmlFor="smtp-port">Porta</Label>
                <Input id="smtp-port" placeholder="587" defaultValue="587" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email-user">Usuário</Label>
                <Input id="email-user" placeholder="sistema@empresa.com" />
              </div>
              <div>
                <Label htmlFor="email-password">Senha</Label>
                <Input id="email-password" type="password" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <Label htmlFor="from-name">Nome do Remetente</Label>
              <Input id="from-name" placeholder="Sistema de Solicitações" defaultValue="Sistema de Solicitações" />
            </div>
            <Button variant="outline" onClick={() => testNotification('email')}>
              <Zap className="h-4 w-4 mr-2" />
              Testar Email
            </Button>
          </CardContent>
        </Card>

        {/* SMS Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Configuração de SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sms-provider">Provedor SMS</Label>
                <Select defaultValue="twilio">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="aws-sns">AWS SNS</SelectItem>
                    <SelectItem value="zenvia">Zenvia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sms-from">Número Remetente</Label>
                <Input id="sms-from" placeholder="+5511999999999" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sms-api-key">API Key</Label>
                <Input id="sms-api-key" type="password" placeholder="••••••••" />
              </div>
              <div>
                <Label htmlFor="sms-api-secret">API Secret</Label>
                <Input id="sms-api-secret" type="password" placeholder="••••••••" />
              </div>
            </div>
            <Button variant="outline" onClick={() => testNotification('SMS')}>
              <Zap className="h-4 w-4 mr-2" />
              Testar SMS
            </Button>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Notificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {notificationTypes.map((type) => (
                <div key={type.key}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{type.title}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email</span>
                      <Switch 
                        checked={notificationSettings[type.key as keyof typeof notificationSettings].email}
                        onCheckedChange={(checked) => updateNotificationSetting(type.key, 'email', checked)}
                        disabled={!emailEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SMS</span>
                      <Switch 
                        checked={notificationSettings[type.key as keyof typeof notificationSettings].sms}
                        onCheckedChange={(checked) => updateNotificationSetting(type.key, 'sms', checked)}
                        disabled={!smsEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Push</span>
                      <Switch 
                        checked={notificationSettings[type.key as keyof typeof notificationSettings].push}
                        onCheckedChange={(checked) => updateNotificationSetting(type.key, 'push', checked)}
                        disabled={!pushEnabled}
                      />
                    </div>
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates de Notificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template-subject">Assunto Padrão - Nova Solicitação</Label>
              <Input 
                id="template-subject" 
                defaultValue="Nova solicitação #{ID} criada por {USUARIO}"
                placeholder="Assunto do email..."
              />
            </div>
            <div>
              <Label htmlFor="template-body">Corpo da Mensagem</Label>
              <Textarea 
                id="template-body"
                rows={4}
                defaultValue="Olá {NOME}, uma nova solicitação #{ID} foi criada e precisa da sua atenção."
                placeholder="Corpo da mensagem..."
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h5 className="font-medium mb-2">Variáveis Disponíveis:</h5>
              <div className="text-sm space-y-1">
                <Badge variant="outline">{"{NOME}"}</Badge>
                <Badge variant="outline">{"{ID}"}</Badge>
                <Badge variant="outline">{"{USUARIO}"}</Badge>
                <Badge variant="outline">{"{EMPRESA}"}</Badge>
                <Badge variant="outline">{"{VALOR}"}</Badge>
                <Badge variant="outline">{"{DATA}"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Configurações Avançadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="retry-attempts">Tentativas de Reenvio</Label>
              <Select defaultValue="3">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 tentativa</SelectItem>
                  <SelectItem value="3">3 tentativas</SelectItem>
                  <SelectItem value="5">5 tentativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quiet-hours">Horário Silencioso</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="22:00" defaultValue="22:00" />
                <Input placeholder="08:00" defaultValue="08:00" />
              </div>
              <p className="text-sm text-muted-foreground">
                Notificações não serão enviadas neste período
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}