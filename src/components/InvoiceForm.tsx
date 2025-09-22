import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, ArrowLeft, AlertTriangle } from 'lucide-react';
import { format, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  nomeCompleto: string;
  nomeFornecedor: string;
  cnpjFornecedor: string;
  numeroNF: string;
  dataEmissao: Date;
  dataVencimento: Date;
  valorTotal: string;
  produtoServico: string;
  setor: string;
  centroCusto: string;
  previsaoPagamento?: Date;
  arquivoNF?: FileList;
  justificativaVencimentoAntecipado?: string;
  formaPagamento: 'deposito_bancario' | 'boleto';
  arquivoBoleto?: FileList;
  banco?: string;
  agencia?: string;
  contaCorrente?: string;
  chavePix?: string;
  cnpjCpfTitular?: string;
  nomeTitularConta?: string;
  justificativaDivergenciaTitular?: string;
}

interface InvoiceFormProps {
  user: any;
  companyId: string;
  onSuccess: () => void;
  onBack: () => void;
}

// CNPJ validation function
const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Basic validation (check digits)
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

// Format currency input
const formatCurrency = (value: string): string => {
  const cleanValue = value.replace(/[^\d]/g, '');
  const numberValue = parseInt(cleanValue) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numberValue || 0);
};

export default function InvoiceForm({ user, companyId, onSuccess, onBack }: InvoiceFormProps) {
  const { toast } = useToast();
  
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(z.object({
      nomeCompleto: z.string().min(1, "Nome completo é obrigatório"),
      nomeFornecedor: z.string().min(1, "Nome do fornecedor é obrigatório"),
      cnpjFornecedor: z.string().min(14, "CNPJ deve ter 14 dígitos"),
      numeroNF: z.string().min(1, "Número da NF é obrigatório"),
      dataEmissao: z.date({ required_error: "Data de emissão é obrigatória" }),
      dataVencimento: z.date({ required_error: "Data de vencimento é obrigatória" }),
      valorTotal: z.string().min(1, "Valor total é obrigatório"),
      produtoServico: z.string().min(1, "Produto/Serviço é obrigatório"),
      setor: z.string().min(1, "Setor é obrigatório"),
      centroCusto: z.string().min(1, "Centro de custo é obrigatório"),
      previsaoPagamento: z.date().optional(),
      arquivoNF: z.any().optional(),
      justificativaVencimentoAntecipado: z.string().optional(),
      formaPagamento: z.enum(['deposito_bancario', 'boleto'], {
        required_error: "Forma de pagamento é obrigatória"
      }),
      arquivoBoleto: z.any().optional(),
      banco: z.string().optional(),
      agencia: z.string().optional(),
      contaCorrente: z.string().optional(),
      chavePix: z.string().optional(),
      cnpjCpfTitular: z.string().optional(),
      nomeTitularConta: z.string().optional(),
      justificativaDivergenciaTitular: z.string().optional(),
    })),
    defaultValues: {
      nomeCompleto: "",
      nomeFornecedor: "",
      cnpjFornecedor: "",
      numeroNF: "",
      valorTotal: "",
      produtoServico: "",
      setor: "",
      centroCusto: "",
      formaPagamento: 'deposito_bancario' as const,
    },
  });

  const [setores, setSetores] = useState<Setor[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Watch form values for conditional logic
  const watchedVencimento = form.watch("dataVencimento");
  const watchedFormaPagamento = form.watch("formaPagamento");
  const watchedCnpjFornecedor = form.watch("cnpjFornecedor");
  const watchedNomeFornecedor = form.watch("nomeFornecedor");
  const watchedCnpjCpfTitular = form.watch("cnpjCpfTitular");
  const watchedNomeTitular = form.watch("nomeTitularConta");
  
  // Check if due date requires justification (less than D+10)
  const isEarlyDueDate = watchedVencimento ? isBefore(watchedVencimento, addDays(new Date(), 10)) : false;
  
  // Check if there's a titularity divergence
  const hasTitularityDivergence = watchedFormaPagamento === 'deposito_bancario' && 
    watchedCnpjFornecedor && watchedNomeFornecedor && 
    watchedCnpjCpfTitular && watchedNomeTitular &&
    (watchedCnpjFornecedor.replace(/\D/g, '') !== watchedCnpjCpfTitular.replace(/\D/g, '') ||
     watchedNomeFornecedor.toLowerCase().trim() !== watchedNomeTitular.toLowerCase().trim());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Load company info
      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('nome')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompanyName(companyData?.nome || '');

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
      toast({
        title: "Erro",
        description: "Erro ao carregar dados: " + error.message,
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (file: File, bucket: string = 'invoices'): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro no upload: " + error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);

    try {
      // Validate CNPJ
      if (!validateCNPJ(data.cnpjFornecedor)) {
        toast({
          title: "Erro",
          description: "CNPJ inválido",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Upload invoice file
      const invoiceFile = data.arquivoNF?.[0];
      if (!invoiceFile) {
        toast({
          title: "Erro",
          description: "Arquivo da NF é obrigatório",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (invoiceFile.type !== 'application/pdf') {
        toast({
          title: "Erro",
          description: "O arquivo deve ser um PDF",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const invoiceFileUrl = await uploadFile(invoiceFile);
      if (!invoiceFileUrl) {
        setIsSubmitting(false);
        return;
      }

      // Upload boleto file if needed
      let boletoFileUrl = null;
      if (data.formaPagamento === 'boleto' && data.arquivoBoleto?.[0]) {
        const boletoFile = data.arquivoBoleto[0];
        if (boletoFile.type !== 'application/pdf') {
          toast({
            title: "Erro",
            description: "O arquivo do boleto deve ser um PDF",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        boletoFileUrl = await uploadFile(boletoFile);
        if (!boletoFileUrl) {
          setIsSubmitting(false);
          return;
        }
      }

      // Convert valor_total to number
      const valorTotal = parseFloat(data.valorTotal.replace(/[^\d,]/g, '').replace(',', '.'));

      // Create invoice request
      const { error } = await supabase
        .from('solicitacoes_nf')
        .insert({
          solicitante_id: user.id,
          empresa_id: companyId,
          nome_solicitante: data.nomeCompleto,
          setor_id: data.setor,
          nome_fornecedor: data.nomeFornecedor,
          cnpj_fornecedor: data.cnpjFornecedor,
          numero_nf: data.numeroNF,
          data_emissao: format(data.dataEmissao, 'yyyy-MM-dd'),
          data_vencimento: format(data.dataVencimento, 'yyyy-MM-dd'),
          produto_servico: data.produtoServico,
          centro_custo_id: data.centroCusto,
          valor_total: valorTotal,
          arquivo_nf_url: invoiceFileUrl,
          previsao_pagamento: data.previsaoPagamento ? format(data.previsaoPagamento, 'yyyy-MM-dd') : null,
          justificativa_vencimento_antecipado: data.justificativaVencimentoAntecipado,
          forma_pagamento: data.formaPagamento,
          arquivo_boleto_url: boletoFileUrl,
          banco: data.banco,
          agencia: data.agencia,
          conta_corrente: data.contaCorrente,
          chave_pix: data.chavePix,
          cnpj_cpf_titular: data.cnpjCpfTitular,
          nome_titular_conta: data.nomeTitularConta,
          justificativa_divergencia_titular: data.justificativaDivergenciaTitular,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Solicitação de pagamento enviada com sucesso!",
      });
      onSuccess();
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Solicitação de Pagamento de Nota Fiscal
                </CardTitle>
                <CardDescription>
                  Preencha todos os campos obrigatórios para enviar sua solicitação
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Empresa */}
                  <FormItem>
                    <FormLabel>Empresa *</FormLabel>
                    <FormControl>
                      <Input 
                        value={companyName} 
                        readOnly 
                        className="bg-gray-50 cursor-not-allowed"
                        placeholder="Carregando empresa..." 
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Para alterar a empresa, volte para a página anterior
                    </p>
                  </FormItem>

                  {/* Nome do solicitante */}
                  <FormField
                    control={form.control}
                    name="nomeCompleto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo do Solicitante *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Setor */}
                  <FormField
                    control={form.control}
                    name="setor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setor *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o setor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {setores.map((setor) => (
                              <SelectItem key={setor.id} value={setor.id}>
                                {setor.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nome do fornecedor */}
                  <FormField
                    control={form.control}
                    name="nomeFornecedor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Fornecedor *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome do fornecedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CNPJ */}
                  <FormField
                    control={form.control}
                    name="cnpjFornecedor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ do Fornecedor *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00.000.000/0001-00"
                            maxLength={18}
                            {...field}
                            onChange={(e) => {
                              const formatted = formatCNPJ(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Upload da NF */}
                  <FormField
                    control={form.control}
                    name="arquivoNF"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Upload da Nota Fiscal (PDF) *</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => onChange(e.target.files)}
                            {...field}
                            value=""
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Apenas arquivos PDF são aceitos. Tamanho máximo: 10MB
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Número da NF */}
                  <FormField
                    control={form.control}
                    name="numeroNF"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Nota Fiscal *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o número da NF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data de emissão */}
                  <FormField
                    control={form.control}
                    name="dataEmissao"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Emissão *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecione a data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data de vencimento */}
                  <FormField
                    control={form.control}
                    name="dataVencimento"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Vencimento *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecione a data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Centro de custo */}
                  <FormField
                    control={form.control}
                    name="centroCusto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Centro de Custo *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o centro de custo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {centrosCusto.map((centro) => (
                              <SelectItem key={centro.id} value={centro.id}>
                                {centro.codigo} - {centro.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valor total */}
                  <FormField
                    control={form.control}
                    name="valorTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="R$ 0,00"
                            {...field}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/[^\d]/g, '');
                              const formattedValue = formatCurrency(rawValue);
                              field.onChange(formattedValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Justificativa para vencimento antecipado */}
                {isEarlyDueDate && (
                  <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        ⚠️ A data de vencimento é menor que 10 dias. Justificativa obrigatória.
                      </AlertDescription>
                    </Alert>
                    <FormField
                      control={form.control}
                      name="justificativaVencimentoAntecipado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Justificativa para Vencimento Antecipado *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Explique o motivo para o vencimento antecipado"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <p className="text-sm text-amber-600">
                            ⚠️ A submissão da justificativa não garante a aprovação do vencimento antecipado.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Forma de pagamento */}
                <FormField
                  control={form.control}
                  name="formaPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="deposito_bancario">Depósito bancário</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos condicionais para Boleto */}
                {watchedFormaPagamento === 'boleto' && (
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900">Dados do Boleto</h3>
                    <FormField
                      control={form.control}
                      name="arquivoBoleto"
                      render={({ field: { onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Upload do Boleto (PDF) *</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => onChange(e.target.files)}
                              {...field}
                              value=""
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Apenas arquivos PDF são aceitos
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Campos condicionais para Depósito bancário */}
                {watchedFormaPagamento === 'deposito_bancario' && (
                  <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900">Dados Bancários</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="banco"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banco *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do banco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="agencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agência *</FormLabel>
                            <FormControl>
                              <Input placeholder="Número da agência" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contaCorrente"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conta Corrente *</FormLabel>
                            <FormControl>
                              <Input placeholder="Número da conta" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="chavePix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave Pix *</FormLabel>
                            <FormControl>
                              <Input placeholder="CPF, CNPJ, email ou chave aleatória" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cnpjCpfTitular"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ ou CPF do Titular da Conta *</FormLabel>
                            <FormControl>
                              <Input placeholder="000.000.000-00 ou 00.000.000/0001-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nomeTitularConta"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Titular da Conta *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo do titular" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Justificativa para divergência de titularidade */}
                    {hasTitularityDivergence && (
                      <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            ⚠️ Os dados do titular da conta diferem dos dados do fornecedor da NF
                          </AlertDescription>
                        </Alert>
                        <FormField
                          control={form.control}
                          name="justificativaDivergenciaTitular"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Justificativa da Divergência de Titularidade *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Explique por que os dados do titular diferem dos dados da NF"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <p className="text-sm text-amber-600">
                                ⚠️ Pagamentos devem ser feitos ao mesmo titular da nota fiscal. Caso haja divergência, é necessário justificar. A solicitação será analisada pelo financeiro.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Produto/Serviço */}
                <FormField
                  control={form.control}
                  name="produtoServico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto ou Serviço Adquirido *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva detalhadamente o produto ou serviço adquirido"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Previsão de pagamento */}
                <FormField
                  control={form.control}
                  name="previsaoPagamento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Previsão de Pagamento (Opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit button */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Enviando...' : isUploading ? 'Fazendo upload...' : 'Enviar Solicitação'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}