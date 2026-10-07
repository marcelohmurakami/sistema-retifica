import {
  Ban,
  BriefcaseBusiness,
  Plus,
  UserCheck,
  UserCog,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  FilterBar,
  Pagination,
  SearchInput,
  Skeleton,
} from "../../components_shared";
import { FEATURES } from "../../features/access/access.constants";
import { useAccess } from "../../features/access/hooks/useAccess";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useDebouncedValue } from "../clientes/hooks/useDebouncedValue";
import { BlocksModal } from "./components/BlocksModal";
import { EmployeeFormModal } from "./components/EmployeeFormModal";
import { EmployeeManagementModal } from "./components/EmployeeManagementModal";
import { EmployeesList } from "./components/EmployeesList";
import { EmployeeStatusDialog } from "./components/EmployeeStatusDialog";
import {
  useCreateEmployee,
  useEmployees,
  useEmployeesMetrics,
  useToggleEmployeeStatus,
  useUpdateEmployee,
} from "./hooks/useEmployees";
import type {
  Funcionario,
  FuncionarioStatusFilter,
  FuncionarioWriteInput,
} from "./types/funcionarios.types";
import { employeeLimitReached } from "./utils/funcionarios.utils";
import "./funcionarios.css";

type FormState =
  | { mode: "create" }
  | { mode: "edit"; employee: Funcionario }
  | null;

export function Funcionarios() {
  const { empresaAtual } = useAuth();
  const { obterLimite, possuiPermissaoPlano } = useAccess();
  const companyId = empresaAtual?.id ?? 0;
  const employeeLimit = obterLimite(FEATURES.PROFESSIONALS);
  const canUseSchedule = possuiPermissaoPlano(FEATURES.INDIVIDUAL_AVAILABILITY);
  const canUseServices = possuiPermissaoPlano(
    FEATURES.SERVICES_BY_PROFESSIONAL,
  );
  const canUseTimeOff = possuiPermissaoPlano(FEATURES.TIME_OFF);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FuncionarioStatusFilter>("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formState, setFormState] = useState<FormState>(null);
  const [employeeToManage, setEmployeeToManage] = useState<Funcionario | null>(
    null,
  );
  const [employeeToDeactivate, setEmployeeToDeactivate] =
    useState<Funcionario | null>(null);
  const [showBlocks, setShowBlocks] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const listQuery = useEmployees({
    companyId,
    search: debouncedSearch,
    status,
    page,
    pageSize,
  });
  const metricsQuery = useEmployeesMetrics(companyId);
  const createMutation = useCreateEmployee(companyId);
  const updateMutation = useUpdateEmployee(companyId);
  const statusMutation = useToggleEmployeeStatus(companyId);
  const metrics = metricsQuery.data ?? {
    total: 0,
    active: 0,
    attending: 0,
    inactive: 0,
  };
  const limitReached = employeeLimitReached(metrics.active, employeeLimit);

  function openCreate() {
    if (limitReached) {
      toast.info(
        `O plano atual permite ${employeeLimit} funcionário${employeeLimit === 1 ? "" : "s"} ativo${employeeLimit === 1 ? "" : "s"}.`,
      );
      return;
    }
    setFormState({ mode: "create" });
  }
  async function saveEmployee(input: FuncionarioWriteInput) {
    if (!formState) return;
    if (formState.mode === "create") await createMutation.mutateAsync(input);
    else
      await updateMutation.mutateAsync({
        employeeId: formState.employee.id,
        input,
      });
    setFormState(null);
  }
  function changeStatus(employee: Funcionario) {
    if (employee.ativo) setEmployeeToDeactivate(employee);
    else {
      if (limitReached) {
        toast.info(
          "Desative outro funcionário antes de reativar este cadastro.",
        );
        return;
      }
      void statusMutation
        .mutateAsync({ employeeId: employee.id, active: true })
        .catch(() => undefined);
    }
  }
  async function deactivate() {
    if (!employeeToDeactivate) return;
    await statusMutation.mutateAsync({
      employeeId: employeeToDeactivate.id,
      active: false,
    });
    setEmployeeToDeactivate(null);
  }
  const emptyAction = !limitReached && (
    <button className="btn btn--primary" type="button" onClick={openCreate}>
      <Plus size={18} /> Novo funcionário
    </button>
  );

  return (
    <div className="page employees-page">
      <header className="page-header">
        <div className="page-header__content">
          <span className="page-eyebrow">Equipe</span>
          <h1>Funcionários</h1>
          <p>
            Equipe, disponibilidade e especialidades organizadas para a agenda.
          </p>
        </div>
        <div className="page-actions">
          {canUseTimeOff && (
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => setShowBlocks(true)}
            >
              <Ban size={18} /> Bloqueios
            </button>
          )}
          <button
            className="btn btn--primary"
            type="button"
            onClick={openCreate}
            disabled={limitReached}
          >
            <Plus size={18} /> Novo funcionário
          </button>
        </div>
      </header>
      <section
        className="employees-metrics"
        aria-label="Resumo dos funcionários"
      >
        {[
          { label: "Total", value: metrics.total, icon: UserCog },
          { label: "Ativos", value: metrics.active, icon: UserCheck },
          {
            label: "Atendem clientes",
            value: metrics.attending,
            icon: BriefcaseBusiness,
          },
          { label: "Inativos", value: metrics.inactive, icon: UserX },
        ].map(({ label, value, icon: Icon }) => (
          <article className="employee-metric-card" key={label}>
            <span className="employee-metric-card__icon">
              <Icon size={18} />
            </span>
            <div>
              <span>{label}</span>
              {metricsQuery.isPending ? (
                <Skeleton width="2.5rem" height="1.4rem" />
              ) : (
                <strong>{value}</strong>
              )}
            </div>
          </article>
        ))}
      </section>
      {limitReached && (
        <div className="alert alert--info employees-limit-alert">
          Limite de funcionários ativos do plano atingido. Você ainda pode
          editar ou desativar cadastros.
        </div>
      )}
      <section className="card employees-list-card">
        <FilterBar
          search={
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Buscar por nome, cargo, CPF ou contato..."
              label="Buscar funcionários"
            />
          }
          activeFilterCount={status === "todos" ? 0 : 1}
          onClearFilters={() => {
            setStatus("todos");
            setPage(1);
          }}
        >
          <label className="employees-filter-select">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as FuncionarioStatusFilter);
                setPage(1);
              }}
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </label>
          <label className="employees-filter-select">
            <span>Por página</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </FilterBar>
        {listQuery.isFetching && !listQuery.isPending && (
          <div className="employees-refreshing">Atualizando lista...</div>
        )}
        <EmployeesList
          employees={listQuery.data?.items ?? []}
          isLoading={listQuery.isPending}
          error={listQuery.error}
          isRetrying={listQuery.isFetching}
          pendingEmployeeId={statusMutation.variables?.employeeId}
          emptyAction={emptyAction}
          onRetry={() => void listQuery.refetch()}
          onEdit={(employee) => setFormState({ mode: "edit", employee })}
          onManage={setEmployeeToManage}
          onChangeStatus={changeStatus}
        />
        {!listQuery.isPending && !listQuery.error && (
          <Pagination
            page={listQuery.data?.page ?? page}
            totalPages={listQuery.data?.totalPages ?? 1}
            totalItems={listQuery.data?.total ?? 0}
            pageSize={pageSize}
            onPageChange={setPage}
            disabled={listQuery.isFetching}
          />
        )}
      </section>
      {formState && (
        <EmployeeFormModal
          key={
            formState.mode === "edit" ? formState.employee.id : "new-employee"
          }
          employee={formState.mode === "edit" ? formState.employee : undefined}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onClose={() => setFormState(null)}
          onSubmit={saveEmployee}
        />
      )}
      {employeeToManage && (
        <EmployeeManagementModal
          key={employeeToManage.id}
          companyId={companyId}
          employee={employeeToManage}
          canUseSchedule={canUseSchedule}
          canUseServices={canUseServices}
          canUseTimeOff={canUseTimeOff}
          onClose={() => setEmployeeToManage(null)}
        />
      )}
      {employeeToDeactivate && (
        <EmployeeStatusDialog
          employee={employeeToDeactivate}
          isSubmitting={statusMutation.isPending}
          onClose={() => setEmployeeToDeactivate(null)}
          onConfirm={deactivate}
        />
      )}
      {showBlocks && (
        <BlocksModal
          companyId={companyId}
          onClose={() => setShowBlocks(false)}
        />
      )}
    </div>
  );
}
