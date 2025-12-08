import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertTriangle, CreditCard, FileText } from 'lucide-react';
import { InvoiceFormData } from '../InvoiceWizard';

interface Step3Props {
  form: UseFormReturn<InvoiceFormData>;
  selectedBoletoFile: string;
  setSelectedBoletoFile: (name: string) => void;
}

export function Step3Payment({ form, selectedBoletoFile, setSelectedBoletoFile }: Step3Props) {
  const watchedFormaPagamento = form.watch("formaPagamento");
  const watchedCnpjFornecedor = form.watch("cnpjFornecedor");
  const watchedNomeFornecedor = form.watch("nomeFornecedor");
  const watchedCnpjCpfTitular = form.watch("cnpjCpfTitular");
  const watchedNomeTitular = form.watch("nomeTitularConta");

  const hasTitularityDivergence = watchedFormaPagamento === 'deposito_bancario' && 
    watchedCnpjFornecedor && watchedNomeFornecedor && 
    watchedCnpjCpfTitular && watchedNomeTitular &&
    (watchedCnpjFornecedor.replace(/\D/g, '') !== watchedCnpjCpfTitular.replace(/\D/g, '') ||
     watchedNomeFornecedor.toLowerCase().trim() !== watchedNomeTitular.toLowerCase().trim());

  return (
    <div className="space-y-6">
      {/* Forma de pagamento */}
      <FormField
        control={form.control}
        name="formaPagamento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Forma de Pagamento *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="deposito_bancario">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Depósito Bancário / PIX
                  </div>
                </SelectItem>
                <SelectItem value="boleto">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Boleto
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Campos para Boleto */}
      {watchedFormaPagamento === 'boleto' && (
        <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dados do Boleto
          </h3>
          <FormField
            control={form.control}
            name="arquivoBoleto"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Upload do Boleto (PDF) *</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setSelectedBoletoFile(files[0].name);
                        onChange(files);
                      }
                    }}
                    {...field}
                  />
                </FormControl>
                {selectedBoletoFile && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {selectedBoletoFile}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Campos para Depósito bancário */}
      {watchedFormaPagamento === 'deposito_bancario' && (
        <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Dados Bancários
          </h3>
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
                  <FormLabel>CNPJ/CPF do Titular *</FormLabel>
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
                  <FormLabel>Nome do Titular *</FormLabel>
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
            <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mt-4">
              <Alert variant="destructive" className="border-amber-500 bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Os dados do titular diferem dos dados do fornecedor da NF
                </AlertDescription>
              </Alert>
              <FormField
                control={form.control}
                name="justificativaDivergenciaTitular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justificativa para Divergência *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explique o motivo da divergência entre o fornecedor e o titular da conta"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
