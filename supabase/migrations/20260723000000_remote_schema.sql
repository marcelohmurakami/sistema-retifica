


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



CREATE TYPE "public"."categoria_contapagar" AS ENUM (
    'materiais',
    'peças',
    'cabeçote',
    'vira',
    'despesas',
    'salario',
    'impostos',
    'funcionarios'
);


ALTER TYPE "public"."categoria_contapagar" OWNER TO "postgres";


CREATE TYPE "public"."linha" AS ENUM (
    'leve',
    'pesada'
);


ALTER TYPE "public"."linha" OWNER TO "postgres";


CREATE TYPE "public"."movimentacao" AS ENUM (
    'entrada',
    'saida'
);


ALTER TYPE "public"."movimentacao" OWNER TO "postgres";


CREATE TYPE "public"."prioridade_tipo" AS ENUM (
    'baixo',
    'medio',
    'alto'
);


ALTER TYPE "public"."prioridade_tipo" OWNER TO "postgres";


CREATE TYPE "public"."situacaoOrcamento" AS ENUM (
    'analise',
    'aguardando',
    'producao',
    'pronto',
    'aguardandoPecas',
    'cancelado'
);


ALTER TYPE "public"."situacaoOrcamento" OWNER TO "postgres";


CREATE TYPE "public"."status_pagamento" AS ENUM (
    'pago',
    'pendente',
    'atrasado',
    'parcial'
);


ALTER TYPE "public"."status_pagamento" OWNER TO "postgres";


CREATE TYPE "public"."tipoServico" AS ENUM (
    'servico',
    'peca'
);


ALTER TYPE "public"."tipoServico" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auditar_alteracoes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if tg_op = 'INSERT' then
    insert into "Auditoria" (
      empresa_id,
      usuario_id,
      entidade,
      entidade_id,
      acao,
      dados_novos
    )
    values (
      new.empresa_id,
      auth.uid(),
      tg_table_name,
      new.id::text,
      'criou',
      to_jsonb(new)
    );

    return new;
  end if;

  if tg_op = 'UPDATE' then
    insert into "Auditoria" (
      empresa_id,
      usuario_id,
      entidade,
      entidade_id,
      acao,
      dados_anteriores,
      dados_novos
    )
    values (
      new.empresa_id,
      auth.uid(),
      tg_table_name,
      new.id::text,
      'editou',
      to_jsonb(old),
      to_jsonb(new)
    );

    return new;
  end if;

  if tg_op = 'DELETE' then
    insert into "Auditoria" (
      empresa_id,
      usuario_id,
      entidade,
      entidade_id,
      acao,
      dados_anteriores
    )
    values (
      old.empresa_id,
      auth.uid(),
      tg_table_name,
      old.id::text,
      'deletou',
      to_jsonb(old)
    );

    return old;
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."auditar_alteracoes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_clientes_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") RETURNS TABLE("cliente" "text", "total_os" numeric, "faturamento_total" numeric, "primeira_data" "date", "ultima_data" "date")
    LANGUAGE "sql"
    AS $$
  select
    c.cliente::text as cliente,
    count(os.id)::numeric as total_os,
    sum(os."valorServico")::numeric as faturamento_total,
    min(os."dataServico"::date) as primeira_data,
    max(os."dataServico"::date) as ultima_data
  from "OrdensDeServiço" os
  join "Clientes" c on c.id = os."idCliente"
  where os.empresa_id = p_empresa_id
    and os."dataServico"::date >= p_data_inicio
    and nullif(trim(c.cliente), '') is not null
    and lower(trim(c.cliente)) <> 'consumidor'
  group by c.cliente
  order by faturamento_total desc;
$$;


ALTER FUNCTION "public"."get_top_clientes_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_clientes_quantidade_os"("p_empresa_id" "uuid", "p_data_inicio" "date") RETURNS TABLE("cliente" "text", "total_os" numeric, "faturamento_total" numeric, "primeira_data" "date", "ultima_data" "date")
    LANGUAGE "sql"
    AS $$
  select
    c.cliente::text as cliente,
    count(os.id)::numeric as total_os,
    coalesce(sum(os."valorServico"), 0)::numeric as faturamento_total,
    min(os."dataServico"::date) as primeira_data,
    max(os."dataServico"::date) as ultima_data
  from "OrdensDeServiço" os
  join "Clientes" c on c.id = os."idCliente"
  where os.empresa_id = p_empresa_id
    and os."dataServico"::date >= p_data_inicio
    and nullif(trim(c.cliente), '') is not null
    and lower(trim(c.cliente)) <> 'consumidor'
  group by c.cliente
  order by total_os desc, faturamento_total desc;
$$;


ALTER FUNCTION "public"."get_top_clientes_quantidade_os"("p_empresa_id" "uuid", "p_data_inicio" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_pecas_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") RETURNS TABLE("descricao" "text", "quantidade_total" numeric, "faturamento_total" numeric, "primeira_data" "date", "ultima_data" "date")
    LANGUAGE "sql"
    AS $$
  with itens_nomeados as (
    select
      coalesce(
        nullif(trim(i.descricao), ''),
        nullif(trim(e.nome), '')
      ) as nome_peca,
      i.quantidade,
      i.valor_unitario,
      i.created_at
    from "itensOS" i
    left join "Estoque" e
      on e.id = i.produto_estoque_id
      and e.empresa_id = p_empresa_id
    where i.empresa_id = p_empresa_id
      and i.tipo = 'peca'
      and i.created_at::date >= p_data_inicio
  )
  select
    nome_peca as descricao,
    sum(quantidade)::numeric as quantidade_total,
    sum(quantidade * valor_unitario)::numeric as faturamento_total,
    min(created_at::date) as primeira_data,
    max(created_at::date) as ultima_data
  from itens_nomeados
  where nome_peca is not null
  group by nome_peca
  order by faturamento_total desc;
$$;


ALTER FUNCTION "public"."get_top_pecas_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_servicos_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") RETURNS TABLE("descricao" "text", "quantidade_total" numeric, "faturamento_total" numeric, "primeira_data" "date", "ultima_data" "date")
    LANGUAGE "sql"
    AS $$
  with itens_nomeados as (
    select
      coalesce(
        nullif(trim(i.descricao), ''),
        nullif(trim(s.servico), '')
      ) as nome_servico,
      i.quantidade,
      i.valor_unitario,
      i.created_at
    from "itensOS" i
    left join "Servicos" s
      on s.id = i.id_servico
      and s.empresa_id = p_empresa_id
    where i.empresa_id = p_empresa_id
      and i.tipo = 'servico'
      and i.created_at::date >= p_data_inicio
  )
  select
    nome_servico as descricao,
    sum(quantidade)::numeric as quantidade_total,
    sum(quantidade * valor_unitario)::numeric as faturamento_total,
    min(created_at::date) as primeira_data,
    max(created_at::date) as ultima_data
  from itens_nomeados
  where nome_servico is not null
  group by nome_servico
  order by faturamento_total desc;
$$;


ALTER FUNCTION "public"."get_top_servicos_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_servicos_quantidade"("p_empresa_id" "uuid", "p_data_inicio" "date") RETURNS TABLE("descricao" "text", "quantidade_total" numeric, "faturamento_total" numeric, "primeira_data" "date", "ultima_data" "date")
    LANGUAGE "sql"
    AS $$
  with itens_nomeados as (
    select
      coalesce(
        nullif(trim(i.descricao), ''),
        nullif(trim(s.servico), '')
      ) as nome_servico,
      i.quantidade,
      i.valor_unitario,
      i.created_at
    from "itensOS" i
    left join "Servicos" s
      on s.id = i.id_servico
      and s.empresa_id = p_empresa_id
    where i.empresa_id = p_empresa_id
      and i.tipo = 'servico'
      and i.created_at::date >= p_data_inicio
  )
  select
    nome_servico as descricao,
    sum(quantidade)::numeric as quantidade_total,
    sum(quantidade * valor_unitario)::numeric as faturamento_total,
    min(created_at::date) as primeira_data,
    max(created_at::date) as ultima_data
  from itens_nomeados
  where nome_servico is not null
  group by nome_servico
  order by quantidade_total desc, faturamento_total desc;
$$;


ALTER FUNCTION "public"."get_top_servicos_quantidade"("p_empresa_id" "uuid", "p_data_inicio" "date") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Auditoria" (
    "id" bigint NOT NULL,
    "empresa_id" "uuid",
    "usuario_id" "uuid",
    "entidade" "text" NOT NULL,
    "entidade_id" "text",
    "acao" "text" NOT NULL,
    "dados_anteriores" "jsonb",
    "dados_novos" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Auditoria" OWNER TO "postgres";


ALTER TABLE "public"."Auditoria" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Auditoria_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Clientes" (
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cliente" character varying NOT NULL,
    "cpfcnpj" "text",
    "oficina" character varying,
    "endereco" character varying,
    "telefone1" bigint,
    "telefone2" bigint,
    "empresa_id" "uuid"
);


ALTER TABLE "public"."Clientes" OWNER TO "postgres";


ALTER TABLE "public"."Clientes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Clientes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ContasPagar" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "descricao" "text",
    "valor" bigint,
    "dataVencimento" "date",
    "status" "public"."status_pagamento",
    "categoria" "public"."categoria_contapagar",
    "empresa_id" "uuid",
    "valor_parcial_pago" double precision
);


ALTER TABLE "public"."ContasPagar" OWNER TO "postgres";


ALTER TABLE "public"."ContasPagar" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ContasPagar_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ContasReceber" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "descricao" "text",
    "valor" bigint,
    "dataPagamento" "date",
    "status" "public"."status_pagamento",
    "osId" integer,
    "empresa_id" "uuid",
    "valorRecebido" double precision
);


ALTER TABLE "public"."ContasReceber" OWNER TO "postgres";


ALTER TABLE "public"."ContasReceber" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ContasReceber_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Estoque" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nome" "text",
    "custo" integer,
    "valor" integer,
    "qtdEstoque" smallint,
    "situacao" "text",
    "empresa_id" "uuid",
    "imagePath" "text"
);


ALTER TABLE "public"."Estoque" OWNER TO "postgres";


ALTER TABLE "public"."Estoque" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Estoque_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Orcamentos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idCliente" integer,
    "motor" "text",
    "orcamento" "text",
    "obs" "text",
    "empresa_id" "uuid",
    "situacao" "public"."situacaoOrcamento" DEFAULT 'analise'::"public"."situacaoOrcamento"
);


ALTER TABLE "public"."Orcamentos" OWNER TO "postgres";


ALTER TABLE "public"."Orcamentos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Orcamentos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."OrdensDeServiço" (
    "id" integer NOT NULL,
    "dataServico" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idCliente" integer,
    "formaPagamento" "text",
    "veículo" "text",
    "motor" "text",
    "obs" "text",
    "dataVencimento" "date",
    "valorServico" real,
    "servicosRealizados" "text" DEFAULT ''::"text" NOT NULL,
    "pecasTrocadas" "text" DEFAULT ''::"text",
    "empresa_id" "uuid"
);


ALTER TABLE "public"."OrdensDeServiço" OWNER TO "postgres";


ALTER TABLE "public"."OrdensDeServiço" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Ordens de serviço_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."PagamentoQuitado" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "formaPagamento" "text",
    "valor" real,
    "dataPagamento" "date",
    "observacoes" "text",
    "empresa_id" "uuid",
    "descricao" "text"
);


ALTER TABLE "public"."PagamentoQuitado" OWNER TO "postgres";


ALTER TABLE "public"."PagamentoQuitado" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."PagamentoQuitado_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."PagamentoRecebido" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valor" integer,
    "metodoPag" "text",
    "taxaMaquina" real,
    "dataRecebimento" "date",
    "empresa_id" "uuid",
    "descricao" "text"
);


ALTER TABLE "public"."PagamentoRecebido" OWNER TO "postgres";


ALTER TABLE "public"."PagamentoRecebido" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."PagamentoRecebido_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Servicos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "servico" "text",
    "valor" integer,
    "linha" "public"."linha" DEFAULT 'leve'::"public"."linha",
    "tipo" "public"."tipoServico" DEFAULT 'servico'::"public"."tipoServico",
    "empresa_id" "uuid"
);


ALTER TABLE "public"."Servicos" OWNER TO "postgres";


ALTER TABLE "public"."Servicos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Servicos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."anotacoes_diarias" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "titulo" "text",
    "concluida" boolean,
    "prioridade" "public"."prioridade_tipo",
    "data" "date",
    "empresa_id" "uuid"
);


ALTER TABLE "public"."anotacoes_diarias" OWNER TO "postgres";


ALTER TABLE "public"."anotacoes_diarias" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."anotacoes_diarias_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."anotacoes_gerais" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "titulo" "text",
    "descricao" "text",
    "cliente" "text",
    "empresa_id" "uuid"
);


ALTER TABLE "public"."anotacoes_gerais" OWNER TO "postgres";


ALTER TABLE "public"."anotacoes_gerais" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."anotacoes_gerais_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."usuarios_empresas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "empresa_id" "uuid",
    "nome" "text",
    "role" "text" NOT NULL,
    "ativo" boolean DEFAULT true
);


ALTER TABLE "public"."usuarios_empresas" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."auditoria_com_usuario" AS
 SELECT "a"."id",
    "a"."empresa_id",
    "a"."usuario_id",
    "a"."entidade",
    "a"."entidade_id",
    "a"."acao",
    "a"."dados_anteriores",
    "a"."dados_novos",
    "a"."created_at",
    "ue"."nome" AS "usuario_nome"
   FROM ("public"."Auditoria" "a"
     LEFT JOIN "public"."usuarios_empresas" "ue" ON ((("ue"."user_id" = "a"."usuario_id") AND ("ue"."empresa_id" = "a"."empresa_id"))));


ALTER VIEW "public"."auditoria_com_usuario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."empresas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nome" "text" NOT NULL,
    "nome_fantasia" "text",
    "cnpj" "text",
    "telefone" "text",
    "endereco" "text",
    "pix" "text",
    "logo_url" "text",
    "ativo" boolean DEFAULT true
);


ALTER TABLE "public"."empresas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."itensOS" (
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_os" integer,
    "id_servico" bigint,
    "quantidade" integer,
    "valor_unitario" bigint,
    "descricao" "text",
    "tipo" "text",
    "manual" boolean,
    "empresa_id" "uuid",
    "produto_estoque_id" bigint
);


ALTER TABLE "public"."itensOS" OWNER TO "postgres";


ALTER TABLE "public"."itensOS" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."itensOS_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."vw_contas_pagar" AS
 SELECT "id",
    "created_at",
    "descricao",
    "valor",
    "dataVencimento",
    "status",
    "categoria",
        CASE
            WHEN (("status" <> 'pago'::"public"."status_pagamento") AND ("dataVencimento" < CURRENT_DATE)) THEN 'atrasado'::"text"
            WHEN ("status" = 'pago'::"public"."status_pagamento") THEN 'pago'::"text"
            ELSE 'pendente'::"text"
        END AS "status_calculado"
   FROM "public"."ContasPagar" "cp";


ALTER VIEW "public"."vw_contas_pagar" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Auditoria"
    ADD CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Clientes"
    ADD CONSTRAINT "Clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ContasPagar"
    ADD CONSTRAINT "ContasPagar_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ContasReceber"
    ADD CONSTRAINT "ContasReceber_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Estoque"
    ADD CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Orcamentos"
    ADD CONSTRAINT "Orcamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."OrdensDeServiço"
    ADD CONSTRAINT "OrdensDeServiço_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PagamentoQuitado"
    ADD CONSTRAINT "PagamentoQuitado_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PagamentoRecebido"
    ADD CONSTRAINT "PagamentoRecebido_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Servicos"
    ADD CONSTRAINT "Servicos_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."Servicos"
    ADD CONSTRAINT "Servicos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anotacoes_diarias"
    ADD CONSTRAINT "anotacoes_diarias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anotacoes_gerais"
    ADD CONSTRAINT "anotacoes_gerais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."empresas"
    ADD CONSTRAINT "empresas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."itensOS"
    ADD CONSTRAINT "itensOS_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios_empresas"
    ADD CONSTRAINT "usuarios_empresas_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "auditar_anotacoes_diarias" AFTER INSERT OR DELETE OR UPDATE ON "public"."anotacoes_diarias" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_anotacoes_gerais" AFTER INSERT OR DELETE OR UPDATE ON "public"."anotacoes_gerais" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_clientes" AFTER INSERT OR DELETE OR UPDATE ON "public"."Clientes" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_contas_pagar" AFTER INSERT OR DELETE OR UPDATE ON "public"."ContasPagar" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_contas_receber" AFTER INSERT OR DELETE OR UPDATE ON "public"."ContasReceber" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_empresas" AFTER INSERT OR DELETE OR UPDATE ON "public"."empresas" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_estoque" AFTER INSERT OR DELETE OR UPDATE ON "public"."Estoque" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_itens_os" AFTER INSERT OR DELETE OR UPDATE ON "public"."itensOS" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_orcamentos" AFTER INSERT OR DELETE OR UPDATE ON "public"."Orcamentos" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_ordens_servico" AFTER INSERT OR DELETE OR UPDATE ON "public"."OrdensDeServiço" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_pagamento_quitado" AFTER INSERT OR DELETE OR UPDATE ON "public"."PagamentoQuitado" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_pagamento_recebido" AFTER INSERT OR DELETE OR UPDATE ON "public"."PagamentoRecebido" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



CREATE OR REPLACE TRIGGER "auditar_servicos" AFTER INSERT OR DELETE OR UPDATE ON "public"."Servicos" FOR EACH ROW EXECUTE FUNCTION "public"."auditar_alteracoes"();



ALTER TABLE ONLY "public"."Clientes"
    ADD CONSTRAINT "Clientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."ContasPagar"
    ADD CONSTRAINT "ContasPagar_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."ContasReceber"
    ADD CONSTRAINT "ContasReceber_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."ContasReceber"
    ADD CONSTRAINT "ContasReceber_osId_fkey" FOREIGN KEY ("osId") REFERENCES "public"."OrdensDeServiço"("id");



ALTER TABLE ONLY "public"."Estoque"
    ADD CONSTRAINT "Estoque_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."Orcamentos"
    ADD CONSTRAINT "Orcamentos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."Orcamentos"
    ADD CONSTRAINT "Orcamentos_idCliente_fkey" FOREIGN KEY ("idCliente") REFERENCES "public"."Clientes"("id");



ALTER TABLE ONLY "public"."OrdensDeServiço"
    ADD CONSTRAINT "OrdensDeServiço_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."OrdensDeServiço"
    ADD CONSTRAINT "OrdensDeServiço_idCliente_fkey" FOREIGN KEY ("idCliente") REFERENCES "public"."Clientes"("id");



ALTER TABLE ONLY "public"."PagamentoQuitado"
    ADD CONSTRAINT "PagamentoQuitado_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."PagamentoRecebido"
    ADD CONSTRAINT "PagamentoRecebido_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."Servicos"
    ADD CONSTRAINT "Servicos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."anotacoes_diarias"
    ADD CONSTRAINT "anotacoes_diarias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."anotacoes_gerais"
    ADD CONSTRAINT "anotacoes_gerais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."itensOS"
    ADD CONSTRAINT "itensOS_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."itensOS"
    ADD CONSTRAINT "itensOS_id_os_fkey" FOREIGN KEY ("id_os") REFERENCES "public"."OrdensDeServiço"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."itensOS"
    ADD CONSTRAINT "itensOS_id_servico_fkey" FOREIGN KEY ("id_servico") REFERENCES "public"."Servicos"("id");



ALTER TABLE ONLY "public"."itensOS"
    ADD CONSTRAINT "itensOS_produto_estoque_id_fkey" FOREIGN KEY ("produto_estoque_id") REFERENCES "public"."Estoque"("id");



ALTER TABLE ONLY "public"."usuarios_empresas"
    ADD CONSTRAINT "usuarios_empresas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id");



ALTER TABLE ONLY "public"."usuarios_empresas"
    ADD CONSTRAINT "usuarios_empresas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "ALL EMPRESAS" ON "public"."empresas" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "ALL USUARIOSEMPRESAS" ON "public"."usuarios_empresas" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."Auditoria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Clientes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Clientes delete admin ou financeiro master" ON "public"."Clientes" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "Clientes insert admin ou financeiro master" ON "public"."Clientes" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "Clientes select usuarios da empresa" ON "public"."Clientes" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true)))));



CREATE POLICY "Clientes update admin ou financeiro master" ON "public"."Clientes" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"])))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



ALTER TABLE "public"."ContasPagar" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ContasPagar delete somente financeiro master" ON "public"."ContasPagar" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "ContasPagar insert somente financeiro master" ON "public"."ContasPagar" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "ContasPagar select somente financeiro master" ON "public"."ContasPagar" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "ContasPagar update somente financeiro master" ON "public"."ContasPagar" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text"))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



ALTER TABLE "public"."ContasReceber" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ContasReceber delete somente financeiro master" ON "public"."ContasReceber" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "ContasReceber insert somente financeiro master" ON "public"."ContasReceber" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "ContasReceber select somente financeiro master" ON "public"."ContasReceber" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "ContasReceber update somente financeiro master" ON "public"."ContasReceber" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text"))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



ALTER TABLE "public"."Estoque" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Estoque delete admin ou financeiro master" ON "public"."Estoque" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "Estoque insert admin ou financeiro master" ON "public"."Estoque" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "Estoque select usuarios da empresa" ON "public"."Estoque" FOR SELECT USING (true);



CREATE POLICY "Estoque update admin ou financeiro master" ON "public"."Estoque" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"])))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "Gerentes podem ver auditoria da empresa" ON "public"."Auditoria" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."usuarios_empresas" "ue"
  WHERE (("ue"."user_id" = "auth"."uid"()) AND ("ue"."empresa_id" = "Auditoria"."empresa_id") AND ("lower"("ue"."role") = ANY (ARRAY['financeiro_master'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."Orcamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Orcamentos delete admin ou financeiro master" ON "public"."Orcamentos" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "Orcamentos insert admin ou financeiro master" ON "public"."Orcamentos" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "Orcamentos select usuarios da empresa" ON "public"."Orcamentos" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true)))));



CREATE POLICY "Orcamentos update admin ou financeiro master" ON "public"."Orcamentos" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"])))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



ALTER TABLE "public"."OrdensDeServiço" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "OrdensDeServiço delete admin ou financeiro master" ON "public"."OrdensDeServiço" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "OrdensDeServiço insert admin ou financeiro master" ON "public"."OrdensDeServiço" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "OrdensDeServiço select usuarios da empresa" ON "public"."OrdensDeServiço" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true)))));



CREATE POLICY "OrdensDeServiço update admin ou financeiro master" ON "public"."OrdensDeServiço" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"])))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



ALTER TABLE "public"."PagamentoQuitado" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "PagamentoQuitado delete somente financeiro master" ON "public"."PagamentoQuitado" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "PagamentoQuitado insert somente financeiro master" ON "public"."PagamentoQuitado" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "PagamentoQuitado select somente financeiro master" ON "public"."PagamentoQuitado" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "PagamentoQuitado update somente financeiro master" ON "public"."PagamentoQuitado" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text"))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



ALTER TABLE "public"."PagamentoRecebido" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "PagamentoRecebido delete somente financeiro master" ON "public"."PagamentoRecebido" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "PagamentoRecebido insert somente financeiro master" ON "public"."PagamentoRecebido" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "PagamentoRecebido select somente financeiro master" ON "public"."PagamentoRecebido" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



CREATE POLICY "PagamentoRecebido update somente financeiro master" ON "public"."PagamentoRecebido" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text"))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'financeiro_master'::"text")))));



ALTER TABLE "public"."Servicos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Servicos delete admin ou financeiro master" ON "public"."Servicos" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "Servicos insert admin ou financeiro master" ON "public"."Servicos" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "Servicos select usuarios da empresa" ON "public"."Servicos" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true)))));



CREATE POLICY "Servicos update admin ou financeiro master" ON "public"."Servicos" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"])))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



ALTER TABLE "public"."anotacoes_diarias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anotacoes_diarias delete admin ou financeiro master" ON "public"."anotacoes_diarias" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "anotacoes_diarias insert admin ou financeiro master" ON "public"."anotacoes_diarias" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "anotacoes_diarias select usuarios da empresa" ON "public"."anotacoes_diarias" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true)))));



CREATE POLICY "anotacoes_diarias update admin ou financeiro master" ON "public"."anotacoes_diarias" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"])))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



ALTER TABLE "public"."anotacoes_gerais" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anotacoes_gerais delete admin ou financeiro master" ON "public"."anotacoes_gerais" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "anotacoes_gerais insert admin ou financeiro master" ON "public"."anotacoes_gerais" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "anotacoes_gerais select usuarios da empresa" ON "public"."anotacoes_gerais" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true)))));



CREATE POLICY "anotacoes_gerais update admin ou financeiro master" ON "public"."anotacoes_gerais" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"])))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



ALTER TABLE "public"."empresas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "empresas select usuarios da empresa" ON "public"."empresas" FOR SELECT USING (("id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true)))));



CREATE POLICY "empresas update somente admin" ON "public"."empresas" FOR UPDATE USING (("id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'admin'::"text"))))) WITH CHECK (("id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = 'admin'::"text")))));



ALTER TABLE "public"."itensOS" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "itensOS delete admin ou financeiro master" ON "public"."itensOS" FOR DELETE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "itensOS insert admin ou financeiro master" ON "public"."itensOS" FOR INSERT WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



CREATE POLICY "itensOS select usuarios da empresa" ON "public"."itensOS" FOR SELECT USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true)))));



CREATE POLICY "itensOS update admin ou financeiro master" ON "public"."itensOS" FOR UPDATE USING (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"])))))) WITH CHECK (("empresa_id" IN ( SELECT "usuarios_empresas"."empresa_id"
   FROM "public"."usuarios_empresas"
  WHERE (("usuarios_empresas"."user_id" = "auth"."uid"()) AND ("usuarios_empresas"."ativo" = true) AND ("usuarios_empresas"."role" = ANY (ARRAY['admin'::"text", 'financeiro_master'::"text"]))))));



ALTER TABLE "public"."usuarios_empresas" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."auditar_alteracoes"() TO "anon";
GRANT ALL ON FUNCTION "public"."auditar_alteracoes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auditar_alteracoes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_clientes_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_clientes_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_clientes_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_clientes_quantidade_os"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_clientes_quantidade_os"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_clientes_quantidade_os"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_pecas_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_pecas_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_pecas_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_servicos_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_servicos_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_servicos_faturamento"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_servicos_quantidade"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_servicos_quantidade"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_servicos_quantidade"("p_empresa_id" "uuid", "p_data_inicio" "date") TO "service_role";



GRANT ALL ON TABLE "public"."Auditoria" TO "anon";
GRANT ALL ON TABLE "public"."Auditoria" TO "authenticated";
GRANT ALL ON TABLE "public"."Auditoria" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Auditoria_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Auditoria_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Auditoria_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Clientes" TO "anon";
GRANT ALL ON TABLE "public"."Clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."Clientes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Clientes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Clientes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Clientes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ContasPagar" TO "anon";
GRANT ALL ON TABLE "public"."ContasPagar" TO "authenticated";
GRANT ALL ON TABLE "public"."ContasPagar" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ContasPagar_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ContasPagar_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ContasPagar_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ContasReceber" TO "anon";
GRANT ALL ON TABLE "public"."ContasReceber" TO "authenticated";
GRANT ALL ON TABLE "public"."ContasReceber" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ContasReceber_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ContasReceber_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ContasReceber_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Estoque" TO "anon";
GRANT ALL ON TABLE "public"."Estoque" TO "authenticated";
GRANT ALL ON TABLE "public"."Estoque" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Estoque_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Estoque_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Estoque_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Orcamentos" TO "anon";
GRANT ALL ON TABLE "public"."Orcamentos" TO "authenticated";
GRANT ALL ON TABLE "public"."Orcamentos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Orcamentos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Orcamentos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Orcamentos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."OrdensDeServiço" TO "anon";
GRANT ALL ON TABLE "public"."OrdensDeServiço" TO "authenticated";
GRANT ALL ON TABLE "public"."OrdensDeServiço" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Ordens de serviço_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Ordens de serviço_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Ordens de serviço_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."PagamentoQuitado" TO "anon";
GRANT ALL ON TABLE "public"."PagamentoQuitado" TO "authenticated";
GRANT ALL ON TABLE "public"."PagamentoQuitado" TO "service_role";



GRANT ALL ON SEQUENCE "public"."PagamentoQuitado_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."PagamentoQuitado_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."PagamentoQuitado_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."PagamentoRecebido" TO "anon";
GRANT ALL ON TABLE "public"."PagamentoRecebido" TO "authenticated";
GRANT ALL ON TABLE "public"."PagamentoRecebido" TO "service_role";



GRANT ALL ON SEQUENCE "public"."PagamentoRecebido_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."PagamentoRecebido_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."PagamentoRecebido_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Servicos" TO "anon";
GRANT ALL ON TABLE "public"."Servicos" TO "authenticated";
GRANT ALL ON TABLE "public"."Servicos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Servicos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Servicos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Servicos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."anotacoes_diarias" TO "anon";
GRANT ALL ON TABLE "public"."anotacoes_diarias" TO "authenticated";
GRANT ALL ON TABLE "public"."anotacoes_diarias" TO "service_role";



GRANT ALL ON SEQUENCE "public"."anotacoes_diarias_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."anotacoes_diarias_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."anotacoes_diarias_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."anotacoes_gerais" TO "anon";
GRANT ALL ON TABLE "public"."anotacoes_gerais" TO "authenticated";
GRANT ALL ON TABLE "public"."anotacoes_gerais" TO "service_role";



GRANT ALL ON SEQUENCE "public"."anotacoes_gerais_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."anotacoes_gerais_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."anotacoes_gerais_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios_empresas" TO "anon";
GRANT ALL ON TABLE "public"."usuarios_empresas" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios_empresas" TO "service_role";



GRANT ALL ON TABLE "public"."auditoria_com_usuario" TO "anon";
GRANT ALL ON TABLE "public"."auditoria_com_usuario" TO "authenticated";
GRANT ALL ON TABLE "public"."auditoria_com_usuario" TO "service_role";



GRANT ALL ON TABLE "public"."empresas" TO "anon";
GRANT ALL ON TABLE "public"."empresas" TO "authenticated";
GRANT ALL ON TABLE "public"."empresas" TO "service_role";



GRANT ALL ON TABLE "public"."itensOS" TO "anon";
GRANT ALL ON TABLE "public"."itensOS" TO "authenticated";
GRANT ALL ON TABLE "public"."itensOS" TO "service_role";



GRANT ALL ON SEQUENCE "public"."itensOS_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."itensOS_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."itensOS_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vw_contas_pagar" TO "anon";
GRANT ALL ON TABLE "public"."vw_contas_pagar" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_contas_pagar" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







