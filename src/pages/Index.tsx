import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import CompanySelector from '@/components/CompanySelector';
import AuthForm from '@/components/AuthForm';

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'company-select' | 'form'>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (currentView === 'company-select') {
    return (
      <CompanySelector
        onCompanySelect={(companyId) => {
          setSelectedCompanyId(companyId);
          setCurrentView('form');
        }}
      />
    );
  }

  if (currentView === 'form' && selectedCompanyId) {
    return (
      <InvoiceForm
        user={user}
        companyId={selectedCompanyId}
        onSuccess={() => setCurrentView('dashboard')}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sistema de Solicitação de Pagamento
              </h1>
              <p className="text-gray-600">
                Bem-vindo, {user.email}
              </p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('company-select')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Nova Solicitação</CardTitle>
              <CardDescription>
                Criar uma nova solicitação de pagamento de nota fiscal
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Minhas Solicitações</CardTitle>
              <CardDescription>
                Visualizar o status das solicitações enviadas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Status do Sistema</CardTitle>
              <CardDescription>
                Verificar disponibilidade e informações do sistema
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                  <p>Selecione a empresa à qual pertence a solicitação</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                  <p>Preencha o formulário com os dados da nota fiscal</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                  <p>Selecione a forma de pagamento e forneça os dados necessários</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                  <p>Aguarde aprovação do gestor e análise do financeiro</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Empresas do Grupo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p>Hotéis Design</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p>Restaurante Adamastor</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p>Barroquinha Estacionamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Status das Solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="font-semibold text-yellow-800">Aguardando Aprovação</div>
                <p className="text-yellow-600">Solicitação enviada e aguardando aprovação do gestor</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-800">Em Análise Financeira</div>
                <p className="text-blue-600">Aprovada pelo gestor, sendo analisada pelo financeiro</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-800">Aprovada</div>
                <p className="text-green-600">Solicitação aprovada e processamento iniciado</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="font-semibold text-red-800">Rejeitada</div>
                <p className="text-red-600">Solicitação não aprovada, verifique os comentários</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}