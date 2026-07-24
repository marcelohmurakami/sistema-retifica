import { describe, expect, it } from "vitest";
import { sortByName } from "./sortByName";

describe("sortByName", () => {
  it("ordena nomes como o usuário espera em português", () => {
    const produtos = [
      { nome: "Peça 10" },
      { nome: "óleo" },
      { nome: "Árvore de comando" },
      { nome: "Peça 2" },
    ];

    expect(sortByName(produtos, (produto) => produto.nome)).toEqual([
      { nome: "Árvore de comando" },
      { nome: "óleo" },
      { nome: "Peça 2" },
      { nome: "Peça 10" },
    ]);
  });

  it("não altera a lista original", () => {
    const produtos = [{ nome: "B" }, { nome: "A" }];

    sortByName(produtos, (produto) => produto.nome);

    expect(produtos).toEqual([{ nome: "B" }, { nome: "A" }]);
  });
});
