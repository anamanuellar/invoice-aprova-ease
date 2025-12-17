import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChangePasswordDialogProps {
  open: boolean;
  onSuccess: () => void;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export const ChangePasswordDialog = ({ open, onSuccess }: ChangePasswordDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PasswordFormData>();

  const onSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (data.newPassword.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(data.newPassword);
    const hasNumber = /[0-9]/.test(data.newPassword);

    if (!hasLetter || !hasNumber) {
      toast({
        title: "Erro",
        description: "A senha deve conter letras e números",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (passwordError) throw passwordError;

      // Update profile to remove password change requirement
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ requires_password_change: false })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso",
      });

      onSuccess();
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Erro ao alterar senha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <DialogDescription>
            Você está usando uma senha temporária. Por favor, defina uma nova senha para continuar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};