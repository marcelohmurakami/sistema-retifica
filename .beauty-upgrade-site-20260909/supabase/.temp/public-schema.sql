


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."status_assinatura" AS ENUM (
    'teste',
    'ativa',
    'inadimplente',
    'suspensa',
    'cancelada',
    'expirada'
);


ALTER TYPE "public"."status_assinatura" OWNER TO "postgres";


CREATE TYPE "public"."status_assinaturas" AS ENUM (
    'teste',
    'ativo',
    'inativo',
    'atraso_pagamento',
    'cancelado'
);


ALTER TYPE "public"."status_assinaturas" OWNER TO "postgres";


CREATE TYPE "public"."status_empresa" AS ENUM (
    'ativo',
    'inativo',
    'suspenso'
);


ALTER TYPE "public"."status_empresa" OWNER TO "postgres";


CREATE TYPE "public"."status_pagamentos" AS ENUM (
    'pago',
    'atrasado',
    'dia_do_pagamento',
    'cancelado',
    'em_dia'
);


ALTER TYPE "public"."status_pagamentos" OWNER TO "postgres";


CREATE TYPE "public"."status_usuario_empresa" AS ENUM (
    'convidado',
    'ativo',
    'desativado'
);


ALTER TYPE "public"."status_usuario_empresa" OWNER TO "postgres";


CREATE TYPE "public"."tipo_conta" AS ENUM (
    'receber',
    'pagar'
);


ALTER TYPE "public"."tipo_conta" OWNER TO "postgres";


CREATE TYPE "public"."tipos_usuarios" AS ENUM (
    'dono',
    'gerente',
    'recepcionista',
    'profissional'
);


ALTER TYPE "public"."tipos_usuarios" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."empresas" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "razao_social" character varying,
    "fantasia" character varying NOT NULL,
    "cnpj" character varying,
    "contato1" character varying,
    "contato2" character varying,
    "email" character varying,
    "status" "public"."status_empresa" DEFAULT 'ativo'::"public"."status_empresa" NOT NULL,
    "criado_por" "uuid",
    "fuso_horario" "text" DEFAULT 'America/Sao_Paulo'::"text" NOT NULL
);


ALTER TABLE "public"."empresas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuracoes_empresas" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "tema_preferido" "text" DEFAULT 'sistema'::"text" NOT NULL,
    "cor_primaria" "text" DEFAULT '#226FE7'::"text" NOT NULL,
    "cor_destaque" "text" DEFAULT '#10B981'::"text" NOT NULL,
    "raio_interface" "text" DEFAULT 'medio'::"text" NOT NULL,
    "densidade_interface" "text" DEFAULT 'confortavel'::"text" NOT NULL,
    "logo_url" "text",
    "idioma" "text" DEFAULT 'pt-BR'::"text" NOT NULL,
    "moeda" "text" DEFAULT 'BRL'::"text" NOT NULL,
    "semana_inicia" smallint DEFAULT 0 NOT NULL,
    "duracao_slot_minutos" smallint DEFAULT 30 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "configuracoes_empresas_cor_destaque_check" CHECK (("cor_destaque" ~ '^#[0-9A-Fa-f]{6}$'::"text")),
    CONSTRAINT "configuracoes_empresas_cor_primaria_check" CHECK (("cor_primaria" ~ '^#[0-9A-Fa-f]{6}$'::"text")),
    CONSTRAINT "configuracoes_empresas_densidade_interface_check" CHECK (("densidade_interface" = ANY (ARRAY['compacta'::"text", 'confortavel'::"text"]))),
    CONSTRAINT "configuracoes_empresas_duracao_slot_minutos_check" CHECK (("duracao_slot_minutos" = ANY (ARRAY[10, 15, 20, 30, 45, 60]))),
    CONSTRAINT "configuracoes_empresas_moeda_check" CHECK (("moeda" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "configuracoes_empresas_raio_interface_check" CHECK (("raio_interface" = ANY (ARRAY['discreto'::"text", 'medio'::"text", 'arredondado'::"text"]))),
    CONSTRAINT "configuracoes_empresas_semana_inicia_check" CHECK ((("semana_inicia" >= 0) AND ("semana_inicia" <= 6))),
    CONSTRAINT "configuracoes_empresas_tema_preferido_check" CHECK (("tema_preferido" = ANY (ARRAY['sistema'::"text", 'claro'::"text", 'escuro'::"text"])))
);


ALTER TABLE "public"."configuracoes_empresas" OWNER TO "postgres";


COMMENT ON TABLE "public"."configuracoes_empresas" IS 'Preferências operacionais e visuais compartilhadas pela empresa.';



CREATE TABLE IF NOT EXISTS "public"."integracoes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "tipo" "text" NOT NULL,
    "provedor" "text" NOT NULL,
    "status" "text" DEFAULT 'inativa'::"text" NOT NULL,
    "configuracoes" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "identificador_externo" character varying,
    "ultimo_erro" character varying,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "credencial_referencia" "text",
    "ultimo_sucesso_em" timestamp with time zone,
    CONSTRAINT "integracoes_configuracoes_objeto" CHECK (("jsonb_typeof"("configuracoes") = 'object'::"text")),
    CONSTRAINT "integracoes_provedor_valido" CHECK (("btrim"("provedor") <> ''::"text")),
    CONSTRAINT "integracoes_status_valido" CHECK (("status" = ANY (ARRAY['configurando'::"text", 'ativa'::"text", 'inativa'::"text", 'erro'::"text"]))),
    CONSTRAINT "integracoes_tipo_valido" CHECK (("btrim"("tipo") <> ''::"text"))
);


ALTER TABLE "public"."integracoes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."integracoes"."configuracoes" IS 'Somente configurações não secretas. Tokens e senhas devem ficar no Vault ou nos secrets das Edge Functions.';



COMMENT ON COLUMN "public"."integracoes"."credencial_referencia" IS 'Nome ou identificador da credencial armazenada fora da tabela; nunca o segredo em texto puro.';



CREATE OR REPLACE FUNCTION "public"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.abrir_sessao_caixa($1, $2, $3, $4) $_$;


ALTER FUNCTION "public"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."aceitar_convites_pendentes"() RETURNS integer
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$ select private.aceitar_convites_pendentes() $$;


ALTER FUNCTION "public"."aceitar_convites_pendentes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."alterar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_acao" "text", "p_motivo" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.alterar_agendamento_cliente_site($1, $2, $3, $4) $_$;


ALTER FUNCTION "public"."alterar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_acao" "text", "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.alterar_agendamento_site($1, $2, $3) $_$;


ALTER FUNCTION "public"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.alterar_status_orcamento($1, $2, $3, $4) $_$;


ALTER FUNCTION "public"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_dados_cliente_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_data_nascimento" "date" DEFAULT NULL::"date", "p_canal_preferido" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.atualizar_dados_cliente_site($1, $2, $3, $4, $5) $_$;


ALTER FUNCTION "public"."atualizar_dados_cliente_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_data_nascimento" "date", "p_canal_preferido" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") RETURNS "public"."empresas"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.atualizar_empresa_administracao($1, $2, $3, $4, $5, $6, $7, $8) $_$;


ALTER FUNCTION "public"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_preferencias_cliente_site"("p_id_empresa" bigint, "p_whatsapp" boolean, "p_email" boolean) RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.atualizar_preferencias_cliente_site($1, $2, $3) $_$;


ALTER FUNCTION "public"."atualizar_preferencias_cliente_site"("p_id_empresa" bigint, "p_whatsapp" boolean, "p_email" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") RETURNS "void"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.atualizar_usuario_empresa_administracao($1, $2, $3, $4) $_$;


ALTER FUNCTION "public"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) RETURNS integer
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.atualizar_vencimentos_financeiros($1) $_$;


ALTER FUNCTION "public"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.cancelar_comanda($1, $2, $3) $_$;


ALTER FUNCTION "public"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.cancelar_conta_financeira($1, $2, $3) $_$;


ALTER FUNCTION "public"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) RETURNS "void"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.cancelar_convite_empresa($1, $2) $_$;


ALTER FUNCTION "public"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text" DEFAULT NULL::"text") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.converter_orcamento_em_comanda($1, $2, $3, $4, $5) $_$;


ALTER FUNCTION "public"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text" DEFAULT NULL::"text", "p_lembrete_whatsapp" boolean DEFAULT true, "p_lembrete_email" boolean DEFAULT true, "p_chave_idempotencia" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.criar_agendamento_site($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) $_$;


ALTER FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text" DEFAULT NULL::"text", "p_lembrete_whatsapp" boolean DEFAULT true, "p_lembrete_email" boolean DEFAULT true, "p_chave_idempotencia" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$
  select private.criar_agendamento_site(
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
  )
$_$;


ALTER FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.criar_ajuste_comissao($1, $2, $3, $4, $5) $_$;


ALTER FUNCTION "public"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.criar_convite_empresa($1, $2, $3) $_$;


ALTER FUNCTION "public"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.estornar_lancamento_comissao($1, $2, $3) $_$;


ALTER FUNCTION "public"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.estornar_movimento_caixa($1, $2, $3) $_$;


ALTER FUNCTION "public"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.estornar_pagamento_comissao($1, $2, $3) $_$;


ALTER FUNCTION "public"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.estornar_pagamento_financeiro($1, $2, $3) $_$;


ALTER FUNCTION "public"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date" DEFAULT CURRENT_DATE) RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.fechar_comanda($1, $2, $3) $_$;


ALTER FUNCTION "public"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date" DEFAULT CURRENT_DATE, "p_id_forma_pagamento" bigint DEFAULT NULL::bigint, "p_id_sessao_caixa" bigint DEFAULT NULL::bigint, "p_data_pagamento" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_valor_pagamento" numeric DEFAULT NULL::numeric, "p_referencia" "text" DEFAULT NULL::"text", "p_observacoes_pagamento" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.fechar_comanda_com_pagamento($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) $_$;


ALTER FUNCTION "public"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor_pagamento" numeric, "p_referencia" "text", "p_observacoes_pagamento" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") RETURNS numeric
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.fechar_sessao_caixa($1, $2, $3, $4) $_$;


ALTER FUNCTION "public"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text" DEFAULT NULL::"text", "p_acao" "text" DEFAULT NULL::"text", "p_tabela" "text" DEFAULT NULL::"text", "p_inicio" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_fim" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_pagina" integer DEFAULT 1, "p_por_pagina" integer DEFAULT 20) RETURNS TABLE("id" bigint, "created_at" timestamp with time zone, "acao" "text", "tabela" "text", "registro_id" "text", "origem" "text", "usuario_id" "uuid", "usuario_nome" "text", "usuario_email" "text", "papel_execucao" "text", "campos_alterados" "text"[], "dados_anteriores" "jsonb", "dados_novos" "jsonb", "total_count" bigint)
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $_$ select * from private.listar_auditoria_administracao($1, $2, $3, $4, $5, $6, $7, $8) $_$;


ALTER FUNCTION "public"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text", "p_acao" "text", "p_tabela" "text", "p_inicio" timestamp with time zone, "p_fim" timestamp with time zone, "p_pagina" integer, "p_por_pagina" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."listar_usuarios_administracao"("p_id_empresa" bigint) RETURNS TABLE("id" bigint, "user_id" "uuid", "nome" "text", "email" "text", "tipo" "public"."tipos_usuarios", "status" "public"."status_usuario_empresa", "created_at" timestamp with time zone, "ultimo_acesso_em" timestamp with time zone, "permissoes" "jsonb")
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $_$ select * from private.listar_usuarios_administracao($1) $_$;


ALTER FUNCTION "public"."listar_usuarios_administracao"("p_id_empresa" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.movimentar_caixa_manual($1, $2, $3, $4, $5) $_$;


ALTER FUNCTION "public"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.movimentar_estoque_manual($1, $2, $3, $4, $5) $_$;


ALTER FUNCTION "public"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."obter_agendamento_site"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $_$ select private.obter_agendamento_site($1) $_$;


ALTER FUNCTION "public"."obter_agendamento_site"("p_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."obter_area_cliente_site"("p_id_empresa" bigint) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $_$ select private.obter_area_cliente_site($1) $_$;


ALTER FUNCTION "public"."obter_area_cliente_site"("p_id_empresa" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."obter_area_cliente_site"("p_id_empresa" bigint) IS 'Retorna somente os dados, agendamentos, pagamentos e preferencias do cliente autenticado.';



CREATE OR REPLACE FUNCTION "public"."obter_catalogo_site"("p_id_empresa" bigint) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $_$ select private.obter_catalogo_site($1) $_$;


ALTER FUNCTION "public"."obter_catalogo_site"("p_id_empresa" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date" DEFAULT CURRENT_DATE, "p_dias_periodo" integer DEFAULT 30) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $_$ select private.obter_dashboard_empresa($1, $2, $3) $_$;


ALTER FUNCTION "public"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date", "p_dias_periodo" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint DEFAULT NULL::bigint) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $_$ select private.obter_disponibilidade_site($1, $2, $3, $4) $_$;


ALTER FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint DEFAULT NULL::bigint) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $_$
  select private.obter_disponibilidade_site($1, $2, $3, $4, $5)
$_$;


ALTER FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reagendar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.reagendar_agendamento_cliente_site($1, $2, $3, $4) $_$;


ALTER FUNCTION "public"."reagendar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.reagendar_agendamento_site($1, $2, $3) $_$;


ALTER FUNCTION "public"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") RETURNS "text"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.receber_compra($1, $2, $3) $_$;


ALTER FUNCTION "public"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.registrar_pagamento_comissao($1, $2, $3, $4, $5, $6, $7, $8, $9) $_$;


ALTER FUNCTION "public"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.registrar_pagamento_financeiro($1, $2, $3, $4, $5, $6, $7, $8, $9) $_$;


ALTER FUNCTION "public"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") RETURNS TABLE("id_funcionario" bigint, "funcionario_nome" "text", "comissoes_geradas" numeric, "comissoes_previstas" numeric, "comissoes_liberadas" numeric, "comissoes_pagas" numeric, "comissoes_estornadas" numeric, "ajustes_manuais" numeric, "saldo_a_pagar" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select * from private.relatorio_comissoes_funcionario($1, $2, $3) $_$;


ALTER FUNCTION "public"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") RETURNS TABLE("mes" "date", "receitas_previstas" numeric, "despesas_previstas" numeric, "receitas_realizadas" numeric, "despesas_realizadas" numeric)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select * from private.relatorio_fluxo_financeiro($1, $2, $3) $_$;


ALTER FUNCTION "public"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) RETURNS "void"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.remover_integracao_administracao($1, $2) $_$;


ALTER FUNCTION "public"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolver_site_publico"("p_dominio" "text" DEFAULT NULL::"text", "p_slug" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select private.resolver_site_publico(p_dominio, p_slug);
$$;


ALTER FUNCTION "public"."resolver_site_publico"("p_dominio" "text", "p_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_agendamento"("p_agendamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_observacoes" "text", "p_sinal_status" "text", "p_sinal_valor" numeric, "p_servicos" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  v_id bigint;
  v_status text;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_item jsonb;
  v_item_id bigint;
begin
  if p_servicos is null or jsonb_typeof(p_servicos) <> 'array' or jsonb_array_length(p_servicos) = 0 then
    raise exception 'Adicione pelo menos um serviço ao agendamento.';
  end if;

  select min((item->>'inicio')::timestamptz), max((item->>'fim')::timestamptz)
  into v_inicio, v_fim
  from jsonb_array_elements(p_servicos) item;

  if p_agendamento_id is null then
    insert into public.agendamentos (
      id_empresa, id_cliente, inicio, fim, observacoes,
      sinal_status, sinal_valor, status, origem, criado_por
    ) values (
      p_id_empresa, p_id_cliente, v_inicio, v_fim, nullif(btrim(p_observacoes), ''),
      p_sinal_status, p_sinal_valor, 'aguardando_confirmacao', 'sistema', auth.uid()
    ) returning id into v_id;
  else
    select status into v_status
    from public.agendamentos
    where id = p_agendamento_id and id_empresa = p_id_empresa
    for update;

    if not found then raise exception 'Agendamento não encontrado.'; end if;
    if v_status in ('em_atendimento', 'finalizado', 'no_show', 'cancelado') then
      raise exception 'Este agendamento não pode mais ser editado.';
    end if;

    update public.agendamentos
    set id_cliente = p_id_cliente,
        inicio = v_inicio,
        fim = v_fim,
        observacoes = nullif(btrim(p_observacoes), ''),
        sinal_status = p_sinal_status,
        sinal_valor = p_sinal_valor
    where id = p_agendamento_id and id_empresa = p_id_empresa;
    v_id := p_agendamento_id;

    update public.agendamentos_servicos
    set status = 'cancelado', updated_at = now()
    where id_empresa = p_id_empresa
      and id_agendamento = v_id
      and status in ('reservado', 'em_execucao');
  end if;

  for v_item in select value from jsonb_array_elements(p_servicos)
  loop
    v_item_id := nullif(v_item->>'id', '')::bigint;

    if v_item_id is null then
      insert into public.agendamentos_servicos (
        id_empresa, id_agendamento, id_servico, id_funcionario,
        inicio, fim, duracao_minutos, preco, ordem, status, observacoes
      ) values (
        p_id_empresa, v_id, (v_item->>'id_servico')::bigint, (v_item->>'id_funcionario')::bigint,
        (v_item->>'inicio')::timestamptz, (v_item->>'fim')::timestamptz,
        (v_item->>'duracao_minutos')::integer, (v_item->>'preco')::numeric,
        (v_item->>'ordem')::integer, 'reservado', nullif(btrim(v_item->>'observacoes'), '')
      );
    else
      update public.agendamentos_servicos
      set id_servico = (v_item->>'id_servico')::bigint,
          id_funcionario = (v_item->>'id_funcionario')::bigint,
          inicio = (v_item->>'inicio')::timestamptz,
          fim = (v_item->>'fim')::timestamptz,
          duracao_minutos = (v_item->>'duracao_minutos')::integer,
          preco = (v_item->>'preco')::numeric,
          ordem = (v_item->>'ordem')::integer,
          status = 'reservado',
          observacoes = nullif(btrim(v_item->>'observacoes'), '')
      where id = v_item_id
        and id_empresa = p_id_empresa
        and id_agendamento = v_id;

      if not found then raise exception 'Serviço do agendamento não encontrado.'; end if;
    end if;
  end loop;

  return v_id;
end;
$$;


ALTER FUNCTION "public"."salvar_agendamento"("p_agendamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_observacoes" "text", "p_sinal_status" "text", "p_sinal_valor" numeric, "p_servicos" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.salvar_comanda($1, $2, $3, $4, $5, $6, $7, $8) $_$;


ALTER FUNCTION "public"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text" DEFAULT 'a_receber'::"text") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.salvar_comanda_com_pagamento($1, $2, $3, $4, $5, $6, $7, $8, $9) $_$;


ALTER FUNCTION "public"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.salvar_compra($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) $_$;


ALTER FUNCTION "public"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) RETURNS "public"."configuracoes_empresas"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.salvar_configuracoes_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) $_$;


ALTER FUNCTION "public"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.salvar_conta_financeira($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) $_$;


ALTER FUNCTION "public"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text" DEFAULT 'configurando'::"text") RETURNS "public"."integracoes"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.salvar_integracao_administracao($1, $2, $3, $4, $5) $_$;


ALTER FUNCTION "public"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.salvar_orcamento($1, $2, $3, $4, $5, $6, $7, $8) $_$;


ALTER FUNCTION "public"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") RETURNS "void"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.salvar_permissoes_usuario($1, $2, $3) $_$;


ALTER FUNCTION "public"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) RETURNS bigint
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.salvar_regra_comissao($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) $_$;


ALTER FUNCTION "public"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_site_publico"("p_id_empresa" bigint, "p_config" "jsonb") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  select private.salvar_site_publico(p_id_empresa, p_config);
$$;


ALTER FUNCTION "public"."salvar_site_publico"("p_id_empresa" bigint, "p_config" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."solicitar_exclusao_dados_site"("p_id_empresa" bigint, "p_motivo" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.solicitar_exclusao_dados_site($1, $2) $_$;


ALTER FUNCTION "public"."solicitar_exclusao_dados_site"("p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vincular_cliente_email_site"("p_id_empresa" bigint) RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.vincular_cliente_email_site($1) $_$;


ALTER FUNCTION "public"."vincular_cliente_email_site"("p_id_empresa" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."vincular_cliente_email_site"("p_id_empresa" bigint) IS 'Vincula a conta Auth ao unico cliente ativo com o mesmo e-mail confirmado na empresa.';



CREATE OR REPLACE FUNCTION "public"."vincular_cliente_site"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $_$ select private.vincular_cliente_site($1) $_$;


ALTER FUNCTION "public"."vincular_cliente_site"("p_token" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."vincular_cliente_site"("p_token" "uuid") IS 'Associa de forma autenticada a conta do cliente a uma reserva comprovada pelo token privado.';



CREATE TABLE IF NOT EXISTS "public"."agendamentos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_cliente" bigint NOT NULL,
    "status" "text" DEFAULT 'aguardando_confirmacao'::"text" NOT NULL,
    "id_empresa" bigint NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inicio" timestamp with time zone NOT NULL,
    "fim" timestamp with time zone NOT NULL,
    "origem" "text" DEFAULT 'sistema'::"text" NOT NULL,
    "criado_por" "uuid",
    "observacoes" "text",
    "sinal_status" "text" DEFAULT 'nao_exigido'::"text" NOT NULL,
    "sinal_valor" numeric(10,2),
    "sinal_pago_em" timestamp with time zone,
    "confirmado_em" timestamp with time zone,
    "checkin_em" timestamp with time zone,
    "iniciado_em" timestamp with time zone,
    "finalizado_em" timestamp with time zone,
    "no_show_em" timestamp with time zone,
    "cancelado_em" timestamp with time zone,
    "motivo_cancelamento" "text",
    "site_access_token" "uuid",
    "site_booking_key" "uuid",
    "site_notification_preferences" "jsonb",
    "id_unidade" bigint NOT NULL,
    "valor_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "pagamento_status" "text" DEFAULT 'nao_exigido'::"text" NOT NULL,
    "pagamento_externo_id" "text",
    CONSTRAINT "agendamentos_origem_check" CHECK (("origem" = ANY (ARRAY['sistema'::"text", 'site'::"text", 'aplicativo'::"text", 'link_publico'::"text", 'importacao'::"text"]))),
    CONSTRAINT "agendamentos_pagamento_status_check" CHECK (("pagamento_status" = ANY (ARRAY['nao_exigido'::"text", 'pendente'::"text", 'processando'::"text", 'pago'::"text", 'falhou'::"text", 'estornado'::"text", 'cancelado'::"text"]))),
    CONSTRAINT "agendamentos_periodo_check" CHECK (("fim" > "inicio")),
    CONSTRAINT "agendamentos_sinal_pago_check" CHECK ((("sinal_pago_em" IS NULL) OR ("sinal_status" = ANY (ARRAY['pago'::"text", 'estornado'::"text"])))),
    CONSTRAINT "agendamentos_sinal_status_check" CHECK (("sinal_status" = ANY (ARRAY['nao_exigido'::"text", 'pendente'::"text", 'pago'::"text", 'dispensado'::"text", 'estornado'::"text"]))),
    CONSTRAINT "agendamentos_sinal_valor_check" CHECK (((("sinal_status" = ANY (ARRAY['nao_exigido'::"text", 'dispensado'::"text"])) AND ("sinal_valor" IS NULL)) OR (("sinal_status" = ANY (ARRAY['pendente'::"text", 'pago'::"text", 'estornado'::"text"])) AND ("sinal_valor" IS NOT NULL) AND ("sinal_valor" > (0)::numeric)))),
    CONSTRAINT "agendamentos_status_check" CHECK (("status" = ANY (ARRAY['aguardando_confirmacao'::"text", 'aguardando_pagamento'::"text", 'confirmado'::"text", 'em_atendimento'::"text", 'finalizado'::"text", 'no_show'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."agendamentos" OWNER TO "postgres";


ALTER TABLE "public"."agendamentos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."agendamentos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."agendamentos_servicos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_servico" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_agendamento" bigint NOT NULL,
    "id_funcionario" bigint NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inicio" timestamp with time zone NOT NULL,
    "fim" timestamp with time zone NOT NULL,
    "duracao_minutos" integer NOT NULL,
    "preco" numeric(10,2) NOT NULL,
    "ordem" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'reservado'::"text" NOT NULL,
    "observacoes" "text",
    CONSTRAINT "agendamentos_servicos_duracao_check" CHECK (("duracao_minutos" > 0)),
    CONSTRAINT "agendamentos_servicos_ordem_check" CHECK (("ordem" > 0)),
    CONSTRAINT "agendamentos_servicos_periodo_check" CHECK (("fim" > "inicio")),
    CONSTRAINT "agendamentos_servicos_preco_check" CHECK (("preco" >= (0)::numeric)),
    CONSTRAINT "agendamentos_servicos_status_check" CHECK (("status" = ANY (ARRAY['reservado'::"text", 'em_execucao'::"text", 'concluido'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."agendamentos_servicos" OWNER TO "postgres";


ALTER TABLE "public"."agendamentos_servicos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."agendamentos_servicos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."assinaturas" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_plano" bigint NOT NULL,
    "status" "public"."status_assinatura" DEFAULT 'teste'::"public"."status_assinatura" NOT NULL,
    "ciclo" character varying DEFAULT 'mensal'::character varying NOT NULL,
    "inicio" "date" DEFAULT CURRENT_DATE NOT NULL,
    "cancelado_em" "date",
    "teste_finaliza_em" "date",
    "valor_contratado" numeric(10,2),
    "periodo_atual_inicio" "date",
    "periodo_atual_fim" "date",
    "cancelar_ao_fim_periodo" boolean DEFAULT false NOT NULL,
    "cliente_externo_id" "text",
    "assinatura_externa_id" "text",
    CONSTRAINT "assinaturas_ciclo_check" CHECK ((("ciclo")::"text" = ANY ((ARRAY['mensal'::character varying, 'anual'::character varying])::"text"[]))),
    CONSTRAINT "assinaturas_periodo_check" CHECK ((("periodo_atual_inicio" IS NULL) OR ("periodo_atual_fim" IS NULL) OR ("periodo_atual_fim" >= "periodo_atual_inicio"))),
    CONSTRAINT "assinaturas_valor_check" CHECK ((("valor_contratado" IS NULL) OR ("valor_contratado" >= (0)::numeric)))
);


ALTER TABLE "public"."assinaturas" OWNER TO "postgres";


ALTER TABLE "public"."assinaturas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."assinaturas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."auditorias" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint,
    "usuario_id" "uuid",
    "acao" "text" NOT NULL,
    "tabela" "text" NOT NULL,
    "registro_id" "text" NOT NULL,
    "dados_anteriores" "jsonb",
    "dados_novos" "jsonb",
    "schema_nome" "text" DEFAULT 'public'::"text" NOT NULL,
    "origem" "text" DEFAULT 'sistema'::"text" NOT NULL,
    "papel_execucao" "text",
    "transacao_id" bigint,
    "campos_alterados" "text"[],
    CONSTRAINT "auditorias_acao_check" CHECK (("acao" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"]))),
    CONSTRAINT "auditorias_dados_check" CHECK (((("acao" = 'INSERT'::"text") AND ("dados_anteriores" IS NULL) AND ("dados_novos" IS NOT NULL)) OR (("acao" = 'UPDATE'::"text") AND ("dados_anteriores" IS NOT NULL) AND ("dados_novos" IS NOT NULL)) OR (("acao" = 'DELETE'::"text") AND ("dados_anteriores" IS NOT NULL) AND ("dados_novos" IS NULL)))),
    CONSTRAINT "auditorias_origem_check" CHECK (("origem" = ANY (ARRAY['usuario'::"text", 'sistema'::"text"]))),
    CONSTRAINT "auditorias_registro_check" CHECK (("btrim"("registro_id") <> ''::"text")),
    CONSTRAINT "auditorias_schema_check" CHECK (("btrim"("schema_nome") <> ''::"text")),
    CONSTRAINT "auditorias_tabela_check" CHECK (("btrim"("tabela") <> ''::"text"))
);


ALTER TABLE "public"."auditorias" OWNER TO "postgres";


ALTER TABLE "public"."auditorias" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."auditorias_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ausencias_funcionarios" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_funcionario" bigint NOT NULL,
    "tipo" character varying DEFAULT 'outro'::character varying NOT NULL,
    "inicio" timestamp with time zone NOT NULL,
    "fim" timestamp with time zone NOT NULL,
    "motivo" character varying,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "criado_por" "uuid" DEFAULT "auth"."uid"(),
    "status" "text" DEFAULT 'ativa'::"text" NOT NULL,
    "cancelado_em" timestamp with time zone,
    "cancelado_por" "uuid",
    "motivo_cancelamento" "text",
    CONSTRAINT "ausencias_funcionarios_cancelamento_check" CHECK (((("status" = 'cancelada'::"text") AND ("cancelado_em" IS NOT NULL) AND ("motivo_cancelamento" IS NOT NULL) AND ("btrim"("motivo_cancelamento") <> ''::"text")) OR ("status" = 'ativa'::"text"))),
    CONSTRAINT "ausencias_funcionarios_periodo_check" CHECK (("fim" > "inicio")),
    CONSTRAINT "ausencias_funcionarios_status_check" CHECK (("status" = ANY (ARRAY['ativa'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "ausencias_funcionarios_tipo_check" CHECK ((("tipo")::"text" = ANY ((ARRAY['ferias'::character varying, 'folga'::character varying, 'atestado'::character varying, 'licenca'::character varying, 'compromisso'::character varying, 'outro'::character varying])::"text"[])))
);


ALTER TABLE "public"."ausencias_funcionarios" OWNER TO "postgres";


ALTER TABLE "public"."ausencias_funcionarios" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ausencias_funcionarios_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."avaliacoes" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_cliente" bigint,
    "id_agendamento" bigint,
    "nota" smallint NOT NULL,
    "comentario" "text",
    "nome_publico" "text",
    "autorizado_publicacao" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "destaque" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "avaliacoes_nota_check" CHECK ((("nota" >= 1) AND ("nota" <= 5))),
    CONSTRAINT "avaliacoes_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'aprovada'::"text", 'rejeitada'::"text"])))
);


ALTER TABLE "public"."avaliacoes" OWNER TO "postgres";


ALTER TABLE "public"."avaliacoes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."avaliacoes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bloqueios_agenda" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_funcionario" bigint,
    "inicio" timestamp with time zone NOT NULL,
    "fim" timestamp with time zone NOT NULL,
    "tipo" character varying DEFAULT 'outro'::character varying NOT NULL,
    "motivo" "text",
    "dia_inteiro" boolean DEFAULT false NOT NULL,
    "status" character varying DEFAULT 'ativo'::character varying NOT NULL,
    "criado_por" "uuid" DEFAULT "auth"."uid"(),
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cancelado_em" timestamp with time zone,
    "cancelado_por" "uuid",
    "motivo_cancelamento" "text",
    "id_unidade" bigint,
    CONSTRAINT "bloqueios_agenda_cancelamento_check" CHECK ((((("status")::"text" = 'cancelado'::"text") AND ("cancelado_em" IS NOT NULL) AND ("motivo_cancelamento" IS NOT NULL) AND ("btrim"("motivo_cancelamento") <> ''::"text")) OR (("status")::"text" = 'ativo'::"text"))),
    CONSTRAINT "bloqueios_agenda_periodo_check" CHECK (("fim" > "inicio")),
    CONSTRAINT "bloqueios_agenda_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['ativo'::character varying, 'cancelado'::character varying])::"text"[]))),
    CONSTRAINT "bloqueios_agenda_tipo_check" CHECK ((("tipo")::"text" = ANY ((ARRAY['feriado'::character varying, 'manutencao'::character varying, 'evento'::character varying, 'indisponibilidade'::character varying, 'outro'::character varying])::"text"[])))
);


ALTER TABLE "public"."bloqueios_agenda" OWNER TO "postgres";


ALTER TABLE "public"."bloqueios_agenda" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bloqueios_agenda_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."caixas" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "nome" "text" NOT NULL,
    "codigo" "text",
    "descricao" "text",
    "localizacao" "text",
    "permite_saldo_negativo" boolean DEFAULT false NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    CONSTRAINT "caixas_codigo_check" CHECK ((("codigo" IS NULL) OR ("btrim"("codigo") <> ''::"text"))),
    CONSTRAINT "caixas_nome_check" CHECK (("btrim"("nome") <> ''::"text"))
);


ALTER TABLE "public"."caixas" OWNER TO "postgres";


ALTER TABLE "public"."caixas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."caixas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categorias_financeiras" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" DEFAULT 'ambos'::"text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    CONSTRAINT "categorias_financeiras_nome_check" CHECK (("btrim"("nome") <> ''::"text")),
    CONSTRAINT "categorias_financeiras_tipo_check" CHECK (("tipo" = ANY (ARRAY['entrada'::"text", 'saida'::"text", 'ambos'::"text"])))
);


ALTER TABLE "public"."categorias_financeiras" OWNER TO "postgres";


ALTER TABLE "public"."categorias_financeiras" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."categorias_financeiras_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "nome" "text" NOT NULL,
    "cpf" "text",
    "telefone_principal" "text",
    "telefone_secundario" "text",
    "email" "text",
    "endereco" "text",
    "genero" "text",
    "data_nascimento" "date",
    "observacoes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "telefone_e164" "text",
    "email_normalizado" "text" GENERATED ALWAYS AS ("lower"("btrim"("email"))) STORED,
    "canal_preferido" "text",
    "idioma" "text" DEFAULT 'pt-BR'::"text" NOT NULL,
    "fuso_horario" "text" DEFAULT 'America/Sao_Paulo'::"text" NOT NULL,
    "bloqueado_comunicacao_em" timestamp with time zone,
    "auth_user_id" "uuid",
    CONSTRAINT "clientes_canal_preferido_valido" CHECK ((("canal_preferido" IS NULL) OR ("canal_preferido" = ANY (ARRAY['whatsapp'::"text", 'email'::"text", 'sms'::"text", 'telefone'::"text", 'nenhum'::"text"])))),
    CONSTRAINT "clientes_data_nascimento_check" CHECK ((("data_nascimento" IS NULL) OR ("data_nascimento" <= CURRENT_DATE))),
    CONSTRAINT "clientes_fuso_horario_valido" CHECK (("btrim"("fuso_horario") <> ''::"text")),
    CONSTRAINT "clientes_idioma_valido" CHECK (("btrim"("idioma") <> ''::"text")),
    CONSTRAINT "clientes_telefone_e164_valido" CHECK ((("telefone_e164" IS NULL) OR ("telefone_e164" ~ '^\+[1-9][0-9]{7,14}$'::"text")))
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clientes"."auth_user_id" IS 'Conta Supabase Auth opcional do cliente para políticas RLS de autoatendimento.';



ALTER TABLE "public"."clientes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."clientes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."comandas" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_cliente" bigint NOT NULL,
    "id_agendamento" bigint,
    "id_orcamento" bigint,
    "id_funcionario_responsavel" bigint,
    "status" "text" DEFAULT 'aberta'::"text" NOT NULL,
    "observacoes" "text",
    "subtotal" numeric(14,2) DEFAULT 0 NOT NULL,
    "desconto_itens" numeric(14,2) DEFAULT 0 NOT NULL,
    "desconto" numeric(14,2) DEFAULT 0 NOT NULL,
    "acrescimo" numeric(14,2) DEFAULT 0 NOT NULL,
    "valor_total" numeric(14,2) GENERATED ALWAYS AS (GREATEST(((("subtotal" - "desconto_itens") - "desconto") + "acrescimo"), (0)::numeric)) STORED,
    "aberta_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fechada_em" timestamp with time zone,
    "cancelada_em" timestamp with time zone,
    "motivo_cancelamento" "text",
    "criado_por" "uuid",
    "condicao_pagamento" "text" DEFAULT 'a_receber'::"text" NOT NULL,
    CONSTRAINT "comandas_condicao_pagamento_check" CHECK (("condicao_pagamento" = ANY (ARRAY['a_receber'::"text", 'parcial'::"text", 'pago'::"text"]))),
    CONSTRAINT "comandas_status_check" CHECK (("status" = ANY (ARRAY['aberta'::"text", 'fechada'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "comandas_valores_check" CHECK ((("subtotal" >= (0)::numeric) AND ("desconto_itens" >= (0)::numeric) AND ("desconto" >= (0)::numeric) AND ("acrescimo" >= (0)::numeric) AND (("desconto_itens" + "desconto") <= ("subtotal" + "acrescimo"))))
);


ALTER TABLE "public"."comandas" OWNER TO "postgres";


COMMENT ON COLUMN "public"."comandas"."condicao_pagamento" IS 'Condição escolhida para o fechamento. O estado financeiro efetivo é calculado pela conta vinculada.';



ALTER TABLE "public"."comandas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."comandas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."comandas_itens" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_comanda" bigint NOT NULL,
    "id_orcamento_item" bigint,
    "tipo_item" "text" NOT NULL,
    "id_servico" bigint,
    "id_produto" bigint,
    "id_funcionario" bigint,
    "descricao_snapshot" "text" NOT NULL,
    "quantidade" numeric(12,3) DEFAULT 1 NOT NULL,
    "valor_unitario_snapshot" numeric(14,2) NOT NULL,
    "custo_unitario_snapshot" numeric(14,2),
    "desconto" numeric(14,2) DEFAULT 0 NOT NULL,
    "valor_total" numeric(14,2) GENERATED ALWAYS AS (GREATEST((("quantidade" * "valor_unitario_snapshot") - "desconto"), (0)::numeric)) STORED,
    "comissao_tipo_snapshot" "text",
    "comissao_valor_snapshot" numeric(14,4),
    "comissao_calculada" numeric(14,2) DEFAULT 0 NOT NULL,
    "ordem" integer DEFAULT 1 NOT NULL,
    "observacoes" "text",
    CONSTRAINT "comandas_itens_comissao_tipo_check" CHECK ((("comissao_tipo_snapshot" IS NULL) OR ("comissao_tipo_snapshot" = ANY (ARRAY['percentual'::"text", 'fixo'::"text"])))),
    CONSTRAINT "comandas_itens_descricao_check" CHECK (("btrim"("descricao_snapshot") <> ''::"text")),
    CONSTRAINT "comandas_itens_referencia_check" CHECK (((("tipo_item" = 'servico'::"text") AND ("id_servico" IS NOT NULL) AND ("id_produto" IS NULL) AND ("id_funcionario" IS NOT NULL)) OR (("tipo_item" = 'produto'::"text") AND ("id_produto" IS NOT NULL) AND ("id_servico" IS NULL)) OR (("tipo_item" = 'outro'::"text") AND ("id_servico" IS NULL) AND ("id_produto" IS NULL)))),
    CONSTRAINT "comandas_itens_tipo_check" CHECK (("tipo_item" = ANY (ARRAY['servico'::"text", 'produto'::"text", 'outro'::"text"]))),
    CONSTRAINT "comandas_itens_valores_check" CHECK ((("quantidade" > (0)::numeric) AND ("valor_unitario_snapshot" >= (0)::numeric) AND (COALESCE("custo_unitario_snapshot", (0)::numeric) >= (0)::numeric) AND ("desconto" >= (0)::numeric) AND ("desconto" <= ("quantidade" * "valor_unitario_snapshot")) AND (COALESCE("comissao_valor_snapshot", (0)::numeric) >= (0)::numeric) AND ("comissao_calculada" >= (0)::numeric) AND ("ordem" > 0)))
);


ALTER TABLE "public"."comandas_itens" OWNER TO "postgres";


ALTER TABLE "public"."comandas_itens" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."comandas_itens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."comissoes_regras" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_funcionario" bigint,
    "id_servico" bigint,
    "id_produto" bigint,
    "tipo_item" character varying NOT NULL,
    "tipo_calculo" character varying NOT NULL,
    "percentual" numeric,
    "valor_fixo" numeric,
    "base_calculo" character varying DEFAULT 'liquido_desconto'::character varying NOT NULL,
    "momento_liberacao" character varying DEFAULT 'fechamento_comanda'::character varying NOT NULL,
    "vigente_de" "date" DEFAULT CURRENT_DATE NOT NULL,
    "prioridade" integer DEFAULT 0 NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "vigente_ate" "date",
    "criado_por" "uuid" DEFAULT "auth"."uid"(),
    CONSTRAINT "comissoes_regras_base_check" CHECK ((("base_calculo")::"text" = ANY ((ARRAY['bruto'::character varying, 'liquido_desconto'::character varying])::"text"[]))),
    CONSTRAINT "comissoes_regras_calculo_check" CHECK ((((("tipo_calculo")::"text" = 'percentual'::"text") AND ("percentual" > (0)::numeric) AND ("percentual" <= (100)::numeric) AND ("valor_fixo" IS NULL)) OR ((("tipo_calculo")::"text" = 'valor_fixo'::"text") AND ("valor_fixo" > (0)::numeric) AND ("percentual" IS NULL)))),
    CONSTRAINT "comissoes_regras_liberacao_check" CHECK ((("momento_liberacao")::"text" = ANY ((ARRAY['fechamento_comanda'::character varying, 'pagamento_cliente'::character varying])::"text"[]))),
    CONSTRAINT "comissoes_regras_referencia_check" CHECK ((((("tipo_item")::"text" = 'servico'::"text") AND ("id_produto" IS NULL)) OR ((("tipo_item")::"text" = 'produto'::"text") AND ("id_servico" IS NULL)) OR ((("tipo_item")::"text" = 'todos'::"text") AND ("id_servico" IS NULL) AND ("id_produto" IS NULL)))),
    CONSTRAINT "comissoes_regras_tipo_calculo_check" CHECK ((("tipo_calculo")::"text" = ANY ((ARRAY['percentual'::character varying, 'valor_fixo'::character varying])::"text"[]))),
    CONSTRAINT "comissoes_regras_tipo_item_check" CHECK ((("tipo_item")::"text" = ANY ((ARRAY['servico'::character varying, 'produto'::character varying, 'todos'::character varying])::"text"[]))),
    CONSTRAINT "comissoes_regras_vigencia_check" CHECK ((("vigente_ate" IS NULL) OR ("vigente_ate" >= "vigente_de")))
);


ALTER TABLE "public"."comissoes_regras" OWNER TO "postgres";


ALTER TABLE "public"."comissoes_regras" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."comissoes_regras_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."compras" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_fornecedor" bigint NOT NULL,
    "numero_documento" "text",
    "status" character varying DEFAULT 'rascunho'::character varying NOT NULL,
    "data_compra" "date" DEFAULT CURRENT_DATE NOT NULL,
    "recebido_em" timestamp with time zone,
    "total_produtos" numeric DEFAULT 0 NOT NULL,
    "frete" numeric DEFAULT 0 NOT NULL,
    "desconto" numeric DEFAULT 0 NOT NULL,
    "total_final" numeric DEFAULT 0 NOT NULL,
    "observacoes" "text",
    "criado_por" "uuid" DEFAULT "auth"."uid"(),
    "anexos" "text"[],
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "previsao_entrega" "date",
    "id_conta" bigint,
    CONSTRAINT "compras_recebimento_check" CHECK ((((("status")::"text" = 'recebida'::"text") AND ("recebido_em" IS NOT NULL)) OR (("status")::"text" <> 'recebida'::"text"))),
    CONSTRAINT "compras_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['rascunho'::character varying, 'pedido'::character varying, 'recebida_parcial'::character varying, 'recebida'::character varying, 'cancelada'::character varying])::"text"[]))),
    CONSTRAINT "compras_valores_check" CHECK ((("total_produtos" >= (0)::numeric) AND ("frete" >= (0)::numeric) AND ("desconto" >= (0)::numeric) AND ("desconto" <= ("total_produtos" + "frete")) AND ("total_final" >= (0)::numeric)))
);


ALTER TABLE "public"."compras" OWNER TO "postgres";


ALTER TABLE "public"."compras" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."compras_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."compras_itens" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_compra" bigint NOT NULL,
    "id_produto" bigint NOT NULL,
    "descricao_snapshot" character varying NOT NULL,
    "quantidade_comprada" numeric NOT NULL,
    "quantidade_recebida" numeric DEFAULT 0 NOT NULL,
    "valor_unitario" numeric NOT NULL,
    "total" numeric DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "desconto" numeric(14,2) DEFAULT 0 NOT NULL,
    CONSTRAINT "compras_itens_descricao_check" CHECK (("btrim"(("descricao_snapshot")::"text") <> ''::"text")),
    CONSTRAINT "compras_itens_valores_check" CHECK ((("quantidade_comprada" > (0)::numeric) AND ("quantidade_recebida" >= (0)::numeric) AND ("quantidade_recebida" <= "quantidade_comprada") AND ("valor_unitario" >= (0)::numeric) AND ("desconto" >= (0)::numeric) AND ("desconto" <= ("quantidade_comprada" * "valor_unitario")) AND ("total" >= (0)::numeric)))
);


ALTER TABLE "public"."compras_itens" OWNER TO "postgres";


ALTER TABLE "public"."compras_itens" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."compras_itens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."configuracoes_empresas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."configuracoes_empresas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."consentimentos_comunicacao" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_cliente" bigint NOT NULL,
    "canal" "text" NOT NULL,
    "finalidade" "text" NOT NULL,
    "consentiu" boolean DEFAULT true NOT NULL,
    "origem" "text" DEFAULT 'sistema'::"text" NOT NULL,
    "registrado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revogado_em" timestamp with time zone,
    "ip_origem" "inet",
    "user_agent" "text",
    "observacoes" "text",
    "criado_por" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "consentimentos_canal_valido" CHECK (("canal" = ANY (ARRAY['whatsapp'::"text", 'email'::"text", 'sms'::"text", 'telefone'::"text"]))),
    CONSTRAINT "consentimentos_finalidade_valida" CHECK (("finalidade" = ANY (ARRAY['lembrete'::"text", 'marketing'::"text", 'cobranca'::"text", 'transacional'::"text", 'todos'::"text"]))),
    CONSTRAINT "consentimentos_origem_valida" CHECK (("btrim"("origem") <> ''::"text"))
);


ALTER TABLE "public"."consentimentos_comunicacao" OWNER TO "postgres";


ALTER TABLE "public"."consentimentos_comunicacao" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."consentimentos_comunicacao_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."contas" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "tipo" "text" NOT NULL,
    "id_cliente" bigint,
    "id_fornecedor" bigint,
    "id_categoria" bigint,
    "id_comanda" bigint,
    "descricao" "text" NOT NULL,
    "documento" "text",
    "data_emissao" "date" DEFAULT CURRENT_DATE NOT NULL,
    "competencia" "date",
    "valor_total" numeric(14,2) DEFAULT 0 NOT NULL,
    "valor_pago" numeric(14,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'aberta'::"text" NOT NULL,
    "observacoes" "text",
    "cancelada_em" timestamp with time zone,
    "motivo_cancelamento" "text",
    "criado_por" "uuid",
    CONSTRAINT "contas_descricao_check" CHECK (("btrim"("descricao") <> ''::"text")),
    CONSTRAINT "contas_partes_check" CHECK (((("tipo" = 'receber'::"text") AND ("id_fornecedor" IS NULL)) OR (("tipo" = 'pagar'::"text") AND ("id_cliente" IS NULL) AND ("id_comanda" IS NULL)))),
    CONSTRAINT "contas_status_check" CHECK (("status" = ANY (ARRAY['aberta'::"text", 'parcial'::"text", 'paga'::"text", 'vencida'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "contas_tipo_check" CHECK (("tipo" = ANY (ARRAY['receber'::"text", 'pagar'::"text"]))),
    CONSTRAINT "contas_valores_check" CHECK ((("valor_total" >= (0)::numeric) AND ("valor_pago" >= (0)::numeric) AND ("valor_pago" <= "valor_total")))
);


ALTER TABLE "public"."contas" OWNER TO "postgres";


ALTER TABLE "public"."contas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."contas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."contas_parcelas" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_conta" bigint NOT NULL,
    "numero_parcela" integer NOT NULL,
    "data_vencimento" "date" NOT NULL,
    "valor_parcela" numeric(14,2) NOT NULL,
    "valor_pago" numeric(14,2) DEFAULT 0 NOT NULL,
    "saldo" numeric(14,2) GENERATED ALWAYS AS (GREATEST(("valor_parcela" - "valor_pago"), (0)::numeric)) STORED,
    "status" "text" DEFAULT 'aberta'::"text" NOT NULL,
    "paga_em" timestamp with time zone,
    "observacoes" "text",
    CONSTRAINT "contas_parcelas_status_check" CHECK (("status" = ANY (ARRAY['aberta'::"text", 'parcial'::"text", 'paga'::"text", 'atrasada'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "contas_parcelas_valores_check" CHECK ((("numero_parcela" > 0) AND ("valor_parcela" > (0)::numeric) AND ("valor_pago" >= (0)::numeric) AND ("valor_pago" <= "valor_parcela")))
);


ALTER TABLE "public"."contas_parcelas" OWNER TO "postgres";


ALTER TABLE "public"."contas_parcelas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."contas_parcelas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."convites_empresa" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "email" "text" NOT NULL,
    "tipo" "public"."tipos_usuarios" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "criado_por" "uuid",
    "aceito_por" "uuid",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "aceito_em" timestamp with time zone,
    "cancelado_em" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "convites_empresa_email_valido" CHECK ((("email" = "lower"("btrim"("email"))) AND (POSITION(('@'::"text") IN ("email")) > 1))),
    CONSTRAINT "convites_empresa_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'aceito'::"text", 'cancelado'::"text", 'expirado'::"text"])))
);


ALTER TABLE "public"."convites_empresa" OWNER TO "postgres";


COMMENT ON TABLE "public"."convites_empresa" IS 'Convites sem credenciais; o acesso é ativado somente para o e-mail autenticado e confirmado.';



ALTER TABLE "public"."convites_empresa" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."convites_empresa_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."disponibilidades" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_unidade" bigint NOT NULL,
    "id_profissional" bigint NOT NULL,
    "inicio" timestamp with time zone NOT NULL,
    "fim" timestamp with time zone NOT NULL,
    "tipo" "text" DEFAULT 'indisponivel'::"text" NOT NULL,
    "origem" "text" DEFAULT 'manual'::"text" NOT NULL,
    "observacoes" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "id_bloqueio_agenda" bigint,
    "criado_por" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "disponibilidades_periodo_check" CHECK (("fim" > "inicio")),
    CONSTRAINT "disponibilidades_tipo_check" CHECK (("tipo" = ANY (ARRAY['disponivel'::"text", 'indisponivel'::"text"])))
);


ALTER TABLE "public"."disponibilidades" OWNER TO "postgres";


COMMENT ON TABLE "public"."disponibilidades" IS 'Exceções versionadas de disponibilidade por profissional e unidade.';



ALTER TABLE "public"."disponibilidades" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."disponibilidades_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."empresas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."empresas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."eventos_sistema" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "tipo_evento" "text" NOT NULL,
    "entidade" "text" NOT NULL,
    "id_entidade" "text",
    "dados" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "origem" "text" DEFAULT 'sistema'::"text" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "prioridade" smallint DEFAULT 100 NOT NULL,
    "tentativas" integer DEFAULT 0 NOT NULL,
    "max_tentativas" integer DEFAULT 5 NOT NULL,
    "processar_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bloqueado_em" timestamp with time zone,
    "bloqueado_por" "text",
    "processado_em" timestamp with time zone,
    "chave_idempotencia" "text",
    "ultimo_erro" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "eventos_dados_objeto" CHECK (("jsonb_typeof"("dados") = 'object'::"text")),
    CONSTRAINT "eventos_entidade_valida" CHECK (("btrim"("entidade") <> ''::"text")),
    CONSTRAINT "eventos_prioridade_valida" CHECK ((("prioridade" >= 0) AND ("prioridade" <= 1000))),
    CONSTRAINT "eventos_status_valido" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'processando'::"text", 'processado'::"text", 'erro'::"text", 'cancelado'::"text"]))),
    CONSTRAINT "eventos_tentativas_validas" CHECK ((("tentativas" >= 0) AND ("max_tentativas" > 0) AND ("tentativas" <= "max_tentativas"))),
    CONSTRAINT "eventos_tipo_valido" CHECK (("btrim"("tipo_evento") <> ''::"text"))
);


ALTER TABLE "public"."eventos_sistema" OWNER TO "postgres";


ALTER TABLE "public"."eventos_sistema" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."eventos_sistema_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fila_mensagens" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_cliente" bigint,
    "id_integracao" bigint,
    "id_evento" bigint,
    "canal" "text" NOT NULL,
    "destinatario" "text" NOT NULL,
    "assunto" "text",
    "conteudo" "text" NOT NULL,
    "dados_template" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "prioridade" smallint DEFAULT 100 NOT NULL,
    "agendada_para" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processamento_iniciado_em" timestamp with time zone,
    "enviada_em" timestamp with time zone,
    "entregue_em" timestamp with time zone,
    "lida_em" timestamp with time zone,
    "cancelada_em" timestamp with time zone,
    "tentativas" integer DEFAULT 0 NOT NULL,
    "max_tentativas" integer DEFAULT 5 NOT NULL,
    "proxima_tentativa_em" timestamp with time zone,
    "identificador_externo" "text",
    "chave_idempotencia" "text",
    "ultimo_erro" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "fila_canal_valido" CHECK (("canal" = ANY (ARRAY['whatsapp'::"text", 'email'::"text", 'sms'::"text", 'push'::"text"]))),
    CONSTRAINT "fila_conteudo_valido" CHECK (("btrim"("conteudo") <> ''::"text")),
    CONSTRAINT "fila_dados_template_objeto" CHECK (("jsonb_typeof"("dados_template") = 'object'::"text")),
    CONSTRAINT "fila_destinatario_valido" CHECK (("btrim"("destinatario") <> ''::"text")),
    CONSTRAINT "fila_prioridade_valida" CHECK ((("prioridade" >= 0) AND ("prioridade" <= 1000))),
    CONSTRAINT "fila_status_valido" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'processando'::"text", 'enviada'::"text", 'entregue'::"text", 'lida'::"text", 'erro'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "fila_tentativas_validas" CHECK ((("tentativas" >= 0) AND ("max_tentativas" > 0) AND ("tentativas" <= "max_tentativas")))
);


ALTER TABLE "public"."fila_mensagens" OWNER TO "postgres";


ALTER TABLE "public"."fila_mensagens" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."fila_mensagens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."formas_pagamento" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "permite_parcelamento" boolean DEFAULT false NOT NULL,
    "max_parcelas" smallint DEFAULT 1 NOT NULL,
    "taxa_percentual" numeric(7,4) DEFAULT 0 NOT NULL,
    "prazo_recebimento_dias" integer DEFAULT 0 NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    CONSTRAINT "formas_pagamento_nome_check" CHECK (("btrim"("nome") <> ''::"text")),
    CONSTRAINT "formas_pagamento_parcelas_check" CHECK ((("max_parcelas" >= 1) AND ("max_parcelas" <= 120))),
    CONSTRAINT "formas_pagamento_prazo_check" CHECK (("prazo_recebimento_dias" >= 0)),
    CONSTRAINT "formas_pagamento_taxa_check" CHECK ((("taxa_percentual" >= (0)::numeric) AND ("taxa_percentual" <= (100)::numeric))),
    CONSTRAINT "formas_pagamento_tipo_check" CHECK (("tipo" = ANY (ARRAY['dinheiro'::"text", 'pix'::"text", 'cartao_credito'::"text", 'cartao_debito'::"text", 'boleto'::"text", 'transferencia'::"text", 'outro'::"text"])))
);


ALTER TABLE "public"."formas_pagamento" OWNER TO "postgres";


ALTER TABLE "public"."formas_pagamento" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."formas_pagamento_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fornecedores" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nome" "text" NOT NULL,
    "documento" "text",
    "telefone" "text",
    "endereco" "text",
    "observacoes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nome_fantasia" "text",
    "contato_responsavel" "text",
    "email" "text",
    "ativo" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."fornecedores" OWNER TO "postgres";


ALTER TABLE "public"."fornecedores" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."fornecedores_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."funcionarios" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nome" "text" NOT NULL,
    "cpf" "text",
    "telefone" "text",
    "data_nascimento" "date",
    "endereco" "text",
    "id_empresa" bigint NOT NULL,
    "data_admissao" "date",
    "data_desligamento" "date",
    "observacoes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "usuario_empresa_id" bigint,
    "email" "text",
    "cargo" "text",
    "atende_clientes" boolean DEFAULT true NOT NULL,
    "cor_agenda" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    CONSTRAINT "funcionarios_data_nascimento_check" CHECK ((("data_nascimento" IS NULL) OR ("data_nascimento" <= CURRENT_DATE))),
    CONSTRAINT "funcionarios_datas_contrato_check" CHECK ((("data_admissao" IS NULL) OR ("data_desligamento" IS NULL) OR ("data_desligamento" >= "data_admissao")))
);


ALTER TABLE "public"."funcionarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funcionarios_ausencias" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_funcionario" bigint NOT NULL,
    "tipo" "text" NOT NULL,
    "inicio" timestamp with time zone NOT NULL,
    "fim" timestamp with time zone NOT NULL,
    "dia_inteiro" boolean DEFAULT false NOT NULL,
    "motivo" "text",
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "criado_por" "uuid",
    CONSTRAINT "funcionarios_ausencias_periodo_check" CHECK (("fim" > "inicio")),
    CONSTRAINT "funcionarios_ausencias_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'aprovado'::"text", 'cancelado'::"text"]))),
    CONSTRAINT "funcionarios_ausencias_tipo_check" CHECK (("tipo" = ANY (ARRAY['folga'::"text", 'ferias'::"text", 'atestado'::"text", 'bloqueio'::"text", 'outro'::"text"])))
);


ALTER TABLE "public"."funcionarios_ausencias" OWNER TO "postgres";


ALTER TABLE "public"."funcionarios_ausencias" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."funcionarios_ausencias_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."funcionarios_horarios" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_funcionario" bigint NOT NULL,
    "dia_semana" smallint NOT NULL,
    "hora_inicio" time without time zone NOT NULL,
    "hora_fim" time without time zone NOT NULL,
    "intervalo_inicio" time without time zone,
    "intervalo_fim" time without time zone,
    "ativo" boolean DEFAULT true NOT NULL,
    CONSTRAINT "funcionarios_horarios_dia_check" CHECK ((("dia_semana" >= 0) AND ("dia_semana" <= 6))),
    CONSTRAINT "funcionarios_horarios_intervalo_check" CHECK (((("intervalo_inicio" IS NULL) AND ("intervalo_fim" IS NULL)) OR (("intervalo_inicio" IS NOT NULL) AND ("intervalo_fim" IS NOT NULL) AND ("intervalo_inicio" >= "hora_inicio") AND ("intervalo_fim" <= "hora_fim") AND ("intervalo_fim" > "intervalo_inicio")))),
    CONSTRAINT "funcionarios_horarios_periodo_check" CHECK (("hora_fim" > "hora_inicio"))
);


ALTER TABLE "public"."funcionarios_horarios" OWNER TO "postgres";


ALTER TABLE "public"."funcionarios_horarios" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."funcionarios_horarios_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."funcionarios" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."funcionarios_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."funcionarios_remuneracoes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_funcionario" bigint NOT NULL,
    "valor" numeric(10,2) NOT NULL,
    "id_empresa" bigint NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tipo" "text" DEFAULT 'salario_base'::"text" NOT NULL,
    "vigente_desde" "date" DEFAULT CURRENT_DATE NOT NULL,
    "vigente_ate" "date",
    "observacoes" "text",
    CONSTRAINT "funcionarios_remuneracoes_tipo_check" CHECK (("tipo" = ANY (ARRAY['salario_base'::"text", 'valor_hora'::"text", 'diaria'::"text", 'outro'::"text"]))),
    CONSTRAINT "funcionarios_remuneracoes_valor_check" CHECK (("valor" >= (0)::numeric)),
    CONSTRAINT "funcionarios_remuneracoes_vigencia_check" CHECK ((("vigente_ate" IS NULL) OR ("vigente_ate" >= "vigente_desde")))
);


ALTER TABLE "public"."funcionarios_remuneracoes" OWNER TO "postgres";


ALTER TABLE "public"."funcionarios_remuneracoes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."funcionarios_remuneracoes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."funcionarios_servicos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_funcionario" bigint NOT NULL,
    "id_servico" bigint NOT NULL,
    "duracao_personalizada" integer,
    "valor_personalizado" numeric(10,2),
    "ativo" boolean DEFAULT true NOT NULL,
    "id_empresa" bigint NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "funcionarios_servicos_duracao_check" CHECK ((("duracao_personalizada" IS NULL) OR ("duracao_personalizada" > 0))),
    CONSTRAINT "funcionarios_servicos_valor_check" CHECK ((("valor_personalizado" IS NULL) OR ("valor_personalizado" >= (0)::numeric)))
);


ALTER TABLE "public"."funcionarios_servicos" OWNER TO "postgres";


ALTER TABLE "public"."funcionarios_servicos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."funcionarios_servicos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" bigint NOT NULL,
    "codigo" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "genero" "text" DEFAULT 'Indefinido'::"text" NOT NULL,
    "plataforma" "text" DEFAULT 'PC'::"text" NOT NULL,
    "preco" numeric(10,2) DEFAULT 0 NOT NULL,
    "nota" numeric(3,1) DEFAULT 0 NOT NULL,
    "ano_lancamento" smallint DEFAULT 2026 NOT NULL,
    "multiplayer" boolean DEFAULT false NOT NULL,
    "em_estoque" boolean DEFAULT true NOT NULL,
    "quantidade" integer DEFAULT 0 NOT NULL,
    "descricao" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "games_ano_lancamento_check" CHECK ((("ano_lancamento" >= 1970) AND ("ano_lancamento" <= 2100))),
    CONSTRAINT "games_nota_check" CHECK ((("nota" >= (0)::numeric) AND ("nota" <= (10)::numeric))),
    CONSTRAINT "games_preco_check" CHECK (("preco" >= (0)::numeric)),
    CONSTRAINT "games_quantidade_check" CHECK (("quantidade" >= 0))
);


ALTER TABLE "public"."games" OWNER TO "postgres";


COMMENT ON TABLE "public"."games" IS 'Dados ficticios e isolados para exercicios de automacao com n8n.';



ALTER TABLE "public"."games" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."games_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."historico_agendamentos" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_agendamento" bigint NOT NULL,
    "id_unidade" bigint NOT NULL,
    "acao" "text" NOT NULL,
    "status_anterior" "text",
    "status_novo" "text",
    "motivo" "text",
    "origem" "text" DEFAULT 'sistema'::"text" NOT NULL,
    "alterado_por" "uuid",
    "dados_anteriores" "jsonb",
    "dados_novos" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "historico_agendamentos_acao_check" CHECK (("acao" = ANY (ARRAY['criado'::"text", 'atualizado'::"text", 'confirmado'::"text", 'reagendado'::"text", 'cancelado'::"text", 'pagamento_atualizado'::"text", 'importado'::"text"])))
);


ALTER TABLE "public"."historico_agendamentos" OWNER TO "postgres";


COMMENT ON TABLE "public"."historico_agendamentos" IS 'Histórico imutável de criação, status, reagendamento, cancelamento e pagamento.';



ALTER TABLE "public"."historico_agendamentos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."historico_agendamentos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."horarios_funcionamento" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_unidade" bigint NOT NULL,
    "dia_semana" smallint NOT NULL,
    "hora_abertura" time without time zone NOT NULL,
    "hora_fechamento" time without time zone NOT NULL,
    "intervalo_inicio" time without time zone,
    "intervalo_fim" time without time zone,
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "horarios_funcionamento_dia_check" CHECK ((("dia_semana" >= 0) AND ("dia_semana" <= 6))),
    CONSTRAINT "horarios_funcionamento_intervalo_check" CHECK (((("intervalo_inicio" IS NULL) AND ("intervalo_fim" IS NULL)) OR (("intervalo_inicio" IS NOT NULL) AND ("intervalo_fim" IS NOT NULL) AND ("intervalo_inicio" > "hora_abertura") AND ("intervalo_fim" > "intervalo_inicio") AND ("intervalo_fim" < "hora_fechamento")))),
    CONSTRAINT "horarios_funcionamento_periodo_check" CHECK (("hora_fechamento" > "hora_abertura"))
);


ALTER TABLE "public"."horarios_funcionamento" OWNER TO "postgres";


COMMENT ON TABLE "public"."horarios_funcionamento" IS 'Jornada pública da unidade, separada da jornada individual dos profissionais.';



ALTER TABLE "public"."horarios_funcionamento" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."horarios_funcionamento_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."horarios_funcionarios" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_funcionario" bigint NOT NULL,
    "dia_semana" smallint NOT NULL,
    "hora_inicio" time without time zone NOT NULL,
    "hora_fim" time without time zone NOT NULL,
    "vigente_de" "date" DEFAULT CURRENT_DATE NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "vigente_ate" "date",
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_por" "uuid" DEFAULT "auth"."uid"(),
    CONSTRAINT "horarios_funcionarios_dia_check" CHECK ((("dia_semana" >= 0) AND ("dia_semana" <= 6))),
    CONSTRAINT "horarios_funcionarios_horas_check" CHECK (("hora_fim" > "hora_inicio")),
    CONSTRAINT "horarios_funcionarios_vigencia_check" CHECK ((("vigente_ate" IS NULL) OR ("vigente_ate" >= "vigente_de")))
);


ALTER TABLE "public"."horarios_funcionarios" OWNER TO "postgres";


ALTER TABLE "public"."horarios_funcionarios" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."horarios_funcionarios_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."integracoes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."integracoes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lancamentos_comissao" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_funcionario" bigint NOT NULL,
    "id_regra" bigint,
    "id_comanda" bigint,
    "tipo_origem" character varying NOT NULL,
    "descricao_snapshot" character varying NOT NULL,
    "desconto_rateado" numeric DEFAULT 0 NOT NULL,
    "base_calculo" numeric NOT NULL,
    "tipo_calculo" "text" NOT NULL,
    "valor_comissao" numeric NOT NULL,
    "valor_pago" numeric DEFAULT 0 NOT NULL,
    "status" character varying DEFAULT 'prevista'::character varying NOT NULL,
    "competencia" "date" DEFAULT CURRENT_DATE NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_comanda_item" bigint,
    "tipo_item" "text",
    "percentual_snapshot" numeric(7,4),
    "valor_fixo_snapshot" numeric(14,2),
    "momento_liberacao" "text" DEFAULT 'fechamento_comanda'::"text" NOT NULL,
    "liberada_em" timestamp with time zone,
    "estornada_em" timestamp with time zone,
    "motivo_estorno" "text",
    CONSTRAINT "lancamentos_comissao_calculo_check" CHECK (((("tipo_calculo" = 'percentual'::"text") AND ("percentual_snapshot" > (0)::numeric) AND ("percentual_snapshot" <= (100)::numeric) AND ("valor_fixo_snapshot" IS NULL)) OR (("tipo_calculo" = 'valor_fixo'::"text") AND ("valor_fixo_snapshot" > (0)::numeric) AND ("percentual_snapshot" IS NULL)))),
    CONSTRAINT "lancamentos_comissao_estorno_check" CHECK ((((("status")::"text" = 'estornada'::"text") AND ("estornada_em" IS NOT NULL) AND ("motivo_estorno" IS NOT NULL) AND ("btrim"("motivo_estorno") <> ''::"text")) OR (("status")::"text" <> 'estornada'::"text"))),
    CONSTRAINT "lancamentos_comissao_liberacao_check" CHECK (("momento_liberacao" = ANY (ARRAY['fechamento_comanda'::"text", 'pagamento_cliente'::"text"]))),
    CONSTRAINT "lancamentos_comissao_origem_referencia_check" CHECK ((((("tipo_origem")::"text" = 'comanda'::"text") AND ("id_comanda" IS NOT NULL)) OR ((("tipo_origem")::"text" = 'ajuste_manual'::"text") AND ("id_comanda" IS NULL) AND ("id_comanda_item" IS NULL) AND ("id_regra" IS NULL)))),
    CONSTRAINT "lancamentos_comissao_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['prevista'::character varying, 'liberada'::character varying, 'parcial'::character varying, 'paga'::character varying, 'estornada'::character varying])::"text"[]))),
    CONSTRAINT "lancamentos_comissao_tipo_calculo_check" CHECK (("tipo_calculo" = ANY (ARRAY['percentual'::"text", 'valor_fixo'::"text"]))),
    CONSTRAINT "lancamentos_comissao_tipo_item_check" CHECK ((("tipo_item" IS NULL) OR ("tipo_item" = ANY (ARRAY['servico'::"text", 'produto'::"text", 'outro'::"text"])))),
    CONSTRAINT "lancamentos_comissao_tipo_origem_check" CHECK ((("tipo_origem")::"text" = ANY ((ARRAY['comanda'::character varying, 'ajuste_manual'::character varying])::"text"[]))),
    CONSTRAINT "lancamentos_comissao_valores_check" CHECK ((("desconto_rateado" >= (0)::numeric) AND ("base_calculo" >= (0)::numeric) AND ("valor_comissao" > (0)::numeric) AND ("valor_pago" >= (0)::numeric) AND ("valor_pago" <= "valor_comissao")))
);


ALTER TABLE "public"."lancamentos_comissao" OWNER TO "postgres";


ALTER TABLE "public"."lancamentos_comissao" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lancamentos_comissao_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."movimentos_caixa" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_caixa" bigint NOT NULL,
    "id_sessao_caixa" bigint NOT NULL,
    "id_pagamento" bigint,
    "id_forma_pagamento" bigint,
    "tipo" "text" NOT NULL,
    "origem" "text" DEFAULT 'manual'::"text" NOT NULL,
    "status" "text" DEFAULT 'ativo'::"text" NOT NULL,
    "valor" numeric(14,2) NOT NULL,
    "descricao" "text" NOT NULL,
    "ocorrido_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "criado_por" "uuid",
    "estornado_em" timestamp with time zone,
    "estornado_por" "uuid",
    "motivo_estorno" "text",
    CONSTRAINT "movimentos_caixa_descricao_check" CHECK (("btrim"("descricao") <> ''::"text")),
    CONSTRAINT "movimentos_caixa_estorno_check" CHECK ((("status" <> 'estornado'::"text") OR (("estornado_em" IS NOT NULL) AND ("motivo_estorno" IS NOT NULL) AND ("btrim"("motivo_estorno") <> ''::"text")))),
    CONSTRAINT "movimentos_caixa_origem_check" CHECK (("origem" = ANY (ARRAY['manual'::"text", 'pagamento'::"text"]))),
    CONSTRAINT "movimentos_caixa_origem_pagamento_check" CHECK (((("origem" = 'pagamento'::"text") AND ("id_pagamento" IS NOT NULL)) OR (("origem" = 'manual'::"text") AND ("id_pagamento" IS NULL)))),
    CONSTRAINT "movimentos_caixa_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'estornado'::"text"]))),
    CONSTRAINT "movimentos_caixa_tipo_check" CHECK (("tipo" = ANY (ARRAY['entrada'::"text", 'saida'::"text", 'suprimento'::"text", 'sangria'::"text", 'ajuste_entrada'::"text", 'ajuste_saida'::"text"]))),
    CONSTRAINT "movimentos_caixa_valor_check" CHECK (("valor" > (0)::numeric))
);


ALTER TABLE "public"."movimentos_caixa" OWNER TO "postgres";


ALTER TABLE "public"."movimentos_caixa" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."movimentos_caixa_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."movimentos_estoque" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_produto" bigint NOT NULL,
    "tipo" character varying NOT NULL,
    "quantidade" numeric NOT NULL,
    "estoque_antes" numeric NOT NULL,
    "estoque_depois" numeric NOT NULL,
    "descricao" "text",
    "status" character varying DEFAULT 'ativo'::character varying NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "origem" "text" DEFAULT 'manual'::"text" NOT NULL,
    "id_compra_item" bigint,
    "id_comanda_item" bigint,
    "movimentado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "criado_por" "uuid" DEFAULT "auth"."uid"(),
    "estornado_em" timestamp with time zone,
    "estornado_por" "uuid",
    "motivo_estorno" "text",
    CONSTRAINT "movimentos_estoque_estorno_check" CHECK ((((("status")::"text" = 'ativo'::"text") AND ("estornado_em" IS NULL) AND ("estornado_por" IS NULL) AND ("motivo_estorno" IS NULL)) OR ((("status")::"text" = 'estornado'::"text") AND ("estornado_em" IS NOT NULL) AND ("motivo_estorno" IS NOT NULL) AND ("btrim"("motivo_estorno") <> ''::"text")))),
    CONSTRAINT "movimentos_estoque_origem_check" CHECK (("origem" = ANY (ARRAY['manual'::"text", 'compra'::"text", 'comanda'::"text", 'ajuste'::"text", 'devolucao'::"text"]))),
    CONSTRAINT "movimentos_estoque_origem_referencia_check" CHECK (((("origem" = 'compra'::"text") AND ("id_compra_item" IS NOT NULL) AND ("id_comanda_item" IS NULL)) OR (("origem" = 'comanda'::"text") AND ("id_comanda_item" IS NOT NULL) AND ("id_compra_item" IS NULL)) OR (("origem" <> ALL (ARRAY['compra'::"text", 'comanda'::"text"])) AND ("id_compra_item" IS NULL) AND ("id_comanda_item" IS NULL)))),
    CONSTRAINT "movimentos_estoque_quantidade_check" CHECK (("quantidade" > (0)::numeric)),
    CONSTRAINT "movimentos_estoque_saldos_check" CHECK ((("estoque_antes" >= (0)::numeric) AND ("estoque_depois" >= (0)::numeric))),
    CONSTRAINT "movimentos_estoque_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['ativo'::character varying, 'estornado'::character varying])::"text"[]))),
    CONSTRAINT "movimentos_estoque_tipo_check" CHECK ((("tipo")::"text" = ANY ((ARRAY['entrada_compra'::character varying, 'entrada_devolucao'::character varying, 'entrada_ajuste'::character varying, 'saida_venda'::character varying, 'saida_consumo'::character varying, 'saida_ajuste'::character varying])::"text"[])))
);


ALTER TABLE "public"."movimentos_estoque" OWNER TO "postgres";


ALTER TABLE "public"."movimentos_estoque" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."movimentos_estoque_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."n8n_chat_histories" (
    "id" integer NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "message" "jsonb" NOT NULL
);


ALTER TABLE "public"."n8n_chat_histories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."n8n_chat_histories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."n8n_chat_histories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."n8n_chat_histories_id_seq" OWNED BY "public"."n8n_chat_histories"."id";



CREATE OR REPLACE VIEW "public"."notificacoes" WITH ("security_invoker"='true') AS
 SELECT "id",
    "id_empresa",
    "id_cliente",
    "id_evento",
    "canal",
    "destinatario",
    "assunto" AS "titulo",
    "conteudo",
    "dados_template",
    "status",
    "prioridade",
    "agendada_para",
    "enviada_em",
    "entregue_em",
    "lida_em",
    "cancelada_em",
    "identificador_externo",
    "tentativas",
    "ultimo_erro",
    "created_at",
    "updated_at"
   FROM "public"."fila_mensagens" "m";


ALTER VIEW "public"."notificacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orcamentos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_cliente" bigint NOT NULL,
    "status" "text" DEFAULT 'rascunho'::"text" NOT NULL,
    "validade" "date",
    "observacoes" "text",
    "subtotal" numeric(14,2) DEFAULT 0 NOT NULL,
    "desconto_itens" numeric(14,2) DEFAULT 0 NOT NULL,
    "desconto" numeric(14,2) DEFAULT 0 NOT NULL,
    "acrescimo" numeric(14,2) DEFAULT 0 NOT NULL,
    "valor_total" numeric(14,2) GENERATED ALWAYS AS (GREATEST(((("subtotal" - "desconto_itens") - "desconto") + "acrescimo"), (0)::numeric)) STORED,
    "enviado_em" timestamp with time zone,
    "aprovado_em" timestamp with time zone,
    "recusado_em" timestamp with time zone,
    "convertido_em" timestamp with time zone,
    "cancelado_em" timestamp with time zone,
    "criado_por" "uuid",
    CONSTRAINT "orcamentos_status_check" CHECK (("status" = ANY (ARRAY['rascunho'::"text", 'enviado'::"text", 'aprovado'::"text", 'recusado'::"text", 'expirado'::"text", 'convertido'::"text", 'cancelado'::"text"]))),
    CONSTRAINT "orcamentos_valores_check" CHECK ((("subtotal" >= (0)::numeric) AND ("desconto_itens" >= (0)::numeric) AND ("desconto" >= (0)::numeric) AND ("acrescimo" >= (0)::numeric) AND (("desconto_itens" + "desconto") <= ("subtotal" + "acrescimo"))))
);


ALTER TABLE "public"."orcamentos" OWNER TO "postgres";


ALTER TABLE "public"."orcamentos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orcamentos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orcamentos_itens" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_orcamento" bigint NOT NULL,
    "tipo_item" "text" NOT NULL,
    "id_servico" bigint,
    "id_produto" bigint,
    "descricao_snapshot" "text" NOT NULL,
    "quantidade" numeric(12,3) DEFAULT 1 NOT NULL,
    "valor_unitario_snapshot" numeric(14,2) NOT NULL,
    "desconto" numeric(14,2) DEFAULT 0 NOT NULL,
    "valor_total" numeric(14,2) GENERATED ALWAYS AS (GREATEST((("quantidade" * "valor_unitario_snapshot") - "desconto"), (0)::numeric)) STORED,
    "ordem" integer DEFAULT 1 NOT NULL,
    "observacoes" "text",
    CONSTRAINT "orcamentos_itens_descricao_check" CHECK (("btrim"("descricao_snapshot") <> ''::"text")),
    CONSTRAINT "orcamentos_itens_referencia_check" CHECK (((("tipo_item" = 'servico'::"text") AND ("id_servico" IS NOT NULL) AND ("id_produto" IS NULL)) OR (("tipo_item" = 'produto'::"text") AND ("id_produto" IS NOT NULL) AND ("id_servico" IS NULL)) OR (("tipo_item" = 'outro'::"text") AND ("id_servico" IS NULL) AND ("id_produto" IS NULL)))),
    CONSTRAINT "orcamentos_itens_tipo_check" CHECK (("tipo_item" = ANY (ARRAY['servico'::"text", 'produto'::"text", 'outro'::"text"]))),
    CONSTRAINT "orcamentos_itens_valores_check" CHECK ((("quantidade" > (0)::numeric) AND ("valor_unitario_snapshot" >= (0)::numeric) AND ("desconto" >= (0)::numeric) AND ("desconto" <= ("quantidade" * "valor_unitario_snapshot")) AND ("ordem" > 0)))
);


ALTER TABLE "public"."orcamentos_itens" OWNER TO "postgres";


ALTER TABLE "public"."orcamentos_itens" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orcamentos_itens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pagamentos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "tipo" "text" NOT NULL,
    "id_forma_pagamento" bigint NOT NULL,
    "data_pagamento" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valor" numeric(14,2) NOT NULL,
    "valor_alocado" numeric(14,2) DEFAULT 0 NOT NULL,
    "saldo_a_alocar" numeric(14,2) GENERATED ALWAYS AS (GREATEST(("valor" - "valor_alocado"), (0)::numeric)) STORED,
    "status" "text" DEFAULT 'confirmado'::"text" NOT NULL,
    "referencia" "text",
    "observacoes" "text",
    "criado_por" "uuid",
    "estornado_em" timestamp with time zone,
    "estornado_por" "uuid",
    "motivo_estorno" "text",
    "id_sessao_caixa" bigint,
    "id_agendamento" bigint,
    "provedor" "text",
    "identificador_externo" "text",
    "chave_idempotencia" "text",
    CONSTRAINT "pagamentos_estorno_check" CHECK ((("status" <> 'estornado'::"text") OR (("estornado_em" IS NOT NULL) AND ("motivo_estorno" IS NOT NULL) AND ("btrim"("motivo_estorno") <> ''::"text")))),
    CONSTRAINT "pagamentos_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'confirmado'::"text", 'estornado'::"text"]))),
    CONSTRAINT "pagamentos_tipo_check" CHECK (("tipo" = ANY (ARRAY['entrada'::"text", 'saida'::"text"]))),
    CONSTRAINT "pagamentos_valores_check" CHECK ((("valor" > (0)::numeric) AND ("valor_alocado" >= (0)::numeric) AND ("valor_alocado" <= "valor")))
);


ALTER TABLE "public"."pagamentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pagamentos_alocacoes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_pagamento" bigint NOT NULL,
    "id_parcela" bigint NOT NULL,
    "valor" numeric(14,2) NOT NULL,
    CONSTRAINT "pagamentos_alocacoes_valor_check" CHECK (("valor" > (0)::numeric))
);


ALTER TABLE "public"."pagamentos_alocacoes" OWNER TO "postgres";


ALTER TABLE "public"."pagamentos_alocacoes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pagamentos_alocacoes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pagamentos_comissao" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_funcionario" bigint NOT NULL,
    "valor_total" numeric DEFAULT 0 NOT NULL,
    "status" character varying DEFAULT 'rascunho'::character varying NOT NULL,
    "pago_em" timestamp with time zone,
    "observacoes" "text",
    "confirmado_por" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_forma_pagamento" bigint,
    "id_sessao_caixa" bigint,
    "id_pagamento" bigint,
    "periodo_inicio" "date",
    "periodo_fim" "date",
    "criado_por" "uuid" DEFAULT "auth"."uid"(),
    "cancelado_em" timestamp with time zone,
    "motivo_cancelamento" "text",
    CONSTRAINT "pagamentos_comissao_cancelamento_check" CHECK ((((("status")::"text" = 'cancelado'::"text") AND ("cancelado_em" IS NOT NULL) AND ("motivo_cancelamento" IS NOT NULL) AND ("btrim"("motivo_cancelamento") <> ''::"text")) OR (("status")::"text" <> 'cancelado'::"text"))),
    CONSTRAINT "pagamentos_comissao_confirmacao_check" CHECK ((((("status")::"text" = 'confirmado'::"text") AND ("pago_em" IS NOT NULL) AND ("id_forma_pagamento" IS NOT NULL) AND ("valor_total" > (0)::numeric)) OR (("status")::"text" <> 'confirmado'::"text"))),
    CONSTRAINT "pagamentos_comissao_periodo_check" CHECK ((("periodo_fim" IS NULL) OR ("periodo_inicio" IS NULL) OR ("periodo_fim" >= "periodo_inicio"))),
    CONSTRAINT "pagamentos_comissao_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['rascunho'::character varying, 'confirmado'::character varying, 'cancelado'::character varying])::"text"[]))),
    CONSTRAINT "pagamentos_comissao_valor_check" CHECK (("valor_total" >= (0)::numeric))
);


ALTER TABLE "public"."pagamentos_comissao" OWNER TO "postgres";


ALTER TABLE "public"."pagamentos_comissao" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pagamentos_comissao_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pagamentos_comissao_itens" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_pagamento_comissao" bigint NOT NULL,
    "id_lancamento_comissao" bigint NOT NULL,
    "valor" numeric(14,2) NOT NULL,
    CONSTRAINT "pagamentos_comissao_itens_valor_check" CHECK (("valor" > (0)::numeric))
);


ALTER TABLE "public"."pagamentos_comissao_itens" OWNER TO "postgres";


ALTER TABLE "public"."pagamentos_comissao_itens" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pagamentos_comissao_itens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."pagamentos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pagamentos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."permissoes_planos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plano_id" bigint NOT NULL,
    "funcionalidade" character varying NOT NULL,
    "ativo" boolean DEFAULT false NOT NULL,
    "limite" integer,
    "ilimitado" boolean DEFAULT false NOT NULL,
    CONSTRAINT "permissoes_planos_ilimitado_check" CHECK (((NOT "ilimitado") OR ("limite" IS NULL))),
    CONSTRAINT "permissoes_planos_limite_check" CHECK ((("limite" IS NULL) OR ("limite" >= 0)))
);


ALTER TABLE "public"."permissoes_planos" OWNER TO "postgres";


ALTER TABLE "public"."permissoes_planos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."permissoes_planos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."permissoes_usuarios" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "usuario_empresa_id" bigint NOT NULL,
    "modulo" "text" NOT NULL,
    "permitido" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_por" "uuid",
    CONSTRAINT "permissoes_usuarios_modulo_check" CHECK (("modulo" = ANY (ARRAY['dashboard'::"text", 'agendamentos'::"text", 'clientes'::"text", 'comandas'::"text", 'orcamentos'::"text", 'funcionarios'::"text", 'servicos'::"text", 'produtos'::"text", 'fornecedores'::"text", 'financeiro'::"text", 'comissoes'::"text", 'estoque'::"text", 'historico'::"text", 'configuracoes'::"text"])))
);


ALTER TABLE "public"."permissoes_usuarios" OWNER TO "postgres";


COMMENT ON TABLE "public"."permissoes_usuarios" IS 'Restrições adicionais de módulos por usuário. Não concede acesso além do cargo e do plano.';



ALTER TABLE "public"."permissoes_usuarios" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."permissoes_usuarios_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."planos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nome" character varying NOT NULL,
    "descricao" character varying,
    "versao" integer DEFAULT 1 NOT NULL,
    "valor_mensal" numeric(10,2) DEFAULT 0 NOT NULL,
    "valor_anual" numeric(10,2) DEFAULT 0 NOT NULL,
    "codigo" "text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "publico" boolean DEFAULT true NOT NULL,
    CONSTRAINT "planos_valor_anual_check" CHECK (("valor_anual" >= (0)::numeric)),
    CONSTRAINT "planos_valor_mensal_check" CHECK (("valor_mensal" >= (0)::numeric)),
    CONSTRAINT "planos_versao_check" CHECK (("versao" > 0))
);


ALTER TABLE "public"."planos" OWNER TO "postgres";


ALTER TABLE "public"."planos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."planos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."politicas_cancelamento" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_unidade" bigint,
    "antecedencia_cancelamento_minutos" integer DEFAULT 1440 NOT NULL,
    "antecedencia_reagendamento_minutos" integer DEFAULT 1440 NOT NULL,
    "antecedencia_agendamento_minutos" integer DEFAULT 120 NOT NULL,
    "janela_agendamento_dias" integer DEFAULT 60 NOT NULL,
    "tolerancia_atraso_minutos" integer DEFAULT 15 NOT NULL,
    "reter_sinal_fora_prazo" boolean DEFAULT true NOT NULL,
    "multa_cancelamento_percentual" numeric(5,2) DEFAULT 0 NOT NULL,
    "texto_publico" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "vigente_desde" "date" DEFAULT CURRENT_DATE NOT NULL,
    "vigente_ate" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "politicas_cancelamento_prazos_check" CHECK ((("antecedencia_cancelamento_minutos" >= 0) AND ("antecedencia_reagendamento_minutos" >= 0) AND ("antecedencia_agendamento_minutos" >= 0) AND (("janela_agendamento_dias" >= 1) AND ("janela_agendamento_dias" <= 365)) AND (("tolerancia_atraso_minutos" >= 0) AND ("tolerancia_atraso_minutos" <= 180)) AND (("multa_cancelamento_percentual" >= (0)::numeric) AND ("multa_cancelamento_percentual" <= (100)::numeric)))),
    CONSTRAINT "politicas_cancelamento_vigencia_check" CHECK ((("vigente_ate" IS NULL) OR ("vigente_ate" >= "vigente_desde")))
);


ALTER TABLE "public"."politicas_cancelamento" OWNER TO "postgres";


COMMENT ON TABLE "public"."politicas_cancelamento" IS 'Regras de antecedência, atraso, sinal e cancelamento por empresa ou unidade.';



ALTER TABLE "public"."politicas_cancelamento" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."politicas_cancelamento_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."preferencias_lembrete" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_cliente" bigint NOT NULL,
    "whatsapp" boolean DEFAULT true NOT NULL,
    "email" boolean DEFAULT true NOT NULL,
    "sms" boolean DEFAULT false NOT NULL,
    "push" boolean DEFAULT false NOT NULL,
    "antecedencias_minutos" integer[] DEFAULT ARRAY[1440, 120] NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "origem" "text" DEFAULT 'painel'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "preferencias_lembrete_antecedencias_check" CHECK ((("array_length"("antecedencias_minutos", 1) IS NULL) OR (0 < ALL ("antecedencias_minutos"))))
);


ALTER TABLE "public"."preferencias_lembrete" OWNER TO "postgres";


COMMENT ON TABLE "public"."preferencias_lembrete" IS 'Preferências persistentes de comunicação do cliente por empresa.';



ALTER TABLE "public"."preferencias_lembrete" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."preferencias_lembrete_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."produtos" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "estoque_atual" numeric(12,3) DEFAULT 0 NOT NULL,
    "estoque_minimo" numeric(12,3) DEFAULT 0 NOT NULL,
    "codigo" "text",
    "preco_venda" numeric(10,2),
    "custo_medio" numeric(10,2),
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "unidade_medida" "text" DEFAULT 'un'::"text" NOT NULL,
    "finalidade" "text" DEFAULT 'ambos'::"text" NOT NULL,
    "controla_estoque" boolean DEFAULT true NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    CONSTRAINT "produtos_custo_medio_check" CHECK ((("custo_medio" IS NULL) OR ("custo_medio" >= (0)::numeric))),
    CONSTRAINT "produtos_estoque_atual_check" CHECK (("estoque_atual" >= (0)::numeric)),
    CONSTRAINT "produtos_estoque_minimo_check" CHECK (("estoque_minimo" >= (0)::numeric)),
    CONSTRAINT "produtos_finalidade_check" CHECK (("finalidade" = ANY (ARRAY['venda'::"text", 'consumo_interno'::"text", 'ambos'::"text"]))),
    CONSTRAINT "produtos_preco_venda_check" CHECK ((("preco_venda" IS NULL) OR ("preco_venda" >= (0)::numeric))),
    CONSTRAINT "produtos_unidade_medida_check" CHECK (("btrim"("unidade_medida") <> ''::"text"))
);


ALTER TABLE "public"."produtos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."produtos_fornecedores" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_produto" bigint NOT NULL,
    "id_fornecedor" bigint NOT NULL,
    "codigo_produto_fornecedor" "text",
    "ultimo_custo" numeric(10,2),
    "prazo_entrega_dias" integer,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fornecedor_principal" boolean DEFAULT false NOT NULL,
    CONSTRAINT "produtos_fornecedores_prazo_check" CHECK ((("prazo_entrega_dias" IS NULL) OR ("prazo_entrega_dias" >= 0))),
    CONSTRAINT "produtos_fornecedores_ultimo_custo_check" CHECK ((("ultimo_custo" IS NULL) OR ("ultimo_custo" >= (0)::numeric)))
);


ALTER TABLE "public"."produtos_fornecedores" OWNER TO "postgres";


ALTER TABLE "public"."produtos_fornecedores" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."produtos_fornecedores_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."produtos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."produtos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."profissionais" WITH ("security_invoker"='true') AS
 SELECT "id",
    "created_at",
    "nome",
    "cpf",
    "telefone",
    "data_nascimento",
    "endereco",
    "id_empresa",
    "data_admissao",
    "data_desligamento",
    "observacoes",
    "updated_at",
    "usuario_empresa_id",
    "email",
    "cargo",
    "atende_clientes",
    "cor_agenda",
    "ativo"
   FROM "public"."funcionarios" "f"
  WHERE "atende_clientes";


ALTER VIEW "public"."profissionais" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profissionais_servicos" WITH ("security_invoker"='true') AS
 SELECT "id",
    "created_at",
    "id_funcionario",
    "id_servico",
    "duracao_personalizada",
    "valor_personalizado",
    "ativo",
    "id_empresa",
    "updated_at"
   FROM "public"."funcionarios_servicos" "fs";


ALTER VIEW "public"."profissionais_servicos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."servicos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "nome" "text" NOT NULL,
    "duracao_minutos" integer DEFAULT 60 NOT NULL,
    "intervalo_minutos" integer DEFAULT 0 NOT NULL,
    "preco" numeric(10,2) DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "descricao" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "permite_agendamento_online" boolean DEFAULT true NOT NULL,
    "exige_sinal" boolean DEFAULT false NOT NULL,
    "sinal_tipo" "text",
    "sinal_valor" numeric(10,2),
    CONSTRAINT "servicos_duracao_check" CHECK (("duracao_minutos" > 0)),
    CONSTRAINT "servicos_intervalo_check" CHECK (("intervalo_minutos" >= 0)),
    CONSTRAINT "servicos_preco_check" CHECK (("preco" >= (0)::numeric)),
    CONSTRAINT "servicos_sinal_check" CHECK ((((NOT "exige_sinal") AND ("sinal_tipo" IS NULL) AND ("sinal_valor" IS NULL)) OR ("exige_sinal" AND ("sinal_tipo" = ANY (ARRAY['percentual'::"text", 'valor_fixo'::"text"])) AND ("sinal_valor" > (0)::numeric) AND (("sinal_tipo" = 'valor_fixo'::"text") OR ("sinal_valor" <= (100)::numeric)))))
);


ALTER TABLE "public"."servicos" OWNER TO "postgres";


ALTER TABLE "public"."servicos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."servicos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sessoes_caixa" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_caixa" bigint NOT NULL,
    "status" "text" DEFAULT 'aberta'::"text" NOT NULL,
    "aberta_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "aberta_por" "uuid",
    "saldo_inicial" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_entradas" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_saidas" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_suprimentos" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_sangrias" numeric(14,2) DEFAULT 0 NOT NULL,
    "saldo_esperado" numeric(14,2) GENERATED ALWAYS AS ((((("saldo_inicial" + "total_entradas") + "total_suprimentos") - "total_saidas") - "total_sangrias")) STORED,
    "fechada_em" timestamp with time zone,
    "fechada_por" "uuid",
    "saldo_final_informado" numeric(14,2),
    "diferenca" numeric(14,2) GENERATED ALWAYS AS (
CASE
    WHEN ("saldo_final_informado" IS NULL) THEN NULL::numeric
    ELSE ("saldo_final_informado" - (((("saldo_inicial" + "total_entradas") + "total_suprimentos") - "total_saidas") - "total_sangrias"))
END) STORED,
    "observacoes_abertura" "text",
    "observacoes_fechamento" "text",
    "cancelada_em" timestamp with time zone,
    "cancelada_por" "uuid",
    "motivo_cancelamento" "text",
    CONSTRAINT "sessoes_caixa_ciclo_check" CHECK (((("status" = 'aberta'::"text") AND ("fechada_em" IS NULL) AND ("saldo_final_informado" IS NULL) AND ("cancelada_em" IS NULL)) OR (("status" = 'fechada'::"text") AND ("fechada_em" IS NOT NULL) AND ("saldo_final_informado" IS NOT NULL) AND ("cancelada_em" IS NULL)) OR (("status" = 'cancelada'::"text") AND ("cancelada_em" IS NOT NULL) AND ("motivo_cancelamento" IS NOT NULL) AND ("btrim"("motivo_cancelamento") <> ''::"text") AND ("fechada_em" IS NULL)))),
    CONSTRAINT "sessoes_caixa_status_check" CHECK (("status" = ANY (ARRAY['aberta'::"text", 'fechada'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "sessoes_caixa_valores_check" CHECK ((("saldo_inicial" >= (0)::numeric) AND ("total_entradas" >= (0)::numeric) AND ("total_saidas" >= (0)::numeric) AND ("total_suprimentos" >= (0)::numeric) AND ("total_sangrias" >= (0)::numeric) AND (("saldo_final_informado" IS NULL) OR ("saldo_final_informado" >= (0)::numeric))))
);


ALTER TABLE "public"."sessoes_caixa" OWNER TO "postgres";


ALTER TABLE "public"."sessoes_caixa" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sessoes_caixa_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sites_publicos" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_unidade_principal" bigint,
    "slug" "text" NOT NULL,
    "publicado" boolean DEFAULT false NOT NULL,
    "nome_publico" "text",
    "titulo_hero" "text",
    "destaque_hero" "text",
    "descricao_hero" "text",
    "titulo_sobre" "text",
    "descricao_sobre" "text",
    "imagem_hero_url" "text",
    "imagem_compartilhamento_url" "text",
    "instagram_url" "text",
    "whatsapp" "text",
    "email_publico" "text",
    "texto_rodape" "text",
    "titulo_seo" "text",
    "descricao_seo" "text",
    "palavras_chave" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "diferenciais" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "perguntas_frequentes" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "mostrar_precos" boolean DEFAULT true NOT NULL,
    "mostrar_profissionais" boolean DEFAULT true NOT NULL,
    "mostrar_avaliacoes" boolean DEFAULT false NOT NULL,
    "mostrar_endereco" boolean DEFAULT true NOT NULL,
    "mostrar_horarios" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_por" "uuid" DEFAULT "auth"."uid"(),
    CONSTRAINT "sites_publicos_diferenciais_array_check" CHECK (("jsonb_typeof"("diferenciais") = 'array'::"text")),
    CONSTRAINT "sites_publicos_faq_array_check" CHECK (("jsonb_typeof"("perguntas_frequentes") = 'array'::"text")),
    CONSTRAINT "sites_publicos_slug_formato_check" CHECK ((("slug" = "lower"("slug")) AND ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::"text")))
);


ALTER TABLE "public"."sites_publicos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sites_publicos_dominios" (
    "id" bigint NOT NULL,
    "id_site" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "dominio" "text" NOT NULL,
    "principal" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sites_publicos_dominios_formato_check" CHECK ((("dominio" = "lower"("dominio")) AND ("dominio" !~ '(^https?://|/|:)'::"text") AND (("length"("dominio") >= 1) AND ("length"("dominio") <= 253))))
);


ALTER TABLE "public"."sites_publicos_dominios" OWNER TO "postgres";


ALTER TABLE "public"."sites_publicos_dominios" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sites_publicos_dominios_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."sites_publicos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sites_publicos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."solicitacoes_privacidade" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "id_cliente" bigint NOT NULL,
    "tipo" "text" DEFAULT 'exclusao'::"text" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "motivo" "text",
    "solicitado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processado_em" timestamp with time zone,
    "processado_por" "uuid",
    "observacoes_internas" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "solicitacoes_privacidade_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'em_analise'::"text", 'concluida'::"text", 'recusada'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "solicitacoes_privacidade_tipo_check" CHECK (("tipo" = ANY (ARRAY['exclusao'::"text", 'exportacao'::"text", 'correcao'::"text"])))
);


ALTER TABLE "public"."solicitacoes_privacidade" OWNER TO "postgres";


COMMENT ON TABLE "public"."solicitacoes_privacidade" IS 'Solicitacoes LGPD do cliente; exclusao e analisada antes de remover dados com retencao obrigatoria.';



ALTER TABLE "public"."solicitacoes_privacidade" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."solicitacoes_privacidade_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."unidades" (
    "id" bigint NOT NULL,
    "id_empresa" bigint NOT NULL,
    "nome" "text" NOT NULL,
    "codigo" "text" NOT NULL,
    "telefone" "text",
    "email" "text",
    "endereco" "text",
    "numero" "text",
    "complemento" "text",
    "bairro" "text",
    "cidade" "text",
    "estado" "text",
    "cep" "text",
    "fuso_horario" "text" DEFAULT 'America/Sao_Paulo'::"text" NOT NULL,
    "principal" boolean DEFAULT false NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "unidades_codigo_check" CHECK (("codigo" ~ '^[a-z0-9][a-z0-9-]{1,59}$'::"text")),
    CONSTRAINT "unidades_nome_check" CHECK ((("char_length"("btrim"("nome")) >= 2) AND ("char_length"("btrim"("nome")) <= 120)))
);


ALTER TABLE "public"."unidades" OWNER TO "postgres";


COMMENT ON TABLE "public"."unidades" IS 'Unidades físicas de cada empresa; todo agendamento pertence a uma unidade.';



ALTER TABLE "public"."unidades" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."unidades_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."usuarios_empresas" (
    "id" bigint NOT NULL,
    "empresa_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tipo" "public"."tipos_usuarios" NOT NULL,
    "status" "public"."status_usuario_empresa" DEFAULT 'ativo'::"public"."status_usuario_empresa" NOT NULL
);


ALTER TABLE "public"."usuarios_empresas" OWNER TO "postgres";


ALTER TABLE "public"."usuarios_empresas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."usuarios_empresas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."n8n_chat_histories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."n8n_chat_histories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agendamentos"
    ADD CONSTRAINT "agendamentos_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."agendamentos"
    ADD CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agendamentos_servicos"
    ADD CONSTRAINT "agendamentos_servicos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agendamentos_servicos"
    ADD CONSTRAINT "agendamentos_servicos_profissional_periodo_excl" EXCLUDE USING "gist" ("id_empresa" WITH =, "id_funcionario" WITH =, "tstzrange"("inicio", "fim", '[)'::"text") WITH &&) WHERE (("status" <> ALL (ARRAY['cancelado'::"text", 'concluido'::"text"])));



COMMENT ON CONSTRAINT "agendamentos_servicos_profissional_periodo_excl" ON "public"."agendamentos_servicos" IS 'Impede no banco dois atendimentos ativos simultaneos do mesmo profissional.';



ALTER TABLE ONLY "public"."agendamentos_servicos"
    ADD CONSTRAINT "agendamentos_servicos_sem_conflito_profissional" EXCLUDE USING "gist" ("id_funcionario" WITH =, "tstzrange"("inicio", "fim", '[)'::"text") WITH &&) WHERE (("status" = ANY (ARRAY['reservado'::"text", 'em_execucao'::"text"])));



ALTER TABLE ONLY "public"."assinaturas"
    ADD CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auditorias"
    ADD CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ausencias_funcionarios"
    ADD CONSTRAINT "ausencias_funcionarios_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."ausencias_funcionarios"
    ADD CONSTRAINT "ausencias_funcionarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."avaliacoes"
    ADD CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bloqueios_agenda"
    ADD CONSTRAINT "bloqueios_agenda_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."bloqueios_agenda"
    ADD CONSTRAINT "bloqueios_agenda_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."caixas"
    ADD CONSTRAINT "caixas_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."caixas"
    ADD CONSTRAINT "caixas_empresa_nome_unique" UNIQUE ("id_empresa", "nome");



ALTER TABLE ONLY "public"."caixas"
    ADD CONSTRAINT "caixas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorias_financeiras"
    ADD CONSTRAINT "categorias_financeiras_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."categorias_financeiras"
    ADD CONSTRAINT "categorias_financeiras_empresa_nome_unique" UNIQUE ("id_empresa", "nome");



ALTER TABLE ONLY "public"."categorias_financeiras"
    ADD CONSTRAINT "categorias_financeiras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_empresa_id_id_key" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comandas"
    ADD CONSTRAINT "comandas_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."comandas_itens"
    ADD CONSTRAINT "comandas_itens_comanda_ordem_unique" UNIQUE ("id_comanda", "ordem");



ALTER TABLE ONLY "public"."comandas_itens"
    ADD CONSTRAINT "comandas_itens_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."comandas_itens"
    ADD CONSTRAINT "comandas_itens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comandas"
    ADD CONSTRAINT "comandas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comissoes_regras"
    ADD CONSTRAINT "comissoes_regras_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."comissoes_regras"
    ADD CONSTRAINT "comissoes_regras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compras"
    ADD CONSTRAINT "compras_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."compras_itens"
    ADD CONSTRAINT "compras_itens_compra_produto_unique" UNIQUE ("id_compra", "id_produto");



ALTER TABLE ONLY "public"."compras_itens"
    ADD CONSTRAINT "compras_itens_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."compras_itens"
    ADD CONSTRAINT "compras_itens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compras"
    ADD CONSTRAINT "compras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracoes_empresas"
    ADD CONSTRAINT "configuracoes_empresas_id_empresa_key" UNIQUE ("id_empresa");



ALTER TABLE ONLY "public"."configuracoes_empresas"
    ADD CONSTRAINT "configuracoes_empresas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consentimentos_comunicacao"
    ADD CONSTRAINT "consentimentos_cliente_canal_finalidade_key" UNIQUE ("id_empresa", "id_cliente", "canal", "finalidade");



ALTER TABLE ONLY "public"."consentimentos_comunicacao"
    ADD CONSTRAINT "consentimentos_comunicacao_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."contas_parcelas"
    ADD CONSTRAINT "contas_parcelas_conta_numero_unique" UNIQUE ("id_conta", "numero_parcela");



ALTER TABLE ONLY "public"."contas_parcelas"
    ADD CONSTRAINT "contas_parcelas_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."contas_parcelas"
    ADD CONSTRAINT "contas_parcelas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."convites_empresa"
    ADD CONSTRAINT "convites_empresa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disponibilidades"
    ADD CONSTRAINT "disponibilidades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."empresas"
    ADD CONSTRAINT "empresas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eventos_sistema"
    ADD CONSTRAINT "eventos_empresa_id_id_key" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."eventos_sistema"
    ADD CONSTRAINT "eventos_sistema_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fila_mensagens"
    ADD CONSTRAINT "fila_mensagens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formas_pagamento"
    ADD CONSTRAINT "formas_pagamento_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."formas_pagamento"
    ADD CONSTRAINT "formas_pagamento_empresa_nome_unique" UNIQUE ("id_empresa", "nome");



ALTER TABLE ONLY "public"."formas_pagamento"
    ADD CONSTRAINT "formas_pagamento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fornecedores"
    ADD CONSTRAINT "fornecedores_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."fornecedores"
    ADD CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funcionarios_ausencias"
    ADD CONSTRAINT "funcionarios_ausencias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funcionarios_ausencias"
    ADD CONSTRAINT "funcionarios_ausencias_sem_sobreposicao" EXCLUDE USING "gist" ("id_funcionario" WITH =, "tstzrange"("inicio", "fim", '[)'::"text") WITH &&) WHERE (("status" = 'aprovado'::"text"));



ALTER TABLE ONLY "public"."funcionarios"
    ADD CONSTRAINT "funcionarios_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."funcionarios_horarios"
    ADD CONSTRAINT "funcionarios_horarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funcionarios_horarios"
    ADD CONSTRAINT "funcionarios_horarios_sem_sobreposicao" EXCLUDE USING "gist" ("id_funcionario" WITH =, "int4range"((((("dia_semana")::integer * 1440) + ((EXTRACT(hour FROM "hora_inicio"))::integer * 60)) + (EXTRACT(minute FROM "hora_inicio"))::integer), (((("dia_semana")::integer * 1440) + ((EXTRACT(hour FROM "hora_fim"))::integer * 60)) + (EXTRACT(minute FROM "hora_fim"))::integer), '[)'::"text") WITH &&) WHERE ("ativo");



ALTER TABLE ONLY "public"."funcionarios_horarios"
    ADD CONSTRAINT "funcionarios_horarios_unique" UNIQUE ("id_empresa", "id_funcionario", "dia_semana", "hora_inicio", "hora_fim");



ALTER TABLE ONLY "public"."funcionarios"
    ADD CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funcionarios_remuneracoes"
    ADD CONSTRAINT "funcionarios_remuneracoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funcionarios_remuneracoes"
    ADD CONSTRAINT "funcionarios_remuneracoes_sem_vigencia_sobreposta" EXCLUDE USING "gist" ("id_funcionario" WITH =, "tipo" WITH =, "daterange"("vigente_desde", COALESCE(("vigente_ate" + 1), 'infinity'::"date"), '[)'::"text") WITH &&);



ALTER TABLE ONLY "public"."funcionarios_remuneracoes"
    ADD CONSTRAINT "funcionarios_remuneracoes_unique" UNIQUE ("id_empresa", "id_funcionario", "tipo", "vigente_desde");



ALTER TABLE ONLY "public"."funcionarios_servicos"
    ADD CONSTRAINT "funcionarios_servicos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funcionarios_servicos"
    ADD CONSTRAINT "funcionarios_servicos_unique" UNIQUE ("id_empresa", "id_funcionario", "id_servico");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_codigo_unique" UNIQUE ("codigo");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historico_agendamentos"
    ADD CONSTRAINT "historico_agendamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."horarios_funcionamento"
    ADD CONSTRAINT "horarios_funcionamento_dia_unique" UNIQUE ("id_empresa", "id_unidade", "dia_semana");



ALTER TABLE ONLY "public"."horarios_funcionamento"
    ADD CONSTRAINT "horarios_funcionamento_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."horarios_funcionamento"
    ADD CONSTRAINT "horarios_funcionamento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."horarios_funcionarios"
    ADD CONSTRAINT "horarios_funcionarios_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."horarios_funcionarios"
    ADD CONSTRAINT "horarios_funcionarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integracoes"
    ADD CONSTRAINT "integracoes_empresa_id_id_key" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."integracoes"
    ADD CONSTRAINT "integracoes_empresa_tipo_provedor_unique" UNIQUE ("id_empresa", "tipo", "provedor");



ALTER TABLE ONLY "public"."integracoes"
    ADD CONSTRAINT "integracoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lancamentos_comissao"
    ADD CONSTRAINT "lancamentos_comissao_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."lancamentos_comissao"
    ADD CONSTRAINT "lancamentos_comissao_item_unique" UNIQUE ("id_comanda_item");



ALTER TABLE ONLY "public"."lancamentos_comissao"
    ADD CONSTRAINT "lancamentos_comissao_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimentos_caixa"
    ADD CONSTRAINT "movimentos_caixa_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."movimentos_caixa"
    ADD CONSTRAINT "movimentos_caixa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."n8n_chat_histories"
    ADD CONSTRAINT "n8n_chat_histories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."orcamentos_itens"
    ADD CONSTRAINT "orcamentos_itens_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."orcamentos_itens"
    ADD CONSTRAINT "orcamentos_itens_orcamento_ordem_unique" UNIQUE ("id_orcamento", "ordem");



ALTER TABLE ONLY "public"."orcamentos_itens"
    ADD CONSTRAINT "orcamentos_itens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamentos_alocacoes"
    ADD CONSTRAINT "pagamentos_alocacoes_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos_alocacoes"
    ADD CONSTRAINT "pagamentos_alocacoes_pagamento_parcela_unique" UNIQUE ("id_pagamento", "id_parcela");



ALTER TABLE ONLY "public"."pagamentos_alocacoes"
    ADD CONSTRAINT "pagamentos_alocacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamentos_comissao"
    ADD CONSTRAINT "pagamentos_comissao_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos_comissao_itens"
    ADD CONSTRAINT "pagamentos_comissao_itens_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos_comissao_itens"
    ADD CONSTRAINT "pagamentos_comissao_itens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamentos_comissao_itens"
    ADD CONSTRAINT "pagamentos_comissao_itens_unique" UNIQUE ("id_pagamento_comissao", "id_lancamento_comissao");



ALTER TABLE ONLY "public"."pagamentos_comissao"
    ADD CONSTRAINT "pagamentos_comissao_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamentos"
    ADD CONSTRAINT "pagamentos_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos"
    ADD CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissoes_planos"
    ADD CONSTRAINT "permissoes_planos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissoes_planos"
    ADD CONSTRAINT "permissoes_planos_plano_func_unique" UNIQUE ("plano_id", "funcionalidade");



ALTER TABLE ONLY "public"."permissoes_usuarios"
    ADD CONSTRAINT "permissoes_usuarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissoes_usuarios"
    ADD CONSTRAINT "permissoes_usuarios_unique" UNIQUE ("id_empresa", "usuario_empresa_id", "modulo");



ALTER TABLE ONLY "public"."planos"
    ADD CONSTRAINT "planos_codigo_unique" UNIQUE ("codigo");



ALTER TABLE ONLY "public"."planos"
    ADD CONSTRAINT "planos_nome_unique" UNIQUE ("nome");



ALTER TABLE ONLY "public"."planos"
    ADD CONSTRAINT "planos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."politicas_cancelamento"
    ADD CONSTRAINT "politicas_cancelamento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preferencias_lembrete"
    ADD CONSTRAINT "preferencias_lembrete_cliente_unique" UNIQUE ("id_empresa", "id_cliente");



ALTER TABLE ONLY "public"."preferencias_lembrete"
    ADD CONSTRAINT "preferencias_lembrete_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."produtos_fornecedores"
    ADD CONSTRAINT "produtos_fornecedores_empresa_produto_fornecedor_unique" UNIQUE ("id_empresa", "id_produto", "id_fornecedor");



ALTER TABLE ONLY "public"."produtos_fornecedores"
    ADD CONSTRAINT "produtos_fornecedores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."servicos"
    ADD CONSTRAINT "servicos_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."servicos"
    ADD CONSTRAINT "servicos_empresa_nome_unique" UNIQUE ("id_empresa", "nome");



ALTER TABLE ONLY "public"."servicos"
    ADD CONSTRAINT "servicos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessoes_caixa"
    ADD CONSTRAINT "sessoes_caixa_empresa_caixa_id_unique" UNIQUE ("id_empresa", "id_caixa", "id");



ALTER TABLE ONLY "public"."sessoes_caixa"
    ADD CONSTRAINT "sessoes_caixa_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."sessoes_caixa"
    ADD CONSTRAINT "sessoes_caixa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sites_publicos_dominios"
    ADD CONSTRAINT "sites_publicos_dominios_dominio_key" UNIQUE ("dominio");



ALTER TABLE ONLY "public"."sites_publicos_dominios"
    ADD CONSTRAINT "sites_publicos_dominios_empresa_site_unique" UNIQUE ("id_empresa", "id_site", "dominio");



ALTER TABLE ONLY "public"."sites_publicos_dominios"
    ADD CONSTRAINT "sites_publicos_dominios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sites_publicos"
    ADD CONSTRAINT "sites_publicos_id_empresa_key" UNIQUE ("id_empresa");



ALTER TABLE ONLY "public"."sites_publicos"
    ADD CONSTRAINT "sites_publicos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sites_publicos"
    ADD CONSTRAINT "sites_publicos_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."solicitacoes_privacidade"
    ADD CONSTRAINT "solicitacoes_privacidade_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unidades"
    ADD CONSTRAINT "unidades_empresa_codigo_unique" UNIQUE ("id_empresa", "codigo");



ALTER TABLE ONLY "public"."unidades"
    ADD CONSTRAINT "unidades_empresa_id_unique" UNIQUE ("id_empresa", "id");



ALTER TABLE ONLY "public"."unidades"
    ADD CONSTRAINT "unidades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios_empresas"
    ADD CONSTRAINT "usuarios_empresas_empresa_id_id_unique" UNIQUE ("empresa_id", "id");



ALTER TABLE ONLY "public"."usuarios_empresas"
    ADD CONSTRAINT "usuarios_empresas_empresa_user_unique" UNIQUE ("empresa_id", "user_id");



ALTER TABLE ONLY "public"."usuarios_empresas"
    ADD CONSTRAINT "usuarios_empresas_pkey" PRIMARY KEY ("id");



CREATE INDEX "agendamentos_empresa_cliente_inicio_idx" ON "public"."agendamentos" USING "btree" ("id_empresa", "id_cliente", "inicio" DESC);



CREATE INDEX "agendamentos_empresa_inicio_idx" ON "public"."agendamentos" USING "btree" ("id_empresa", "inicio");



CREATE INDEX "agendamentos_empresa_status_inicio_idx" ON "public"."agendamentos" USING "btree" ("id_empresa", "status", "inicio");



CREATE INDEX "agendamentos_servicos_empresa_agendamento_idx" ON "public"."agendamentos_servicos" USING "btree" ("id_empresa", "id_agendamento");



CREATE INDEX "agendamentos_servicos_empresa_funcionario_inicio_idx" ON "public"."agendamentos_servicos" USING "btree" ("id_empresa", "id_funcionario", "inicio");



CREATE INDEX "agendamentos_servicos_empresa_servico_idx" ON "public"."agendamentos_servicos" USING "btree" ("id_empresa", "id_servico");



CREATE UNIQUE INDEX "agendamentos_servicos_ordem_ativa_unique" ON "public"."agendamentos_servicos" USING "btree" ("id_empresa", "id_agendamento", "ordem") WHERE ("status" <> 'cancelado'::"text");



CREATE UNIQUE INDEX "agendamentos_site_access_token_unique" ON "public"."agendamentos" USING "btree" ("site_access_token") WHERE ("site_access_token" IS NOT NULL);



CREATE UNIQUE INDEX "agendamentos_site_booking_key_unique" ON "public"."agendamentos" USING "btree" ("id_empresa", "site_booking_key") WHERE ("site_booking_key" IS NOT NULL);



CREATE UNIQUE INDEX "assinaturas_empresa_corrente_unique" ON "public"."assinaturas" USING "btree" ("id_empresa") WHERE ("status" = ANY (ARRAY['teste'::"public"."status_assinatura", 'ativa'::"public"."status_assinatura", 'inadimplente'::"public"."status_assinatura", 'suspensa'::"public"."status_assinatura"]));



CREATE INDEX "assinaturas_empresa_idx" ON "public"."assinaturas" USING "btree" ("id_empresa");



CREATE INDEX "assinaturas_plano_idx" ON "public"."assinaturas" USING "btree" ("id_plano");



CREATE INDEX "assinaturas_status_idx" ON "public"."assinaturas" USING "btree" ("status");



CREATE INDEX "auditorias_acao_data_idx" ON "public"."auditorias" USING "btree" ("acao", "created_at" DESC);



CREATE INDEX "auditorias_empresa_data_idx" ON "public"."auditorias" USING "btree" ("id_empresa", "created_at" DESC);



CREATE INDEX "auditorias_empresa_tabela_data_idx" ON "public"."auditorias" USING "btree" ("id_empresa", "tabela", "created_at" DESC);



CREATE INDEX "auditorias_tabela_registro_idx" ON "public"."auditorias" USING "btree" ("tabela", "registro_id");



CREATE INDEX "auditorias_usuario_data_idx" ON "public"."auditorias" USING "btree" ("usuario_id", "created_at" DESC) WHERE ("usuario_id" IS NOT NULL);



CREATE INDEX "ausencias_funcionarios_periodo_idx" ON "public"."ausencias_funcionarios" USING "btree" ("id_empresa", "id_funcionario", "inicio", "fim") WHERE ("status" = 'ativa'::"text");



CREATE UNIQUE INDEX "avaliacoes_agendamento_unique" ON "public"."avaliacoes" USING "btree" ("id_empresa", "id_agendamento") WHERE ("id_agendamento" IS NOT NULL);



CREATE INDEX "avaliacoes_publicadas_idx" ON "public"."avaliacoes" USING "btree" ("id_empresa", "destaque" DESC, "created_at" DESC) WHERE (("status" = 'aprovada'::"text") AND "autorizado_publicacao");



CREATE INDEX "bloqueios_agenda_periodo_idx" ON "public"."bloqueios_agenda" USING "btree" ("id_empresa", "id_funcionario", "inicio", "fim") WHERE (("status")::"text" = 'ativo'::"text");



CREATE UNIQUE INDEX "caixas_empresa_codigo_unique" ON "public"."caixas" USING "btree" ("id_empresa", "codigo") WHERE ("codigo" IS NOT NULL);



CREATE UNIQUE INDEX "clientes_empresa_auth_user_unique" ON "public"."clientes" USING "btree" ("id_empresa", "auth_user_id") WHERE ("auth_user_id" IS NOT NULL);



CREATE UNIQUE INDEX "clientes_empresa_cpf_unique" ON "public"."clientes" USING "btree" ("id_empresa", "cpf") WHERE (("cpf" IS NOT NULL) AND ("btrim"("cpf") <> ''::"text"));



CREATE INDEX "clientes_id_empresa_idx" ON "public"."clientes" USING "btree" ("id_empresa");



CREATE UNIQUE INDEX "comandas_empresa_agendamento_unique" ON "public"."comandas" USING "btree" ("id_empresa", "id_agendamento") WHERE ("id_agendamento" IS NOT NULL);



CREATE INDEX "comandas_empresa_cliente_idx" ON "public"."comandas" USING "btree" ("id_empresa", "id_cliente", "aberta_em" DESC);



CREATE UNIQUE INDEX "comandas_empresa_orcamento_unique" ON "public"."comandas" USING "btree" ("id_empresa", "id_orcamento") WHERE ("id_orcamento" IS NOT NULL);



CREATE INDEX "comandas_empresa_status_idx" ON "public"."comandas" USING "btree" ("id_empresa", "status", "aberta_em" DESC);



CREATE INDEX "comandas_itens_comanda_idx" ON "public"."comandas_itens" USING "btree" ("id_comanda", "ordem");



CREATE UNIQUE INDEX "comandas_itens_orcamento_item_unique" ON "public"."comandas_itens" USING "btree" ("id_comanda", "id_orcamento_item") WHERE ("id_orcamento_item" IS NOT NULL);



CREATE INDEX "comissoes_regras_busca_idx" ON "public"."comissoes_regras" USING "btree" ("id_empresa", "id_funcionario", "tipo_item", "id_servico", "id_produto", "ativo", "prioridade" DESC);



CREATE UNIQUE INDEX "comissoes_regras_escopo_unique" ON "public"."comissoes_regras" USING "btree" ("id_empresa", "id_funcionario", "tipo_item", "id_servico", "id_produto", "vigente_de") NULLS NOT DISTINCT;



CREATE UNIQUE INDEX "compras_documento_unique" ON "public"."compras" USING "btree" ("id_empresa", "id_fornecedor", "numero_documento") WHERE ("numero_documento" IS NOT NULL);



CREATE INDEX "compras_empresa_data_idx" ON "public"."compras" USING "btree" ("id_empresa", "data_compra" DESC);



CREATE INDEX "compras_empresa_fornecedor_idx" ON "public"."compras" USING "btree" ("id_empresa", "id_fornecedor");



CREATE INDEX "compras_itens_compra_idx" ON "public"."compras_itens" USING "btree" ("id_compra");



CREATE INDEX "contas_empresa_cliente_idx" ON "public"."contas" USING "btree" ("id_empresa", "id_cliente", "created_at" DESC) WHERE ("id_cliente" IS NOT NULL);



CREATE UNIQUE INDEX "contas_empresa_comanda_unique" ON "public"."contas" USING "btree" ("id_empresa", "id_comanda") WHERE ("id_comanda" IS NOT NULL);



CREATE INDEX "contas_empresa_fornecedor_idx" ON "public"."contas" USING "btree" ("id_empresa", "id_fornecedor", "created_at" DESC) WHERE ("id_fornecedor" IS NOT NULL);



CREATE INDEX "contas_empresa_tipo_status_idx" ON "public"."contas" USING "btree" ("id_empresa", "tipo", "status", "data_emissao" DESC);



CREATE INDEX "contas_parcelas_vencimento_idx" ON "public"."contas_parcelas" USING "btree" ("id_empresa", "status", "data_vencimento");



CREATE INDEX "convites_empresa_empresa_status_idx" ON "public"."convites_empresa" USING "btree" ("id_empresa", "status", "created_at" DESC);



CREATE UNIQUE INDEX "convites_empresa_pendente_unique" ON "public"."convites_empresa" USING "btree" ("id_empresa", "lower"("email")) WHERE ("status" = 'pendente'::"text");



CREATE INDEX "dashboard_agendamentos_periodo_idx" ON "public"."agendamentos" USING "btree" ("id_empresa", "inicio", "fim") WHERE ("status" <> 'cancelado'::"text");



CREATE INDEX "dashboard_agendamentos_servicos_periodo_idx" ON "public"."agendamentos_servicos" USING "btree" ("id_empresa", "id_funcionario", "inicio", "fim") WHERE ("status" <> 'cancelado'::"text");



CREATE INDEX "dashboard_clientes_criados_idx" ON "public"."clientes" USING "btree" ("id_empresa", "created_at");



CREATE INDEX "dashboard_comandas_fechadas_idx" ON "public"."comandas" USING "btree" ("id_empresa", "fechada_em") WHERE ("status" = 'fechada'::"text");



CREATE INDEX "dashboard_comandas_itens_idx" ON "public"."comandas_itens" USING "btree" ("id_empresa", "id_comanda", "tipo_item");



CREATE INDEX "dashboard_estoque_baixo_idx" ON "public"."produtos" USING "btree" ("id_empresa", "estoque_atual") WHERE ("ativo" AND "controla_estoque");



CREATE INDEX "dashboard_jornadas_idx" ON "public"."funcionarios_horarios" USING "btree" ("id_empresa", "dia_semana", "id_funcionario") WHERE "ativo";



CREATE INDEX "dashboard_parcelas_vencimento_idx" ON "public"."contas_parcelas" USING "btree" ("id_empresa", "data_vencimento") WHERE ("status" <> ALL (ARRAY['paga'::"text", 'cancelada'::"text"]));



CREATE INDEX "disponibilidades_consulta_idx" ON "public"."disponibilidades" USING "btree" ("id_empresa", "id_unidade", "id_profissional", "inicio", "fim") WHERE "ativo";



CREATE UNIQUE INDEX "empresas_cnpj_unique" ON "public"."empresas" USING "btree" ("cnpj") WHERE (("cnpj" IS NOT NULL) AND ("btrim"(("cnpj")::"text") <> ''::"text"));



CREATE UNIQUE INDEX "fornecedores_empresa_documento_unique" ON "public"."fornecedores" USING "btree" ("id_empresa", "documento") WHERE (("documento" IS NOT NULL) AND ("btrim"("documento") <> ''::"text"));



CREATE INDEX "fornecedores_id_empresa_idx" ON "public"."fornecedores" USING "btree" ("id_empresa");



CREATE INDEX "funcionarios_ausencias_empresa_funcionario_periodo_idx" ON "public"."funcionarios_ausencias" USING "btree" ("id_empresa", "id_funcionario", "inicio", "fim");



CREATE UNIQUE INDEX "funcionarios_empresa_cpf_unique" ON "public"."funcionarios" USING "btree" ("id_empresa", "cpf") WHERE (("cpf" IS NOT NULL) AND ("btrim"("cpf") <> ''::"text"));



CREATE UNIQUE INDEX "funcionarios_empresa_usuario_unique" ON "public"."funcionarios" USING "btree" ("id_empresa", "usuario_empresa_id") WHERE ("usuario_empresa_id" IS NOT NULL);



CREATE INDEX "funcionarios_horarios_empresa_funcionario_idx" ON "public"."funcionarios_horarios" USING "btree" ("id_empresa", "id_funcionario", "dia_semana");



CREATE INDEX "funcionarios_id_empresa_idx" ON "public"."funcionarios" USING "btree" ("id_empresa");



CREATE INDEX "funcionarios_remuneracoes_empresa_funcionario_idx" ON "public"."funcionarios_remuneracoes" USING "btree" ("id_empresa", "id_funcionario");



CREATE INDEX "funcionarios_servicos_empresa_servico_idx" ON "public"."funcionarios_servicos" USING "btree" ("id_empresa", "id_servico");



CREATE INDEX "historico_agendamentos_consulta_idx" ON "public"."historico_agendamentos" USING "btree" ("id_empresa", "id_agendamento", "created_at" DESC);



CREATE INDEX "horarios_funcionarios_busca_idx" ON "public"."horarios_funcionarios" USING "btree" ("id_empresa", "id_funcionario", "dia_semana", "vigente_de", "vigente_ate") WHERE "ativo";



CREATE INDEX "idx_clientes_empresa_email_normalizado" ON "public"."clientes" USING "btree" ("id_empresa", "email_normalizado") WHERE ("email_normalizado" IS NOT NULL);



CREATE INDEX "idx_clientes_empresa_telefone_e164" ON "public"."clientes" USING "btree" ("id_empresa", "telefone_e164") WHERE ("telefone_e164" IS NOT NULL);



CREATE INDEX "idx_consentimentos_cliente" ON "public"."consentimentos_comunicacao" USING "btree" ("id_empresa", "id_cliente");



CREATE INDEX "idx_consentimentos_criado_por" ON "public"."consentimentos_comunicacao" USING "btree" ("criado_por") WHERE ("criado_por" IS NOT NULL);



CREATE INDEX "idx_eventos_empresa_tipo" ON "public"."eventos_sistema" USING "btree" ("id_empresa", "tipo_evento", "created_at" DESC);



CREATE INDEX "idx_eventos_processamento" ON "public"."eventos_sistema" USING "btree" ("status", "processar_em", "prioridade", "id") WHERE ("status" = ANY (ARRAY['pendente'::"text", 'erro'::"text"]));



CREATE INDEX "idx_fila_cliente" ON "public"."fila_mensagens" USING "btree" ("id_cliente") WHERE ("id_cliente" IS NOT NULL);



CREATE INDEX "idx_fila_empresa_status" ON "public"."fila_mensagens" USING "btree" ("id_empresa", "status", "agendada_para");



CREATE INDEX "idx_fila_evento" ON "public"."fila_mensagens" USING "btree" ("id_evento") WHERE ("id_evento" IS NOT NULL);



CREATE INDEX "idx_fila_integracao" ON "public"."fila_mensagens" USING "btree" ("id_integracao") WHERE ("id_integracao" IS NOT NULL);



CREATE INDEX "idx_fila_processamento" ON "public"."fila_mensagens" USING "btree" ("status", COALESCE("proxima_tentativa_em", "agendada_para"), "prioridade", "id") WHERE ("status" = ANY (ARRAY['pendente'::"text", 'erro'::"text"]));



CREATE INDEX "idx_fk_agendamentos_criado_por_421f4b03" ON "public"."agendamentos" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_ausencias_funcionarios_cancelado_por_8575a457" ON "public"."ausencias_funcionarios" USING "btree" ("cancelado_por");



CREATE INDEX "idx_fk_ausencias_funcionarios_criado_por_90ab031c" ON "public"."ausencias_funcionarios" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_bloqueios_agenda_cancelado_por_91565201" ON "public"."bloqueios_agenda" USING "btree" ("cancelado_por");



CREATE INDEX "idx_fk_bloqueios_agenda_criado_por_57cd9b64" ON "public"."bloqueios_agenda" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_comandas_criado_por_cddc21e8" ON "public"."comandas" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_comandas_id_empresa_id_funcionario_responsavel_7fddb7a9" ON "public"."comandas" USING "btree" ("id_empresa", "id_funcionario_responsavel");



CREATE INDEX "idx_fk_comandas_itens_id_empresa_id_comanda_857b8492" ON "public"."comandas_itens" USING "btree" ("id_empresa", "id_comanda");



CREATE INDEX "idx_fk_comandas_itens_id_empresa_id_funcionario_ddd6fba8" ON "public"."comandas_itens" USING "btree" ("id_empresa", "id_funcionario");



CREATE INDEX "idx_fk_comandas_itens_id_empresa_id_orcamento_item_a4feed4e" ON "public"."comandas_itens" USING "btree" ("id_empresa", "id_orcamento_item");



CREATE INDEX "idx_fk_comandas_itens_id_empresa_id_produto_3baf5293" ON "public"."comandas_itens" USING "btree" ("id_empresa", "id_produto");



CREATE INDEX "idx_fk_comandas_itens_id_empresa_id_servico_c1f31702" ON "public"."comandas_itens" USING "btree" ("id_empresa", "id_servico");



CREATE INDEX "idx_fk_comissoes_regras_criado_por_bcaed56c" ON "public"."comissoes_regras" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_comissoes_regras_id_empresa_id_produto_a76fa81e" ON "public"."comissoes_regras" USING "btree" ("id_empresa", "id_produto");



CREATE INDEX "idx_fk_comissoes_regras_id_empresa_id_servico_ff989270" ON "public"."comissoes_regras" USING "btree" ("id_empresa", "id_servico");



CREATE INDEX "idx_fk_compras_criado_por_c5cdd715" ON "public"."compras" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_compras_id_empresa_id_conta_d6356859" ON "public"."compras" USING "btree" ("id_empresa", "id_conta");



CREATE INDEX "idx_fk_compras_itens_id_empresa_id_compra_f0e4b901" ON "public"."compras_itens" USING "btree" ("id_empresa", "id_compra");



CREATE INDEX "idx_fk_compras_itens_id_empresa_id_produto_e0f39a97" ON "public"."compras_itens" USING "btree" ("id_empresa", "id_produto");



CREATE INDEX "idx_fk_contas_criado_por_1bbaf23d" ON "public"."contas" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_contas_id_empresa_id_categoria_a2dbfb16" ON "public"."contas" USING "btree" ("id_empresa", "id_categoria");



CREATE INDEX "idx_fk_contas_id_empresa_id_comanda_1792837a" ON "public"."contas" USING "btree" ("id_empresa", "id_comanda");



CREATE INDEX "idx_fk_contas_parcelas_id_empresa_id_conta_dce27280" ON "public"."contas_parcelas" USING "btree" ("id_empresa", "id_conta");



CREATE INDEX "idx_fk_empresas_criado_por_6c52f6c2" ON "public"."empresas" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_funcionarios_ausencias_criado_por_83411a1f" ON "public"."funcionarios_ausencias" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_horarios_funcionarios_criado_por_a547b232" ON "public"."horarios_funcionarios" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_lancamentos_comissao_id_empresa_id_comanda_1acd0609" ON "public"."lancamentos_comissao" USING "btree" ("id_empresa", "id_comanda");



CREATE INDEX "idx_fk_lancamentos_comissao_id_empresa_id_comanda_item_d12d59ca" ON "public"."lancamentos_comissao" USING "btree" ("id_empresa", "id_comanda_item");



CREATE INDEX "idx_fk_lancamentos_comissao_id_empresa_id_regra_6a052477" ON "public"."lancamentos_comissao" USING "btree" ("id_empresa", "id_regra");



CREATE INDEX "idx_fk_movimentos_caixa_criado_por_67a56499" ON "public"."movimentos_caixa" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_movimentos_caixa_estornado_por_3e4aa88e" ON "public"."movimentos_caixa" USING "btree" ("estornado_por");



CREATE INDEX "idx_fk_movimentos_caixa_id_empresa_id_caixa_id_sessao__4ff8c835" ON "public"."movimentos_caixa" USING "btree" ("id_empresa", "id_caixa", "id_sessao_caixa");



CREATE INDEX "idx_fk_movimentos_caixa_id_empresa_id_pagamento_0811856c" ON "public"."movimentos_caixa" USING "btree" ("id_empresa", "id_pagamento");



CREATE INDEX "idx_fk_movimentos_estoque_criado_por_4ac2c50c" ON "public"."movimentos_estoque" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_movimentos_estoque_estornado_por_eea506dc" ON "public"."movimentos_estoque" USING "btree" ("estornado_por");



CREATE INDEX "idx_fk_movimentos_estoque_id_empresa_id_comanda_item_b2a69563" ON "public"."movimentos_estoque" USING "btree" ("id_empresa", "id_comanda_item");



CREATE INDEX "idx_fk_movimentos_estoque_id_empresa_id_compra_item_cbec0fe1" ON "public"."movimentos_estoque" USING "btree" ("id_empresa", "id_compra_item");



CREATE INDEX "idx_fk_orcamentos_criado_por_95b3bda6" ON "public"."orcamentos" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_orcamentos_itens_id_empresa_id_orcamento_3dc37d48" ON "public"."orcamentos_itens" USING "btree" ("id_empresa", "id_orcamento");



CREATE INDEX "idx_fk_orcamentos_itens_id_empresa_id_produto_7889b8f9" ON "public"."orcamentos_itens" USING "btree" ("id_empresa", "id_produto");



CREATE INDEX "idx_fk_orcamentos_itens_id_empresa_id_servico_4723518e" ON "public"."orcamentos_itens" USING "btree" ("id_empresa", "id_servico");



CREATE INDEX "idx_fk_pagamentos_alocacoes_id_empresa_id_pagamento_1767e0d4" ON "public"."pagamentos_alocacoes" USING "btree" ("id_empresa", "id_pagamento");



CREATE INDEX "idx_fk_pagamentos_alocacoes_id_empresa_id_parcela_9fa66b01" ON "public"."pagamentos_alocacoes" USING "btree" ("id_empresa", "id_parcela");



CREATE INDEX "idx_fk_pagamentos_comissao_confirmado_por_0107eea3" ON "public"."pagamentos_comissao" USING "btree" ("confirmado_por");



CREATE INDEX "idx_fk_pagamentos_comissao_criado_por_9596aa84" ON "public"."pagamentos_comissao" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_pagamentos_comissao_id_empresa_id_forma_pagamen_cbef3869" ON "public"."pagamentos_comissao" USING "btree" ("id_empresa", "id_forma_pagamento");



CREATE INDEX "idx_fk_pagamentos_comissao_id_empresa_id_pagamento_eabe5750" ON "public"."pagamentos_comissao" USING "btree" ("id_empresa", "id_pagamento");



CREATE INDEX "idx_fk_pagamentos_comissao_id_empresa_id_sessao_caixa_0456033a" ON "public"."pagamentos_comissao" USING "btree" ("id_empresa", "id_sessao_caixa");



CREATE INDEX "idx_fk_pagamentos_comissao_itens_id_empresa_id_lancame_b347a893" ON "public"."pagamentos_comissao_itens" USING "btree" ("id_empresa", "id_lancamento_comissao");



CREATE INDEX "idx_fk_pagamentos_comissao_itens_id_empresa_id_pagamen_9f978e1e" ON "public"."pagamentos_comissao_itens" USING "btree" ("id_empresa", "id_pagamento_comissao");



CREATE INDEX "idx_fk_pagamentos_criado_por_ee27e496" ON "public"."pagamentos" USING "btree" ("criado_por");



CREATE INDEX "idx_fk_pagamentos_estornado_por_e81030fa" ON "public"."pagamentos" USING "btree" ("estornado_por");



CREATE INDEX "idx_fk_pagamentos_id_empresa_id_forma_pagamento_a0891cc4" ON "public"."pagamentos" USING "btree" ("id_empresa", "id_forma_pagamento");



CREATE INDEX "idx_fk_pagamentos_id_empresa_id_sessao_caixa_efdad452" ON "public"."pagamentos" USING "btree" ("id_empresa", "id_sessao_caixa");



CREATE INDEX "idx_fk_sessoes_caixa_aberta_por_11863a8c" ON "public"."sessoes_caixa" USING "btree" ("aberta_por");



CREATE INDEX "idx_fk_sessoes_caixa_cancelada_por_00252788" ON "public"."sessoes_caixa" USING "btree" ("cancelada_por");



CREATE INDEX "idx_fk_sessoes_caixa_fechada_por_b7d43786" ON "public"."sessoes_caixa" USING "btree" ("fechada_por");



CREATE INDEX "idx_integracoes_empresa_status" ON "public"."integracoes" USING "btree" ("id_empresa", "status");



CREATE INDEX "lancamentos_comissao_funcionario_status_idx" ON "public"."lancamentos_comissao" USING "btree" ("id_empresa", "id_funcionario", "status", "competencia");



CREATE INDEX "movimentos_caixa_empresa_tipo_idx" ON "public"."movimentos_caixa" USING "btree" ("id_empresa", "tipo", "ocorrido_em" DESC);



CREATE INDEX "movimentos_caixa_forma_idx" ON "public"."movimentos_caixa" USING "btree" ("id_empresa", "id_forma_pagamento", "ocorrido_em" DESC) WHERE ("id_forma_pagamento" IS NOT NULL);



CREATE UNIQUE INDEX "movimentos_caixa_pagamento_unique" ON "public"."movimentos_caixa" USING "btree" ("id_pagamento") WHERE ("id_pagamento" IS NOT NULL);



CREATE INDEX "movimentos_caixa_sessao_data_idx" ON "public"."movimentos_caixa" USING "btree" ("id_sessao_caixa", "ocorrido_em");



CREATE UNIQUE INDEX "movimentos_estoque_comanda_item_unique" ON "public"."movimentos_estoque" USING "btree" ("id_comanda_item") WHERE (("id_comanda_item" IS NOT NULL) AND (("tipo")::"text" = 'saida_venda'::"text"));



CREATE INDEX "movimentos_estoque_compra_item_idx" ON "public"."movimentos_estoque" USING "btree" ("id_compra_item") WHERE ("id_compra_item" IS NOT NULL);



CREATE INDEX "movimentos_estoque_empresa_produto_data_idx" ON "public"."movimentos_estoque" USING "btree" ("id_empresa", "id_produto", "movimentado_em" DESC);



CREATE INDEX "orcamentos_empresa_cliente_idx" ON "public"."orcamentos" USING "btree" ("id_empresa", "id_cliente", "created_at" DESC);



CREATE INDEX "orcamentos_empresa_status_idx" ON "public"."orcamentos" USING "btree" ("id_empresa", "status", "created_at" DESC);



CREATE INDEX "orcamentos_itens_orcamento_idx" ON "public"."orcamentos_itens" USING "btree" ("id_orcamento", "ordem");



CREATE INDEX "pagamentos_alocacoes_parcela_idx" ON "public"."pagamentos_alocacoes" USING "btree" ("id_parcela");



CREATE UNIQUE INDEX "pagamentos_chave_idempotencia_unique" ON "public"."pagamentos" USING "btree" ("id_empresa", "chave_idempotencia") WHERE ("chave_idempotencia" IS NOT NULL);



CREATE INDEX "pagamentos_comissao_funcionario_data_idx" ON "public"."pagamentos_comissao" USING "btree" ("id_empresa", "id_funcionario", "pago_em" DESC);



CREATE INDEX "pagamentos_comissao_itens_lancamento_idx" ON "public"."pagamentos_comissao_itens" USING "btree" ("id_lancamento_comissao");



CREATE INDEX "pagamentos_empresa_data_idx" ON "public"."pagamentos" USING "btree" ("id_empresa", "data_pagamento" DESC);



CREATE UNIQUE INDEX "pagamentos_identificador_externo_unique" ON "public"."pagamentos" USING "btree" ("id_empresa", "provedor", "identificador_externo") WHERE ("identificador_externo" IS NOT NULL);



CREATE INDEX "pagamentos_sessao_caixa_idx" ON "public"."pagamentos" USING "btree" ("id_sessao_caixa") WHERE ("id_sessao_caixa" IS NOT NULL);



CREATE INDEX "permissoes_usuarios_vinculo_idx" ON "public"."permissoes_usuarios" USING "btree" ("id_empresa", "usuario_empresa_id");



CREATE UNIQUE INDEX "politicas_cancelamento_ativa_unique" ON "public"."politicas_cancelamento" USING "btree" ("id_empresa", COALESCE("id_unidade", (0)::bigint)) WHERE ("ativo" AND ("vigente_ate" IS NULL));



CREATE UNIQUE INDEX "produtos_empresa_codigo_unique" ON "public"."produtos" USING "btree" ("id_empresa", "codigo") WHERE (("codigo" IS NOT NULL) AND ("btrim"("codigo") <> ''::"text"));



CREATE INDEX "produtos_fornecedores_empresa_fornecedor_idx" ON "public"."produtos_fornecedores" USING "btree" ("id_empresa", "id_fornecedor");



CREATE INDEX "produtos_id_empresa_idx" ON "public"."produtos" USING "btree" ("id_empresa");



CREATE INDEX "servicos_id_empresa_idx" ON "public"."servicos" USING "btree" ("id_empresa");



CREATE INDEX "sessoes_caixa_empresa_status_idx" ON "public"."sessoes_caixa" USING "btree" ("id_empresa", "status", "aberta_em" DESC);



CREATE UNIQUE INDEX "sessoes_caixa_uma_aberta_por_caixa" ON "public"."sessoes_caixa" USING "btree" ("id_empresa", "id_caixa") WHERE ("status" = 'aberta'::"text");



CREATE INDEX "sites_publicos_dominios_empresa_idx" ON "public"."sites_publicos_dominios" USING "btree" ("id_empresa");



CREATE UNIQUE INDEX "sites_publicos_um_dominio_principal" ON "public"."sites_publicos_dominios" USING "btree" ("id_site") WHERE "principal";



CREATE INDEX "solicitacoes_privacidade_empresa_status_idx" ON "public"."solicitacoes_privacidade" USING "btree" ("id_empresa", "status", "solicitado_em" DESC);



CREATE UNIQUE INDEX "solicitacoes_privacidade_exclusao_pendente_unique" ON "public"."solicitacoes_privacidade" USING "btree" ("id_empresa", "id_cliente", "tipo") WHERE (("tipo" = 'exclusao'::"text") AND ("status" = ANY (ARRAY['pendente'::"text", 'em_analise'::"text"])));



CREATE UNIQUE INDEX "unidades_principal_por_empresa_unique" ON "public"."unidades" USING "btree" ("id_empresa") WHERE ("principal" AND "ativo");



CREATE UNIQUE INDEX "uq_eventos_empresa_idempotencia" ON "public"."eventos_sistema" USING "btree" ("id_empresa", "chave_idempotencia") WHERE ("chave_idempotencia" IS NOT NULL);



CREATE UNIQUE INDEX "uq_fila_empresa_idempotencia" ON "public"."fila_mensagens" USING "btree" ("id_empresa", "chave_idempotencia") WHERE ("chave_idempotencia" IS NOT NULL);



CREATE UNIQUE INDEX "uq_integracoes_empresa_provedor_identificador" ON "public"."integracoes" USING "btree" ("id_empresa", "lower"("tipo"), "lower"("provedor"), COALESCE("identificador_externo", ''::character varying));



CREATE INDEX "usuarios_empresas_empresa_status_idx" ON "public"."usuarios_empresas" USING "btree" ("empresa_id", "status");



CREATE INDEX "usuarios_empresas_user_id_idx" ON "public"."usuarios_empresas" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "a_consentimentos_normalizar" BEFORE INSERT OR UPDATE ON "public"."consentimentos_comunicacao" FOR EACH ROW EXECUTE FUNCTION "private"."normalizar_consentimento"();



CREATE OR REPLACE TRIGGER "a_eventos_updated_at" BEFORE UPDATE ON "public"."eventos_sistema" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "a_fila_updated_at" BEFORE UPDATE ON "public"."fila_mensagens" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "a_integracoes_updated_at" BEFORE UPDATE ON "public"."integracoes" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "agendamentos_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."agendamentos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "agendamentos_preparar_operacional" BEFORE INSERT OR UPDATE OF "id_empresa", "id_unidade", "sinal_status" ON "public"."agendamentos" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_agendamento_operacional"();



CREATE OR REPLACE TRIGGER "agendamentos_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."agendamentos" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "agendamentos_registrar_historico" AFTER INSERT OR UPDATE OF "status", "inicio", "fim", "id_cliente", "id_unidade", "sinal_status", "sinal_valor", "pagamento_status", "pagamento_externo_id", "valor_total" ON "public"."agendamentos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_historico_agendamento"();



CREATE OR REPLACE TRIGGER "agendamentos_servicos_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."agendamentos_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "agendamentos_servicos_definir_updated_at" BEFORE UPDATE ON "public"."agendamentos_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "agendamentos_servicos_preparar_insert" BEFORE INSERT ON "public"."agendamentos_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_agendamento_servico"();



CREATE OR REPLACE TRIGGER "agendamentos_servicos_preparar_update" BEFORE UPDATE OF "id_empresa", "id_agendamento", "id_servico", "id_funcionario", "inicio", "fim", "duracao_minutos", "preco" ON "public"."agendamentos_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_agendamento_servico"();



CREATE OR REPLACE TRIGGER "agendamentos_servicos_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."agendamentos_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "agendamentos_servicos_recalcular_total" AFTER INSERT OR DELETE OR UPDATE OF "preco", "status", "id_agendamento" ON "public"."agendamentos_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."recalcular_total_agendamento"();



CREATE OR REPLACE TRIGGER "agendamentos_servicos_validar_disponibilidade" BEFORE INSERT OR UPDATE ON "public"."agendamentos_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."validar_disponibilidade_funcionario"();



CREATE OR REPLACE TRIGGER "agendamentos_sincronizar_preferencias_site" AFTER INSERT OR UPDATE OF "site_notification_preferences" ON "public"."agendamentos" FOR EACH ROW EXECUTE FUNCTION "private"."sincronizar_preferencias_lembrete_site"();



CREATE OR REPLACE TRIGGER "agendamentos_sincronizar_status_servicos" AFTER UPDATE OF "status" ON "public"."agendamentos" FOR EACH ROW EXECUTE FUNCTION "private"."sincronizar_status_servicos_agendamento"();



CREATE OR REPLACE TRIGGER "agendamentos_validar" BEFORE INSERT OR UPDATE ON "public"."agendamentos" FOR EACH ROW EXECUTE FUNCTION "private"."validar_agendamento"();



CREATE CONSTRAINT TRIGGER "agendamentos_validar_servicos_periodo" AFTER INSERT OR UPDATE OF "inicio", "fim" ON "public"."agendamentos" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "private"."validar_servicos_no_periodo_agendamento"();



CREATE OR REPLACE TRIGGER "assinaturas_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."assinaturas" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "auditorias_proteger_registro" BEFORE DELETE OR UPDATE ON "public"."auditorias" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_registro_auditoria"();



CREATE OR REPLACE TRIGGER "ausencias_funcionarios_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."ausencias_funcionarios" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "ausencias_funcionarios_preparar" BEFORE INSERT OR UPDATE ON "public"."ausencias_funcionarios" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_ausencia_funcionario"();



CREATE OR REPLACE TRIGGER "bloqueios_agenda_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."bloqueios_agenda" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "bloqueios_agenda_preparar" BEFORE INSERT OR UPDATE ON "public"."bloqueios_agenda" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_bloqueio_agenda"();



CREATE OR REPLACE TRIGGER "caixas_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."caixas" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "caixas_definir_updated_at" BEFORE UPDATE ON "public"."caixas" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "caixas_proteger_id_empresa" BEFORE UPDATE ON "public"."caixas" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "categorias_financeiras_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."categorias_financeiras" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "categorias_financeiras_definir_updated_at" BEFORE UPDATE ON "public"."categorias_financeiras" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "categorias_financeiras_proteger_id_empresa" BEFORE UPDATE ON "public"."categorias_financeiras" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "clientes_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."clientes" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "clientes_definir_updated_at" BEFORE UPDATE ON "public"."clientes" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "clientes_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."clientes" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "comandas_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."comandas" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "comandas_gerar_comissoes" AFTER UPDATE OF "status" ON "public"."comandas" FOR EACH ROW EXECUTE FUNCTION "private"."gerar_comissoes_comanda"();



CREATE OR REPLACE TRIGGER "comandas_itens_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."comandas_itens" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "comandas_itens_preparar" BEFORE INSERT OR UPDATE ON "public"."comandas_itens" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_comanda_item"();



CREATE OR REPLACE TRIGGER "comandas_itens_recalcular" AFTER INSERT OR DELETE OR UPDATE ON "public"."comandas_itens" FOR EACH ROW EXECUTE FUNCTION "private"."recalcular_cabecalho_item"();



CREATE OR REPLACE TRIGGER "comandas_itens_validar_delete" BEFORE DELETE ON "public"."comandas_itens" FOR EACH ROW EXECUTE FUNCTION "private"."validar_exclusao_item_comercial"();



CREATE OR REPLACE TRIGGER "comandas_movimentar_estoque" AFTER UPDATE OF "status" ON "public"."comandas" FOR EACH ROW EXECUTE FUNCTION "private"."movimentar_estoque_comanda"();



CREATE OR REPLACE TRIGGER "comandas_preparar" BEFORE INSERT OR UPDATE ON "public"."comandas" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_comanda"();



CREATE OR REPLACE TRIGGER "comissoes_regras_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."comissoes_regras" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "comissoes_regras_preparar" BEFORE INSERT OR UPDATE ON "public"."comissoes_regras" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_regra_comissao"();



CREATE OR REPLACE TRIGGER "compras_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."compras" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "compras_itens_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."compras_itens" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "compras_itens_preparar" BEFORE INSERT OR UPDATE ON "public"."compras_itens" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_compra_item"();



CREATE OR REPLACE TRIGGER "compras_itens_processar" AFTER INSERT OR DELETE OR UPDATE ON "public"."compras_itens" FOR EACH ROW EXECUTE FUNCTION "private"."processar_compra_item"();



CREATE OR REPLACE TRIGGER "compras_itens_validar_delete" BEFORE DELETE ON "public"."compras_itens" FOR EACH ROW EXECUTE FUNCTION "private"."validar_exclusao_compra_item"();



CREATE OR REPLACE TRIGGER "compras_preparar" BEFORE INSERT OR UPDATE ON "public"."compras" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_compra"();



CREATE OR REPLACE TRIGGER "configuracoes_empresas_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."configuracoes_empresas" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "configuracoes_empresas_updated_at" BEFORE UPDATE ON "public"."configuracoes_empresas" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "contas_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."contas" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "contas_definir_updated_at" BEFORE UPDATE ON "public"."contas" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "contas_liberar_comissoes" AFTER UPDATE OF "status" ON "public"."contas" FOR EACH ROW EXECUTE FUNCTION "private"."liberar_comissoes_conta_paga"();



CREATE OR REPLACE TRIGGER "contas_parcelas_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."contas_parcelas" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "contas_parcelas_definir_updated_at" BEFORE UPDATE ON "public"."contas_parcelas" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "contas_parcelas_proteger_id_empresa" BEFORE UPDATE ON "public"."contas_parcelas" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "contas_parcelas_recalcular_conta" AFTER INSERT OR DELETE OR UPDATE ON "public"."contas_parcelas" FOR EACH ROW EXECUTE FUNCTION "private"."recalcular_conta_por_parcela"();



CREATE OR REPLACE TRIGGER "contas_proteger_id_empresa" BEFORE UPDATE ON "public"."contas" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "convites_empresa_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."convites_empresa" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "convites_empresa_updated_at" BEFORE UPDATE ON "public"."convites_empresa" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "disponibilidades_sincronizar_bloqueio" BEFORE INSERT OR DELETE OR UPDATE OF "id_empresa", "id_unidade", "id_profissional", "inicio", "fim", "tipo", "observacoes", "ativo" ON "public"."disponibilidades" FOR EACH ROW EXECUTE FUNCTION "private"."sincronizar_disponibilidade_com_bloqueio"();



CREATE OR REPLACE TRIGGER "empresas_adicionar_dono" AFTER INSERT ON "public"."empresas" FOR EACH ROW EXECUTE FUNCTION "private"."adicionar_dono_da_empresa"();



CREATE OR REPLACE TRIGGER "empresas_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."empresas" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "empresas_configurar_financeiro_padrao" AFTER INSERT ON "public"."empresas" FOR EACH ROW EXECUTE FUNCTION "private"."configurar_financeiro_nova_empresa"();



CREATE OR REPLACE TRIGGER "empresas_proteger_criador" BEFORE UPDATE OF "criado_por" ON "public"."empresas" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_criador_empresa"();



CREATE OR REPLACE TRIGGER "formas_pagamento_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."formas_pagamento" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "formas_pagamento_definir_updated_at" BEFORE UPDATE ON "public"."formas_pagamento" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "formas_pagamento_proteger_id_empresa" BEFORE UPDATE ON "public"."formas_pagamento" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "fornecedores_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."fornecedores" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "fornecedores_definir_updated_at" BEFORE UPDATE ON "public"."fornecedores" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "fornecedores_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."fornecedores" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "funcionarios_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."funcionarios" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "funcionarios_ausencias_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."funcionarios_ausencias" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "funcionarios_ausencias_definir_updated_at" BEFORE UPDATE ON "public"."funcionarios_ausencias" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "funcionarios_ausencias_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."funcionarios_ausencias" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "funcionarios_definir_updated_at" BEFORE UPDATE ON "public"."funcionarios" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "funcionarios_horarios_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."funcionarios_horarios" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "funcionarios_horarios_definir_updated_at" BEFORE UPDATE ON "public"."funcionarios_horarios" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "funcionarios_horarios_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."funcionarios_horarios" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "funcionarios_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."funcionarios" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "funcionarios_remuneracoes_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."funcionarios_remuneracoes" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "funcionarios_remuneracoes_definir_updated_at" BEFORE UPDATE ON "public"."funcionarios_remuneracoes" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "funcionarios_remuneracoes_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."funcionarios_remuneracoes" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "funcionarios_servicos_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."funcionarios_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "funcionarios_servicos_definir_updated_at" BEFORE UPDATE ON "public"."funcionarios_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "funcionarios_servicos_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."funcionarios_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "horarios_funcionarios_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."horarios_funcionarios" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "horarios_funcionarios_preparar" BEFORE INSERT OR UPDATE ON "public"."horarios_funcionarios" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_horario_funcionario"();



CREATE OR REPLACE TRIGGER "lancamentos_comissao_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."lancamentos_comissao" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "lancamentos_comissao_preparar" BEFORE INSERT OR UPDATE ON "public"."lancamentos_comissao" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_lancamento_comissao"();



CREATE OR REPLACE TRIGGER "movimentos_caixa_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."movimentos_caixa" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "movimentos_caixa_preparar" BEFORE INSERT OR UPDATE ON "public"."movimentos_caixa" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_movimento_caixa"();



CREATE OR REPLACE TRIGGER "movimentos_caixa_recalcular_sessao" AFTER INSERT OR DELETE OR UPDATE ON "public"."movimentos_caixa" FOR EACH ROW EXECUTE FUNCTION "private"."recalcular_sessao_caixa"();



CREATE OR REPLACE TRIGGER "movimentos_estoque_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."movimentos_estoque" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "movimentos_estoque_bloquear_delete" BEFORE DELETE ON "public"."movimentos_estoque" FOR EACH ROW EXECUTE FUNCTION "private"."bloquear_exclusao_movimento_estoque"();



CREATE OR REPLACE TRIGGER "movimentos_estoque_preparar" BEFORE INSERT OR UPDATE ON "public"."movimentos_estoque" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_movimento_estoque"();



CREATE OR REPLACE TRIGGER "orcamentos_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."orcamentos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "orcamentos_itens_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."orcamentos_itens" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "orcamentos_itens_preparar" BEFORE INSERT OR UPDATE ON "public"."orcamentos_itens" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_orcamento_item"();



CREATE OR REPLACE TRIGGER "orcamentos_itens_recalcular" AFTER INSERT OR DELETE OR UPDATE ON "public"."orcamentos_itens" FOR EACH ROW EXECUTE FUNCTION "private"."recalcular_cabecalho_item"();



CREATE OR REPLACE TRIGGER "orcamentos_itens_validar_delete" BEFORE DELETE ON "public"."orcamentos_itens" FOR EACH ROW EXECUTE FUNCTION "private"."validar_exclusao_item_comercial"();



CREATE OR REPLACE TRIGGER "orcamentos_preparar" BEFORE INSERT OR UPDATE ON "public"."orcamentos" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_orcamento"();



CREATE OR REPLACE TRIGGER "pagamentos_alocacoes_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."pagamentos_alocacoes" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "pagamentos_alocacoes_recalcular" AFTER INSERT OR DELETE OR UPDATE ON "public"."pagamentos_alocacoes" FOR EACH ROW EXECUTE FUNCTION "private"."recalcular_alocacao_pagamento"();



CREATE OR REPLACE TRIGGER "pagamentos_alocacoes_validar" BEFORE INSERT OR UPDATE ON "public"."pagamentos_alocacoes" FOR EACH ROW EXECUTE FUNCTION "private"."validar_alocacao_pagamento"();



CREATE OR REPLACE TRIGGER "pagamentos_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."pagamentos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "pagamentos_comissao_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."pagamentos_comissao" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "pagamentos_comissao_itens_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."pagamentos_comissao_itens" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "pagamentos_comissao_itens_preparar" BEFORE INSERT OR UPDATE ON "public"."pagamentos_comissao_itens" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_pagamento_comissao_item"();



CREATE OR REPLACE TRIGGER "pagamentos_comissao_itens_processar" AFTER INSERT OR DELETE OR UPDATE ON "public"."pagamentos_comissao_itens" FOR EACH ROW EXECUTE FUNCTION "private"."processar_pagamento_comissao_item"();



CREATE OR REPLACE TRIGGER "pagamentos_comissao_preparar" BEFORE INSERT OR UPDATE ON "public"."pagamentos_comissao" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_pagamento_comissao"();



CREATE OR REPLACE TRIGGER "pagamentos_comissao_processar" AFTER UPDATE OF "status" ON "public"."pagamentos_comissao" FOR EACH ROW EXECUTE FUNCTION "private"."processar_pagamento_comissao"();



CREATE OR REPLACE TRIGGER "pagamentos_definir_updated_at" BEFORE UPDATE ON "public"."pagamentos" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "pagamentos_proteger_id_empresa" BEFORE UPDATE ON "public"."pagamentos" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "pagamentos_recalcular_parcelas" AFTER UPDATE OF "status", "valor" ON "public"."pagamentos" FOR EACH ROW EXECUTE FUNCTION "private"."recalcular_parcelas_pagamento"();



CREATE OR REPLACE TRIGGER "pagamentos_sincronizar_caixa_insert" AFTER INSERT ON "public"."pagamentos" FOR EACH ROW EXECUTE FUNCTION "private"."sincronizar_pagamento_caixa"();



CREATE OR REPLACE TRIGGER "pagamentos_sincronizar_caixa_update" AFTER UPDATE OF "status", "valor", "tipo", "id_forma_pagamento", "id_sessao_caixa" ON "public"."pagamentos" FOR EACH ROW EXECUTE FUNCTION "private"."sincronizar_pagamento_caixa"();



CREATE OR REPLACE TRIGGER "permissoes_planos_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."permissoes_planos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "permissoes_usuarios_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."permissoes_usuarios" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "permissoes_usuarios_updated_at" BEFORE UPDATE ON "public"."permissoes_usuarios" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "planos_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."planos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "produtos_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."produtos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "produtos_definir_updated_at" BEFORE UPDATE ON "public"."produtos" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "produtos_fornecedores_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."produtos_fornecedores" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "produtos_fornecedores_definir_updated_at" BEFORE UPDATE ON "public"."produtos_fornecedores" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "produtos_fornecedores_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."produtos_fornecedores" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "produtos_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."produtos" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "servicos_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."servicos" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "servicos_definir_updated_at" BEFORE UPDATE ON "public"."servicos" FOR EACH ROW EXECUTE FUNCTION "private"."definir_updated_at"();



CREATE OR REPLACE TRIGGER "servicos_proteger_id_empresa" BEFORE UPDATE OF "id_empresa" ON "public"."servicos" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_id_empresa"();



CREATE OR REPLACE TRIGGER "sessoes_caixa_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."sessoes_caixa" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "sessoes_caixa_preparar" BEFORE INSERT OR UPDATE ON "public"."sessoes_caixa" FOR EACH ROW EXECUTE FUNCTION "private"."preparar_sessao_caixa"();



CREATE OR REPLACE TRIGGER "usuarios_empresas_auditar" AFTER INSERT OR DELETE OR UPDATE ON "public"."usuarios_empresas" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "usuarios_empresas_proteger_vinculo" BEFORE DELETE OR UPDATE ON "public"."usuarios_empresas" FOR EACH ROW EXECUTE FUNCTION "private"."proteger_vinculo_empresa"();



CREATE OR REPLACE TRIGGER "z_consentimentos_auditoria" AFTER INSERT OR DELETE OR UPDATE ON "public"."consentimentos_comunicacao" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "z_eventos_auditoria" AFTER INSERT OR DELETE OR UPDATE ON "public"."eventos_sistema" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "z_fila_auditoria" AFTER INSERT OR DELETE OR UPDATE ON "public"."fila_mensagens" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "z_integracoes_auditoria" AFTER INSERT OR DELETE OR UPDATE ON "public"."integracoes" FOR EACH ROW EXECUTE FUNCTION "private"."registrar_auditoria"();



CREATE OR REPLACE TRIGGER "zz_agendamentos_servicos_impedir_conflito" BEFORE INSERT OR UPDATE OF "id_empresa", "id_servico", "id_funcionario", "inicio", "fim", "status" ON "public"."agendamentos_servicos" FOR EACH ROW EXECUTE FUNCTION "private"."impedir_conflito_profissional_agendamento"();



ALTER TABLE ONLY "public"."agendamentos"
    ADD CONSTRAINT "agendamentos_cliente_empresa_fkey" FOREIGN KEY ("id_empresa", "id_cliente") REFERENCES "public"."clientes"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."agendamentos"
    ADD CONSTRAINT "agendamentos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agendamentos"
    ADD CONSTRAINT "agendamentos_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agendamentos_servicos"
    ADD CONSTRAINT "agendamentos_servicos_agendamento_empresa_fkey" FOREIGN KEY ("id_empresa", "id_agendamento") REFERENCES "public"."agendamentos"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agendamentos_servicos"
    ADD CONSTRAINT "agendamentos_servicos_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."agendamentos_servicos"
    ADD CONSTRAINT "agendamentos_servicos_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agendamentos_servicos"
    ADD CONSTRAINT "agendamentos_servicos_servico_empresa_fkey" FOREIGN KEY ("id_empresa", "id_servico") REFERENCES "public"."servicos"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."agendamentos"
    ADD CONSTRAINT "agendamentos_unidade_empresa_fkey" FOREIGN KEY ("id_empresa", "id_unidade") REFERENCES "public"."unidades"("id_empresa", "id");



ALTER TABLE ONLY "public"."assinaturas"
    ADD CONSTRAINT "assinaturas_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."assinaturas"
    ADD CONSTRAINT "assinaturas_plano_fkey" FOREIGN KEY ("id_plano") REFERENCES "public"."planos"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."auditorias"
    ADD CONSTRAINT "auditorias_usuario_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ausencias_funcionarios"
    ADD CONSTRAINT "ausencias_funcionarios_cancelado_por_fkey" FOREIGN KEY ("cancelado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ausencias_funcionarios"
    ADD CONSTRAINT "ausencias_funcionarios_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ausencias_funcionarios"
    ADD CONSTRAINT "ausencias_funcionarios_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ausencias_funcionarios"
    ADD CONSTRAINT "ausencias_funcionarios_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."avaliacoes"
    ADD CONSTRAINT "avaliacoes_agendamento_fkey" FOREIGN KEY ("id_empresa", "id_agendamento") REFERENCES "public"."agendamentos"("id_empresa", "id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."avaliacoes"
    ADD CONSTRAINT "avaliacoes_cliente_fkey" FOREIGN KEY ("id_empresa", "id_cliente") REFERENCES "public"."clientes"("id_empresa", "id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."avaliacoes"
    ADD CONSTRAINT "avaliacoes_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bloqueios_agenda"
    ADD CONSTRAINT "bloqueios_agenda_cancelado_por_fkey" FOREIGN KEY ("cancelado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bloqueios_agenda"
    ADD CONSTRAINT "bloqueios_agenda_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bloqueios_agenda"
    ADD CONSTRAINT "bloqueios_agenda_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bloqueios_agenda"
    ADD CONSTRAINT "bloqueios_agenda_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bloqueios_agenda"
    ADD CONSTRAINT "bloqueios_agenda_unidade_fkey" FOREIGN KEY ("id_empresa", "id_unidade") REFERENCES "public"."unidades"("id_empresa", "id");



ALTER TABLE ONLY "public"."caixas"
    ADD CONSTRAINT "caixas_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categorias_financeiras"
    ADD CONSTRAINT "categorias_financeiras_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_auth_user_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comandas"
    ADD CONSTRAINT "comandas_agendamento_empresa_fkey" FOREIGN KEY ("id_empresa", "id_agendamento") REFERENCES "public"."agendamentos"("id_empresa", "id");



ALTER TABLE ONLY "public"."comandas"
    ADD CONSTRAINT "comandas_cliente_empresa_fkey" FOREIGN KEY ("id_empresa", "id_cliente") REFERENCES "public"."clientes"("id_empresa", "id");



ALTER TABLE ONLY "public"."comandas"
    ADD CONSTRAINT "comandas_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comandas"
    ADD CONSTRAINT "comandas_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comandas"
    ADD CONSTRAINT "comandas_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario_responsavel") REFERENCES "public"."funcionarios"("id_empresa", "id");



ALTER TABLE ONLY "public"."comandas_itens"
    ADD CONSTRAINT "comandas_itens_comanda_empresa_fkey" FOREIGN KEY ("id_empresa", "id_comanda") REFERENCES "public"."comandas"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comandas_itens"
    ADD CONSTRAINT "comandas_itens_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id");



ALTER TABLE ONLY "public"."comandas_itens"
    ADD CONSTRAINT "comandas_itens_orcamento_item_empresa_fkey" FOREIGN KEY ("id_empresa", "id_orcamento_item") REFERENCES "public"."orcamentos_itens"("id_empresa", "id");



ALTER TABLE ONLY "public"."comandas_itens"
    ADD CONSTRAINT "comandas_itens_produto_empresa_fkey" FOREIGN KEY ("id_empresa", "id_produto") REFERENCES "public"."produtos"("id_empresa", "id");



ALTER TABLE ONLY "public"."comandas_itens"
    ADD CONSTRAINT "comandas_itens_servico_empresa_fkey" FOREIGN KEY ("id_empresa", "id_servico") REFERENCES "public"."servicos"("id_empresa", "id");



ALTER TABLE ONLY "public"."comandas"
    ADD CONSTRAINT "comandas_orcamento_empresa_fkey" FOREIGN KEY ("id_empresa", "id_orcamento") REFERENCES "public"."orcamentos"("id_empresa", "id");



ALTER TABLE ONLY "public"."comissoes_regras"
    ADD CONSTRAINT "comissoes_regras_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comissoes_regras"
    ADD CONSTRAINT "comissoes_regras_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comissoes_regras"
    ADD CONSTRAINT "comissoes_regras_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comissoes_regras"
    ADD CONSTRAINT "comissoes_regras_produto_empresa_fkey" FOREIGN KEY ("id_empresa", "id_produto") REFERENCES "public"."produtos"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comissoes_regras"
    ADD CONSTRAINT "comissoes_regras_servico_empresa_fkey" FOREIGN KEY ("id_empresa", "id_servico") REFERENCES "public"."servicos"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compras"
    ADD CONSTRAINT "compras_conta_empresa_fkey" FOREIGN KEY ("id_empresa", "id_conta") REFERENCES "public"."contas"("id_empresa", "id");



ALTER TABLE ONLY "public"."compras"
    ADD CONSTRAINT "compras_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compras"
    ADD CONSTRAINT "compras_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compras"
    ADD CONSTRAINT "compras_fornecedor_empresa_fkey" FOREIGN KEY ("id_empresa", "id_fornecedor") REFERENCES "public"."fornecedores"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."compras_itens"
    ADD CONSTRAINT "compras_itens_compra_empresa_fkey" FOREIGN KEY ("id_empresa", "id_compra") REFERENCES "public"."compras"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compras_itens"
    ADD CONSTRAINT "compras_itens_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compras_itens"
    ADD CONSTRAINT "compras_itens_produto_empresa_fkey" FOREIGN KEY ("id_empresa", "id_produto") REFERENCES "public"."produtos"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."configuracoes_empresas"
    ADD CONSTRAINT "configuracoes_empresas_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."configuracoes_empresas"
    ADD CONSTRAINT "configuracoes_empresas_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consentimentos_comunicacao"
    ADD CONSTRAINT "consentimentos_cliente_empresa_fkey" FOREIGN KEY ("id_empresa", "id_cliente") REFERENCES "public"."clientes"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consentimentos_comunicacao"
    ADD CONSTRAINT "consentimentos_comunicacao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consentimentos_comunicacao"
    ADD CONSTRAINT "consentimentos_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_categoria_empresa_fkey" FOREIGN KEY ("id_empresa", "id_categoria") REFERENCES "public"."categorias_financeiras"("id_empresa", "id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_cliente_empresa_fkey" FOREIGN KEY ("id_empresa", "id_cliente") REFERENCES "public"."clientes"("id_empresa", "id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_comanda_empresa_fkey" FOREIGN KEY ("id_empresa", "id_comanda") REFERENCES "public"."comandas"("id_empresa", "id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_fornecedor_empresa_fkey" FOREIGN KEY ("id_empresa", "id_fornecedor") REFERENCES "public"."fornecedores"("id_empresa", "id");



ALTER TABLE ONLY "public"."contas_parcelas"
    ADD CONSTRAINT "contas_parcelas_conta_empresa_fkey" FOREIGN KEY ("id_empresa", "id_conta") REFERENCES "public"."contas"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."convites_empresa"
    ADD CONSTRAINT "convites_empresa_aceito_por_fkey" FOREIGN KEY ("aceito_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."convites_empresa"
    ADD CONSTRAINT "convites_empresa_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."convites_empresa"
    ADD CONSTRAINT "convites_empresa_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disponibilidades"
    ADD CONSTRAINT "disponibilidades_bloqueio_fkey" FOREIGN KEY ("id_empresa", "id_bloqueio_agenda") REFERENCES "public"."bloqueios_agenda"("id_empresa", "id");



ALTER TABLE ONLY "public"."disponibilidades"
    ADD CONSTRAINT "disponibilidades_profissional_fkey" FOREIGN KEY ("id_empresa", "id_profissional") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disponibilidades"
    ADD CONSTRAINT "disponibilidades_unidade_fkey" FOREIGN KEY ("id_empresa", "id_unidade") REFERENCES "public"."unidades"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."empresas"
    ADD CONSTRAINT "empresas_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."eventos_sistema"
    ADD CONSTRAINT "eventos_sistema_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fila_mensagens"
    ADD CONSTRAINT "fila_mensagens_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "public"."clientes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fila_mensagens"
    ADD CONSTRAINT "fila_mensagens_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fila_mensagens"
    ADD CONSTRAINT "fila_mensagens_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "public"."eventos_sistema"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fila_mensagens"
    ADD CONSTRAINT "fila_mensagens_id_integracao_fkey" FOREIGN KEY ("id_integracao") REFERENCES "public"."integracoes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."formas_pagamento"
    ADD CONSTRAINT "formas_pagamento_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fornecedores"
    ADD CONSTRAINT "fornecedores_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios_ausencias"
    ADD CONSTRAINT "funcionarios_ausencias_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funcionarios_ausencias"
    ADD CONSTRAINT "funcionarios_ausencias_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios_ausencias"
    ADD CONSTRAINT "funcionarios_ausencias_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios_horarios"
    ADD CONSTRAINT "funcionarios_horarios_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios_horarios"
    ADD CONSTRAINT "funcionarios_horarios_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios"
    ADD CONSTRAINT "funcionarios_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios_remuneracoes"
    ADD CONSTRAINT "funcionarios_remuneracoes_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios_remuneracoes"
    ADD CONSTRAINT "funcionarios_remuneracoes_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios_servicos"
    ADD CONSTRAINT "funcionarios_servicos_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios_servicos"
    ADD CONSTRAINT "funcionarios_servicos_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios_servicos"
    ADD CONSTRAINT "funcionarios_servicos_servico_empresa_fkey" FOREIGN KEY ("id_empresa", "id_servico") REFERENCES "public"."servicos"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funcionarios"
    ADD CONSTRAINT "funcionarios_usuario_empresa_fkey" FOREIGN KEY ("id_empresa", "usuario_empresa_id") REFERENCES "public"."usuarios_empresas"("empresa_id", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."historico_agendamentos"
    ADD CONSTRAINT "historico_agendamentos_agendamento_fkey" FOREIGN KEY ("id_empresa", "id_agendamento") REFERENCES "public"."agendamentos"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historico_agendamentos"
    ADD CONSTRAINT "historico_agendamentos_unidade_fkey" FOREIGN KEY ("id_empresa", "id_unidade") REFERENCES "public"."unidades"("id_empresa", "id");



ALTER TABLE ONLY "public"."horarios_funcionamento"
    ADD CONSTRAINT "horarios_funcionamento_unidade_fkey" FOREIGN KEY ("id_empresa", "id_unidade") REFERENCES "public"."unidades"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."horarios_funcionarios"
    ADD CONSTRAINT "horarios_funcionarios_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."horarios_funcionarios"
    ADD CONSTRAINT "horarios_funcionarios_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."horarios_funcionarios"
    ADD CONSTRAINT "horarios_funcionarios_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integracoes"
    ADD CONSTRAINT "integracoes_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lancamentos_comissao"
    ADD CONSTRAINT "lancamentos_comissao_comanda_empresa_fkey" FOREIGN KEY ("id_empresa", "id_comanda") REFERENCES "public"."comandas"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lancamentos_comissao"
    ADD CONSTRAINT "lancamentos_comissao_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lancamentos_comissao"
    ADD CONSTRAINT "lancamentos_comissao_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lancamentos_comissao"
    ADD CONSTRAINT "lancamentos_comissao_item_empresa_fkey" FOREIGN KEY ("id_empresa", "id_comanda_item") REFERENCES "public"."comandas_itens"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lancamentos_comissao"
    ADD CONSTRAINT "lancamentos_comissao_regra_empresa_fkey" FOREIGN KEY ("id_empresa", "id_regra") REFERENCES "public"."comissoes_regras"("id_empresa", "id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movimentos_caixa"
    ADD CONSTRAINT "movimentos_caixa_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movimentos_caixa"
    ADD CONSTRAINT "movimentos_caixa_estornado_por_fkey" FOREIGN KEY ("estornado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movimentos_caixa"
    ADD CONSTRAINT "movimentos_caixa_forma_empresa_fkey" FOREIGN KEY ("id_empresa", "id_forma_pagamento") REFERENCES "public"."formas_pagamento"("id_empresa", "id");



ALTER TABLE ONLY "public"."movimentos_caixa"
    ADD CONSTRAINT "movimentos_caixa_pagamento_empresa_fkey" FOREIGN KEY ("id_empresa", "id_pagamento") REFERENCES "public"."pagamentos"("id_empresa", "id");



ALTER TABLE ONLY "public"."movimentos_caixa"
    ADD CONSTRAINT "movimentos_caixa_sessao_empresa_fkey" FOREIGN KEY ("id_empresa", "id_caixa", "id_sessao_caixa") REFERENCES "public"."sessoes_caixa"("id_empresa", "id_caixa", "id");



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_comanda_item_empresa_fkey" FOREIGN KEY ("id_empresa", "id_comanda_item") REFERENCES "public"."comandas_itens"("id_empresa", "id");



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_compra_item_empresa_fkey" FOREIGN KEY ("id_empresa", "id_compra_item") REFERENCES "public"."compras_itens"("id_empresa", "id") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_estornado_por_fkey" FOREIGN KEY ("estornado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_produto_empresa_fkey" FOREIGN KEY ("id_empresa", "id_produto") REFERENCES "public"."produtos"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_cliente_empresa_fkey" FOREIGN KEY ("id_empresa", "id_cliente") REFERENCES "public"."clientes"("id_empresa", "id");



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orcamentos_itens"
    ADD CONSTRAINT "orcamentos_itens_orcamento_empresa_fkey" FOREIGN KEY ("id_empresa", "id_orcamento") REFERENCES "public"."orcamentos"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orcamentos_itens"
    ADD CONSTRAINT "orcamentos_itens_produto_empresa_fkey" FOREIGN KEY ("id_empresa", "id_produto") REFERENCES "public"."produtos"("id_empresa", "id");



ALTER TABLE ONLY "public"."orcamentos_itens"
    ADD CONSTRAINT "orcamentos_itens_servico_empresa_fkey" FOREIGN KEY ("id_empresa", "id_servico") REFERENCES "public"."servicos"("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos"
    ADD CONSTRAINT "pagamentos_agendamento_fkey" FOREIGN KEY ("id_empresa", "id_agendamento") REFERENCES "public"."agendamentos"("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos_alocacoes"
    ADD CONSTRAINT "pagamentos_alocacoes_pagamento_empresa_fkey" FOREIGN KEY ("id_empresa", "id_pagamento") REFERENCES "public"."pagamentos"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_alocacoes"
    ADD CONSTRAINT "pagamentos_alocacoes_parcela_empresa_fkey" FOREIGN KEY ("id_empresa", "id_parcela") REFERENCES "public"."contas_parcelas"("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos_comissao"
    ADD CONSTRAINT "pagamentos_comissao_confirmado_por_fkey" FOREIGN KEY ("confirmado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pagamentos_comissao"
    ADD CONSTRAINT "pagamentos_comissao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pagamentos_comissao"
    ADD CONSTRAINT "pagamentos_comissao_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_comissao"
    ADD CONSTRAINT "pagamentos_comissao_forma_empresa_fkey" FOREIGN KEY ("id_empresa", "id_forma_pagamento") REFERENCES "public"."formas_pagamento"("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos_comissao"
    ADD CONSTRAINT "pagamentos_comissao_funcionario_empresa_fkey" FOREIGN KEY ("id_empresa", "id_funcionario") REFERENCES "public"."funcionarios"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pagamentos_comissao_itens"
    ADD CONSTRAINT "pagamentos_comissao_itens_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_comissao_itens"
    ADD CONSTRAINT "pagamentos_comissao_itens_lancamento_empresa_fkey" FOREIGN KEY ("id_empresa", "id_lancamento_comissao") REFERENCES "public"."lancamentos_comissao"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pagamentos_comissao_itens"
    ADD CONSTRAINT "pagamentos_comissao_itens_pagamento_empresa_fkey" FOREIGN KEY ("id_empresa", "id_pagamento_comissao") REFERENCES "public"."pagamentos_comissao"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_comissao"
    ADD CONSTRAINT "pagamentos_comissao_pagamento_empresa_fkey" FOREIGN KEY ("id_empresa", "id_pagamento") REFERENCES "public"."pagamentos"("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos_comissao"
    ADD CONSTRAINT "pagamentos_comissao_sessao_empresa_fkey" FOREIGN KEY ("id_empresa", "id_sessao_caixa") REFERENCES "public"."sessoes_caixa"("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos"
    ADD CONSTRAINT "pagamentos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pagamentos"
    ADD CONSTRAINT "pagamentos_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos"
    ADD CONSTRAINT "pagamentos_estornado_por_fkey" FOREIGN KEY ("estornado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pagamentos"
    ADD CONSTRAINT "pagamentos_forma_empresa_fkey" FOREIGN KEY ("id_empresa", "id_forma_pagamento") REFERENCES "public"."formas_pagamento"("id_empresa", "id");



ALTER TABLE ONLY "public"."pagamentos"
    ADD CONSTRAINT "pagamentos_sessao_empresa_fkey" FOREIGN KEY ("id_empresa", "id_sessao_caixa") REFERENCES "public"."sessoes_caixa"("id_empresa", "id");



ALTER TABLE ONLY "public"."permissoes_planos"
    ADD CONSTRAINT "permissoes_planos_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "public"."planos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."permissoes_usuarios"
    ADD CONSTRAINT "permissoes_usuarios_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."permissoes_usuarios"
    ADD CONSTRAINT "permissoes_usuarios_vinculo_fkey" FOREIGN KEY ("id_empresa", "usuario_empresa_id") REFERENCES "public"."usuarios_empresas"("empresa_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."politicas_cancelamento"
    ADD CONSTRAINT "politicas_cancelamento_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."politicas_cancelamento"
    ADD CONSTRAINT "politicas_cancelamento_unidade_fkey" FOREIGN KEY ("id_empresa", "id_unidade") REFERENCES "public"."unidades"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preferencias_lembrete"
    ADD CONSTRAINT "preferencias_lembrete_cliente_fkey" FOREIGN KEY ("id_empresa", "id_cliente") REFERENCES "public"."clientes"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."produtos_fornecedores"
    ADD CONSTRAINT "produtos_fornecedores_fornecedor_empresa_fkey" FOREIGN KEY ("id_empresa", "id_fornecedor") REFERENCES "public"."fornecedores"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."produtos_fornecedores"
    ADD CONSTRAINT "produtos_fornecedores_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."produtos_fornecedores"
    ADD CONSTRAINT "produtos_fornecedores_produto_empresa_fkey" FOREIGN KEY ("id_empresa", "id_produto") REFERENCES "public"."produtos"("id_empresa", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."servicos"
    ADD CONSTRAINT "servicos_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessoes_caixa"
    ADD CONSTRAINT "sessoes_caixa_aberta_por_fkey" FOREIGN KEY ("aberta_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessoes_caixa"
    ADD CONSTRAINT "sessoes_caixa_caixa_empresa_fkey" FOREIGN KEY ("id_empresa", "id_caixa") REFERENCES "public"."caixas"("id_empresa", "id");



ALTER TABLE ONLY "public"."sessoes_caixa"
    ADD CONSTRAINT "sessoes_caixa_cancelada_por_fkey" FOREIGN KEY ("cancelada_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessoes_caixa"
    ADD CONSTRAINT "sessoes_caixa_fechada_por_fkey" FOREIGN KEY ("fechada_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sites_publicos_dominios"
    ADD CONSTRAINT "sites_publicos_dominios_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sites_publicos_dominios"
    ADD CONSTRAINT "sites_publicos_dominios_id_site_fkey" FOREIGN KEY ("id_site") REFERENCES "public"."sites_publicos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sites_publicos"
    ADD CONSTRAINT "sites_publicos_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sites_publicos"
    ADD CONSTRAINT "sites_publicos_unidade_fkey" FOREIGN KEY ("id_empresa", "id_unidade_principal") REFERENCES "public"."unidades"("id_empresa", "id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."solicitacoes_privacidade"
    ADD CONSTRAINT "solicitacoes_privacidade_cliente_fkey" FOREIGN KEY ("id_empresa", "id_cliente") REFERENCES "public"."clientes"("id_empresa", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."unidades"
    ADD CONSTRAINT "unidades_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios_empresas"
    ADD CONSTRAINT "usuarios_empresas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios_empresas"
    ADD CONSTRAINT "usuarios_empresas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."agendamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agendamentos_cliente_le_proprios" ON "public"."agendamentos" FOR SELECT TO "authenticated" USING ("private"."usuario_eh_cliente"("id_empresa", "id_cliente"));



CREATE POLICY "agendamentos_equipe_atualiza" ON "public"."agendamentos" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "agendamentos_equipe_insere" ON "public"."agendamentos" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "agendamentos_equipe_ou_profissional_le" ON "public"."agendamentos" FOR SELECT TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]) OR "private"."usuario_participa_agendamento"("id")));



ALTER TABLE "public"."agendamentos_servicos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agendamentos_servicos_cliente_le_proprios" ON "public"."agendamentos_servicos" FOR SELECT TO "authenticated" USING ("private"."usuario_eh_cliente_agendamento"("id_empresa", "id_agendamento"));



CREATE POLICY "agendamentos_servicos_equipe_atualiza" ON "public"."agendamentos_servicos" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "agendamentos_servicos_equipe_insere" ON "public"."agendamentos_servicos" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "agendamentos_servicos_equipe_ou_profissional_le" ON "public"."agendamentos_servicos" FOR SELECT TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]) OR "private"."usuario_eh_funcionario"("id_funcionario")));



ALTER TABLE "public"."assinaturas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "assinaturas_membros_leem" ON "public"."assinaturas" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."auditorias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "auditorias_gestao_le" ON "public"."auditorias" FOR SELECT TO "authenticated" USING ((("id_empresa" IS NOT NULL) AND "private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])));



ALTER TABLE "public"."ausencias_funcionarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ausencias_funcionarios_insert" ON "public"."ausencias_funcionarios" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "ausencias_funcionarios_select" ON "public"."ausencias_funcionarios" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "ausencias_funcionarios_update" ON "public"."ausencias_funcionarios" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."avaliacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "avaliacoes_cliente_cria_propria" ON "public"."avaliacoes" FOR INSERT TO "authenticated" WITH CHECK (("private"."usuario_eh_cliente"("id_empresa", "id_cliente") AND ("status" = 'pendente'::"text") AND (NOT "autorizado_publicacao")));



CREATE POLICY "avaliacoes_cliente_le_proprias" ON "public"."avaliacoes" FOR SELECT TO "authenticated" USING ("private"."usuario_eh_cliente"("id_empresa", "id_cliente"));



CREATE POLICY "avaliacoes_equipe_le" ON "public"."avaliacoes" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "avaliacoes_gestao_modera" ON "public"."avaliacoes" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."bloqueios_agenda" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bloqueios_agenda_insert" ON "public"."bloqueios_agenda" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "bloqueios_agenda_select" ON "public"."bloqueios_agenda" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "bloqueios_agenda_update" ON "public"."bloqueios_agenda" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."caixas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "caixas_gestao_atualiza" ON "public"."caixas" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "caixas_gestao_insere" ON "public"."caixas" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "caixas_membros_leem" ON "public"."caixas" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."categorias_financeiras" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categorias_financeiras_equipe_atualiza" ON "public"."categorias_financeiras" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "categorias_financeiras_equipe_insere" ON "public"."categorias_financeiras" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "categorias_financeiras_membros_leem" ON "public"."categorias_financeiras" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clientes_cliente_le_proprio" ON "public"."clientes" FOR SELECT TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "clientes_equipe_atualiza" ON "public"."clientes" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "clientes_equipe_insere" ON "public"."clientes" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "clientes_membros_leem" ON "public"."clientes" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."comandas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comandas_equipe_atualiza" ON "public"."comandas" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "comandas_equipe_insere" ON "public"."comandas" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."comandas_itens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comandas_itens_equipe_atualiza" ON "public"."comandas_itens" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "comandas_itens_equipe_exclui" ON "public"."comandas_itens" FOR DELETE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "comandas_itens_equipe_insere" ON "public"."comandas_itens" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "comandas_itens_membros_leem" ON "public"."comandas_itens" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "comandas_membros_leem" ON "public"."comandas" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."comissoes_regras" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comissoes_regras_select" ON "public"."comissoes_regras" FOR SELECT TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."compras" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "compras_insert" ON "public"."compras" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."compras_itens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "compras_itens_insert" ON "public"."compras_itens" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "compras_itens_select" ON "public"."compras_itens" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "compras_itens_update" ON "public"."compras_itens" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "compras_select" ON "public"."compras" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "compras_update" ON "public"."compras" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."configuracoes_empresas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "configuracoes_empresas_membros_leem" ON "public"."configuracoes_empresas" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."consentimentos_comunicacao" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "consentimentos_delete_gestao" ON "public"."consentimentos_comunicacao" FOR DELETE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "consentimentos_insert_equipe" ON "public"."consentimentos_comunicacao" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "consentimentos_select_equipe" ON "public"."consentimentos_comunicacao" FOR SELECT TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "consentimentos_update_equipe" ON "public"."consentimentos_comunicacao" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."contas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contas_equipe_le" ON "public"."contas" FOR SELECT TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]) OR (("tipo" = 'receber'::"text") AND "private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['recepcionista'::"public"."tipos_usuarios"]))));



ALTER TABLE "public"."contas_parcelas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contas_parcelas_equipe_le" ON "public"."contas_parcelas" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."contas" "c"
  WHERE (("c"."id" = "contas_parcelas"."id_conta") AND ("c"."id_empresa" = "contas_parcelas"."id_empresa")))));



ALTER TABLE "public"."convites_empresa" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "convites_empresa_gestao_le" ON "public"."convites_empresa" FOR SELECT TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."disponibilidades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "disponibilidades_equipe_ou_proprio_gerencia" ON "public"."disponibilidades" TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]) OR "private"."usuario_eh_funcionario"("id_profissional"))) WITH CHECK (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]) OR "private"."usuario_eh_funcionario"("id_profissional")));



CREATE POLICY "disponibilidades_membros_leem" ON "public"."disponibilidades" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."empresas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "empresas_dono_atualiza" ON "public"."empresas" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id", ARRAY['dono'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id", ARRAY['dono'::"public"."tipos_usuarios"]));



CREATE POLICY "empresas_membros_leem" ON "public"."empresas" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id"));



CREATE POLICY "empresas_usuario_cria" ON "public"."empresas" FOR INSERT TO "authenticated" WITH CHECK (("criado_por" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."eventos_sistema" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "eventos_sistema_select_gestao" ON "public"."eventos_sistema" FOR SELECT TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."fila_mensagens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fila_mensagens_select_equipe" ON "public"."fila_mensagens" FOR SELECT TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."formas_pagamento" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "formas_pagamento_equipe_atualiza" ON "public"."formas_pagamento" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "formas_pagamento_equipe_insere" ON "public"."formas_pagamento" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "formas_pagamento_membros_leem" ON "public"."formas_pagamento" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."fornecedores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fornecedores_equipe_atualiza" ON "public"."fornecedores" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "fornecedores_equipe_insere" ON "public"."fornecedores" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "fornecedores_membros_leem" ON "public"."fornecedores" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."funcionarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funcionarios_ausencias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funcionarios_ausencias_gestao_atualiza" ON "public"."funcionarios_ausencias" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "funcionarios_ausencias_gestao_ou_proprio_insere" ON "public"."funcionarios_ausencias" FOR INSERT TO "authenticated" WITH CHECK (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]) OR ("private"."usuario_eh_funcionario"("id_funcionario") AND ("status" = 'pendente'::"text"))));



CREATE POLICY "funcionarios_ausencias_gestao_ou_proprio_le" ON "public"."funcionarios_ausencias" FOR SELECT TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]) OR "private"."usuario_eh_funcionario"("id_funcionario")));



CREATE POLICY "funcionarios_equipe_le" ON "public"."funcionarios" FOR SELECT TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]) OR "private"."usuario_eh_funcionario"("id")));



CREATE POLICY "funcionarios_gestao_atualiza" ON "public"."funcionarios" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "funcionarios_gestao_insere" ON "public"."funcionarios" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."funcionarios_horarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funcionarios_horarios_gestao_atualiza" ON "public"."funcionarios_horarios" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "funcionarios_horarios_gestao_insere" ON "public"."funcionarios_horarios" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "funcionarios_horarios_membros_leem" ON "public"."funcionarios_horarios" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."funcionarios_remuneracoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funcionarios_servicos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funcionarios_servicos_gestao_atualiza" ON "public"."funcionarios_servicos" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "funcionarios_servicos_gestao_insere" ON "public"."funcionarios_servicos" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "funcionarios_servicos_membros_leem" ON "public"."funcionarios_servicos" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historico_agendamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "historico_agendamentos_membros_leem" ON "public"."historico_agendamentos" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."horarios_funcionamento" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "horarios_funcionamento_gestao_gerencia" ON "public"."horarios_funcionamento" TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "horarios_funcionamento_membros_leem" ON "public"."horarios_funcionamento" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."horarios_funcionarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "horarios_funcionarios_insert" ON "public"."horarios_funcionarios" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "horarios_funcionarios_select" ON "public"."horarios_funcionarios" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "horarios_funcionarios_update" ON "public"."horarios_funcionarios" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."integracoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integracoes_delete_gestao" ON "public"."integracoes" FOR DELETE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "integracoes_insert_gestao" ON "public"."integracoes" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "integracoes_select_gestao" ON "public"."integracoes" FOR SELECT TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "integracoes_update_gestao" ON "public"."integracoes" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."lancamentos_comissao" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lancamentos_comissao_select" ON "public"."lancamentos_comissao" FOR SELECT TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]) OR "private"."usuario_eh_funcionario"("id_funcionario")));



ALTER TABLE "public"."movimentos_caixa" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "movimentos_caixa_equipe_le" ON "public"."movimentos_caixa" FOR SELECT TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."movimentos_estoque" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "movimentos_estoque_insert" ON "public"."movimentos_estoque" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "movimentos_estoque_select" ON "public"."movimentos_estoque" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "movimentos_estoque_update" ON "public"."movimentos_estoque" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."orcamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orcamentos_equipe_atualiza" ON "public"."orcamentos" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "orcamentos_equipe_insere" ON "public"."orcamentos" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."orcamentos_itens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orcamentos_itens_equipe_atualiza" ON "public"."orcamentos_itens" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "orcamentos_itens_equipe_exclui" ON "public"."orcamentos_itens" FOR DELETE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "orcamentos_itens_equipe_insere" ON "public"."orcamentos_itens" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "orcamentos_itens_membros_leem" ON "public"."orcamentos_itens" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "orcamentos_membros_leem" ON "public"."orcamentos" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."pagamentos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pagamentos_alocacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pagamentos_alocacoes_equipe_le" ON "public"."pagamentos_alocacoes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."pagamentos" "p"
  WHERE (("p"."id" = "pagamentos_alocacoes"."id_pagamento") AND ("p"."id_empresa" = "pagamentos_alocacoes"."id_empresa")))));



ALTER TABLE "public"."pagamentos_comissao" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pagamentos_comissao_itens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pagamentos_comissao_itens_select" ON "public"."pagamentos_comissao_itens" FOR SELECT TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "pagamentos_comissao_select" ON "public"."pagamentos_comissao" FOR SELECT TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]) OR "private"."usuario_eh_funcionario"("id_funcionario")));



CREATE POLICY "pagamentos_equipe_le" ON "public"."pagamentos" FOR SELECT TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]) OR (("tipo" = 'entrada'::"text") AND "private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['recepcionista'::"public"."tipos_usuarios"]))));



ALTER TABLE "public"."permissoes_planos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "permissoes_planos_leitura_publica" ON "public"."permissoes_planos" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."planos" "p"
  WHERE (("p"."id" = "permissoes_planos"."plano_id") AND "p"."ativo" AND "p"."publico"))));



ALTER TABLE "public"."permissoes_usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "permissoes_usuarios_leitura" ON "public"."permissoes_usuarios" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."usuarios_empresas" "ue"
  WHERE (("ue"."id" = "permissoes_usuarios"."usuario_empresa_id") AND ("ue"."empresa_id" = "permissoes_usuarios"."id_empresa") AND ("ue"."status" = 'ativo'::"public"."status_usuario_empresa") AND (("ue"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "private"."usuario_tem_tipo_empresa"("permissoes_usuarios"."id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]))))));



ALTER TABLE "public"."planos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "planos_leitura_publica" ON "public"."planos" FOR SELECT TO "authenticated", "anon" USING (("ativo" AND "publico"));



ALTER TABLE "public"."politicas_cancelamento" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "politicas_cancelamento_gestao_gerencia" ON "public"."politicas_cancelamento" TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "politicas_cancelamento_membros_leem" ON "public"."politicas_cancelamento" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."preferencias_lembrete" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "preferencias_lembrete_cliente_atualiza_proprias" ON "public"."preferencias_lembrete" FOR UPDATE TO "authenticated" USING ("private"."usuario_eh_cliente"("id_empresa", "id_cliente")) WITH CHECK ("private"."usuario_eh_cliente"("id_empresa", "id_cliente"));



CREATE POLICY "preferencias_lembrete_cliente_insere_proprias" ON "public"."preferencias_lembrete" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_eh_cliente"("id_empresa", "id_cliente"));



CREATE POLICY "preferencias_lembrete_cliente_le_proprias" ON "public"."preferencias_lembrete" FOR SELECT TO "authenticated" USING ("private"."usuario_eh_cliente"("id_empresa", "id_cliente"));



CREATE POLICY "preferencias_lembrete_equipe_gerencia" ON "public"."preferencias_lembrete" TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "preferencias_lembrete_membros_leem" ON "public"."preferencias_lembrete" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."produtos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "produtos_equipe_atualiza" ON "public"."produtos" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "produtos_equipe_insere" ON "public"."produtos" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."produtos_fornecedores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "produtos_fornecedores_equipe_atualiza" ON "public"."produtos_fornecedores" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "produtos_fornecedores_equipe_insere" ON "public"."produtos_fornecedores" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



CREATE POLICY "produtos_fornecedores_membros_leem" ON "public"."produtos_fornecedores" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "produtos_membros_leem" ON "public"."produtos" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "remuneracoes_dono_atualiza" ON "public"."funcionarios_remuneracoes" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios"]));



CREATE POLICY "remuneracoes_dono_insere" ON "public"."funcionarios_remuneracoes" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios"]));



CREATE POLICY "remuneracoes_dono_ou_proprio_le" ON "public"."funcionarios_remuneracoes" FOR SELECT TO "authenticated" USING (("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios"]) OR "private"."usuario_eh_funcionario"("id_funcionario")));



ALTER TABLE "public"."servicos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "servicos_gestao_atualiza" ON "public"."servicos" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "servicos_gestao_insere" ON "public"."servicos" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "servicos_membros_leem" ON "public"."servicos" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."sessoes_caixa" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessoes_caixa_equipe_le" ON "public"."sessoes_caixa" FOR SELECT TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios", 'recepcionista'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."sites_publicos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sites_publicos_dominios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sites_publicos_dominios_gestao_gerencia" ON "public"."sites_publicos_dominios" TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "sites_publicos_dominios_membros_leem" ON "public"."sites_publicos_dominios" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



CREATE POLICY "sites_publicos_gestao_gerencia" ON "public"."sites_publicos" TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "sites_publicos_membros_leem" ON "public"."sites_publicos" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."solicitacoes_privacidade" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "solicitacoes_privacidade_cliente_le_proprias" ON "public"."solicitacoes_privacidade" FOR SELECT TO "authenticated" USING ("private"."usuario_eh_cliente"("id_empresa", "id_cliente"));



CREATE POLICY "solicitacoes_privacidade_gestao_gerencia" ON "public"."solicitacoes_privacidade" TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



ALTER TABLE "public"."unidades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "unidades_gestao_gerencia" ON "public"."unidades" TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("id_empresa", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"]));



CREATE POLICY "unidades_membros_leem" ON "public"."unidades" FOR SELECT TO "authenticated" USING ("private"."usuario_pertence_empresa"("id_empresa"));



ALTER TABLE "public"."usuarios_empresas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuarios_empresas_dono_atualiza" ON "public"."usuarios_empresas" FOR UPDATE TO "authenticated" USING ("private"."usuario_tem_tipo_empresa"("empresa_id", ARRAY['dono'::"public"."tipos_usuarios"])) WITH CHECK ("private"."usuario_tem_tipo_empresa"("empresa_id", ARRAY['dono'::"public"."tipos_usuarios"]));



CREATE POLICY "usuarios_empresas_dono_insere" ON "public"."usuarios_empresas" FOR INSERT TO "authenticated" WITH CHECK ("private"."usuario_tem_tipo_empresa"("empresa_id", ARRAY['dono'::"public"."tipos_usuarios"]));



CREATE POLICY "usuarios_empresas_leitura" ON "public"."usuarios_empresas" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "private"."usuario_tem_tipo_empresa"("empresa_id", ARRAY['dono'::"public"."tipos_usuarios", 'gerente'::"public"."tipos_usuarios"])));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."empresas" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."empresas" TO "authenticated";



GRANT ALL ON TABLE "public"."configuracoes_empresas" TO "service_role";
GRANT SELECT ON TABLE "public"."configuracoes_empresas" TO "authenticated";



GRANT ALL ON TABLE "public"."integracoes" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."integracoes" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."aceitar_convites_pendentes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."aceitar_convites_pendentes"() TO "service_role";
GRANT ALL ON FUNCTION "public"."aceitar_convites_pendentes"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."alterar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_acao" "text", "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."alterar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_acao" "text", "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."alterar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_acao" "text", "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."atualizar_dados_cliente_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_data_nascimento" "date", "p_canal_preferido" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."atualizar_dados_cliente_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_data_nascimento" "date", "p_canal_preferido" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."atualizar_dados_cliente_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_data_nascimento" "date", "p_canal_preferido" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."atualizar_preferencias_cliente_site"("p_id_empresa" bigint, "p_whatsapp" boolean, "p_email" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."atualizar_preferencias_cliente_site"("p_id_empresa" bigint, "p_whatsapp" boolean, "p_email" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."atualizar_preferencias_cliente_site"("p_id_empresa" bigint, "p_whatsapp" boolean, "p_email" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") TO "service_role";
GRANT ALL ON FUNCTION "public"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") TO "service_role";
GRANT ALL ON FUNCTION "public"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") TO "service_role";
GRANT ALL ON FUNCTION "public"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date") TO "service_role";
GRANT ALL ON FUNCTION "public"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor_pagamento" numeric, "p_referencia" "text", "p_observacoes_pagamento" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor_pagamento" numeric, "p_referencia" "text", "p_observacoes_pagamento" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor_pagamento" numeric, "p_referencia" "text", "p_observacoes_pagamento" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text", "p_acao" "text", "p_tabela" "text", "p_inicio" timestamp with time zone, "p_fim" timestamp with time zone, "p_pagina" integer, "p_por_pagina" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text", "p_acao" "text", "p_tabela" "text", "p_inicio" timestamp with time zone, "p_fim" timestamp with time zone, "p_pagina" integer, "p_por_pagina" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text", "p_acao" "text", "p_tabela" "text", "p_inicio" timestamp with time zone, "p_fim" timestamp with time zone, "p_pagina" integer, "p_por_pagina" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."listar_usuarios_administracao"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."listar_usuarios_administracao"("p_id_empresa" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."listar_usuarios_administracao"("p_id_empresa" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."obter_agendamento_site"("p_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."obter_agendamento_site"("p_token" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."obter_agendamento_site"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."obter_agendamento_site"("p_token" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "public"."obter_area_cliente_site"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."obter_area_cliente_site"("p_id_empresa" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."obter_area_cliente_site"("p_id_empresa" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."obter_catalogo_site"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."obter_catalogo_site"("p_id_empresa" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."obter_catalogo_site"("p_id_empresa" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."obter_catalogo_site"("p_id_empresa" bigint) TO "anon";



REVOKE ALL ON FUNCTION "public"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date", "p_dias_periodo" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date", "p_dias_periodo" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date", "p_dias_periodo" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "anon";



REVOKE ALL ON FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."reagendar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reagendar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."reagendar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) TO "anon";



REVOKE ALL ON FUNCTION "public"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") TO "service_role";
GRANT ALL ON FUNCTION "public"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") TO "service_role";
GRANT ALL ON FUNCTION "public"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."resolver_site_publico"("p_dominio" "text", "p_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."resolver_site_publico"("p_dominio" "text", "p_slug" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."resolver_site_publico"("p_dominio" "text", "p_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resolver_site_publico"("p_dominio" "text", "p_slug" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_agendamento"("p_agendamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_observacoes" "text", "p_sinal_status" "text", "p_sinal_valor" numeric, "p_servicos" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_agendamento"("p_agendamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_observacoes" "text", "p_sinal_status" "text", "p_sinal_valor" numeric, "p_servicos" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_agendamento"("p_agendamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_observacoes" "text", "p_sinal_status" "text", "p_sinal_valor" numeric, "p_servicos" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_site_publico"("p_id_empresa" bigint, "p_config" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_site_publico"("p_id_empresa" bigint, "p_config" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."salvar_site_publico"("p_id_empresa" bigint, "p_config" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."solicitar_exclusao_dados_site"("p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."solicitar_exclusao_dados_site"("p_id_empresa" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."solicitar_exclusao_dados_site"("p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."vincular_cliente_email_site"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vincular_cliente_email_site"("p_id_empresa" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."vincular_cliente_email_site"("p_id_empresa" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."vincular_cliente_site"("p_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vincular_cliente_site"("p_token" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."vincular_cliente_site"("p_token" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."agendamentos" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."agendamentos" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."agendamentos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."agendamentos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."agendamentos_servicos" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."agendamentos_servicos" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."agendamentos_servicos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."agendamentos_servicos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."assinaturas" TO "service_role";
GRANT SELECT ON TABLE "public"."assinaturas" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."assinaturas_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."assinaturas_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."auditorias" TO "service_role";
GRANT SELECT ON TABLE "public"."auditorias" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."auditorias_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."auditorias_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."ausencias_funcionarios" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."ausencias_funcionarios" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."ausencias_funcionarios_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."ausencias_funcionarios_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."avaliacoes" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."avaliacoes" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."avaliacoes_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."avaliacoes_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."bloqueios_agenda" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."bloqueios_agenda" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."bloqueios_agenda_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."bloqueios_agenda_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."caixas" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."caixas" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."caixas_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."caixas_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."categorias_financeiras" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."categorias_financeiras" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."categorias_financeiras_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."categorias_financeiras_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."clientes" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."clientes" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."clientes_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."clientes_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."comandas" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."comandas" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."comandas_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."comandas_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."comandas_itens" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comandas_itens" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."comandas_itens_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."comandas_itens_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."comissoes_regras" TO "service_role";
GRANT SELECT ON TABLE "public"."comissoes_regras" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."comissoes_regras_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."comissoes_regras_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."compras" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."compras" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."compras_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."compras_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."compras_itens" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."compras_itens" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."compras_itens_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."compras_itens_id_seq" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."configuracoes_empresas_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."configuracoes_empresas_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."consentimentos_comunicacao" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."consentimentos_comunicacao" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."consentimentos_comunicacao_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."consentimentos_comunicacao_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."contas" TO "service_role";
GRANT SELECT ON TABLE "public"."contas" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."contas_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."contas_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."contas_parcelas" TO "service_role";
GRANT SELECT ON TABLE "public"."contas_parcelas" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."contas_parcelas_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."contas_parcelas_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."convites_empresa" TO "service_role";
GRANT SELECT ON TABLE "public"."convites_empresa" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."convites_empresa_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."convites_empresa_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."disponibilidades" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."disponibilidades" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."disponibilidades_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."disponibilidades_id_seq" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."empresas_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."empresas_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."eventos_sistema" TO "service_role";
GRANT SELECT ON TABLE "public"."eventos_sistema" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."eventos_sistema_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."eventos_sistema_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."fila_mensagens" TO "service_role";
GRANT SELECT ON TABLE "public"."fila_mensagens" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."fila_mensagens_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."fila_mensagens_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."formas_pagamento" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."formas_pagamento" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."formas_pagamento_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."formas_pagamento_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."fornecedores" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."fornecedores" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."fornecedores_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."fornecedores_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."funcionarios" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."funcionarios" TO "authenticated";



GRANT ALL ON TABLE "public"."funcionarios_ausencias" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."funcionarios_ausencias" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."funcionarios_ausencias_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."funcionarios_ausencias_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."funcionarios_horarios" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."funcionarios_horarios" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."funcionarios_horarios_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."funcionarios_horarios_id_seq" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."funcionarios_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."funcionarios_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."funcionarios_remuneracoes" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."funcionarios_remuneracoes" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."funcionarios_remuneracoes_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."funcionarios_remuneracoes_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."funcionarios_servicos" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."funcionarios_servicos" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."funcionarios_servicos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."funcionarios_servicos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON SEQUENCE "public"."games_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."historico_agendamentos" TO "service_role";
GRANT SELECT ON TABLE "public"."historico_agendamentos" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."historico_agendamentos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."historico_agendamentos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."horarios_funcionamento" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."horarios_funcionamento" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."horarios_funcionamento_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."horarios_funcionamento_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."horarios_funcionarios" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."horarios_funcionarios" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."horarios_funcionarios_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."horarios_funcionarios_id_seq" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."integracoes_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."integracoes_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."lancamentos_comissao" TO "service_role";
GRANT SELECT ON TABLE "public"."lancamentos_comissao" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."lancamentos_comissao_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."lancamentos_comissao_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."movimentos_caixa" TO "service_role";
GRANT SELECT ON TABLE "public"."movimentos_caixa" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."movimentos_caixa_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."movimentos_caixa_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."movimentos_estoque" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."movimentos_estoque" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."movimentos_estoque_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."movimentos_estoque_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."n8n_chat_histories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."n8n_chat_histories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notificacoes" TO "service_role";
GRANT SELECT ON TABLE "public"."notificacoes" TO "authenticated";



GRANT ALL ON TABLE "public"."orcamentos" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."orcamentos" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."orcamentos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."orcamentos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."orcamentos_itens" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."orcamentos_itens" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."orcamentos_itens_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."orcamentos_itens_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."pagamentos" TO "service_role";
GRANT SELECT ON TABLE "public"."pagamentos" TO "authenticated";



GRANT ALL ON TABLE "public"."pagamentos_alocacoes" TO "service_role";
GRANT SELECT ON TABLE "public"."pagamentos_alocacoes" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."pagamentos_alocacoes_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."pagamentos_alocacoes_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."pagamentos_comissao" TO "service_role";
GRANT SELECT ON TABLE "public"."pagamentos_comissao" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."pagamentos_comissao_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."pagamentos_comissao_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."pagamentos_comissao_itens" TO "service_role";
GRANT SELECT ON TABLE "public"."pagamentos_comissao_itens" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."pagamentos_comissao_itens_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."pagamentos_comissao_itens_id_seq" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."pagamentos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."pagamentos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."permissoes_planos" TO "service_role";
GRANT SELECT ON TABLE "public"."permissoes_planos" TO "anon";
GRANT SELECT ON TABLE "public"."permissoes_planos" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."permissoes_planos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."permissoes_planos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."permissoes_usuarios" TO "service_role";
GRANT SELECT ON TABLE "public"."permissoes_usuarios" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."permissoes_usuarios_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."permissoes_usuarios_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."planos" TO "service_role";
GRANT SELECT ON TABLE "public"."planos" TO "anon";
GRANT SELECT ON TABLE "public"."planos" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."planos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."planos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."politicas_cancelamento" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."politicas_cancelamento" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."politicas_cancelamento_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."politicas_cancelamento_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."preferencias_lembrete" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."preferencias_lembrete" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."preferencias_lembrete_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."preferencias_lembrete_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."produtos" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."produtos" TO "authenticated";



GRANT ALL ON TABLE "public"."produtos_fornecedores" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."produtos_fornecedores" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."produtos_fornecedores_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."produtos_fornecedores_id_seq" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."produtos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."produtos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."profissionais" TO "service_role";
GRANT SELECT ON TABLE "public"."profissionais" TO "authenticated";



GRANT ALL ON TABLE "public"."profissionais_servicos" TO "service_role";
GRANT SELECT ON TABLE "public"."profissionais_servicos" TO "authenticated";



GRANT ALL ON TABLE "public"."servicos" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."servicos" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."servicos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."servicos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."sessoes_caixa" TO "service_role";
GRANT SELECT ON TABLE "public"."sessoes_caixa" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."sessoes_caixa_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."sessoes_caixa_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."sites_publicos" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."sites_publicos" TO "authenticated";



GRANT ALL ON TABLE "public"."sites_publicos_dominios" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."sites_publicos_dominios" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."sites_publicos_dominios_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."sites_publicos_dominios_id_seq" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."sites_publicos_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."sites_publicos_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."solicitacoes_privacidade" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."solicitacoes_privacidade" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."solicitacoes_privacidade_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."unidades" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."unidades" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."unidades_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."unidades_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."usuarios_empresas" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."usuarios_empresas" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."usuarios_empresas_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."usuarios_empresas_id_seq" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







