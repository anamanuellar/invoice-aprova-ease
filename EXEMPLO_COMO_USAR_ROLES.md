# Como Usar o Sistema de Roles

## 1. Inserir o Primeiro Usuário Admin

Após executar a migração, você precisa inserir manualmente o primeiro usuário admin no sistema. Faça isso através do SQL Editor do Supabase:

```sql
-- Substitua 'SEU_USER_ID_AQUI' pelo ID do usuário que já existe na tabela auth.users
INSERT INTO public.user_roles (user_id, role) 
VALUES ('SEU_USER_ID_AQUI', 'admin');
```

**Para descobrir seu user_id:**
1. Acesse o Supabase Dashboard
2. Vá em Authentication → Users  
3. Copie o ID do seu usuário

## 2. Cadastro de Novos Usuários com Roles

### Exemplo de como cadastrar usuários via código:

```typescript
// Hook personalizado para admin gerenciar usuários
const useUserManagement = () => {
  const assignRole = async (userId: string, role: UserRole, empresaId?: string) => {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        empresa_id: empresaId || null
      });
    
    if (error) throw error;
  };

  return { assignRole };
};
```

### Fluxo Recomendado:
1. **Usuário se cadastra** através do AuthForm (apenas cria conta)
2. **Admin recebe notificação** de novo usuário
3. **Admin atribui role** através de interface administrativa
4. **Usuário acessa** com permissões adequadas

## 3. Exemplos de Uso no Frontend

### Verificar Role do Usuário:
```typescript
const { userRoles, primaryRole, hasRole } = useUserRole();

// Verificar se tem role específico
if (hasRole('gestor')) {
  // Mostrar funcionalidades de gestor
}

// Obter role principal (maior prioridade)
console.log(primaryRole); // 'admin', 'financeiro', 'gestor', 'solicitante'
```

### Controle Condicional de UI:
```typescript
// Componente que só aparece para gestores e admins
<RoleBasedAccess allowedRoles={['gestor', 'admin']}>
  <Button onClick={aprovarSolicitacao}>
    Aprovar Solicitação
  </Button>
</RoleBasedAccess>

// Botão que fica desabilitado sem permissão
<RoleBasedButton allowedRoles={['financeiro', 'admin']} onClick={processarPagamento}>
  <Button>Processar Pagamento</Button>
</RoleBasedButton>
```

### Redirecionamento Baseado em Role:
```typescript
useEffect(() => {
  if (primaryRole) {
    switch (primaryRole) {
      case 'admin':
        navigate('/admin');
        break;
      case 'financeiro':
        navigate('/financeiro');
        break;
      case 'gestor':
        navigate('/gestor');
        break;
      default:
        navigate('/solicitante');
    }
  }
}, [primaryRole]);
```

## 4. Múltiplos Roles por Usuário

Um usuário pode ter múltiplos roles, inclusive em empresas diferentes:

```sql
-- Usuário que é gestor na Empresa A e solicitante na Empresa B
INSERT INTO public.user_roles (user_id, role, empresa_id) VALUES
('user-uuid', 'gestor', 'empresa-a-uuid'),
('user-uuid', 'solicitante', 'empresa-b-uuid');
```

### No Frontend:
```typescript
const { hasRoleInCompany } = useUserRole();

// Verificar role em empresa específica
if (hasRoleInCompany('gestor', selectedCompanyId)) {
  // Mostrar funcionalidades de gestor para esta empresa
}
```

## 5. Proteção de Endpoints (Edge Functions)

```typescript
// supabase/functions/manage-request/index.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export default async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader?.replace('Bearer ', ''));
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verificar role do usuário
  const { data: roles } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const userRoles = roles?.map(r => r.role) || [];
  
  if (!userRoles.includes('admin') && !userRoles.includes('financeiro')) {
    return new Response('Forbidden', { status: 403 });
  }

  // Prosseguir com a lógica do endpoint
};
```

## 6. Boas Práticas

### Segurança:
- **Nunca** confie apenas no frontend para controle de acesso
- **Sempre** valide permissões no backend (RLS + Edge Functions)
- **Use** as funções security definer para evitar recursão no RLS

### Performance:
- **Cache** os roles do usuário no frontend
- **Use** o hook `useUserRole` em vez de buscar roles repetidamente
- **Implemente** loading states durante verificação de permissões

### Experiência do Usuário:
- **Mostre** mensagens claras quando o acesso é negado
- **Redirecione** automaticamente para o dashboard apropriado
- **Indique** visualmente o role atual do usuário

## 7. Estrutura de Permissões por Role

| Role | Criar Solicitação | Ver Próprias | Ver Todas | Aprovar Gestor | Aprovar Financeiro | Admin |
|------|-------------------|--------------|-----------|----------------|-------------------|--------|
| **solicitante** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **gestor** | ✅ | ✅ | ✅ (setor) | ✅ | ❌ | ❌ |
| **financeiro** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Esta estrutura está implementada através das RLS policies no banco de dados.