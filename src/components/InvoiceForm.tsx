import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { User } from '@supabase/supabase-js';

interface Setor {
  id: string;
  nome: string;
}

interface CentroCusto {
  id: string;
  nome: string;
  codigo: string;
}

interface InvoiceFormData {
  setor_id: string;
  nome_fornecedor: string;
  cnpj_fornecedor: string;
  numero_nf: string;
  data_emissao: string;
  data_vencimento: string;
  produto_servico: string;
  centro_custo_id: string;
  valor_total: string;
  arquivo_nf: FileList;
}

interface InvoiceFormProps {
  user: User;
  onSuccess: () => void;
}

// CNPJ validation function
const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Validate check digits
  let sum = 0;
  let weight = 2;
  
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  sum = 0;
  weight = 2;
  
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return digit === parseInt(cleanCNPJ.charAt(13));
};

// Format CNPJ as user types
const formatCNPJ = (value: string): string => {
  const cleanValue = value.replace(/[^\d]/g, '');
  return cleanValue
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export default function InvoiceForm({ user, onSuccess }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const { register, handleSubmit, control, watch, formState: { errors }, setValue } = useForm<InvoiceFormData>();

  // Watch CNPJ field for formatting
  const cnpjValue = watch('cnpj_fornecedor');

  // Format CNPJ on change
  useEffect(() => {
    if (cnpjValue) {
      const formatted = formatCNPJ(cnpjValue);
      if (formatted !== cnpjValue) {
        setValue('cnpj_fornecedor', formatted);
      }
    }
  }, [cnpjValue, setValue]);

  // Load user profile and form data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }

        // Load sectors
        const { data: setoresData, error: setoresError } = await supabase
          .from('setores')
          .select('*')
          .order('nome');

        if (setoresError) throw setoresError;
        setSetores(setoresData || []);

        // Load cost centers
        const { data: centrosData, error: centrosError } = await supabase
          .from('centros_custo')
          .select('*')
          .order('nome');

        if (centrosError) throw centrosError;
        setCentrosCusto(centrosData || []);

      } catch (error: any) {
        toast.error('Erro ao carregar dados: ' + error.message);
      }
    };

    loadData();
  }, [user.id]);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) return null;

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setLoading(true);

    try {
      // Validate CNPJ
      if (!validateCNPJ(data.cnpj_fornecedor)) {
        toast.error('CNPJ inválido');
        setLoading(false);
        return;
      }

      // Upload invoice file
      const file = data.arquivo_nf[0];
      if (!file) {
        toast.error('Arquivo da NF é obrigatório');
        setLoading(false);
        return;
      }

      if (file.type !== 'application/pdf') {
        toast.error('O arquivo deve ser um PDF');
        setLoading(false);
        return;
      }

      const fileUrl = await uploadFile(file);
      if (!fileUrl) {
        setLoading(false);
        return;
      }

      // Convert valor_total to number
      const valorTotal = parseFloat(data.valor_total.replace(/[^\d,]/g, '').replace(',', '.'));

      // Create invoice request
      const { error } = await supabase
        .from('solicitacoes_nf')
        .insert({
          solicitante_id: user.id,
          nome_solicitante: userProfile?.name || user.email || '',
          setor_id: data.setor_id,
          nome_fornecedor: data.nome_fornecedor,
          cnpj_fornecedor: data.cnpj_fornecedor,
          numero_nf: data.numero_nf,
          data_emissao: data.data_emissao,
          data_vencimento: data.data_vencimento,
          produto_servico: data.produto_servico,
          centro_custo_id: data.centro_custo_id,
          valor_total: valorTotal,
          arquivo_nf_url: fileUrl,
        });

      if (error) throw error;

      toast.success('Solicitação de pagamento enviada com sucesso!');
      onSuccess();
      
    } catch (error: any) {
      toast.error('Erro ao enviar solicitação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format currency input
  const formatCurrency = (value: string): string => {
    const cleanValue = value.replace(/[^\d]/g, '');
    const numberValue = parseInt(cleanValue) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numberValue || 0);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Solicitação de Pagamento de Nota Fiscal</CardTitle>
            <CardDescription>
              Preencha todos os campos obrigatórios para enviar sua solicitação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome do solicitante - Auto preenchido */}
                <div className="space-y-2">
                  <Label>Nome do Solicitante</Label>
                  <Input 
                    value={userProfile?.name || user.email || ''} 
                    disabled 
                    className="bg-muted"
                  />
                </div>

                {/* Setor */}
                <div className="space-y-2">
                  <Label htmlFor="setor">Setor *</Label>
                  <Controller
                    name="setor_id"
                    control={control}
                    rules={{ required: 'Setor é obrigatório' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          {setores.map((setor) => (
                            <SelectItem key={setor.id} value={setor.id}>
                              {setor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.setor_id && (
                    <p className="text-sm text-destructive">{errors.setor_id.message}</p>
                  )}
                </div>

                {/* Nome do fornecedor */}
                <div className="space-y-2">
                  <Label htmlFor="nome_fornecedor">Nome do Fornecedor *</Label>
                  <Input
                    id="nome_fornecedor"
                    {...register('nome_fornecedor', { required: 'Nome do fornecedor é obrigatório' })}
                    placeholder="Digite o nome do fornecedor"
                  />
                  {errors.nome_fornecedor && (
                    <p className="text-sm text-destructive">{errors.nome_fornecedor.message}</p>
                  )}
                </div>

                {/* CNPJ */}
                <div className="space-y-2">
                  <Label htmlFor="cnpj_fornecedor">CNPJ do Fornecedor *</Label>
                  <Input
                    id="cnpj_fornecedor"
                    {...register('cnpj_fornecedor', { 
                      required: 'CNPJ é obrigatório',
                      validate: (value) => validateCNPJ(value) || 'CNPJ inválido'
                    })}
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                  />
                  {errors.cnpj_fornecedor && (
                    <p className="text-sm text-destructive">{errors.cnpj_fornecedor.message}</p>
                  )}
                </div>

                {/* Número da NF */}
                <div className="space-y-2">
                  <Label htmlFor="numero_nf">Número da Nota Fiscal *</Label>
                  <Input
                    id="numero_nf"
                    {...register('numero_nf', { required: 'Número da NF é obrigatório' })}
                    placeholder="Digite o número da NF"
                  />
                  {errors.numero_nf && (
                    <p className="text-sm text-destructive">{errors.numero_nf.message}</p>
                  )}
                </div>

                {/* Data de emissão */}
                <div className="space-y-2">
                  <Label htmlFor="data_emissao">Data de Emissão *</Label>
                  <Input
                    id="data_emissao"
                    type="date"
                    {...register('data_emissao', { required: 'Data de emissão é obrigatória' })}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                  {errors.data_emissao && (
                    <p className="text-sm text-destructive">{errors.data_emissao.message}</p>
                  )}
                </div>

                {/* Data de vencimento */}
                <div className="space-y-2">
                  <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                  <Input
                    id="data_vencimento"
                    type="date"
                    {...register('data_vencimento', { required: 'Data de vencimento é obrigatória' })}
                  />
                  {errors.data_vencimento && (
                    <p className="text-sm text-destructive">{errors.data_vencimento.message}</p>
                  )}
                </div>

                {/* Centro de custo */}
                <div className="space-y-2">
                  <Label htmlFor="centro_custo">Centro de Custo *</Label>
                  <Controller
                    name="centro_custo_id"
                    control={control}
                    rules={{ required: 'Centro de custo é obrigatório' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o centro de custo" />
                        </SelectTrigger>
                        <SelectContent>
                          {centrosCusto.map((centro) => (
                            <SelectItem key={centro.id} value={centro.id}>
                              {centro.codigo} - {centro.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.centro_custo_id && (
                    <p className="text-sm text-destructive">{errors.centro_custo_id.message}</p>
                  )}
                </div>

                {/* Valor total */}
                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total (R$) *</Label>
                  <Controller
                    name="valor_total"
                    control={control}
                    rules={{ required: 'Valor total é obrigatório' }}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        value={value ? formatCurrency(value) : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/[^\d]/g, '');
                          onChange(rawValue);
                        }}
                        placeholder="R$ 0,00"
                      />
                    )}
                  />
                  {errors.valor_total && (
                    <p className="text-sm text-destructive">{errors.valor_total.message}</p>
                  )}
                </div>
              </div>

              {/* Produto/Serviço */}
              <div className="space-y-2">
                <Label htmlFor="produto_servico">Produto ou Serviço Adquirido *</Label>
                <Textarea
                  id="produto_servico"
                  {...register('produto_servico', { required: 'Descrição do produto/serviço é obrigatória' })}
                  placeholder="Descreva detalhadamente o produto ou serviço adquirido"
                  rows={3}
                />
                {errors.produto_servico && (
                  <p className="text-sm text-destructive">{errors.produto_servico.message}</p>
                )}
              </div>

              {/* Upload da NF */}
              <div className="space-y-2">
                <Label htmlFor="arquivo_nf">Upload da Nota Fiscal (PDF) *</Label>
                <Input
                  id="arquivo_nf"
                  type="file"
                  accept=".pdf"
                  {...register('arquivo_nf', { required: 'Upload da NF é obrigatório' })}
                  className="cursor-pointer"
                />
                {errors.arquivo_nf && (
                  <p className="text-sm text-destructive">{errors.arquivo_nf.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Apenas arquivos PDF são aceitos. Tamanho máximo: 10MB
                </p>
              </div>

              {/* Status information */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Informações da Solicitação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status inicial:</span> Aguardando aprovação do gestor
                  </div>
                  <div>
                    <span className="font-medium">Data de envio:</span> {format(new Date(), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1"
                >
                  {loading ? 'Enviando...' : uploading ? 'Fazendo upload...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}