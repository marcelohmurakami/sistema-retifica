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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cancelado_em: string | null
          cancelado_por_cliente: number | null
          cancelado_por_usuario: string | null
          cancelamento_origem: string | null
          checkin_em: string | null
          confirmacao_origem: string | null
          confirmado_em: string | null
          created_at: string
          criado_por: string | null
          fim: string
          finalizado_em: string | null
          id: number
          id_cliente: number
          id_empresa: number
          id_unidade: number
          iniciado_em: string | null
          inicio: string
          motivo_cancelamento: string | null
          no_show_em: string | null
          observacoes: string | null
          origem: string
          pagamento_externo_id: string | null
          pagamento_status: string
          sinal_pago_em: string | null
          sinal_status: string
          sinal_valor: number | null
          site_access_token: string | null
          site_access_token_expires_at: string | null
          site_access_token_use_count: number
          site_booking_key: string | null
          site_notification_preferences: Json | null
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          cancelado_em?: string | null
          cancelado_por_cliente?: number | null
          cancelado_por_usuario?: string | null
          cancelamento_origem?: string | null
          checkin_em?: string | null
          confirmacao_origem?: string | null
          confirmado_em?: string | null
          created_at?: string
          criado_por?: string | null
          fim: string
          finalizado_em?: string | null
          id?: number
          id_cliente: number
          id_empresa: number
          id_unidade: number
          iniciado_em?: string | null
          inicio: string
          motivo_cancelamento?: string | null
          no_show_em?: string | null
          observacoes?: string | null
          origem?: string
          pagamento_externo_id?: string | null
          pagamento_status?: string
          sinal_pago_em?: string | null
          sinal_status?: string
          sinal_valor?: number | null
          site_access_token?: string | null
          site_access_token_expires_at?: string | null
          site_access_token_use_count?: number
          site_booking_key?: string | null
          site_notification_preferences?: Json | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          cancelado_em?: string | null
          cancelado_por_cliente?: number | null
          cancelado_por_usuario?: string | null
          cancelamento_origem?: string | null
          checkin_em?: string | null
          confirmacao_origem?: string | null
          confirmado_em?: string | null
          created_at?: string
          criado_por?: string | null
          fim?: string
          finalizado_em?: string | null
          id?: number
          id_cliente?: number
          id_empresa?: number
          id_unidade?: number
          iniciado_em?: string | null
          inicio?: string
          motivo_cancelamento?: string | null
          no_show_em?: string | null
          observacoes?: string | null
          origem?: string
          pagamento_externo_id?: string | null
          pagamento_status?: string
          sinal_pago_em?: string | null
          sinal_status?: string
          sinal_valor?: number | null
          site_access_token?: string | null
          site_access_token_expires_at?: string | null
          site_access_token_use_count?: number
          site_booking_key?: string | null
          site_notification_preferences?: Json | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cancelado_por_cliente_fkey"
            columns: ["id_empresa", "cancelado_por_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_empresa_fkey"
            columns: ["id_empresa", "id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "agendamentos_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_unidade_empresa_fkey"
            columns: ["id_empresa", "id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      agendamentos_servicos: {
        Row: {
          created_at: string
          duracao_minutos: number
          fim: string
          id: number
          id_agendamento: number
          id_empresa: number
          id_funcionario: number
          id_servico: number
          inicio: string
          observacoes: string | null
          ordem: number
          preco: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duracao_minutos: number
          fim: string
          id?: number
          id_agendamento: number
          id_empresa: number
          id_funcionario: number
          id_servico: number
          inicio: string
          observacoes?: string | null
          ordem?: number
          preco: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duracao_minutos?: number
          fim?: string
          id?: number
          id_agendamento?: number
          id_empresa?: number
          id_funcionario?: number
          id_servico?: number
          inicio?: string
          observacoes?: string | null
          ordem?: number
          preco?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_servicos_agendamento_empresa_fkey"
            columns: ["id_empresa", "id_agendamento"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "agendamentos_servicos_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "agendamentos_servicos_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "agendamentos_servicos_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servicos_servico_empresa_fkey"
            columns: ["id_empresa", "id_servico"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          assinatura_externa_id: string | null
          cancelado_em: string | null
          cancelar_ao_fim_periodo: boolean
          ciclo: string
          cliente_externo_id: string | null
          created_at: string
          id: number
          id_empresa: number
          id_plano: number
          inicio: string
          periodo_atual_fim: string | null
          periodo_atual_inicio: string | null
          status: Database["public"]["Enums"]["status_assinatura"]
          teste_finaliza_em: string | null
          valor_contratado: number | null
        }
        Insert: {
          assinatura_externa_id?: string | null
          cancelado_em?: string | null
          cancelar_ao_fim_periodo?: boolean
          ciclo?: string
          cliente_externo_id?: string | null
          created_at?: string
          id?: number
          id_empresa: number
          id_plano: number
          inicio?: string
          periodo_atual_fim?: string | null
          periodo_atual_inicio?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
          teste_finaliza_em?: string | null
          valor_contratado?: number | null
        }
        Update: {
          assinatura_externa_id?: string | null
          cancelado_em?: string | null
          cancelar_ao_fim_periodo?: boolean
          ciclo?: string
          cliente_externo_id?: string | null
          created_at?: string
          id?: number
          id_empresa?: number
          id_plano?: number
          inicio?: string
          periodo_atual_fim?: string | null
          periodo_atual_inicio?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
          teste_finaliza_em?: string | null
          valor_contratado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_fkey"
            columns: ["id_plano"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      auditorias: {
        Row: {
          acao: string
          campos_alterados: string[] | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: number
          id_empresa: number | null
          origem: string
          papel_execucao: string | null
          registro_id: string
          schema_nome: string
          tabela: string
          transacao_id: number | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: number
          id_empresa?: number | null
          origem?: string
          papel_execucao?: string | null
          registro_id: string
          schema_nome?: string
          tabela: string
          transacao_id?: number | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          campos_alterados?: string[] | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: number
          id_empresa?: number | null
          origem?: string
          papel_execucao?: string | null
          registro_id?: string
          schema_nome?: string
          tabela?: string
          transacao_id?: number | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      ausencias_funcionarios: {
        Row: {
          cancelado_em: string | null
          cancelado_por: string | null
          created_at: string
          criado_por: string | null
          fim: string
          id: number
          id_empresa: number
          id_funcionario: number
          inicio: string
          motivo: string | null
          motivo_cancelamento: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          created_at?: string
          criado_por?: string | null
          fim: string
          id?: number
          id_empresa: number
          id_funcionario: number
          inicio: string
          motivo?: string | null
          motivo_cancelamento?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          created_at?: string
          criado_por?: string | null
          fim?: string
          id?: number
          id_empresa?: number
          id_funcionario?: number
          inicio?: string
          motivo?: string | null
          motivo_cancelamento?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ausencias_funcionarios_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ausencias_funcionarios_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "ausencias_funcionarios_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          autorizado_publicacao: boolean
          comentario: string | null
          created_at: string
          destaque: boolean
          id: number
          id_agendamento: number | null
          id_cliente: number | null
          id_empresa: number
          nome_publico: string | null
          nota: number
          status: string
          updated_at: string
        }
        Insert: {
          autorizado_publicacao?: boolean
          comentario?: string | null
          created_at?: string
          destaque?: boolean
          id?: number
          id_agendamento?: number | null
          id_cliente?: number | null
          id_empresa: number
          nome_publico?: string | null
          nota: number
          status?: string
          updated_at?: string
        }
        Update: {
          autorizado_publicacao?: boolean
          comentario?: string | null
          created_at?: string
          destaque?: boolean
          id?: number
          id_agendamento?: number | null
          id_cliente?: number | null
          id_empresa?: number
          nome_publico?: string | null
          nota?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_agendamento_fkey"
            columns: ["id_empresa", "id_agendamento"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "avaliacoes_cliente_fkey"
            columns: ["id_empresa", "id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "avaliacoes_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueios_agenda: {
        Row: {
          cancelado_em: string | null
          cancelado_por: string | null
          created_at: string
          criado_por: string | null
          dia_inteiro: boolean
          fim: string
          id: number
          id_empresa: number
          id_funcionario: number | null
          id_unidade: number | null
          inicio: string
          motivo: string | null
          motivo_cancelamento: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          created_at?: string
          criado_por?: string | null
          dia_inteiro?: boolean
          fim: string
          id?: number
          id_empresa: number
          id_funcionario?: number | null
          id_unidade?: number | null
          inicio: string
          motivo?: string | null
          motivo_cancelamento?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          created_at?: string
          criado_por?: string | null
          dia_inteiro?: boolean
          fim?: string
          id?: number
          id_empresa?: number
          id_funcionario?: number | null
          id_unidade?: number | null
          inicio?: string
          motivo?: string | null
          motivo_cancelamento?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloqueios_agenda_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueios_agenda_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "bloqueios_agenda_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "bloqueios_agenda_unidade_fkey"
            columns: ["id_empresa", "id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      caixas: {
        Row: {
          ativo: boolean
          codigo: string | null
          created_at: string
          descricao: string | null
          id: number
          id_empresa: number
          localizacao: string | null
          nome: string
          permite_saldo_negativo: boolean
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          id_empresa: number
          localizacao?: string | null
          nome: string
          permite_saldo_negativo?: boolean
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          id_empresa?: number
          localizacao?: string | null
          nome?: string
          permite_saldo_negativo?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caixas_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_financeiras: {
        Row: {
          ativo: boolean
          created_at: string
          id: number
          id_empresa: number
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: number
          id_empresa: number
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: number
          id_empresa?: number
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_financeiras_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          auth_user_id: string | null
          bloqueado_comunicacao_em: string | null
          canal_preferido: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          email_normalizado: string | null
          endereco: string | null
          fuso_horario: string
          genero: string | null
          id: number
          id_empresa: number
          idioma: string
          nome: string
          observacoes: string | null
          telefone_e164: string | null
          telefone_principal: string | null
          telefone_secundario: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          auth_user_id?: string | null
          bloqueado_comunicacao_em?: string | null
          canal_preferido?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          endereco?: string | null
          fuso_horario?: string
          genero?: string | null
          id?: number
          id_empresa: number
          idioma?: string
          nome: string
          observacoes?: string | null
          telefone_e164?: string | null
          telefone_principal?: string | null
          telefone_secundario?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string | null
          bloqueado_comunicacao_em?: string | null
          canal_preferido?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          email_normalizado?: string | null
          endereco?: string | null
          fuso_horario?: string
          genero?: string | null
          id?: number
          id_empresa?: number
          idioma?: string
          nome?: string
          observacoes?: string | null
          telefone_e164?: string | null
          telefone_principal?: string | null
          telefone_secundario?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          aberta_em: string
          acrescimo: number
          cancelada_em: string | null
          condicao_pagamento: string
          created_at: string
          criado_por: string | null
          custo_insumos_snapshot: number
          desconto: number
          desconto_itens: number
          fechada_em: string | null
          id: number
          id_agendamento: number | null
          id_cliente: number
          id_empresa: number
          id_funcionario_responsavel: number | null
          id_orcamento: number | null
          motivo_cancelamento: string | null
          observacoes: string | null
          status: string
          subtotal: number
          taxa_pagamento_snapshot: number
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          aberta_em?: string
          acrescimo?: number
          cancelada_em?: string | null
          condicao_pagamento?: string
          created_at?: string
          criado_por?: string | null
          custo_insumos_snapshot?: number
          desconto?: number
          desconto_itens?: number
          fechada_em?: string | null
          id?: number
          id_agendamento?: number | null
          id_cliente: number
          id_empresa: number
          id_funcionario_responsavel?: number | null
          id_orcamento?: number | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          status?: string
          subtotal?: number
          taxa_pagamento_snapshot?: number
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          aberta_em?: string
          acrescimo?: number
          cancelada_em?: string | null
          condicao_pagamento?: string
          created_at?: string
          criado_por?: string | null
          custo_insumos_snapshot?: number
          desconto?: number
          desconto_itens?: number
          fechada_em?: string | null
          id?: number
          id_agendamento?: number | null
          id_cliente?: number
          id_empresa?: number
          id_funcionario_responsavel?: number | null
          id_orcamento?: number | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          status?: string
          subtotal?: number
          taxa_pagamento_snapshot?: number
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comandas_agendamento_empresa_fkey"
            columns: ["id_empresa", "id_agendamento"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comandas_cliente_empresa_fkey"
            columns: ["id_empresa", "id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comandas_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario_responsavel"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comandas_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario_responsavel"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comandas_orcamento_empresa_fkey"
            columns: ["id_empresa", "id_orcamento"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      comandas_itens: {
        Row: {
          comissao_calculada: number
          comissao_tipo_snapshot: string | null
          comissao_valor_snapshot: number | null
          created_at: string
          custo_unitario_snapshot: number | null
          desconto: number
          descricao_snapshot: string
          id: number
          id_comanda: number
          id_empresa: number
          id_funcionario: number | null
          id_orcamento_item: number | null
          id_produto: number | null
          id_servico: number | null
          observacoes: string | null
          ordem: number
          quantidade: number
          tipo_item: string
          updated_at: string
          valor_total: number | null
          valor_unitario_snapshot: number
        }
        Insert: {
          comissao_calculada?: number
          comissao_tipo_snapshot?: string | null
          comissao_valor_snapshot?: number | null
          created_at?: string
          custo_unitario_snapshot?: number | null
          desconto?: number
          descricao_snapshot: string
          id?: number
          id_comanda: number
          id_empresa: number
          id_funcionario?: number | null
          id_orcamento_item?: number | null
          id_produto?: number | null
          id_servico?: number | null
          observacoes?: string | null
          ordem?: number
          quantidade?: number
          tipo_item: string
          updated_at?: string
          valor_total?: number | null
          valor_unitario_snapshot: number
        }
        Update: {
          comissao_calculada?: number
          comissao_tipo_snapshot?: string | null
          comissao_valor_snapshot?: number | null
          created_at?: string
          custo_unitario_snapshot?: number | null
          desconto?: number
          descricao_snapshot?: string
          id?: number
          id_comanda?: number
          id_empresa?: number
          id_funcionario?: number | null
          id_orcamento_item?: number | null
          id_produto?: number | null
          id_servico?: number | null
          observacoes?: string | null
          ordem?: number
          quantidade?: number
          tipo_item?: string
          updated_at?: string
          valor_total?: number | null
          valor_unitario_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "comandas_itens_comanda_empresa_fkey"
            columns: ["id_empresa", "id_comanda"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comandas_itens_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comandas_itens_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comandas_itens_orcamento_item_empresa_fkey"
            columns: ["id_empresa", "id_orcamento_item"]
            isOneToOne: false
            referencedRelation: "orcamentos_itens"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comandas_itens_produto_empresa_fkey"
            columns: ["id_empresa", "id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comandas_itens_servico_empresa_fkey"
            columns: ["id_empresa", "id_servico"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      comissoes_regras: {
        Row: {
          ativo: boolean
          base_calculo: string
          created_at: string
          criado_por: string | null
          descontar_insumos: boolean
          descontar_taxa_pagamento: boolean
          id: number
          id_empresa: number
          id_funcionario: number | null
          id_produto: number | null
          id_servico: number | null
          momento_liberacao: string
          percentual: number | null
          prioridade: number
          tipo_calculo: string
          tipo_item: string
          updated_at: string
          valor_fixo: number | null
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          ativo?: boolean
          base_calculo?: string
          created_at?: string
          criado_por?: string | null
          descontar_insumos?: boolean
          descontar_taxa_pagamento?: boolean
          id?: number
          id_empresa: number
          id_funcionario?: number | null
          id_produto?: number | null
          id_servico?: number | null
          momento_liberacao?: string
          percentual?: number | null
          prioridade?: number
          tipo_calculo: string
          tipo_item: string
          updated_at?: string
          valor_fixo?: number | null
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          ativo?: boolean
          base_calculo?: string
          created_at?: string
          criado_por?: string | null
          descontar_insumos?: boolean
          descontar_taxa_pagamento?: boolean
          id?: number
          id_empresa?: number
          id_funcionario?: number | null
          id_produto?: number | null
          id_servico?: number | null
          momento_liberacao?: string
          percentual?: number | null
          prioridade?: number
          tipo_calculo?: string
          tipo_item?: string
          updated_at?: string
          valor_fixo?: number | null
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_regras_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_regras_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comissoes_regras_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comissoes_regras_produto_empresa_fkey"
            columns: ["id_empresa", "id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "comissoes_regras_servico_empresa_fkey"
            columns: ["id_empresa", "id_servico"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      compras: {
        Row: {
          anexos: string[] | null
          created_at: string
          criado_por: string | null
          data_compra: string
          desconto: number
          frete: number
          id: number
          id_conta: number | null
          id_empresa: number
          id_fornecedor: number
          numero_documento: string | null
          observacoes: string | null
          previsao_entrega: string | null
          recebido_em: string | null
          status: string
          total_final: number
          total_produtos: number
          updated_at: string
        }
        Insert: {
          anexos?: string[] | null
          created_at?: string
          criado_por?: string | null
          data_compra?: string
          desconto?: number
          frete?: number
          id?: number
          id_conta?: number | null
          id_empresa: number
          id_fornecedor: number
          numero_documento?: string | null
          observacoes?: string | null
          previsao_entrega?: string | null
          recebido_em?: string | null
          status?: string
          total_final?: number
          total_produtos?: number
          updated_at?: string
        }
        Update: {
          anexos?: string[] | null
          created_at?: string
          criado_por?: string | null
          data_compra?: string
          desconto?: number
          frete?: number
          id?: number
          id_conta?: number | null
          id_empresa?: number
          id_fornecedor?: number
          numero_documento?: string | null
          observacoes?: string | null
          previsao_entrega?: string | null
          recebido_em?: string | null
          status?: string
          total_final?: number
          total_produtos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_conta_empresa_fkey"
            columns: ["id_empresa", "id_conta"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "compras_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_fornecedor_empresa_fkey"
            columns: ["id_empresa", "id_fornecedor"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      compras_itens: {
        Row: {
          created_at: string
          desconto: number
          descricao_snapshot: string
          id: number
          id_compra: number
          id_empresa: number
          id_produto: number
          quantidade_comprada: number
          quantidade_recebida: number
          total: number
          updated_at: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          desconto?: number
          descricao_snapshot: string
          id?: number
          id_compra: number
          id_empresa: number
          id_produto: number
          quantidade_comprada: number
          quantidade_recebida?: number
          total?: number
          updated_at?: string
          valor_unitario: number
        }
        Update: {
          created_at?: string
          desconto?: number
          descricao_snapshot?: string
          id?: number
          id_compra?: number
          id_empresa?: number
          id_produto?: number
          quantidade_comprada?: number
          quantidade_recebida?: number
          total?: number
          updated_at?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_itens_compra_empresa_fkey"
            columns: ["id_empresa", "id_compra"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "compras_itens_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_itens_produto_empresa_fkey"
            columns: ["id_empresa", "id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      configuracoes_empresas: {
        Row: {
          cor_destaque: string
          cor_primaria: string
          densidade_interface: string
          duracao_slot_minutos: number
          id: number
          id_empresa: number
          idioma: string
          logo_url: string | null
          moeda: string
          raio_interface: string
          semana_inicia: number
          tema_preferido: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cor_destaque?: string
          cor_primaria?: string
          densidade_interface?: string
          duracao_slot_minutos?: number
          id?: number
          id_empresa: number
          idioma?: string
          logo_url?: string | null
          moeda?: string
          raio_interface?: string
          semana_inicia?: number
          tema_preferido?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cor_destaque?: string
          cor_primaria?: string
          densidade_interface?: string
          duracao_slot_minutos?: number
          id?: number
          id_empresa?: number
          idioma?: string
          logo_url?: string | null
          moeda?: string
          raio_interface?: string
          semana_inicia?: number
          tema_preferido?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_empresas_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_lembretes_empresa: {
        Row: {
          antecedencias_minutos: number[]
          ativo: boolean
          created_at: string
          email: boolean
          id_empresa: number
          max_tentativas: number
          updated_at: string
          whatsapp: boolean
        }
        Insert: {
          antecedencias_minutos?: number[]
          ativo?: boolean
          created_at?: string
          email?: boolean
          id_empresa: number
          max_tentativas?: number
          updated_at?: string
          whatsapp?: boolean
        }
        Update: {
          antecedencias_minutos?: number[]
          ativo?: boolean
          created_at?: string
          email?: boolean
          id_empresa?: number
          max_tentativas?: number
          updated_at?: string
          whatsapp?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_lembretes_empresa_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      consentimentos_comunicacao: {
        Row: {
          canal: string
          consentiu: boolean
          created_at: string
          criado_por: string | null
          finalidade: string
          id: number
          id_cliente: number
          id_empresa: number
          ip_origem: unknown
          observacoes: string | null
          origem: string
          registrado_em: string
          revogado_em: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          canal: string
          consentiu?: boolean
          created_at?: string
          criado_por?: string | null
          finalidade: string
          id?: number
          id_cliente: number
          id_empresa: number
          ip_origem?: unknown
          observacoes?: string | null
          origem?: string
          registrado_em?: string
          revogado_em?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          canal?: string
          consentiu?: boolean
          created_at?: string
          criado_por?: string | null
          finalidade?: string
          id?: number
          id_cliente?: number
          id_empresa?: number
          ip_origem?: unknown
          observacoes?: string | null
          origem?: string
          registrado_em?: string
          revogado_em?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consentimentos_cliente_empresa_fkey"
            columns: ["id_empresa", "id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "consentimentos_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      consumos_insumos_comanda: {
        Row: {
          created_at: string
          custo_total: number | null
          custo_unitario_snapshot: number
          descontar_comissao: boolean
          id: number
          id_comanda: number
          id_comanda_item: number
          id_empresa: number
          id_funcionario: number | null
          id_produto: number
          id_servico: number
          quantidade_sugerida: number
          quantidade_utilizada: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_total?: number | null
          custo_unitario_snapshot?: number
          descontar_comissao?: boolean
          id?: number
          id_comanda: number
          id_comanda_item: number
          id_empresa: number
          id_funcionario?: number | null
          id_produto: number
          id_servico: number
          quantidade_sugerida?: number
          quantidade_utilizada: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_total?: number | null
          custo_unitario_snapshot?: number
          descontar_comissao?: boolean
          id?: number
          id_comanda?: number
          id_comanda_item?: number
          id_empresa?: number
          id_funcionario?: number | null
          id_produto?: number
          id_servico?: number
          quantidade_sugerida?: number
          quantidade_utilizada?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumos_insumos_comanda_fkey"
            columns: ["id_empresa", "id_comanda"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "consumos_insumos_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumos_insumos_funcionario_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "consumos_insumos_funcionario_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "consumos_insumos_item_fkey"
            columns: ["id_empresa", "id_comanda_item"]
            isOneToOne: false
            referencedRelation: "comandas_itens"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "consumos_insumos_produto_fkey"
            columns: ["id_empresa", "id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "consumos_insumos_servico_fkey"
            columns: ["id_empresa", "id_servico"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      contas: {
        Row: {
          cancelada_em: string | null
          competencia: string | null
          created_at: string
          criado_por: string | null
          data_emissao: string
          descricao: string
          documento: string | null
          id: number
          id_categoria: number | null
          id_cliente: number | null
          id_comanda: number | null
          id_empresa: number
          id_fornecedor: number | null
          motivo_cancelamento: string | null
          observacoes: string | null
          status: string
          tipo: string
          updated_at: string
          valor_pago: number
          valor_total: number
        }
        Insert: {
          cancelada_em?: string | null
          competencia?: string | null
          created_at?: string
          criado_por?: string | null
          data_emissao?: string
          descricao: string
          documento?: string | null
          id?: number
          id_categoria?: number | null
          id_cliente?: number | null
          id_comanda?: number | null
          id_empresa: number
          id_fornecedor?: number | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor_pago?: number
          valor_total?: number
        }
        Update: {
          cancelada_em?: string | null
          competencia?: string | null
          created_at?: string
          criado_por?: string | null
          data_emissao?: string
          descricao?: string
          documento?: string | null
          id?: number
          id_categoria?: number | null
          id_cliente?: number | null
          id_comanda?: number | null
          id_empresa?: number
          id_fornecedor?: number | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_pago?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_categoria_empresa_fkey"
            columns: ["id_empresa", "id_categoria"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "contas_cliente_empresa_fkey"
            columns: ["id_empresa", "id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "contas_comanda_empresa_fkey"
            columns: ["id_empresa", "id_comanda"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "contas_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_fornecedor_empresa_fkey"
            columns: ["id_empresa", "id_fornecedor"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      contas_parcelas: {
        Row: {
          created_at: string
          data_vencimento: string
          id: number
          id_conta: number
          id_empresa: number
          numero_parcela: number
          observacoes: string | null
          paga_em: string | null
          saldo: number | null
          status: string
          updated_at: string
          valor_pago: number
          valor_parcela: number
        }
        Insert: {
          created_at?: string
          data_vencimento: string
          id?: number
          id_conta: number
          id_empresa: number
          numero_parcela: number
          observacoes?: string | null
          paga_em?: string | null
          saldo?: number | null
          status?: string
          updated_at?: string
          valor_pago?: number
          valor_parcela: number
        }
        Update: {
          created_at?: string
          data_vencimento?: string
          id?: number
          id_conta?: number
          id_empresa?: number
          numero_parcela?: number
          observacoes?: string | null
          paga_em?: string | null
          saldo?: number | null
          status?: string
          updated_at?: string
          valor_pago?: number
          valor_parcela?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_parcelas_conta_empresa_fkey"
            columns: ["id_empresa", "id_conta"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      convites_empresa: {
        Row: {
          aceito_em: string | null
          aceito_por: string | null
          cancelado_em: string | null
          created_at: string
          criado_por: string | null
          email: string
          expires_at: string
          id: number
          id_empresa: number
          status: string
          tipo: Database["public"]["Enums"]["tipos_usuarios"]
          updated_at: string
        }
        Insert: {
          aceito_em?: string | null
          aceito_por?: string | null
          cancelado_em?: string | null
          created_at?: string
          criado_por?: string | null
          email: string
          expires_at?: string
          id?: number
          id_empresa: number
          status?: string
          tipo: Database["public"]["Enums"]["tipos_usuarios"]
          updated_at?: string
        }
        Update: {
          aceito_em?: string | null
          aceito_por?: string | null
          cancelado_em?: string | null
          created_at?: string
          criado_por?: string | null
          email?: string
          expires_at?: string
          id?: number
          id_empresa?: number
          status?: string
          tipo?: Database["public"]["Enums"]["tipos_usuarios"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "convites_empresa_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilidades: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: string | null
          fim: string
          id: number
          id_bloqueio_agenda: number | null
          id_empresa: number
          id_profissional: number
          id_unidade: number
          inicio: string
          observacoes: string | null
          origem: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          fim: string
          id?: number
          id_bloqueio_agenda?: number | null
          id_empresa: number
          id_profissional: number
          id_unidade: number
          inicio: string
          observacoes?: string | null
          origem?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          fim?: string
          id?: number
          id_bloqueio_agenda?: number | null
          id_empresa?: number
          id_profissional?: number
          id_unidade?: number
          inicio?: string
          observacoes?: string | null
          origem?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilidades_bloqueio_fkey"
            columns: ["id_empresa", "id_bloqueio_agenda"]
            isOneToOne: false
            referencedRelation: "bloqueios_agenda"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "disponibilidades_profissional_fkey"
            columns: ["id_empresa", "id_profissional"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "disponibilidades_profissional_fkey"
            columns: ["id_empresa", "id_profissional"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "disponibilidades_unidade_fkey"
            columns: ["id_empresa", "id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string | null
          contato1: string | null
          contato2: string | null
          created_at: string
          criado_por: string | null
          email: string | null
          fantasia: string
          fuso_horario: string
          id: number
          razao_social: string | null
          status: Database["public"]["Enums"]["status_empresa"]
        }
        Insert: {
          cnpj?: string | null
          contato1?: string | null
          contato2?: string | null
          created_at?: string
          criado_por?: string | null
          email?: string | null
          fantasia: string
          fuso_horario?: string
          id?: number
          razao_social?: string | null
          status?: Database["public"]["Enums"]["status_empresa"]
        }
        Update: {
          cnpj?: string | null
          contato1?: string | null
          contato2?: string | null
          created_at?: string
          criado_por?: string | null
          email?: string | null
          fantasia?: string
          fuso_horario?: string
          id?: number
          razao_social?: string | null
          status?: Database["public"]["Enums"]["status_empresa"]
        }
        Relationships: []
      }
      eventos_funil_agendamento: {
        Row: {
          created_at: string
          etapa: number | null
          evento: string
          id: number
          id_empresa: number
          id_funcionario: number | null
          id_servico: number | null
          sessao: string
        }
        Insert: {
          created_at?: string
          etapa?: number | null
          evento: string
          id?: number
          id_empresa: number
          id_funcionario?: number | null
          id_servico?: number | null
          sessao: string
        }
        Update: {
          created_at?: string
          etapa?: number | null
          evento?: string
          id?: number
          id_empresa?: number
          id_funcionario?: number | null
          id_servico?: number | null
          sessao?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_funil_agendamento_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_mensagens_recebidas: {
        Row: {
          acao: string
          canal: string
          conteudo: string
          id: number
          id_agendamento: number | null
          id_cliente: number | null
          id_empresa: number
          identificador_externo: string
          processado_em: string | null
          recebido_em: string
          remetente: string
          resposta: Json
        }
        Insert: {
          acao?: string
          canal?: string
          conteudo: string
          id?: number
          id_agendamento?: number | null
          id_cliente?: number | null
          id_empresa: number
          identificador_externo: string
          processado_em?: string | null
          recebido_em?: string
          remetente: string
          resposta?: Json
        }
        Update: {
          acao?: string
          canal?: string
          conteudo?: string
          id?: number
          id_agendamento?: number | null
          id_cliente?: number | null
          id_empresa?: number
          identificador_externo?: string
          processado_em?: string | null
          recebido_em?: string
          remetente?: string
          resposta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "eventos_mensagens_agendamento_fkey"
            columns: ["id_empresa", "id_agendamento"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "eventos_mensagens_cliente_fkey"
            columns: ["id_empresa", "id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "eventos_mensagens_recebidas_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_sistema: {
        Row: {
          bloqueado_em: string | null
          bloqueado_por: string | null
          chave_idempotencia: string | null
          created_at: string
          dados: Json
          entidade: string
          id: number
          id_empresa: number
          id_entidade: string | null
          max_tentativas: number
          origem: string
          prioridade: number
          processado_em: string | null
          processar_em: string
          status: string
          tentativas: number
          tipo_evento: string
          ultimo_erro: string | null
          updated_at: string
        }
        Insert: {
          bloqueado_em?: string | null
          bloqueado_por?: string | null
          chave_idempotencia?: string | null
          created_at?: string
          dados?: Json
          entidade: string
          id?: number
          id_empresa: number
          id_entidade?: string | null
          max_tentativas?: number
          origem?: string
          prioridade?: number
          processado_em?: string | null
          processar_em?: string
          status?: string
          tentativas?: number
          tipo_evento: string
          ultimo_erro?: string | null
          updated_at?: string
        }
        Update: {
          bloqueado_em?: string | null
          bloqueado_por?: string | null
          chave_idempotencia?: string | null
          created_at?: string
          dados?: Json
          entidade?: string
          id?: number
          id_empresa?: number
          id_entidade?: string | null
          max_tentativas?: number
          origem?: string
          prioridade?: number
          processado_em?: string | null
          processar_em?: string
          status?: string
          tentativas?: number
          tipo_evento?: string
          ultimo_erro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_sistema_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_mensagens: {
        Row: {
          agendada_para: string
          assunto: string | null
          canal: string
          cancelada_em: string | null
          chave_idempotencia: string | null
          conteudo: string
          created_at: string
          dados_template: Json
          destinatario: string
          entregue_em: string | null
          enviada_em: string | null
          id: number
          id_cliente: number | null
          id_empresa: number
          id_evento: number | null
          id_integracao: number | null
          identificador_externo: string | null
          lida_em: string | null
          max_tentativas: number
          prioridade: number
          processamento_iniciado_em: string | null
          proxima_tentativa_em: string | null
          status: string
          tentativas: number
          ultimo_erro: string | null
          updated_at: string
        }
        Insert: {
          agendada_para?: string
          assunto?: string | null
          canal: string
          cancelada_em?: string | null
          chave_idempotencia?: string | null
          conteudo: string
          created_at?: string
          dados_template?: Json
          destinatario: string
          entregue_em?: string | null
          enviada_em?: string | null
          id?: number
          id_cliente?: number | null
          id_empresa: number
          id_evento?: number | null
          id_integracao?: number | null
          identificador_externo?: string | null
          lida_em?: string | null
          max_tentativas?: number
          prioridade?: number
          processamento_iniciado_em?: string | null
          proxima_tentativa_em?: string | null
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
          updated_at?: string
        }
        Update: {
          agendada_para?: string
          assunto?: string | null
          canal?: string
          cancelada_em?: string | null
          chave_idempotencia?: string | null
          conteudo?: string
          created_at?: string
          dados_template?: Json
          destinatario?: string
          entregue_em?: string | null
          enviada_em?: string | null
          id?: number
          id_cliente?: number | null
          id_empresa?: number
          id_evento?: number | null
          id_integracao?: number | null
          identificador_externo?: string | null
          lida_em?: string | null
          max_tentativas?: number
          prioridade?: number
          processamento_iniciado_em?: string | null
          proxima_tentativa_em?: string | null
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fila_mensagens_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_mensagens_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_mensagens_id_evento_fkey"
            columns: ["id_evento"]
            isOneToOne: false
            referencedRelation: "eventos_sistema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_mensagens_id_integracao_fkey"
            columns: ["id_integracao"]
            isOneToOne: false
            referencedRelation: "integracoes"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativo: boolean
          created_at: string
          id: number
          id_empresa: number
          max_parcelas: number
          nome: string
          permite_parcelamento: boolean
          prazo_recebimento_dias: number
          taxa_percentual: number
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: number
          id_empresa: number
          max_parcelas?: number
          nome: string
          permite_parcelamento?: boolean
          prazo_recebimento_dias?: number
          taxa_percentual?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: number
          id_empresa?: number
          max_parcelas?: number
          nome?: string
          permite_parcelamento?: boolean
          prazo_recebimento_dias?: number
          taxa_percentual?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formas_pagamento_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          contato_responsavel: string | null
          created_at: string
          documento: string | null
          email: string | null
          endereco: string | null
          id: number
          id_empresa: number
          nome: string
          nome_fantasia: string | null
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          contato_responsavel?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: number
          id_empresa: number
          nome: string
          nome_fantasia?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          contato_responsavel?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: number
          id_empresa?: number
          nome?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          atende_clientes: boolean
          ativo: boolean
          cargo: string | null
          cor_agenda: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_desligamento: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: number
          id_empresa: number
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
          usuario_empresa_id: number | null
        }
        Insert: {
          atende_clientes?: boolean
          ativo?: boolean
          cargo?: string | null
          cor_agenda?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_desligamento?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: number
          id_empresa: number
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          usuario_empresa_id?: number | null
        }
        Update: {
          atende_clientes?: boolean
          ativo?: boolean
          cargo?: string | null
          cor_agenda?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_desligamento?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: number
          id_empresa?: number
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          usuario_empresa_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_usuario_empresa_fkey"
            columns: ["id_empresa", "usuario_empresa_id"]
            isOneToOne: false
            referencedRelation: "usuarios_empresas"
            referencedColumns: ["empresa_id", "id"]
          },
        ]
      }
      funcionarios_ausencias: {
        Row: {
          created_at: string
          criado_por: string | null
          dia_inteiro: boolean
          fim: string
          id: number
          id_empresa: number
          id_funcionario: number
          inicio: string
          motivo: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          dia_inteiro?: boolean
          fim: string
          id?: number
          id_empresa: number
          id_funcionario: number
          inicio: string
          motivo?: string | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          dia_inteiro?: boolean
          fim?: string
          id?: number
          id_empresa?: number
          id_funcionario?: number
          inicio?: string
          motivo?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_ausencias_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_ausencias_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_ausencias_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios_horarios: {
        Row: {
          ativo: boolean
          created_at: string
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: number
          id_empresa: number
          id_funcionario: number
          intervalo_fim: string | null
          intervalo_inicio: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: number
          id_empresa: number
          id_funcionario: number
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: number
          id_empresa?: number
          id_funcionario?: number
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_horarios_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_horarios_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_horarios_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios_remuneracoes: {
        Row: {
          created_at: string
          id: number
          id_empresa: number
          id_funcionario: number
          observacoes: string | null
          tipo: string
          updated_at: string
          valor: number
          vigente_ate: string | null
          vigente_desde: string
        }
        Insert: {
          created_at?: string
          id?: number
          id_empresa: number
          id_funcionario: number
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          valor: number
          vigente_ate?: string | null
          vigente_desde?: string
        }
        Update: {
          created_at?: string
          id?: number
          id_empresa?: number
          id_funcionario?: number
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
          vigente_ate?: string | null
          vigente_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_remuneracoes_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_remuneracoes_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_remuneracoes_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios_servicos: {
        Row: {
          ativo: boolean
          created_at: string
          duracao_personalizada: number | null
          id: number
          id_empresa: number
          id_funcionario: number
          id_servico: number
          updated_at: string
          valor_personalizado: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          duracao_personalizada?: number | null
          id?: number
          id_empresa: number
          id_funcionario: number
          id_servico: number
          updated_at?: string
          valor_personalizado?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          duracao_personalizada?: number | null
          id?: number
          id_empresa?: number
          id_funcionario?: number
          id_servico?: number
          updated_at?: string
          valor_personalizado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_servicos_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_servicos_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_servicos_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_servicos_servico_empresa_fkey"
            columns: ["id_empresa", "id_servico"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      games: {
        Row: {
          ano_lancamento: number
          codigo: string
          created_at: string
          descricao: string | null
          em_estoque: boolean
          genero: string
          id: number
          multiplayer: boolean
          nome: string
          nota: number
          plataforma: string
          preco: number
          quantidade: number
          updated_at: string
        }
        Insert: {
          ano_lancamento?: number
          codigo?: string
          created_at?: string
          descricao?: string | null
          em_estoque?: boolean
          genero?: string
          id?: number
          multiplayer?: boolean
          nome: string
          nota?: number
          plataforma?: string
          preco?: number
          quantidade?: number
          updated_at?: string
        }
        Update: {
          ano_lancamento?: number
          codigo?: string
          created_at?: string
          descricao?: string | null
          em_estoque?: boolean
          genero?: string
          id?: number
          multiplayer?: boolean
          nome?: string
          nota?: number
          plataforma?: string
          preco?: number
          quantidade?: number
          updated_at?: string
        }
        Relationships: []
      }
      historico_agendamentos: {
        Row: {
          acao: string
          alterado_por: string | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: number
          id_agendamento: number
          id_empresa: number
          id_unidade: number
          motivo: string | null
          origem: string
          status_anterior: string | null
          status_novo: string | null
        }
        Insert: {
          acao: string
          alterado_por?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: number
          id_agendamento: number
          id_empresa: number
          id_unidade: number
          motivo?: string | null
          origem?: string
          status_anterior?: string | null
          status_novo?: string | null
        }
        Update: {
          acao?: string
          alterado_por?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: number
          id_agendamento?: number
          id_empresa?: number
          id_unidade?: number
          motivo?: string | null
          origem?: string
          status_anterior?: string | null
          status_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_agendamentos_agendamento_fkey"
            columns: ["id_empresa", "id_agendamento"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "historico_agendamentos_unidade_fkey"
            columns: ["id_empresa", "id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      horarios_funcionamento: {
        Row: {
          ativo: boolean
          created_at: string
          dia_semana: number
          hora_abertura: string
          hora_fechamento: string
          id: number
          id_empresa: number
          id_unidade: number
          intervalo_fim: string | null
          intervalo_inicio: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dia_semana: number
          hora_abertura: string
          hora_fechamento: string
          id?: number
          id_empresa: number
          id_unidade: number
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dia_semana?: number
          hora_abertura?: string
          hora_fechamento?: string
          id?: number
          id_empresa?: number
          id_unidade?: number
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_funcionamento_unidade_fkey"
            columns: ["id_empresa", "id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      horarios_funcionarios: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: string | null
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: number
          id_empresa: number
          id_funcionario: number
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: number
          id_empresa: number
          id_funcionario: number
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: number
          id_empresa?: number
          id_funcionario?: number
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_funcionarios_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_funcionarios_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "horarios_funcionarios_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      integracoes: {
        Row: {
          configuracoes: Json
          created_at: string
          credencial_referencia: string | null
          id: number
          id_empresa: number
          identificador_externo: string | null
          provedor: string
          status: string
          tipo: string
          ultimo_erro: string | null
          ultimo_sucesso_em: string | null
          updated_at: string
        }
        Insert: {
          configuracoes?: Json
          created_at?: string
          credencial_referencia?: string | null
          id?: number
          id_empresa: number
          identificador_externo?: string | null
          provedor: string
          status?: string
          tipo: string
          ultimo_erro?: string | null
          ultimo_sucesso_em?: string | null
          updated_at?: string
        }
        Update: {
          configuracoes?: Json
          created_at?: string
          credencial_referencia?: string | null
          id?: number
          id_empresa?: number
          identificador_externo?: string | null
          provedor?: string
          status?: string
          tipo?: string
          ultimo_erro?: string | null
          ultimo_sucesso_em?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integracoes_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_comissao: {
        Row: {
          base_calculo: number
          base_original: number
          competencia: string
          created_at: string
          custo_insumos_rateado: number
          desconto_rateado: number
          descricao_snapshot: string
          estornada_em: string | null
          id: number
          id_comanda: number | null
          id_comanda_item: number | null
          id_empresa: number
          id_funcionario: number
          id_regra: number | null
          liberada_em: string | null
          momento_liberacao: string
          motivo_estorno: string | null
          percentual_snapshot: number | null
          status: string
          taxa_pagamento_rateada: number
          tipo_calculo: string
          tipo_item: string | null
          tipo_origem: string
          updated_at: string
          valor_comissao: number
          valor_fixo_snapshot: number | null
          valor_pago: number
        }
        Insert: {
          base_calculo: number
          base_original: number
          competencia?: string
          created_at?: string
          custo_insumos_rateado?: number
          desconto_rateado?: number
          descricao_snapshot: string
          estornada_em?: string | null
          id?: number
          id_comanda?: number | null
          id_comanda_item?: number | null
          id_empresa: number
          id_funcionario: number
          id_regra?: number | null
          liberada_em?: string | null
          momento_liberacao?: string
          motivo_estorno?: string | null
          percentual_snapshot?: number | null
          status?: string
          taxa_pagamento_rateada?: number
          tipo_calculo: string
          tipo_item?: string | null
          tipo_origem: string
          updated_at?: string
          valor_comissao: number
          valor_fixo_snapshot?: number | null
          valor_pago?: number
        }
        Update: {
          base_calculo?: number
          base_original?: number
          competencia?: string
          created_at?: string
          custo_insumos_rateado?: number
          desconto_rateado?: number
          descricao_snapshot?: string
          estornada_em?: string | null
          id?: number
          id_comanda?: number | null
          id_comanda_item?: number | null
          id_empresa?: number
          id_funcionario?: number
          id_regra?: number | null
          liberada_em?: string | null
          momento_liberacao?: string
          motivo_estorno?: string | null
          percentual_snapshot?: number | null
          status?: string
          taxa_pagamento_rateada?: number
          tipo_calculo?: string
          tipo_item?: string | null
          tipo_origem?: string
          updated_at?: string
          valor_comissao?: number
          valor_fixo_snapshot?: number | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_comissao_comanda_empresa_fkey"
            columns: ["id_empresa", "id_comanda"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "lancamentos_comissao_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_comissao_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "lancamentos_comissao_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "lancamentos_comissao_item_empresa_fkey"
            columns: ["id_empresa", "id_comanda_item"]
            isOneToOne: false
            referencedRelation: "comandas_itens"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "lancamentos_comissao_regra_empresa_fkey"
            columns: ["id_empresa", "id_regra"]
            isOneToOne: false
            referencedRelation: "comissoes_regras"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      movimentos_caixa: {
        Row: {
          created_at: string
          criado_por: string | null
          descricao: string
          estornado_em: string | null
          estornado_por: string | null
          id: number
          id_caixa: number
          id_empresa: number
          id_forma_pagamento: number | null
          id_pagamento: number | null
          id_sessao_caixa: number
          motivo_estorno: string | null
          ocorrido_em: string
          origem: string
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          descricao: string
          estornado_em?: string | null
          estornado_por?: string | null
          id?: number
          id_caixa: number
          id_empresa: number
          id_forma_pagamento?: number | null
          id_pagamento?: number | null
          id_sessao_caixa: number
          motivo_estorno?: string | null
          ocorrido_em?: string
          origem?: string
          status?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          descricao?: string
          estornado_em?: string | null
          estornado_por?: string | null
          id?: number
          id_caixa?: number
          id_empresa?: number
          id_forma_pagamento?: number | null
          id_pagamento?: number | null
          id_sessao_caixa?: number
          motivo_estorno?: string | null
          ocorrido_em?: string
          origem?: string
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_caixa_forma_empresa_fkey"
            columns: ["id_empresa", "id_forma_pagamento"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "movimentos_caixa_pagamento_empresa_fkey"
            columns: ["id_empresa", "id_pagamento"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "movimentos_caixa_sessao_empresa_fkey"
            columns: ["id_empresa", "id_caixa", "id_sessao_caixa"]
            isOneToOne: false
            referencedRelation: "sessoes_caixa"
            referencedColumns: ["id_empresa", "id_caixa", "id"]
          },
        ]
      }
      movimentos_estoque: {
        Row: {
          created_at: string
          criado_por: string | null
          descricao: string | null
          estoque_antes: number
          estoque_depois: number
          estornado_em: string | null
          estornado_por: string | null
          id: number
          id_comanda_item: number | null
          id_compra_item: number | null
          id_consumo_insumo: number | null
          id_empresa: number
          id_produto: number
          motivo_estorno: string | null
          movimentado_em: string
          origem: string
          quantidade: number
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          estoque_antes: number
          estoque_depois: number
          estornado_em?: string | null
          estornado_por?: string | null
          id?: number
          id_comanda_item?: number | null
          id_compra_item?: number | null
          id_consumo_insumo?: number | null
          id_empresa: number
          id_produto: number
          motivo_estorno?: string | null
          movimentado_em?: string
          origem?: string
          quantidade: number
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          estoque_antes?: number
          estoque_depois?: number
          estornado_em?: string | null
          estornado_por?: string | null
          id?: number
          id_comanda_item?: number | null
          id_compra_item?: number | null
          id_consumo_insumo?: number | null
          id_empresa?: number
          id_produto?: number
          motivo_estorno?: string | null
          movimentado_em?: string
          origem?: string
          quantidade?: number
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_estoque_comanda_item_empresa_fkey"
            columns: ["id_empresa", "id_comanda_item"]
            isOneToOne: false
            referencedRelation: "comandas_itens"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "movimentos_estoque_compra_item_empresa_fkey"
            columns: ["id_empresa", "id_compra_item"]
            isOneToOne: false
            referencedRelation: "compras_itens"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "movimentos_estoque_consumo_insumo_fkey"
            columns: ["id_consumo_insumo"]
            isOneToOne: false
            referencedRelation: "consumos_insumos_comanda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_estoque_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_estoque_produto_empresa_fkey"
            columns: ["id_empresa", "id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          acrescimo: number
          aprovado_em: string | null
          cancelado_em: string | null
          convertido_em: string | null
          created_at: string
          criado_por: string | null
          desconto: number
          desconto_itens: number
          enviado_em: string | null
          id: number
          id_cliente: number
          id_empresa: number
          observacoes: string | null
          recusado_em: string | null
          status: string
          subtotal: number
          updated_at: string
          validade: string | null
          valor_total: number | null
        }
        Insert: {
          acrescimo?: number
          aprovado_em?: string | null
          cancelado_em?: string | null
          convertido_em?: string | null
          created_at?: string
          criado_por?: string | null
          desconto?: number
          desconto_itens?: number
          enviado_em?: string | null
          id?: number
          id_cliente: number
          id_empresa: number
          observacoes?: string | null
          recusado_em?: string | null
          status?: string
          subtotal?: number
          updated_at?: string
          validade?: string | null
          valor_total?: number | null
        }
        Update: {
          acrescimo?: number
          aprovado_em?: string | null
          cancelado_em?: string | null
          convertido_em?: string | null
          created_at?: string
          criado_por?: string | null
          desconto?: number
          desconto_itens?: number
          enviado_em?: string | null
          id?: number
          id_cliente?: number
          id_empresa?: number
          observacoes?: string | null
          recusado_em?: string | null
          status?: string
          subtotal?: number
          updated_at?: string
          validade?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_empresa_fkey"
            columns: ["id_empresa", "id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "orcamentos_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos_itens: {
        Row: {
          created_at: string
          desconto: number
          descricao_snapshot: string
          id: number
          id_empresa: number
          id_orcamento: number
          id_produto: number | null
          id_servico: number | null
          observacoes: string | null
          ordem: number
          quantidade: number
          tipo_item: string
          updated_at: string
          valor_total: number | null
          valor_unitario_snapshot: number
        }
        Insert: {
          created_at?: string
          desconto?: number
          descricao_snapshot: string
          id?: number
          id_empresa: number
          id_orcamento: number
          id_produto?: number | null
          id_servico?: number | null
          observacoes?: string | null
          ordem?: number
          quantidade?: number
          tipo_item: string
          updated_at?: string
          valor_total?: number | null
          valor_unitario_snapshot: number
        }
        Update: {
          created_at?: string
          desconto?: number
          descricao_snapshot?: string
          id?: number
          id_empresa?: number
          id_orcamento?: number
          id_produto?: number | null
          id_servico?: number | null
          observacoes?: string | null
          ordem?: number
          quantidade?: number
          tipo_item?: string
          updated_at?: string
          valor_total?: number | null
          valor_unitario_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_itens_orcamento_empresa_fkey"
            columns: ["id_empresa", "id_orcamento"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "orcamentos_itens_produto_empresa_fkey"
            columns: ["id_empresa", "id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "orcamentos_itens_servico_empresa_fkey"
            columns: ["id_empresa", "id_servico"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          chave_idempotencia: string | null
          created_at: string
          criado_por: string | null
          data_pagamento: string
          estornado_em: string | null
          estornado_por: string | null
          expira_em: string | null
          id: number
          id_agendamento: number | null
          id_empresa: number
          id_forma_pagamento: number
          id_sessao_caixa: number | null
          identificador_externo: string | null
          motivo_estorno: string | null
          observacoes: string | null
          provedor: string | null
          provedor_atualizado_em: string | null
          provedor_status: string | null
          provedor_status_detalhe: string | null
          referencia: string | null
          saldo_a_alocar: number | null
          status: string
          tipo: string
          updated_at: string
          valor: number
          valor_alocado: number
        }
        Insert: {
          chave_idempotencia?: string | null
          created_at?: string
          criado_por?: string | null
          data_pagamento?: string
          estornado_em?: string | null
          estornado_por?: string | null
          expira_em?: string | null
          id?: number
          id_agendamento?: number | null
          id_empresa: number
          id_forma_pagamento: number
          id_sessao_caixa?: number | null
          identificador_externo?: string | null
          motivo_estorno?: string | null
          observacoes?: string | null
          provedor?: string | null
          provedor_atualizado_em?: string | null
          provedor_status?: string | null
          provedor_status_detalhe?: string | null
          referencia?: string | null
          saldo_a_alocar?: number | null
          status?: string
          tipo: string
          updated_at?: string
          valor: number
          valor_alocado?: number
        }
        Update: {
          chave_idempotencia?: string | null
          created_at?: string
          criado_por?: string | null
          data_pagamento?: string
          estornado_em?: string | null
          estornado_por?: string | null
          expira_em?: string | null
          id?: number
          id_agendamento?: number | null
          id_empresa?: number
          id_forma_pagamento?: number
          id_sessao_caixa?: number | null
          identificador_externo?: string | null
          motivo_estorno?: string | null
          observacoes?: string | null
          provedor?: string | null
          provedor_atualizado_em?: string | null
          provedor_status?: string | null
          provedor_status_detalhe?: string | null
          referencia?: string | null
          saldo_a_alocar?: number | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
          valor_alocado?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_agendamento_fkey"
            columns: ["id_empresa", "id_agendamento"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "pagamentos_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_forma_empresa_fkey"
            columns: ["id_empresa", "id_forma_pagamento"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "pagamentos_sessao_empresa_fkey"
            columns: ["id_empresa", "id_sessao_caixa"]
            isOneToOne: false
            referencedRelation: "sessoes_caixa"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      pagamentos_alocacoes: {
        Row: {
          created_at: string
          id: number
          id_empresa: number
          id_pagamento: number
          id_parcela: number
          valor: number
        }
        Insert: {
          created_at?: string
          id?: number
          id_empresa: number
          id_pagamento: number
          id_parcela: number
          valor: number
        }
        Update: {
          created_at?: string
          id?: number
          id_empresa?: number
          id_pagamento?: number
          id_parcela?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_alocacoes_pagamento_empresa_fkey"
            columns: ["id_empresa", "id_pagamento"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "pagamentos_alocacoes_parcela_empresa_fkey"
            columns: ["id_empresa", "id_parcela"]
            isOneToOne: false
            referencedRelation: "contas_parcelas"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      pagamentos_comissao: {
        Row: {
          cancelado_em: string | null
          confirmado_por: string | null
          created_at: string
          criado_por: string | null
          id: number
          id_empresa: number
          id_forma_pagamento: number | null
          id_funcionario: number
          id_pagamento: number | null
          id_sessao_caixa: number | null
          motivo_cancelamento: string | null
          observacoes: string | null
          pago_em: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          cancelado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          criado_por?: string | null
          id?: number
          id_empresa: number
          id_forma_pagamento?: number | null
          id_funcionario: number
          id_pagamento?: number | null
          id_sessao_caixa?: number | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          pago_em?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          cancelado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          criado_por?: string | null
          id?: number
          id_empresa?: number
          id_forma_pagamento?: number | null
          id_funcionario?: number
          id_pagamento?: number | null
          id_sessao_caixa?: number | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          pago_em?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_comissao_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_comissao_forma_empresa_fkey"
            columns: ["id_empresa", "id_forma_pagamento"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "pagamentos_comissao_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "pagamentos_comissao_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "pagamentos_comissao_pagamento_empresa_fkey"
            columns: ["id_empresa", "id_pagamento"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "pagamentos_comissao_sessao_empresa_fkey"
            columns: ["id_empresa", "id_sessao_caixa"]
            isOneToOne: false
            referencedRelation: "sessoes_caixa"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      pagamentos_comissao_itens: {
        Row: {
          created_at: string
          id: number
          id_empresa: number
          id_lancamento_comissao: number
          id_pagamento_comissao: number
          valor: number
        }
        Insert: {
          created_at?: string
          id?: number
          id_empresa: number
          id_lancamento_comissao: number
          id_pagamento_comissao: number
          valor: number
        }
        Update: {
          created_at?: string
          id?: number
          id_empresa?: number
          id_lancamento_comissao?: number
          id_pagamento_comissao?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_comissao_itens_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_comissao_itens_lancamento_empresa_fkey"
            columns: ["id_empresa", "id_lancamento_comissao"]
            isOneToOne: false
            referencedRelation: "lancamentos_comissao"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "pagamentos_comissao_itens_pagamento_empresa_fkey"
            columns: ["id_empresa", "id_pagamento_comissao"]
            isOneToOne: false
            referencedRelation: "pagamentos_comissao"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      permissoes_planos: {
        Row: {
          ativo: boolean
          created_at: string
          funcionalidade: string
          id: number
          ilimitado: boolean
          limite: number | null
          plano_id: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          funcionalidade: string
          id?: number
          ilimitado?: boolean
          limite?: number | null
          plano_id: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          funcionalidade?: string
          id?: number
          ilimitado?: boolean
          limite?: number | null
          plano_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_planos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes_usuarios: {
        Row: {
          atualizado_por: string | null
          created_at: string
          id: number
          id_empresa: number
          modulo: string
          permitido: boolean
          updated_at: string
          usuario_empresa_id: number
        }
        Insert: {
          atualizado_por?: string | null
          created_at?: string
          id?: number
          id_empresa: number
          modulo: string
          permitido?: boolean
          updated_at?: string
          usuario_empresa_id: number
        }
        Update: {
          atualizado_por?: string | null
          created_at?: string
          id?: number
          id_empresa?: number
          modulo?: string
          permitido?: boolean
          updated_at?: string
          usuario_empresa_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_usuarios_vinculo_fkey"
            columns: ["id_empresa", "usuario_empresa_id"]
            isOneToOne: false
            referencedRelation: "usuarios_empresas"
            referencedColumns: ["empresa_id", "id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          id: number
          nome: string
          publico: boolean
          valor_anual: number
          valor_mensal: number
          versao: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: number
          nome: string
          publico?: boolean
          valor_anual?: number
          valor_mensal?: number
          versao?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: number
          nome?: string
          publico?: boolean
          valor_anual?: number
          valor_mensal?: number
          versao?: number
        }
        Relationships: []
      }
      politicas_cancelamento: {
        Row: {
          antecedencia_agendamento_minutos: number
          antecedencia_cancelamento_minutos: number
          antecedencia_reagendamento_minutos: number
          ativo: boolean
          created_at: string
          id: number
          id_empresa: number
          id_unidade: number | null
          janela_agendamento_dias: number
          multa_cancelamento_percentual: number
          reter_sinal_fora_prazo: boolean
          texto_publico: string | null
          tolerancia_atraso_minutos: number
          updated_at: string
          vigente_ate: string | null
          vigente_desde: string
        }
        Insert: {
          antecedencia_agendamento_minutos?: number
          antecedencia_cancelamento_minutos?: number
          antecedencia_reagendamento_minutos?: number
          ativo?: boolean
          created_at?: string
          id?: number
          id_empresa: number
          id_unidade?: number | null
          janela_agendamento_dias?: number
          multa_cancelamento_percentual?: number
          reter_sinal_fora_prazo?: boolean
          texto_publico?: string | null
          tolerancia_atraso_minutos?: number
          updated_at?: string
          vigente_ate?: string | null
          vigente_desde?: string
        }
        Update: {
          antecedencia_agendamento_minutos?: number
          antecedencia_cancelamento_minutos?: number
          antecedencia_reagendamento_minutos?: number
          ativo?: boolean
          created_at?: string
          id?: number
          id_empresa?: number
          id_unidade?: number | null
          janela_agendamento_dias?: number
          multa_cancelamento_percentual?: number
          reter_sinal_fora_prazo?: boolean
          texto_publico?: string | null
          tolerancia_atraso_minutos?: number
          updated_at?: string
          vigente_ate?: string | null
          vigente_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "politicas_cancelamento_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politicas_cancelamento_unidade_fkey"
            columns: ["id_empresa", "id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      preferencias_lembrete: {
        Row: {
          antecedencias_minutos: number[]
          ativo: boolean
          created_at: string
          email: boolean
          id: number
          id_cliente: number
          id_empresa: number
          origem: string
          push: boolean
          sms: boolean
          updated_at: string
          whatsapp: boolean
        }
        Insert: {
          antecedencias_minutos?: number[]
          ativo?: boolean
          created_at?: string
          email?: boolean
          id?: number
          id_cliente: number
          id_empresa: number
          origem?: string
          push?: boolean
          sms?: boolean
          updated_at?: string
          whatsapp?: boolean
        }
        Update: {
          antecedencias_minutos?: number[]
          ativo?: boolean
          created_at?: string
          email?: boolean
          id?: number
          id_cliente?: number
          id_empresa?: number
          origem?: string
          push?: boolean
          sms?: boolean
          updated_at?: string
          whatsapp?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "preferencias_lembrete_cliente_fkey"
            columns: ["id_empresa", "id_cliente"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          codigo: string | null
          controla_estoque: boolean
          created_at: string
          custo_medio: number | null
          descricao: string | null
          estoque_atual: number
          estoque_minimo: number
          finalidade: string
          id: number
          id_empresa: number
          nome: string
          preco_venda: number | null
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          controla_estoque?: boolean
          created_at?: string
          custo_medio?: number | null
          descricao?: string | null
          estoque_atual?: number
          estoque_minimo?: number
          finalidade?: string
          id?: number
          id_empresa: number
          nome: string
          preco_venda?: number | null
          unidade_medida?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          controla_estoque?: boolean
          created_at?: string
          custo_medio?: number | null
          descricao?: string | null
          estoque_atual?: number
          estoque_minimo?: number
          finalidade?: string
          id?: number
          id_empresa?: number
          nome?: string
          preco_venda?: number | null
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_fornecedores: {
        Row: {
          codigo_produto_fornecedor: string | null
          created_at: string
          fornecedor_principal: boolean
          id: number
          id_empresa: number
          id_fornecedor: number
          id_produto: number
          prazo_entrega_dias: number | null
          ultimo_custo: number | null
          updated_at: string
        }
        Insert: {
          codigo_produto_fornecedor?: string | null
          created_at?: string
          fornecedor_principal?: boolean
          id?: number
          id_empresa: number
          id_fornecedor: number
          id_produto: number
          prazo_entrega_dias?: number | null
          ultimo_custo?: number | null
          updated_at?: string
        }
        Update: {
          codigo_produto_fornecedor?: string | null
          created_at?: string
          fornecedor_principal?: boolean
          id?: number
          id_empresa?: number
          id_fornecedor?: number
          id_produto?: number
          prazo_entrega_dias?: number | null
          ultimo_custo?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_fornecedores_fornecedor_empresa_fkey"
            columns: ["id_empresa", "id_fornecedor"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "produtos_fornecedores_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_fornecedores_produto_empresa_fkey"
            columns: ["id_empresa", "id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          duracao_minutos: number
          exige_sinal: boolean
          id: number
          id_empresa: number
          intervalo_minutos: number
          nome: string
          permite_agendamento_online: boolean
          preco: number
          sinal_tipo: string | null
          sinal_valor: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number
          exige_sinal?: boolean
          id?: number
          id_empresa: number
          intervalo_minutos?: number
          nome: string
          permite_agendamento_online?: boolean
          preco?: number
          sinal_tipo?: string | null
          sinal_valor?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number
          exige_sinal?: boolean
          id?: number
          id_empresa?: number
          intervalo_minutos?: number
          nome?: string
          permite_agendamento_online?: boolean
          preco?: number
          sinal_tipo?: string | null
          sinal_valor?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_insumos: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: string | null
          descontar_comissao: boolean
          id: number
          id_empresa: number
          id_produto: number
          id_servico: number
          quantidade_padrao: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          descontar_comissao?: boolean
          id?: number
          id_empresa: number
          id_produto: number
          id_servico: number
          quantidade_padrao: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          descontar_comissao?: boolean
          id?: number
          id_empresa?: number
          id_produto?: number
          id_servico?: number
          quantidade_padrao?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_insumos_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_insumos_produto_fkey"
            columns: ["id_empresa", "id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "servicos_insumos_servico_fkey"
            columns: ["id_empresa", "id_servico"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      sessoes_caixa: {
        Row: {
          aberta_em: string
          aberta_por: string | null
          cancelada_em: string | null
          cancelada_por: string | null
          created_at: string
          diferenca: number | null
          fechada_em: string | null
          fechada_por: string | null
          id: number
          id_caixa: number
          id_empresa: number
          motivo_cancelamento: string | null
          observacoes_abertura: string | null
          observacoes_fechamento: string | null
          saldo_esperado: number | null
          saldo_final_informado: number | null
          saldo_inicial: number
          status: string
          total_entradas: number
          total_saidas: number
          total_sangrias: number
          total_suprimentos: number
          updated_at: string
        }
        Insert: {
          aberta_em?: string
          aberta_por?: string | null
          cancelada_em?: string | null
          cancelada_por?: string | null
          created_at?: string
          diferenca?: number | null
          fechada_em?: string | null
          fechada_por?: string | null
          id?: number
          id_caixa: number
          id_empresa: number
          motivo_cancelamento?: string | null
          observacoes_abertura?: string | null
          observacoes_fechamento?: string | null
          saldo_esperado?: number | null
          saldo_final_informado?: number | null
          saldo_inicial?: number
          status?: string
          total_entradas?: number
          total_saidas?: number
          total_sangrias?: number
          total_suprimentos?: number
          updated_at?: string
        }
        Update: {
          aberta_em?: string
          aberta_por?: string | null
          cancelada_em?: string | null
          cancelada_por?: string | null
          created_at?: string
          diferenca?: number | null
          fechada_em?: string | null
          fechada_por?: string | null
          id?: number
          id_caixa?: number
          id_empresa?: number
          motivo_cancelamento?: string | null
          observacoes_abertura?: string | null
          observacoes_fechamento?: string | null
          saldo_esperado?: number | null
          saldo_final_informado?: number | null
          saldo_inicial?: number
          status?: string
          total_entradas?: number
          total_saidas?: number
          total_sangrias?: number
          total_suprimentos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_caixa_caixa_empresa_fkey"
            columns: ["id_empresa", "id_caixa"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      sites_publicos: {
        Row: {
          atualizado_por: string | null
          created_at: string
          descricao_hero: string | null
          descricao_seo: string | null
          descricao_sobre: string | null
          destaque_hero: string | null
          diferenciais: Json
          email_publico: string | null
          id: number
          id_empresa: number
          id_unidade_principal: number | null
          imagem_compartilhamento_url: string | null
          imagem_hero_url: string | null
          instagram_url: string | null
          mostrar_avaliacoes: boolean
          mostrar_endereco: boolean
          mostrar_horarios: boolean
          mostrar_precos: boolean
          mostrar_profissionais: boolean
          nome_publico: string | null
          palavras_chave: string[]
          perguntas_frequentes: Json
          publicado: boolean
          slug: string
          texto_rodape: string | null
          titulo_hero: string | null
          titulo_seo: string | null
          titulo_sobre: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          atualizado_por?: string | null
          created_at?: string
          descricao_hero?: string | null
          descricao_seo?: string | null
          descricao_sobre?: string | null
          destaque_hero?: string | null
          diferenciais?: Json
          email_publico?: string | null
          id?: number
          id_empresa: number
          id_unidade_principal?: number | null
          imagem_compartilhamento_url?: string | null
          imagem_hero_url?: string | null
          instagram_url?: string | null
          mostrar_avaliacoes?: boolean
          mostrar_endereco?: boolean
          mostrar_horarios?: boolean
          mostrar_precos?: boolean
          mostrar_profissionais?: boolean
          nome_publico?: string | null
          palavras_chave?: string[]
          perguntas_frequentes?: Json
          publicado?: boolean
          slug: string
          texto_rodape?: string | null
          titulo_hero?: string | null
          titulo_seo?: string | null
          titulo_sobre?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          atualizado_por?: string | null
          created_at?: string
          descricao_hero?: string | null
          descricao_seo?: string | null
          descricao_sobre?: string | null
          destaque_hero?: string | null
          diferenciais?: Json
          email_publico?: string | null
          id?: number
          id_empresa?: number
          id_unidade_principal?: number | null
          imagem_compartilhamento_url?: string | null
          imagem_hero_url?: string | null
          instagram_url?: string | null
          mostrar_avaliacoes?: boolean
          mostrar_endereco?: boolean
          mostrar_horarios?: boolean
          mostrar_precos?: boolean
          mostrar_profissionais?: boolean
          nome_publico?: string | null
          palavras_chave?: string[]
          perguntas_frequentes?: Json
          publicado?: boolean
          slug?: string
          texto_rodape?: string | null
          titulo_hero?: string | null
          titulo_seo?: string | null
          titulo_sobre?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_publicos_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_publicos_unidade_fkey"
            columns: ["id_empresa", "id_unidade_principal"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      sites_publicos_dominios: {
        Row: {
          created_at: string
          dominio: string
          id: number
          id_empresa: number
          id_site: number
          principal: boolean
        }
        Insert: {
          created_at?: string
          dominio: string
          id?: number
          id_empresa: number
          id_site: number
          principal?: boolean
        }
        Update: {
          created_at?: string
          dominio?: string
          id?: number
          id_empresa?: number
          id_site?: number
          principal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sites_publicos_dominios_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_publicos_dominios_id_site_fkey"
            columns: ["id_site"]
            isOneToOne: false
            referencedRelation: "sites_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_estorno_agendamento: {
        Row: {
          chave_idempotencia: string
          created_at: string
          id: number
          id_agendamento: number
          id_empresa: number
          id_pagamento: number
          motivo: string
          processado_em: string | null
          provedor_status: string | null
          provedor_status_detalhe: string | null
          proxima_tentativa_em: string
          status: string
          tentativas: number
          ultimo_erro: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          chave_idempotencia?: string
          created_at?: string
          id?: number
          id_agendamento: number
          id_empresa: number
          id_pagamento: number
          motivo: string
          processado_em?: string | null
          provedor_status?: string | null
          provedor_status_detalhe?: string | null
          proxima_tentativa_em?: string
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          chave_idempotencia?: string
          created_at?: string
          id?: number
          id_agendamento?: number
          id_empresa?: number
          id_pagamento?: number
          motivo?: string
          processado_em?: string | null
          provedor_status?: string | null
          provedor_status_detalhe?: string | null
          proxima_tentativa_em?: string
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_estorno_agendamento_fkey"
            columns: ["id_empresa", "id_agendamento"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "solicitacoes_estorno_pagamento_fkey"
            columns: ["id_empresa", "id_pagamento"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      solicitacoes_privacidade: {
        Row: {
          created_at: string
          id: number
          id_cliente: number
          id_empresa: number
          motivo: string | null
          observacoes_internas: string | null
          processado_em: string | null
          processado_por: string | null
          solicitado_em: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          id_cliente: number
          id_empresa: number
          motivo?: string | null
          observacoes_internas?: string | null
          processado_em?: string | null
          processado_por?: string | null
          solicitado_em?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          id_cliente?: number
          id_empresa?: number
          motivo?: string | null
          observacoes_internas?: string | null
          processado_em?: string | null
          processado_por?: string | null
          solicitado_em?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_privacidade_cliente_fkey"
            columns: ["id_empresa", "id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      templates_mensagens_empresa: {
        Row: {
          assunto: string | null
          ativo: boolean
          canal: string
          conteudo: string
          id: number
          id_empresa: number
          tipo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assunto?: string | null
          ativo?: boolean
          canal: string
          conteudo: string
          id?: number
          id_empresa: number
          tipo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assunto?: string | null
          ativo?: boolean
          canal?: string
          conteudo?: string
          id?: number
          id_empresa?: number
          tipo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_mensagens_empresa_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens_links_agendamento: {
        Row: {
          created_at: string
          expira_em: string
          finalidade: string
          id: number
          id_agendamento: number
          id_empresa: number
          max_usos: number
          revogado_em: string | null
          token_hash: string
          ultimo_uso_em: string | null
          usos: number
        }
        Insert: {
          created_at?: string
          expira_em: string
          finalidade?: string
          id?: number
          id_agendamento: number
          id_empresa: number
          max_usos?: number
          revogado_em?: string | null
          token_hash: string
          ultimo_uso_em?: string | null
          usos?: number
        }
        Update: {
          created_at?: string
          expira_em?: string
          finalidade?: string
          id?: number
          id_agendamento?: number
          id_empresa?: number
          max_usos?: number
          revogado_em?: string | null
          token_hash?: string
          ultimo_uso_em?: string | null
          usos?: number
        }
        Relationships: [
          {
            foreignKeyName: "tokens_links_agendamento_agendamento_fkey"
            columns: ["id_empresa", "id_agendamento"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
      unidades: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          codigo: string
          complemento: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          fuso_horario: string
          id: number
          id_empresa: number
          nome: string
          numero: string | null
          principal: boolean
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          codigo: string
          complemento?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          fuso_horario?: string
          id?: number
          id_empresa: number
          nome: string
          numero?: string | null
          principal?: boolean
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          codigo?: string
          complemento?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          fuso_horario?: string
          id?: number
          id_empresa?: number
          nome?: string
          numero?: string | null
          principal?: boolean
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_empresas: {
        Row: {
          created_at: string
          empresa_id: number
          id: number
          status: Database["public"]["Enums"]["status_usuario_empresa"]
          tipo: Database["public"]["Enums"]["tipos_usuarios"]
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: number
          id?: number
          status?: Database["public"]["Enums"]["status_usuario_empresa"]
          tipo: Database["public"]["Enums"]["tipos_usuarios"]
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: number
          id?: number
          status?: Database["public"]["Enums"]["status_usuario_empresa"]
          tipo?: Database["public"]["Enums"]["tipos_usuarios"]
          user_id?: string
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
      notificacoes: {
        Row: {
          agendada_para: string | null
          canal: string | null
          cancelada_em: string | null
          conteudo: string | null
          created_at: string | null
          dados_template: Json | null
          destinatario: string | null
          entregue_em: string | null
          enviada_em: string | null
          id: number | null
          id_cliente: number | null
          id_empresa: number | null
          id_evento: number | null
          identificador_externo: string | null
          lida_em: string | null
          prioridade: number | null
          status: string | null
          tentativas: number | null
          titulo: string | null
          ultimo_erro: string | null
          updated_at: string | null
        }
        Insert: {
          agendada_para?: string | null
          canal?: string | null
          cancelada_em?: string | null
          conteudo?: string | null
          created_at?: string | null
          dados_template?: Json | null
          destinatario?: string | null
          entregue_em?: string | null
          enviada_em?: string | null
          id?: number | null
          id_cliente?: number | null
          id_empresa?: number | null
          id_evento?: number | null
          identificador_externo?: string | null
          lida_em?: string | null
          prioridade?: number | null
          status?: string | null
          tentativas?: number | null
          titulo?: string | null
          ultimo_erro?: string | null
          updated_at?: string | null
        }
        Update: {
          agendada_para?: string | null
          canal?: string | null
          cancelada_em?: string | null
          conteudo?: string | null
          created_at?: string | null
          dados_template?: Json | null
          destinatario?: string | null
          entregue_em?: string | null
          enviada_em?: string | null
          id?: number | null
          id_cliente?: number | null
          id_empresa?: number | null
          id_evento?: number | null
          identificador_externo?: string | null
          lida_em?: string | null
          prioridade?: number | null
          status?: string | null
          tentativas?: number | null
          titulo?: string | null
          ultimo_erro?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fila_mensagens_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_mensagens_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_mensagens_id_evento_fkey"
            columns: ["id_evento"]
            isOneToOne: false
            referencedRelation: "eventos_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          atende_clientes: boolean | null
          ativo: boolean | null
          cargo: string | null
          cor_agenda: string | null
          cpf: string | null
          created_at: string | null
          data_admissao: string | null
          data_desligamento: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: number | null
          id_empresa: number | null
          nome: string | null
          observacoes: string | null
          telefone: string | null
          updated_at: string | null
          usuario_empresa_id: number | null
        }
        Insert: {
          atende_clientes?: boolean | null
          ativo?: boolean | null
          cargo?: string | null
          cor_agenda?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: number | null
          id_empresa?: number | null
          nome?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario_empresa_id?: number | null
        }
        Update: {
          atende_clientes?: boolean | null
          ativo?: boolean | null
          cargo?: string | null
          cor_agenda?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: number | null
          id_empresa?: number | null
          nome?: string | null
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario_empresa_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_usuario_empresa_fkey"
            columns: ["id_empresa", "usuario_empresa_id"]
            isOneToOne: false
            referencedRelation: "usuarios_empresas"
            referencedColumns: ["empresa_id", "id"]
          },
        ]
      }
      profissionais_servicos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          duracao_personalizada: number | null
          id: number | null
          id_empresa: number | null
          id_funcionario: number | null
          id_servico: number | null
          updated_at: string | null
          valor_personalizado: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          duracao_personalizada?: number | null
          id?: number | null
          id_empresa?: number | null
          id_funcionario?: number | null
          id_servico?: number | null
          updated_at?: string | null
          valor_personalizado?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          duracao_personalizada?: number | null
          id?: number | null
          id_empresa?: number | null
          id_funcionario?: number | null
          id_servico?: number | null
          updated_at?: string | null
          valor_personalizado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_servicos_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_servicos_funcionario_empresa_fkey"
            columns: ["id_empresa", "id_funcionario"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id_empresa", "id"]
          },
          {
            foreignKeyName: "funcionarios_servicos_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_servicos_servico_empresa_fkey"
            columns: ["id_empresa", "id_servico"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id_empresa", "id"]
          },
        ]
      }
    }
    Functions: {
      abrir_sessao_caixa: {
        Args: {
          p_id_caixa: number
          p_id_empresa: number
          p_observacoes: string
          p_saldo_inicial: number
        }
        Returns: number
      }
      aceitar_convites_pendentes: { Args: never; Returns: number }
      alterar_agendamento_administracao: {
        Args: {
          p_id_agendamento: number
          p_id_empresa: number
          p_motivo?: string
          p_status: string
        }
        Returns: Json
      }
      alterar_agendamento_cliente_site: {
        Args: {
          p_acao: string
          p_id_agendamento: number
          p_id_empresa: number
          p_motivo?: string
        }
        Returns: Json
      }
      alterar_agendamento_site: {
        Args: { p_acao: string; p_motivo?: string; p_token: string }
        Returns: Json
      }
      alterar_status_orcamento: {
        Args: {
          p_id_empresa: number
          p_observacao?: string
          p_orcamento_id: number
          p_status: string
        }
        Returns: string
      }
      aplicar_order_mercado_pago: {
        Args: {
          p_order_id: string
          p_paid_amount: number
          p_paid_at: string
          p_status: string
          p_status_detail: string
          p_transaction_status: string
          p_transaction_status_detail: string
        }
        Returns: Json
      }
      aplicar_order_mercado_pago_v2: {
        Args: {
          p_external_reference: string
          p_order_id: string
          p_paid_amount: number
          p_paid_at: string
          p_status: string
          p_status_detail: string
          p_transaction_status: string
          p_transaction_status_detail: string
        }
        Returns: Json
      }
      atualizar_dados_cliente_site: {
        Args: {
          p_canal_preferido?: string
          p_data_nascimento?: string
          p_id_empresa: number
          p_nome: string
          p_telefone: string
        }
        Returns: Json
      }
      atualizar_email_agendamento_site: {
        Args: { p_email: string; p_token: string }
        Returns: Json
      }
      atualizar_empresa_administracao: {
        Args: {
          p_cnpj: string
          p_contato1: string
          p_contato2: string
          p_email: string
          p_fantasia: string
          p_fuso_horario: string
          p_id_empresa: number
          p_razao_social: string
        }
        Returns: {
          cnpj: string | null
          contato1: string | null
          contato2: string | null
          created_at: string
          criado_por: string | null
          email: string | null
          fantasia: string
          fuso_horario: string
          id: number
          razao_social: string | null
          status: Database["public"]["Enums"]["status_empresa"]
        }
        SetofOptions: {
          from: "*"
          to: "empresas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      atualizar_preferencias_cliente_site: {
        Args: { p_email: boolean; p_id_empresa: number; p_whatsapp: boolean }
        Returns: Json
      }
      atualizar_usuario_empresa_administracao: {
        Args: {
          p_id_empresa: number
          p_status: Database["public"]["Enums"]["status_usuario_empresa"]
          p_tipo: Database["public"]["Enums"]["tipos_usuarios"]
          p_usuario_empresa_id: number
        }
        Returns: undefined
      }
      atualizar_vencimentos_financeiros: {
        Args: { p_id_empresa: number }
        Returns: number
      }
      cancelar_comanda: {
        Args: { p_comanda_id: number; p_id_empresa: number; p_motivo: string }
        Returns: string
      }
      cancelar_conta_financeira: {
        Args: { p_conta_id: number; p_id_empresa: number; p_motivo: string }
        Returns: string
      }
      cancelar_convite_empresa: {
        Args: { p_convite_id: number; p_id_empresa: number }
        Returns: undefined
      }
      concluir_estorno_agendamento: {
        Args: {
          p_provedor_status: string
          p_provedor_status_detalhe: string
          p_solicitacao_id: number
        }
        Returns: undefined
      }
      consumir_token_link_agendamento: {
        Args: { p_token: string }
        Returns: Json
      }
      converter_orcamento_em_comanda: {
        Args: {
          p_funcionarios_servicos: Json
          p_id_empresa: number
          p_id_funcionario_responsavel: number
          p_observacoes?: string
          p_orcamento_id: number
        }
        Returns: number
      }
      criar_agendamento_site:
        | {
            Args: {
              p_chave_idempotencia?: string
              p_email: string
              p_id_empresa: number
              p_id_funcionario: number
              p_id_servico: number
              p_id_unidade: number
              p_inicio: string
              p_lembrete_email?: boolean
              p_lembrete_whatsapp?: boolean
              p_nome: string
              p_observacoes?: string
              p_telefone: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_chave_idempotencia?: string
              p_email: string
              p_id_empresa: number
              p_id_funcionario: number
              p_id_servico: number
              p_inicio: string
              p_lembrete_email?: boolean
              p_lembrete_whatsapp?: boolean
              p_nome: string
              p_observacoes?: string
              p_telefone: string
            }
            Returns: Json
          }
      criar_ajuste_comissao: {
        Args: {
          p_competencia: string
          p_descricao: string
          p_id_empresa: number
          p_id_funcionario: number
          p_valor: number
        }
        Returns: number
      }
      criar_convite_empresa: {
        Args: {
          p_email: string
          p_id_empresa: number
          p_tipo: Database["public"]["Enums"]["tipos_usuarios"]
        }
        Returns: Json
      }
      estornar_lancamento_comissao: {
        Args: {
          p_id_empresa: number
          p_lancamento_id: number
          p_motivo: string
        }
        Returns: string
      }
      estornar_movimento_caixa: {
        Args: { p_id_empresa: number; p_motivo: string; p_movimento_id: number }
        Returns: string
      }
      estornar_pagamento_comissao: {
        Args: {
          p_id_empresa: number
          p_motivo: string
          p_pagamento_comissao_id: number
        }
        Returns: string
      }
      estornar_pagamento_financeiro: {
        Args: { p_id_empresa: number; p_motivo: string; p_pagamento_id: number }
        Returns: string
      }
      expirar_pagamentos_mercado_pago: {
        Args: { p_id_empresa?: number }
        Returns: number
      }
      falhar_estorno_agendamento: {
        Args: { p_erro: string; p_solicitacao_id: number }
        Returns: undefined
      }
      fechar_comanda: {
        Args: {
          p_comanda_id: number
          p_data_vencimento?: string
          p_id_empresa: number
        }
        Returns: number
      }
      fechar_comanda_beauty: {
        Args: {
          p_comanda_id: number
          p_consumos?: Json
          p_data_pagamento?: string
          p_data_vencimento?: string
          p_id_empresa: number
          p_id_forma_pagamento?: number
          p_id_sessao_caixa?: number
          p_observacoes_pagamento?: string
          p_referencia?: string
          p_situacao_pagamento: string
          p_valor_pagamento?: number
        }
        Returns: Json
      }
      fechar_comanda_com_pagamento: {
        Args: {
          p_comanda_id: number
          p_data_pagamento?: string
          p_data_vencimento?: string
          p_id_empresa: number
          p_id_forma_pagamento?: number
          p_id_sessao_caixa?: number
          p_observacoes_pagamento?: string
          p_referencia?: string
          p_situacao_pagamento: string
          p_valor_pagamento?: number
        }
        Returns: Json
      }
      fechar_sessao_caixa: {
        Args: {
          p_id_empresa: number
          p_observacoes: string
          p_saldo_contado: number
          p_sessao_id: number
        }
        Returns: number
      }
      listar_auditoria_administracao: {
        Args: {
          p_acao?: string
          p_busca?: string
          p_fim?: string
          p_id_empresa: number
          p_inicio?: string
          p_pagina?: number
          p_por_pagina?: number
          p_tabela?: string
        }
        Returns: {
          acao: string
          campos_alterados: string[]
          created_at: string
          dados_anteriores: Json
          dados_novos: Json
          id: number
          origem: string
          papel_execucao: string
          registro_id: string
          tabela: string
          total_count: number
          usuario_email: string
          usuario_id: string
          usuario_nome: string
        }[]
      }
      listar_pagamentos_mercado_pago_pendentes: {
        Args: { p_limite?: number }
        Returns: {
          booking_id: number
          company_id: number
          expires_at: string
          external_id: string
          payment_id: number
        }[]
      }
      listar_usuarios_administracao: {
        Args: { p_id_empresa: number }
        Returns: {
          created_at: string
          email: string
          id: number
          nome: string
          permissoes: Json
          status: Database["public"]["Enums"]["status_usuario_empresa"]
          tipo: Database["public"]["Enums"]["tipos_usuarios"]
          ultimo_acesso_em: string
          user_id: string
        }[]
      }
      movimentar_caixa_manual: {
        Args: {
          p_descricao: string
          p_id_empresa: number
          p_id_sessao_caixa: number
          p_tipo: string
          p_valor: number
        }
        Returns: number
      }
      movimentar_estoque_manual: {
        Args: {
          p_descricao: string
          p_id_empresa: number
          p_id_produto: number
          p_operacao: string
          p_quantidade: number
        }
        Returns: number
      }
      n8n_processar_resposta_whatsapp: {
        Args: {
          p_conteudo: string
          p_id_empresa: number
          p_identificador_externo: string
          p_remetente: string
        }
        Returns: Json
      }
      n8n_registrar_resultado_mensagem: {
        Args: {
          p_erro?: string
          p_id_mensagem: number
          p_identificador_externo?: string
          p_status: string
        }
        Returns: Json
      }
      n8n_reservar_mensagens: {
        Args: { p_limite?: number }
        Returns: {
          assunto: string
          canal: string
          conteudo: string
          dados_template: Json
          destinatario: string
          id: number
          id_empresa: number
          max_tentativas: number
          tentativas: number
        }[]
      }
      obter_agendamento_site: { Args: { p_token: string }; Returns: Json }
      obter_area_cliente_site: { Args: { p_id_empresa: number }; Returns: Json }
      obter_catalogo_site: { Args: { p_id_empresa: number }; Returns: Json }
      obter_dashboard_empresa: {
        Args: {
          p_data_referencia?: string
          p_dias_periodo?: number
          p_id_empresa: number
        }
        Returns: Json
      }
      obter_disponibilidade_site:
        | {
            Args: {
              p_data: string
              p_id_empresa: number
              p_id_funcionario?: number
              p_id_servico: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_data: string
              p_id_empresa: number
              p_id_funcionario?: number
              p_id_servico: number
              p_id_unidade: number
            }
            Returns: Json
          }
      obter_pagamento_mercado_pago: {
        Args: { p_id_agendamento: number; p_id_empresa: number }
        Returns: Json
      }
      preparar_pagamento_mercado_pago: {
        Args: {
          p_chave_idempotencia: string
          p_id_agendamento: number
          p_id_empresa: number
        }
        Returns: Json
      }
      reagendar_agendamento_cliente_site: {
        Args: {
          p_id_agendamento: number
          p_id_empresa: number
          p_id_funcionario: number
          p_inicio: string
        }
        Returns: Json
      }
      reagendar_agendamento_site: {
        Args: { p_id_funcionario: number; p_inicio: string; p_token: string }
        Returns: Json
      }
      receber_compra: {
        Args: { p_compra_id: number; p_id_empresa: number; p_itens: Json }
        Returns: string
      }
      reenviar_confirmacao_agendamento_administracao: {
        Args: { p_id_agendamento: number; p_id_empresa: number }
        Returns: Json
      }
      registrar_evento_funil_agendamento: {
        Args: {
          p_etapa?: number
          p_evento: string
          p_id_empresa: number
          p_id_funcionario?: number
          p_id_servico?: number
          p_sessao: string
        }
        Returns: undefined
      }
      registrar_fechamento_semanal: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_empresa: number
          p_id_forma_pagamento: number
          p_id_sessao_caixa?: number
          p_observacoes?: string
          p_pago_em?: string
        }
        Returns: Json
      }
      registrar_order_mercado_pago: {
        Args: {
          p_expira_em: string
          p_id_empresa: number
          p_id_pagamento: number
          p_order_id: string
          p_status: string
          p_status_detail: string
        }
        Returns: Json
      }
      registrar_pagamento_comissao: {
        Args: {
          p_id_empresa: number
          p_id_forma_pagamento: number
          p_id_funcionario: number
          p_id_sessao_caixa: number
          p_itens: Json
          p_observacoes: string
          p_pago_em: string
          p_periodo_fim: string
          p_periodo_inicio: string
        }
        Returns: number
      }
      registrar_pagamento_financeiro: {
        Args: {
          p_alocacoes: Json
          p_data_pagamento: string
          p_id_empresa: number
          p_id_forma_pagamento: number
          p_id_sessao_caixa: number
          p_observacoes: string
          p_referencia: string
          p_tipo: string
          p_valor: number
        }
        Returns: number
      }
      reivindicar_estornos_agendamento: {
        Args: { p_id_agendamento?: number; p_limite?: number }
        Returns: {
          amount: number
          booking_id: number
          company_id: number
          idempotency_key: string
          order_id: string
          payment_id: number
          request_id: number
        }[]
      }
      relatorio_comissoes_funcionario: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_empresa: number
        }
        Returns: {
          ajustes_manuais: number
          comissoes_estornadas: number
          comissoes_geradas: number
          comissoes_liberadas: number
          comissoes_pagas: number
          comissoes_previstas: number
          funcionario_nome: string
          id_funcionario: number
          saldo_a_pagar: number
        }[]
      }
      relatorio_fluxo_financeiro: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_empresa: number
        }
        Returns: {
          despesas_previstas: number
          despesas_realizadas: number
          mes: string
          receitas_previstas: number
          receitas_realizadas: number
        }[]
      }
      remover_integracao_administracao: {
        Args: { p_id_empresa: number; p_integracao_id: number }
        Returns: undefined
      }
      resolver_site_publico: {
        Args: { p_dominio?: string; p_slug?: string }
        Returns: Json
      }
      resumo_fechamento_semanal: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_empresa: number
        }
        Returns: {
          ajustes: number
          base_comissao: number
          comissao_gerada: number
          custos_insumos: number
          descontos: number
          funcionario_nome: string
          id_funcionario: number
          producao_bruta: number
          saldo_a_pagar: number
          taxas_pagamento: number
          valor_pago: number
        }[]
      }
      salvar_agendamento: {
        Args: {
          p_agendamento_id: number
          p_id_cliente: number
          p_id_empresa: number
          p_observacoes: string
          p_servicos: Json
          p_sinal_status: string
          p_sinal_valor: number
        }
        Returns: number
      }
      salvar_agendamento_administracao: {
        Args: {
          p_agendamento_id: number
          p_id_cliente: number
          p_id_empresa: number
          p_observacoes: string
          p_servicos: Json
          p_sinal_status: string
          p_sinal_valor: number
        }
        Returns: number
      }
      salvar_comanda: {
        Args: {
          p_acrescimo: number
          p_comanda_id: number
          p_desconto: number
          p_id_cliente: number
          p_id_empresa: number
          p_id_funcionario_responsavel: number
          p_itens: Json
          p_observacoes: string
        }
        Returns: number
      }
      salvar_comanda_com_pagamento: {
        Args: {
          p_acrescimo: number
          p_comanda_id: number
          p_condicao_pagamento?: string
          p_desconto: number
          p_id_cliente: number
          p_id_empresa: number
          p_id_funcionario_responsavel: number
          p_itens: Json
          p_observacoes: string
        }
        Returns: number
      }
      salvar_compra: {
        Args: {
          p_compra_id: number
          p_data_compra: string
          p_desconto: number
          p_frete: number
          p_id_empresa: number
          p_id_fornecedor: number
          p_itens: Json
          p_numero_documento: string
          p_observacoes: string
          p_previsao_entrega: string
        }
        Returns: number
      }
      salvar_configuracao_lembretes_administracao: {
        Args: {
          p_antecedencias_minutos: number[]
          p_ativo: boolean
          p_email: boolean
          p_id_empresa: number
          p_max_tentativas: number
          p_whatsapp: boolean
        }
        Returns: {
          antecedencias_minutos: number[]
          ativo: boolean
          created_at: string
          email: boolean
          id_empresa: number
          max_tentativas: number
          updated_at: string
          whatsapp: boolean
        }
        SetofOptions: {
          from: "*"
          to: "configuracoes_lembretes_empresa"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      salvar_configuracoes_empresa: {
        Args: {
          p_cor_destaque: string
          p_cor_primaria: string
          p_densidade_interface: string
          p_duracao_slot_minutos: number
          p_id_empresa: number
          p_idioma: string
          p_logo_url: string
          p_moeda: string
          p_raio_interface: string
          p_semana_inicia: number
          p_tema_preferido: string
        }
        Returns: {
          cor_destaque: string
          cor_primaria: string
          densidade_interface: string
          duracao_slot_minutos: number
          id: number
          id_empresa: number
          idioma: string
          logo_url: string | null
          moeda: string
          raio_interface: string
          semana_inicia: number
          tema_preferido: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "configuracoes_empresas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      salvar_conta_financeira: {
        Args: {
          p_competencia: string
          p_conta_id: number
          p_data_emissao: string
          p_descricao: string
          p_documento: string
          p_id_categoria: number
          p_id_cliente: number
          p_id_empresa: number
          p_id_fornecedor: number
          p_numero_parcelas: number
          p_observacoes: string
          p_primeiro_vencimento: string
          p_tipo: string
          p_valor_total: number
        }
        Returns: number
      }
      salvar_insumos_servico: {
        Args: { p_id_empresa: number; p_id_servico: number; p_insumos: Json }
        Returns: number
      }
      salvar_integracao_administracao: {
        Args: {
          p_configuracoes: Json
          p_id_empresa: number
          p_provedor: string
          p_status?: string
          p_tipo: string
        }
        Returns: {
          configuracoes: Json
          created_at: string
          credencial_referencia: string | null
          id: number
          id_empresa: number
          identificador_externo: string | null
          provedor: string
          status: string
          tipo: string
          ultimo_erro: string | null
          ultimo_sucesso_em: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "integracoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      salvar_orcamento: {
        Args: {
          p_acrescimo: number
          p_desconto: number
          p_id_cliente: number
          p_id_empresa: number
          p_itens: Json
          p_observacoes: string
          p_orcamento_id: number
          p_validade: string
        }
        Returns: number
      }
      salvar_permissoes_usuario: {
        Args: {
          p_id_empresa: number
          p_permissoes: Json
          p_usuario_empresa_id: number
        }
        Returns: undefined
      }
      salvar_regra_comissao: {
        Args: {
          p_ativo: boolean
          p_base_calculo: string
          p_id_empresa: number
          p_id_funcionario: number
          p_id_produto: number
          p_id_servico: number
          p_momento_liberacao: string
          p_percentual: number
          p_prioridade: number
          p_regra_id: number
          p_tipo_calculo: string
          p_tipo_item: string
          p_valor_fixo: number
          p_vigente_ate: string
          p_vigente_de: string
        }
        Returns: number
      }
      salvar_regra_comissao_beauty: {
        Args: {
          p_ativo: boolean
          p_base_calculo: string
          p_descontar_insumos?: boolean
          p_descontar_taxa_pagamento?: boolean
          p_id_empresa: number
          p_id_funcionario: number
          p_id_produto: number
          p_id_servico: number
          p_momento_liberacao: string
          p_percentual: number
          p_prioridade: number
          p_regra_id: number
          p_tipo_calculo: string
          p_tipo_item: string
          p_valor_fixo: number
          p_vigente_ate: string
          p_vigente_de: string
        }
        Returns: number
      }
      salvar_site_publico: {
        Args: { p_config: Json; p_id_empresa: number }
        Returns: Json
      }
      salvar_template_mensagem: {
        Args: {
          p_assunto: string
          p_ativo?: boolean
          p_canal: string
          p_conteudo: string
          p_id_empresa: number
          p_tipo: string
        }
        Returns: number
      }
      solicitar_exclusao_dados_site: {
        Args: { p_id_empresa: number; p_motivo?: string }
        Returns: Json
      }
      vincular_cliente_email_site: {
        Args: { p_id_empresa: number }
        Returns: Json
      }
      vincular_cliente_site: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      status_assinatura:
        | "teste"
        | "ativa"
        | "inadimplente"
        | "suspensa"
        | "cancelada"
        | "expirada"
      status_assinaturas:
        | "teste"
        | "ativo"
        | "inativo"
        | "atraso_pagamento"
        | "cancelado"
      status_empresa: "ativo" | "inativo" | "suspenso"
      status_pagamentos:
        | "pago"
        | "atrasado"
        | "dia_do_pagamento"
        | "cancelado"
        | "em_dia"
      status_usuario_empresa: "convidado" | "ativo" | "desativado"
      tipo_conta: "receber" | "pagar"
      tipos_usuarios: "dono" | "gerente" | "recepcionista" | "profissional"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      status_assinatura: [
        "teste",
        "ativa",
        "inadimplente",
        "suspensa",
        "cancelada",
        "expirada",
      ],
      status_assinaturas: [
        "teste",
        "ativo",
        "inativo",
        "atraso_pagamento",
        "cancelado",
      ],
      status_empresa: ["ativo", "inativo", "suspenso"],
      status_pagamentos: [
        "pago",
        "atrasado",
        "dia_do_pagamento",
        "cancelado",
        "em_dia",
      ],
      status_usuario_empresa: ["convidado", "ativo", "desativado"],
      tipo_conta: ["receber", "pagar"],
      tipos_usuarios: ["dono", "gerente", "recepcionista", "profissional"],
    },
  },
} as const
