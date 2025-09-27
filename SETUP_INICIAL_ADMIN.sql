-- ===============================================
-- SETUP INICIAL DO SISTEMA DE ROLES
-- ===============================================

-- 1. Primeiro, descubra seu user_id executando:
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Copie o ID do seu usuário e execute o comando abaixo
-- SUBSTITUA 'SEU_USER_ID_AQUI' pelo ID real do seu usuário:

INSERT INTO public.user_roles (user_id, role) 
VALUES ('SEU_USER_ID_AQUI', 'admin');

-- ===============================================
-- EXEMPLOS DE INSERÇÃO DE OUTROS USUÁRIOS
-- ===============================================

-- Criar usuário solicitante:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('user-id-aqui', 'solicitante');

-- Criar usuário gestor:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('user-id-aqui', 'gestor');

-- Criar usuário financeiro:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('user-id-aqui', 'financeiro');

-- Criar usuário com role em empresa específica:
-- INSERT INTO public.user_roles (user_id, role, empresa_id) 
-- VALUES ('user-id-aqui', 'gestor', 'empresa-id-aqui');

-- ===============================================
-- VERIFICAR ROLES EXISTENTES
-- ===============================================

-- Ver todos os roles atribuídos:
SELECT 
    ur.role,
    ur.empresa_id,
    au.email,
    e.nome as empresa_nome,
    ur.created_at
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN public.empresas e ON ur.empresa_id = e.id
ORDER BY ur.created_at DESC;

-- ===============================================
-- COMANDOS ÚTEIS PARA ADMINISTRAÇÃO
-- ===============================================

-- Remover role de um usuário:
-- DELETE FROM public.user_roles 
-- WHERE user_id = 'user-id-aqui' AND role = 'nome-do-role';

-- Atualizar role de um usuário:
-- UPDATE public.user_roles 
-- SET role = 'novo-role' 
-- WHERE user_id = 'user-id-aqui' AND role = 'role-antigo';

-- Ver usuários sem role atribuído:
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ORDER BY au.created_at DESC;