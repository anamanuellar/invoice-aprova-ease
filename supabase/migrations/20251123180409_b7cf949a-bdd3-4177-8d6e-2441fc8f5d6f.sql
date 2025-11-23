-- Habilitar a extensão pg_net para permitir chamadas HTTP do banco de dados
-- Isso é necessário para o trigger de notificações por email funcionar
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;