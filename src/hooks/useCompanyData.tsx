import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanyData {
  id: string;
  codigo: string;
  nome: string;
  created_at: string;
  usuariosAtivos?: number;
  solicitacoesMes?: number;
}

export interface Setor {
  id: string;
  nome: string;
  created_at: string;
}

export const useCompanyData = () => {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [sectors, setSectors] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch companies
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('*')
        .order('nome');

      if (empresasError) throw empresasError;

      // Get user count per company
      const { data: userCounts, error: userCountError } = await supabase
        .from('user_roles')
        .select('empresa_id, count(*)')
        .not('empresa_id', 'is', null);

      if (userCountError) throw userCountError;

      // Get requests count per company for current month
      const currentMonth = new Date();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: requestCounts, error: requestCountError } = await supabase
        .from('solicitacoes_nf')
        .select('empresa_id, count(*)')
        .gte('created_at', firstDay.toISOString())
        .not('empresa_id', 'is', null);

      if (requestCountError) throw requestCountError;

      // Combine data
      const companiesWithStats = empresas?.map(empresa => ({
        ...empresa,
        usuariosAtivos: userCounts?.find(uc => uc.empresa_id === empresa.id)?.count || 0,
        solicitacoesMes: requestCounts?.find(rc => rc.empresa_id === empresa.id)?.count || 0,
      })) || [];

      setCompanies(companiesWithStats);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast({
        title: "Erro ao carregar empresas",
        description: "Não foi possível carregar a lista de empresas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSectors = async () => {
    try {
      const { data, error } = await supabase
        .from('setores')
        .select('*')
        .order('nome');

      if (error) throw error;
      setSectors(data || []);
    } catch (err) {
      console.error('Error fetching sectors:', err);
      toast({
        title: "Erro ao carregar setores",
        description: "Não foi possível carregar a lista de setores.",
        variant: "destructive",
      });
    }
  };

  const createCompany = async (companyData: { codigo: string; nome: string }) => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert([companyData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Empresa criada com sucesso",
        description: `${companyData.nome} foi adicionada ao sistema.`,
      });

      await fetchCompanies();
      return { success: true };
    } catch (err) {
      console.error('Error creating company:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: "Erro ao criar empresa",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const createSector = async (sectorData: { nome: string }) => {
    try {
      const { data, error } = await supabase
        .from('setores')
        .insert([sectorData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Setor criado com sucesso",
        description: `${sectorData.nome} foi adicionado ao sistema.`,
      });

      await fetchSectors();
      return { success: true };
    } catch (err) {
      console.error('Error creating sector:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: "Erro ao criar setor",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchSectors();
  }, []);

  return {
    companies,
    sectors,
    loading,
    error,
    refetch: () => {
      fetchCompanies();
      fetchSectors();
    },
    createCompany,
    createSector
  };
};