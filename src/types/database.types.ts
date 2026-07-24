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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anotacoes_diarias: {
        Row: {
          concluida: boolean | null
          created_at: string
          data: string | null
          empresa_id: string | null
          id: number
          prioridade: Database["public"]["Enums"]["prioridade_tipo"] | null
          titulo: string | null
        }
        Insert: {
          concluida?: boolean | null
          created_at?: string
          data?: string | null
          empresa_id?: string | null
          id?: number
          prioridade?: Database["public"]["Enums"]["prioridade_tipo"] | null
          titulo?: string | null
        }
        Update: {
          concluida?: boolean | null
          created_at?: string
          data?: string | null
          empresa_id?: string | null
          id?: number
          prioridade?: Database["public"]["Enums"]["prioridade_tipo"] | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anotacoes_diarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      anotacoes_gerais: {
        Row: {
          cliente: string | null
          created_at: string
          descricao: string | null
          empresa_id: string | null
          id: number
          titulo: string | null
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          titulo?: string | null
        }
        Update: {
          cliente?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anotacoes_gerais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      Auditoria: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          empresa_id: string | null
          entidade: string
          entidade_id: string | null
          id: number
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          empresa_id?: string | null
          entidade: string
          entidade_id?: string | null
          id?: number
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          empresa_id?: string | null
          entidade?: string
          entidade_id?: string | null
          id?: number
          usuario_id?: string | null
        }
        Relationships: []
      }
      Clientes: {
        Row: {
          cliente: string
          cpfcnpj: string | null
          created_at: string
          empresa_id: string | null
          endereco: string | null
          id: number
          oficina: string | null
          telefone1: number | null
          telefone2: number | null
        }
        Insert: {
          cliente: string
          cpfcnpj?: string | null
          created_at?: string
          empresa_id?: string | null
          endereco?: string | null
          id?: number
          oficina?: string | null
          telefone1?: number | null
          telefone2?: number | null
        }
        Update: {
          cliente?: string
          cpfcnpj?: string | null
          created_at?: string
          empresa_id?: string | null
          endereco?: string | null
          id?: number
          oficina?: string | null
          telefone1?: number | null
          telefone2?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ContasPagar: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_contapagar"] | null
          created_at: string
          dataVencimento: string | null
          descricao: string | null
          empresa_id: string | null
          id: number
          status: Database["public"]["Enums"]["status_pagamento"] | null
          valor: number | null
          valor_parcial_pago: number | null
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_contapagar"] | null
          created_at?: string
          dataVencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          valor?: number | null
          valor_parcial_pago?: number | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_contapagar"] | null
          created_at?: string
          dataVencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          valor?: number | null
          valor_parcial_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ContasPagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ContasReceber: {
        Row: {
          created_at: string
          dataPagamento: string | null
          descricao: string | null
          empresa_id: string | null
          id: number
          osId: number | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          valor: number | null
          valorRecebido: number | null
        }
        Insert: {
          created_at?: string
          dataPagamento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          osId?: number | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          valor?: number | null
          valorRecebido?: number | null
        }
        Update: {
          created_at?: string
          dataPagamento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          osId?: number | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          valor?: number | null
          valorRecebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ContasReceber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ContasReceber_osId_fkey"
            columns: ["osId"]
            isOneToOne: false
            referencedRelation: "OrdensDeServiço"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean | null
          cnpj: string | null
          created_at: string
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          nome_fantasia: string | null
          pix: string | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean | null
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          nome_fantasia?: string | null
          pix?: string | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean | null
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          nome_fantasia?: string | null
          pix?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      Estoque: {
        Row: {
          created_at: string
          custo: number | null
          empresa_id: string | null
          id: number
          imagePath: string | null
          nome: string | null
          qtdEstoque: number | null
          situacao: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string
          custo?: number | null
          empresa_id?: string | null
          id?: number
          imagePath?: string | null
          nome?: string | null
          qtdEstoque?: number | null
          situacao?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string
          custo?: number | null
          empresa_id?: string | null
          id?: number
          imagePath?: string | null
          nome?: string | null
          qtdEstoque?: number | null
          situacao?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      itensOS: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string | null
          id: number
          id_os: number | null
          id_servico: number | null
          manual: boolean | null
          produto_estoque_id: number | null
          quantidade: number | null
          tipo: string | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          id_os?: number | null
          id_servico?: number | null
          manual?: boolean | null
          produto_estoque_id?: number | null
          quantidade?: number | null
          tipo?: string | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          id_os?: number | null
          id_servico?: number | null
          manual?: boolean | null
          produto_estoque_id?: number | null
          quantidade?: number | null
          tipo?: string | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itensOS_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itensOS_id_os_fkey"
            columns: ["id_os"]
            isOneToOne: false
            referencedRelation: "OrdensDeServiço"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itensOS_id_servico_fkey"
            columns: ["id_servico"]
            isOneToOne: false
            referencedRelation: "Servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itensOS_produto_estoque_id_fkey"
            columns: ["produto_estoque_id"]
            isOneToOne: false
            referencedRelation: "Estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      Orcamentos: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: number
          idCliente: number | null
          motor: string | null
          obs: string | null
          orcamento: string | null
          situacao: Database["public"]["Enums"]["situacaoOrcamento"] | null
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: number
          idCliente?: number | null
          motor?: string | null
          obs?: string | null
          orcamento?: string | null
          situacao?: Database["public"]["Enums"]["situacaoOrcamento"] | null
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: number
          idCliente?: number | null
          motor?: string | null
          obs?: string | null
          orcamento?: string | null
          situacao?: Database["public"]["Enums"]["situacaoOrcamento"] | null
        }
        Relationships: [
          {
            foreignKeyName: "Orcamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Orcamentos_idCliente_fkey"
            columns: ["idCliente"]
            isOneToOne: false
            referencedRelation: "Clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      OrdensDeServiço: {
        Row: {
          dataServico: string
          dataVencimento: string | null
          empresa_id: string | null
          formaPagamento: string | null
          id: number
          idCliente: number | null
          motor: string | null
          obs: string | null
          pecasTrocadas: string | null
          servicosRealizados: string
          valorServico: number | null
          veículo: string | null
        }
        Insert: {
          dataServico?: string
          dataVencimento?: string | null
          empresa_id?: string | null
          formaPagamento?: string | null
          id?: number
          idCliente?: number | null
          motor?: string | null
          obs?: string | null
          pecasTrocadas?: string | null
          servicosRealizados?: string
          valorServico?: number | null
          veículo?: string | null
        }
        Update: {
          dataServico?: string
          dataVencimento?: string | null
          empresa_id?: string | null
          formaPagamento?: string | null
          id?: number
          idCliente?: number | null
          motor?: string | null
          obs?: string | null
          pecasTrocadas?: string | null
          servicosRealizados?: string
          valorServico?: number | null
          veículo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "OrdensDeServiço_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrdensDeServiço_idCliente_fkey"
            columns: ["idCliente"]
            isOneToOne: false
            referencedRelation: "Clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      PagamentoQuitado: {
        Row: {
          created_at: string
          dataPagamento: string | null
          descricao: string | null
          empresa_id: string | null
          formaPagamento: string | null
          id: number
          observacoes: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string
          dataPagamento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          formaPagamento?: string | null
          id?: number
          observacoes?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string
          dataPagamento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          formaPagamento?: string | null
          id?: number
          observacoes?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "PagamentoQuitado_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      PagamentoRecebido: {
        Row: {
          created_at: string
          dataRecebimento: string | null
          descricao: string | null
          empresa_id: string | null
          id: number
          metodoPag: string | null
          taxaMaquina: number | null
          valor: number | null
        }
        Insert: {
          created_at?: string
          dataRecebimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          metodoPag?: string | null
          taxaMaquina?: number | null
          valor?: number | null
        }
        Update: {
          created_at?: string
          dataRecebimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: number
          metodoPag?: string | null
          taxaMaquina?: number | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "PagamentoRecebido_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      Servicos: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: number
          linha: Database["public"]["Enums"]["linha"] | null
          servico: string | null
          tipo: Database["public"]["Enums"]["tipoServico"] | null
          valor: number | null
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: number
          linha?: Database["public"]["Enums"]["linha"] | null
          servico?: string | null
          tipo?: Database["public"]["Enums"]["tipoServico"] | null
          valor?: number | null
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: number
          linha?: Database["public"]["Enums"]["linha"] | null
          servico?: string | null
          tipo?: Database["public"]["Enums"]["tipoServico"] | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_empresas: {
        Row: {
          ativo: boolean | null
          created_at: string
          empresa_id: string | null
          id: string
          nome: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auditoria_com_usuario: {
        Row: {
          acao: string | null
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          empresa_id: string | null
          entidade: string | null
          entidade_id: string | null
          id: number | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Relationships: []
      }
      vw_contas_pagar: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_contapagar"] | null
          created_at: string | null
          dataVencimento: string | null
          descricao: string | null
          id: number | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          status_calculado: string | null
          valor: number | null
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_contapagar"] | null
          created_at?: string | null
          dataVencimento?: string | null
          descricao?: string | null
          id?: number | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          status_calculado?: never
          valor?: number | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_contapagar"] | null
          created_at?: string | null
          dataVencimento?: string | null
          descricao?: string | null
          id?: number | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          status_calculado?: never
          valor?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      excluir_ordem_servico: { Args: { p_os_id: number }; Returns: boolean }
      get_top_clientes_faturamento: {
        Args: { p_data_inicio: string; p_empresa_id: string }
        Returns: {
          cliente: string
          faturamento_total: number
          primeira_data: string
          total_os: number
          ultima_data: string
        }[]
      }
      get_top_clientes_quantidade_os: {
        Args: { p_data_inicio: string; p_empresa_id: string }
        Returns: {
          cliente: string
          faturamento_total: number
          primeira_data: string
          total_os: number
          ultima_data: string
        }[]
      }
      get_top_pecas_faturamento: {
        Args: { p_data_inicio: string; p_empresa_id: string }
        Returns: {
          descricao: string
          faturamento_total: number
          primeira_data: string
          quantidade_total: number
          ultima_data: string
        }[]
      }
      get_top_servicos_faturamento: {
        Args: { p_data_inicio: string; p_empresa_id: string }
        Returns: {
          descricao: string
          faturamento_total: number
          primeira_data: string
          quantidade_total: number
          ultima_data: string
        }[]
      }
      get_top_servicos_quantidade: {
        Args: { p_data_inicio: string; p_empresa_id: string }
        Returns: {
          descricao: string
          faturamento_total: number
          primeira_data: string
          quantidade_total: number
          ultima_data: string
        }[]
      }
      salvar_ordem_servico: {
        Args: { p_itens: Json; p_os: Json; p_os_id: number }
        Returns: {
          dataServico: string
          dataVencimento: string | null
          empresa_id: string | null
          formaPagamento: string | null
          id: number
          idCliente: number | null
          motor: string | null
          obs: string | null
          pecasTrocadas: string | null
          servicosRealizados: string
          valorServico: number | null
          veículo: string | null
        }
        SetofOptions: {
          from: "*"
          to: "OrdensDeServiço"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      categoria_contapagar:
        | "materiais"
        | "peças"
        | "cabeçote"
        | "vira"
        | "despesas"
        | "salario"
        | "impostos"
        | "funcionarios"
      linha: "leve" | "pesada"
      movimentacao: "entrada" | "saida"
      prioridade_tipo: "baixo" | "medio" | "alto"
      situacaoOrcamento:
        | "analise"
        | "aguardando"
        | "producao"
        | "pronto"
        | "aguardandoPecas"
        | "cancelado"
      status_pagamento: "pago" | "pendente" | "atrasado" | "parcial"
      tipoServico: "servico" | "peca"
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
      categoria_contapagar: [
        "materiais",
        "peças",
        "cabeçote",
        "vira",
        "despesas",
        "salario",
        "impostos",
        "funcionarios",
      ],
      linha: ["leve", "pesada"],
      movimentacao: ["entrada", "saida"],
      prioridade_tipo: ["baixo", "medio", "alto"],
      situacaoOrcamento: [
        "analise",
        "aguardando",
        "producao",
        "pronto",
        "aguardandoPecas",
        "cancelado",
      ],
      status_pagamento: ["pago", "pendente", "atrasado", "parcial"],
      tipoServico: ["servico", "peca"],
    },
  },
} as const
