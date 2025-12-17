import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Building2, FileText, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Step1CompanySupplier } from './wizard/Step1CompanySupplier';
import { Step2InvoiceDetails } from './wizard/Step2InvoiceDetails';
import { Step3Payment } from './wizard/Step3Payment';

interface InvoiceWizardProps {
  user: any;
  initialCompanyId?: string;
  editingRequest?: any;
  onSuccess: () => void;
  onBack: () => void;
}

const formSchema = z.object({
  empresa_id: z.string().min(1, "Empresa é obrigatória"),
  nomeCompleto: z.string().min(1, "Nome completo é obrigatório"),
  nomeFornecedor: z.string().min(1, "Nome do fornecedor é obrigatório"),
  cnpjFornecedor: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  setor: z.string().min(1, "Setor é obrigatório"),
  numeroNF: z.string().min(1, "Número da NF é obrigatório"),
  dataEmissao: z.date({ required_error: "Data de emissão é obrigatória" }),
  dataVencimento: z.date({ required_error: "Data de vencimento é obrigatória" }),
  valorTotal: z.string().min(1, "Valor total é obrigatório"),
  produtoServico: z.string().min(1, "Produto/Serviço é obrigatório"),
  previsaoPagamento: z.date().optional(),
  arquivoNF: z.any().optional(),
  justificativaVencimentoAntecipado: z.string().optional(),
  formaPagamento: z.enum(['deposito_bancario', 'boleto']).optional(),
  arquivoBoleto: z.any().optional(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  contaCorrente: z.string().optional(),
  chavePix: z.string().optional(),
  cnpjCpfTitular: z.string().optional(),
  nomeTitularConta: z.string().optional(),
  justificativaDivergenciaTitular: z.string().optional(),
});

export type InvoiceFormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: 'Empresa e Fornecedor', icon: Building2 },
  { id: 2, title: 'Dados da NF', icon: FileText },
  { id: 3, title: 'Pagamento', icon: CreditCard },
];

export default function InvoiceWizard({ 
  user, 
  initialCompanyId, 
  editingRequest,
  onSuccess, 
  onBack 
}: InvoiceWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNFFile, setSelectedNFFile] = useState<string>('');
  const [selectedBoletoFile, setSelectedBoletoFile] = useState<string>('');
  
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: initialCompanyId || '',
      nomeCompleto: "",
      nomeFornecedor: "",
      cnpjFornecedor: "",
      numeroNF: "",
      valorTotal: "",
      produtoServico: "",
      setor: "",
    },
  });

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();

      if (profileData?.name) {
        form.setValue('nomeCompleto', profileData.name);
      }
    };
    loadUserProfile();
  }, [user.id, form]);

  // Load editing data
  useEffect(() => {
    if (editingRequest) {
      form.reset({
        empresa_id: editingRequest.empresa_id || '',
        nomeCompleto: editingRequest.nome_solicitante || '',
        nomeFornecedor: editingRequest.nome_fornecedor || '',
        cnpjFornecedor: editingRequest.cnpj_fornecedor || '',
        setor: editingRequest.setor_id || '',
        numeroNF: editingRequest.numero_nf || '',
        dataEmissao: editingRequest.data_emissao ? new Date(editingRequest.data_emissao) : undefined,
        dataVencimento: editingRequest.data_vencimento ? new Date(editingRequest.data_vencimento) : undefined,
        valorTotal: editingRequest.valor_total ? `R$ ${Number(editingRequest.valor_total).toFixed(2).replace('.', ',')}` : '',
        produtoServico: editingRequest.produto_servico || '',
        formaPagamento: editingRequest.forma_pagamento || undefined,
        banco: editingRequest.banco || '',
        agencia: editingRequest.agencia || '',
        contaCorrente: editingRequest.conta_corrente || '',
        chavePix: editingRequest.chave_pix || '',
        cnpjCpfTitular: editingRequest.cnpj_cpf_titular || '',
        nomeTitularConta: editingRequest.nome_titular_conta || '',
        justificativaVencimentoAntecipado: editingRequest.justificativa_vencimento_antecipado || '',
        justificativaDivergenciaTitular: editingRequest.justificativa_divergencia_titular || '',
      });
    }
  }, [editingRequest, form]);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Return just the file path (bucket is now private, we'll use signed URLs to access)
      return fileName;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro no upload: " + error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const validateStep = async (step: number): Promise<boolean> => {
    const fields: Record<number, (keyof InvoiceFormData)[]> = {
      1: ['empresa_id', 'nomeCompleto', 'nomeFornecedor', 'cnpjFornecedor', 'setor'],
      2: ['numeroNF', 'dataEmissao', 'dataVencimento', 'valorTotal', 'produtoServico'],
      3: ['formaPagamento'],
    };
    
    const result = await form.trigger(fields[step]);
    return result;
  };

  const nextStep = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Prevenir submit por Enter em etapas anteriores
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep < 3) {
      e.preventDefault();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    // Verificação de segurança: só submeter na última etapa
    if (currentStep !== 3) {
      console.log('Tentativa de submit em etapa incorreta, ignorando');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Upload invoice file if new
      let invoiceFileUrl = editingRequest?.arquivo_nf_url || null;
      const invoiceFile = data.arquivoNF?.[0];
      
      if (invoiceFile) {
        if (invoiceFile.type !== 'application/pdf') {
          toast({
            title: "Erro",
            description: "O arquivo deve ser um PDF",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        invoiceFileUrl = await uploadFile(invoiceFile);
      }
      
      if (!invoiceFileUrl && !editingRequest) {
        toast({
          title: "Erro",
          description: "Arquivo da NF é obrigatório",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Upload boleto file if needed
      let boletoFileUrl = editingRequest?.arquivo_boleto_url || null;
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
      }

      // Convert valor_total to number
      const valorTotal = parseFloat(data.valorTotal.replace(/[^\d,]/g, '').replace(',', '.'));

      const requestData: any = {
        solicitante_id: user.id,
        empresa_id: data.empresa_id,
        nome_solicitante: data.nomeCompleto,
        setor_id: data.setor,
        nome_fornecedor: data.nomeFornecedor,
        cnpj_fornecedor: data.cnpjFornecedor,
        numero_nf: data.numeroNF,
        data_emissao: format(data.dataEmissao, 'yyyy-MM-dd'),
        data_vencimento: format(data.dataVencimento, 'yyyy-MM-dd'),
        produto_servico: data.produtoServico,
        valor_total: valorTotal,
        arquivo_nf_url: invoiceFileUrl,
        previsao_pagamento: data.previsaoPagamento ? format(data.previsaoPagamento, 'yyyy-MM-dd') : null,
        justificativa_vencimento_antecipado: data.justificativaVencimentoAntecipado || null,
        forma_pagamento: data.formaPagamento,
        arquivo_boleto_url: boletoFileUrl,
        banco: data.banco || null,
        agencia: data.agencia || null,
        conta_corrente: data.contaCorrente || null,
        chave_pix: data.chavePix || null,
        cnpj_cpf_titular: data.cnpjCpfTitular || null,
        nome_titular_conta: data.nomeTitularConta || null,
        justificativa_divergencia_titular: data.justificativaDivergenciaTitular || null,
      };

      // Se está reenviando uma solicitação rejeitada, volta o status para aguardando
      if (editingRequest?.status === 'Rejeitada pelo gestor') {
        requestData.status = 'Aguardando aprovação do gestor';
      }

      if (editingRequest) {
        const { error } = await supabase
          .from('solicitacoes_nf')
          .update(requestData)
          .eq('id', editingRequest.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Solicitação atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('solicitacoes_nf')
          .insert(requestData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Solicitação enviada com sucesso!",
        });
      }
      
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {editingRequest ? 'Editar Solicitação' : 'Nova Solicitação de Pagamento'}
                </CardTitle>
                <CardDescription>
                  Preencha os dados em 3 etapas simples
                </CardDescription>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = currentStep > step.id;
                  const isCurrent = currentStep === step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                            isCompleted && "bg-primary border-primary text-primary-foreground",
                            isCurrent && "border-primary text-primary bg-primary/10",
                            !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-6 w-6" />
                          ) : (
                            <StepIcon className="h-5 w-5" />
                          )}
                        </div>
                        <span className={cn(
                          "mt-2 text-sm font-medium text-center",
                          isCurrent && "text-primary",
                          !isCurrent && !isCompleted && "text-muted-foreground"
                        )}>
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={cn(
                          "flex-1 h-1 mx-4",
                          isCompleted ? "bg-primary" : "bg-muted"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
                {currentStep === 1 && (
                  <Step1CompanySupplier 
                    form={form} 
                    initialCompanyId={initialCompanyId}
                  />
                )}
                
                {currentStep === 2 && (
                  <Step2InvoiceDetails 
                    form={form}
                    selectedNFFile={selectedNFFile}
                    setSelectedNFFile={setSelectedNFFile}
                    isEditing={!!editingRequest}
                  />
                )}
                
                {currentStep === 3 && (
                  <Step3Payment 
                    form={form}
                    selectedBoletoFile={selectedBoletoFile}
                    setSelectedBoletoFile={setSelectedBoletoFile}
                  />
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={currentStep === 1 ? onBack : prevStep}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {currentStep === 1 ? 'Cancelar' : 'Voltar'}
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button type="button" onClick={nextStep}>
                      Próximo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Enviando...' : (editingRequest ? 'Salvar Alterações' : 'Enviar Solicitação')}
                      <Check className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
