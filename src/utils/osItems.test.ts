import { describe, expect, it } from "vitest";
import {
  calculateOsItemsTotal,
  resolveSelectedItemId,
} from "./osItems";

describe("itens da ordem de serviço", () => {
  it("seleciona o primeiro ID real quando o ID inicial não existe", () => {
    expect(resolveSelectedItemId([{ id: 42 }, { id: 57 }], 1)).toBe(42);
  });

  it("mantém a seleção atual quando ela ainda existe", () => {
    expect(resolveSelectedItemId([{ id: 42 }, { id: 57 }], 57)).toBe(57);
  });

  it("calcula o total usando valor e quantidade de todos os itens", () => {
    expect(
      calculateOsItemsTotal([
        { valor: 150, quantidade: 2 },
        { valor: 75.5, quantidade: 1 },
      ]),
    ).toBe(375.5);
  });
});
