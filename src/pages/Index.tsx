import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/AuthForm';
import InvoiceForm from '@/components/InvoiceForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Plus, FileText } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (showForm) {
    return (
      <InvoiceForm 
        user={user} 
        onSuccess={() => setShowForm(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold">Sistema de Pagamentos</h1>
              <p className="text-sm text-muted-foreground">Olá, {user.email}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Nova Solicitação */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowForm(true)}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2 text-primary" />
                Nova Solicitação
              </CardTitle>
              <CardDescription>
                Criar uma nova solicitação de pagamento de nota fiscal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Criar Solicitação
              </Button>
            </CardContent>
          </Card>

          {/* Minhas Solicitações */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Minhas Solicitações
              </CardTitle>
              <CardDescription>
                Ver histórico das minhas solicitações de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Em breve
              </Button>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>
                Informações sobre o funcionamento do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <span className="text-sm text-green-600 font-medium">Operacional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Usuário:</span>
                <span className="text-sm font-medium">Conectado</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Como funciona</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Preencha o formulário com os dados da nota fiscal</li>
                <li>Faça upload do arquivo PDF da nota fiscal</li>
                <li>A solicitação será enviada para aprovação do gestor</li>
                <li>Após aprovação, seguirá para análise do financeiro</li>
                <li>Você receberá notificações sobre o status</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status das Solicitações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Aguardando aprovação do gestor</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Rejeitado pelo gestor</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Aguardando análise do financeiro</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Aprovado para pagamento</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
