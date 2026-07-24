import { describe, expect, it } from "vitest";
import { getPaginationRange, parseSort } from "./queryPagination";

describe("parseSort", () => {
  const allowedFields = new Set(["id", "nome"]);

  it("preserva campo permitido e direção crescente", () => {
    expect(parseSort("nome-asc", allowedFields)).toEqual({
      field: "nome",
      ascending: true,
    });
  });

  it("respeita ordenação decrescente por id", () => {
    expect(parseSort("id-desc", allowedFields)).toEqual({
      field: "id",
      ascending: false,
    });
  });

  it("substitui campos não permitidos pelo campo padrão", () => {
    expect(parseSort("invalido-asc", allowedFields)).toEqual({
      field: "id",
      ascending: true,
    });
  });
});

describe("getPaginationRange", () => {
  it("calcula os limites inclusivos da página", () => {
    expect(getPaginationRange(3, 10)).toEqual({ from: 20, to: 29 });
  });

  it("normaliza páginas inválidas para a primeira página", () => {
    expect(getPaginationRange(0, 10)).toEqual({ from: 0, to: 9 });
    expect(getPaginationRange(Number.NaN, 10)).toEqual({ from: 0, to: 9 });
  });
});
