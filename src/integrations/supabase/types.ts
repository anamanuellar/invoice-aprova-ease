export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      centros_custo: {
        Row: {
          codigo: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          requires_password_change: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          requires_password_change?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          requires_password_change?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      setores: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      solicitacao_historico: {
        Row: {
          comentario: string | null
          created_at: string
          dias_para_vencimento: number | null
          id: string
          motivo_rejeicao: string | null
          solicitacao_id: string
          status_anterior: string | null
          status_novo: string
          tempo_no_status_anterior: unknown
          usuario_id: string | null
          usuario_nome: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          dias_para_vencimento?: number | null
          id?: string
          motivo_rejeicao?: string | null
          solicitacao_id: string
          status_anterior?: string | null
          status_novo: string
          tempo_no_status_anterior?: unknown
          usuario_id?: string | null
          usuario_nome?: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          dias_para_vencimento?: number | null
          id?: string
          motivo_rejeicao?: string | null
          solicitacao_id?: string
          status_anterior?: string | null
          status_novo?: string
          tempo_no_status_anterior?: unknown
          usuario_id?: string | null
          usuario_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacao_historico_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_nf"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_nf: {
        Row: {
          agencia: string | null
          arquivo_boleto_url: string | null
          arquivo_nf_url: string | null
          banco: string | null
          centro_custo_id: string | null
          chave_pix: string | null
          cnpj_cpf_titular: string | null
          cnpj_fornecedor: string
          comentario_financeiro: string | null
          comentario_gestor: string | null
          conta_corrente: string | null
          created_at: string
          data_analise_financeira: string | null
          data_aprovacao_gestor: string | null
          data_emissao: string
          data_envio: string
          data_vencimento: string
          empresa_id: string | null
          forma_pagamento: string | null
          id: string
          justificativa_divergencia_titular: string | null
          justificativa_vencimento_antecipado: string | null
          nome_fornecedor: string
          nome_solicitante: string
          nome_titular_conta: string | null
          numero_nf: string
          previsao_pagamento: string | null
          produto_servico: string
          setor_id: string
          solicitante_id: string
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          agencia?: string | null
          arquivo_boleto_url?: string | null
          arquivo_nf_url?: string | null
          banco?: string | null
          centro_custo_id?: string | null
          chave_pix?: string | null
          cnpj_cpf_titular?: string | null
          cnpj_fornecedor: string
          comentario_financeiro?: string | null
          comentario_gestor?: string | null
          conta_corrente?: string | null
          created_at?: string
          data_analise_financeira?: string | null
          data_aprovacao_gestor?: string | null
          data_emissao: string
          data_envio?: string
          data_vencimento: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          id?: string
          justificativa_divergencia_titular?: string | null
          justificativa_vencimento_antecipado?: string | null
          nome_fornecedor: string
          nome_solicitante: string
          nome_titular_conta?: string | null
          numero_nf: string
          previsao_pagamento?: string | null
          produto_servico: string
          setor_id: string
          solicitante_id: string
          status?: string
          updated_at?: string
          valor_total: number
        }
        Update: {
          agencia?: string | null
          arquivo_boleto_url?: string | null
          arquivo_nf_url?: string | null
          banco?: string | null
          centro_custo_id?: string | null
          chave_pix?: string | null
          cnpj_cpf_titular?: string | null
          cnpj_fornecedor?: string
          comentario_financeiro?: string | null
          comentario_gestor?: string | null
          conta_corrente?: string | null
          created_at?: string
          data_analise_financeira?: string | null
          data_aprovacao_gestor?: string | null
          data_emissao?: string
          data_envio?: string
          data_vencimento?: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          id?: string
          justificativa_divergencia_titular?: string | null
          justificativa_vencimento_antecipado?: string | null
          nome_fornecedor?: string
          nome_solicitante?: string
          nome_titular_conta?: string | null
          numero_nf?: string
          previsao_pagamento?: string | null
          produto_servico?: string
          setor_id?: string
          solicitante_id?: string
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_nf_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_nf_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_nf_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_nf_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          empresa_id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_company: {
        Args: {
          _empresa_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "solicitante" | "gestor" | "financeiro" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["solicitante", "gestor", "financeiro", "admin"],
    },
  },
} as const
