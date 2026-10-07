# Componentes compartilhados

Esta pasta concentra a interface reutilizável do AgendaPro. Os componentes
usam os tokens de tema existentes e já respondem aos modos claro e escuro.
Importe-os pelo arquivo `index.ts` desta pasta para evitar caminhos longos.

## Modal e confirmação

O `Modal` controla foco, tecla Escape, clique no fundo e bloqueio da rolagem da
página. Use `ConfirmDeleteDialog` para exclusões, inclusive quando a ação for
assíncrona:

```tsx
<ConfirmDeleteDialog
  open={isDeleteOpen}
  resourceName={cliente.nome}
  onClose={() => setIsDeleteOpen(false)}
  onConfirm={() => excluirCliente(cliente.id)}
/>
```

## Formulários e máscaras

Estão disponíveis `TextField`, `SelectField`, `TextAreaField`,
`CheckboxField`, `FormField` e `FormActions`. Eles aceitam texto de ajuda,
mensagem de erro, estado obrigatório e atributos nativos do HTML.

```tsx
<MaskedInput
  mask="cpf"
  label="CPF"
  value={cpf}
  onValueChange={(formattedValue, digits) => {
    setCpf(formattedValue)
    setCpfSomenteNumeros(digits)
  }}
/>
```

As máscaras aceitas são `telefone`, `cpf`, `cnpj` e `dinheiro`. Para dinheiro,
o valor digitado representa centavos; use `parseMoney(valorFormatado)` antes de
salvar um número no banco.

## Listagens

O `DataTable` recebe colunas tipadas e já possui loading, erro, estado vazio e
suporte a linhas clicáveis pelo teclado. Combine-o com `Pagination`,
`SearchInput` e `FilterBar`:

```tsx
const columns: DataTableColumn<Cliente>[] = [
  { id: 'nome', header: 'Nome', cell: (cliente) => cliente.nome },
  { id: 'telefone', header: 'Telefone', cell: (cliente) => cliente.telefone },
]

<DataTable
  data={clientes}
  columns={columns}
  rowKey="id"
  isLoading={isLoading}
  error={error}
  onRetry={refetch}
/>
```

## Feedback

Use `LoadingState` para carregamentos completos, `Skeleton` ou `SkeletonLines`
para preservar o formato do conteúdo, `EmptyState` para listas vazias e
`ErrorState` para erros recuperáveis. `getErrorMessage` transforma erros
desconhecidos em uma mensagem segura para a interface.

## Arquivos, data e horário

`FileUpload` valida tipo, tamanho, limite e duplicidade dos arquivos antes de
entregá-los à página. Ele não envia arquivos sozinho: o hook ou serviço do
módulo deve gravá-los no Supabase Storage.

`DateTimePicker` seleciona uma data e um horário. `DateTimeRangePicker` reúne
início e fim; valide a ordem com `isDateTimeRangeValid` e converta um valor com
`dateTimeValueToIso`.
