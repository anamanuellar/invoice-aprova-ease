import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import InvoiceWizard from '@/components/invoice/InvoiceWizard';
import { useToast } from '@/hooks/use-toast';

export default function EditRequest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id || !user) return;

      try {
        const { data, error } = await supabase
          .from('solicitacoes_nf')
          .select('*')
          .eq('id', id)
          .eq('solicitante_id', user.id)
          .single();

        if (error) throw error;

        // Verificar se pode editar (apenas pendente ou rejeitada)
        if (data.status !== 'Aguardando aprovação do gestor' && data.status !== 'Rejeitada pelo gestor') {
          toast({
            title: "Ação não permitida",
            description: "Esta solicitação não pode mais ser editada.",
            variant: "destructive",
          });
          navigate('/minhas-solicitacoes');
          return;
        }

        setRequest(data);
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a solicitação.",
          variant: "destructive",
        });
        navigate('/minhas-solicitacoes');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, user, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !request) {
    return null;
  }

  return (
    <InvoiceWizard
      user={user}
      editingRequest={request}
      onSuccess={() => {
        toast({
          title: "Sucesso",
          description: request.status === 'Rejeitada pelo gestor' 
            ? "Solicitação reenviada para aprovação!"
            : "Solicitação atualizada com sucesso!",
        });
        navigate('/minhas-solicitacoes');
      }}
      onBack={() => navigate('/minhas-solicitacoes')}
    />
  );
}
