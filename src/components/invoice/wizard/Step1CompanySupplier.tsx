import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceFormData } from '../InvoiceWizard';

interface Step1Props {
  form: UseFormReturn<InvoiceFormData>;
  initialCompanyId?: string;
}

interface Company {
  id: string;
  nome: string;
  codigo: string;
}

interface Setor {
  id: string;
  nome: string;
}

const formatCNPJ = (value: string): string => {
  const cleanValue = value.replace(/[^\d]/g, '');
  return cleanValue
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export function Step1CompanySupplier({ form, initialCompanyId }: Step1Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, setoresRes] = await Promise.all([
          supabase.from('empresas').select('*').order('nome'),
          supabase.from('setores').select('*').order('nome'),
        ]);

        if (companiesRes.data) setCompanies(companiesRes.data);
        if (setoresRes.data) setSetores(setoresRes.data);

        // Set initial company if provided
        if (initialCompanyId && !form.getValues('empresa_id')) {
          form.setValue('empresa_id', initialCompanyId);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialCompanyId, form]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Empresa */}
        <FormField
          control={form.control}
          name="empresa_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nome do solicitante */}
        <FormField
          control={form.control}
          name="nomeCompleto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solicitante *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Preenchido automaticamente
              </p>
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
              <Select onValueChange={field.onChange} value={field.value}>
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
            <FormItem className="md:col-span-2">
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
      </div>
    </div>
  );
}
