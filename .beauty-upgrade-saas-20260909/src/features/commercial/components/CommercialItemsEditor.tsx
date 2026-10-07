import { Plus, Trash2 } from "lucide-react";
import { SelectField, TextAreaField, TextField } from "../../../components_shared";
import type { CommercialCatalogs, CommercialItemForm, CommercialItemType } from "../types/commercial.types";
import { COMMERCIAL_ITEM_LABELS, createCommercialItem, formatCommercialCurrency, formatCommercialNumber } from "../utils/commercial.utils";

type Props = {
  mode: "quote" | "command";
  items: CommercialItemForm[];
  catalogs: CommercialCatalogs;
  error?: string;
  onChange: (items: CommercialItemForm[]) => void;
};

export function CommercialItemsEditor({ mode, items, catalogs, error, onChange }: Props) {
  function patchItem(index: number, patch: Partial<CommercialItemForm>) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function changeType(index: number, type: CommercialItemType) {
    patchItem(index, { type, catalogId: "", description: "", unitPrice: "0", employeeId: "", discount: "0" });
  }

  function changeCatalog(index: number, catalogId: string) {
    const item = items[index];
    if (item.type === "servico") {
      const service = catalogs.services.find((candidate) => candidate.id === Number(catalogId));
      patchItem(index, { catalogId, description: service?.nome ?? "", unitPrice: String(service?.preco ?? 0), employeeId: "" });
    } else if (item.type === "produto") {
      const product = catalogs.products.find((candidate) => candidate.id === Number(catalogId));
      patchItem(index, { catalogId, description: product?.nome ?? "", unitPrice: String(product?.preco_venda ?? 0), employeeId: "" });
    }
  }

  return (
    <section className="commercial-items-editor">
      <header>
        <div><h3>Itens</h3><p>Adicione serviços, produtos ou cobranças avulsas.</p></div>
        <button className="btn btn--secondary btn--small" type="button" onClick={() => onChange([...items, createCommercialItem()])}><Plus size={16} /> Adicionar item</button>
      </header>

      <div className="commercial-items-list">
        {items.map((item, index) => {
          const employeesForService = catalogs.employees.filter((employee) => employee.ativo && employee.atende_clientes && catalogs.employeeServices.some((assignment) => assignment.ativo && assignment.id_funcionario === employee.id && assignment.id_servico === Number(item.catalogId)));
          const itemTotal = Math.max(Number(item.quantity || 0) * Number(item.unitPrice || 0) - Number(item.discount || 0), 0);
          return (
            <article className="commercial-item-card" key={item.key}>
              <header><strong>Item {index + 1}</strong><span>{formatCommercialCurrency(itemTotal)}</span><button className="btn btn--icon btn--ghost" type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} disabled={items.length === 1} aria-label={`Remover item ${index + 1}`}><Trash2 size={17} /></button></header>
              <div className="commercial-item-grid">
                <SelectField label="Tipo" value={item.type} onChange={(event) => changeType(index, event.target.value as CommercialItemType)} options={(Object.entries(COMMERCIAL_ITEM_LABELS) as [CommercialItemType, string][]).map(([value, label]) => ({ value, label }))} />
                {item.type === "servico" && <SelectField label="Serviço" value={item.catalogId} onChange={(event) => changeCatalog(index, event.target.value)} placeholder="Selecione" options={catalogs.services.map((service) => ({ value: String(service.id), label: `${service.nome}${service.ativo ? "" : " (inativo)"}`, disabled: !service.ativo && service.id !== Number(item.catalogId) }))} wrapperClassName="commercial-item-grid__catalog" required />}
                {item.type === "produto" && <SelectField label="Produto" value={item.catalogId} onChange={(event) => changeCatalog(index, event.target.value)} placeholder="Selecione" options={catalogs.products.map((product) => ({ value: String(product.id), label: `${product.nome}${product.controla_estoque ? ` · ${formatCommercialNumber(product.estoque_atual)} ${product.unidade_medida}` : ""}${product.ativo ? "" : " (inativo)"}`, disabled: !product.ativo && product.id !== Number(item.catalogId) }))} wrapperClassName="commercial-item-grid__catalog" required />}
                {item.type === "outro" && <TextField label="Descrição" value={item.description} onChange={(event) => patchItem(index, { description: event.target.value })} maxLength={180} wrapperClassName="commercial-item-grid__catalog" required />}
                {mode === "command" && item.type === "servico" && <SelectField label="Profissional" value={item.employeeId} onChange={(event) => patchItem(index, { employeeId: event.target.value })} placeholder={item.catalogId ? "Selecione" : "Escolha o serviço primeiro"} options={employeesForService.map((employee) => ({ value: String(employee.id), label: employee.nome }))} required />}
                <TextField label="Quantidade" type="number" min={0.001} step="0.001" value={item.quantity} onChange={(event) => patchItem(index, { quantity: event.target.value })} required />
                <TextField label="Preço unitário" type="number" min={0} step="0.01" value={item.unitPrice} onChange={(event) => patchItem(index, { unitPrice: event.target.value })} trailingContent="R$" required />
                <TextField label="Desconto do item" type="number" min={0} max={Number(item.quantity || 0) * Number(item.unitPrice || 0)} step="0.01" value={item.discount} onChange={(event) => patchItem(index, { discount: event.target.value })} trailingContent="R$" />
                <TextAreaField label="Observação do item" value={item.notes} onChange={(event) => patchItem(index, { notes: event.target.value })} rows={2} maxLength={400} wrapperClassName="commercial-item-grid__notes" />
              </div>
            </article>
          );
        })}
      </div>
      {error && <small className="field__error" role="alert">{error}</small>}
    </section>
  );
}
