import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Upload, AlertTriangle } from 'lucide-react';
import { format, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { InvoiceFormData } from '../InvoiceWizard';

interface Step2Props {
  form: UseFormReturn<InvoiceFormData>;
  selectedNFFile: string;
  setSelectedNFFile: (name: string) => void;
  isEditing?: boolean;
}

const formatCurrency = (value: string): string => {
  const cleanValue = value.replace(/[^\d]/g, '');
  const numberValue = parseInt(cleanValue) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numberValue || 0);
};

export function Step2InvoiceDetails({ form, selectedNFFile, setSelectedNFFile, isEditing }: Step2Props) {
  const watchedVencimento = form.watch("dataVencimento");
  const isEarlyDueDate = watchedVencimento ? isBefore(watchedVencimento, addDays(new Date(), 10)) : false;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Número da NF */}
        <FormField
          control={form.control}
          name="numeroNF"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número da NF *</FormLabel>
              <FormControl>
                <Input placeholder="Digite o número da NF" {...field} />
              </FormControl>
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
              <FormLabel>Valor Total *</FormLabel>
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
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
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
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Upload da NF */}
        <FormField
          control={form.control}
          name="arquivoNF"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Upload da NF (PDF) {!isEditing && '*'}</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setSelectedNFFile(files[0].name);
                      onChange(files);
                    }
                  }}
                  {...field}
                />
              </FormControl>
              {selectedNFFile && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {selectedNFFile}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para manter o arquivo atual
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Produto/Serviço */}
        <FormField
          control={form.control}
          name="produtoServico"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Descrição do Produto/Serviço *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o produto ou serviço"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Justificativa para vencimento antecipado */}
      {isEarlyDueDate && (
        <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <Alert variant="destructive" className="border-amber-500 bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              A data de vencimento é menor que 10 dias. Justificativa obrigatória.
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
