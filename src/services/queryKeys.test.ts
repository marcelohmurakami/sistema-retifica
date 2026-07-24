import { describe, expect, it } from "vitest";
import { queryKeys } from "./queryKeys";

describe("queryKeys", () => {
  it("isola listagens de OS por usuário", () => {
    const firstUserKey = queryKeys.ordensServico.page(
      "usuario-a",
      "id-desc",
      1,
      "",
    );
    const secondUserKey = queryKeys.ordensServico.page(
      "usuario-b",
      "id-desc",
      1,
      "",
    );

    expect(firstUserKey).not.toEqual(secondUserKey);
  });

  it("isola detalhes de clientes por usuário", () => {
    expect(queryKeys.clientes.detail("usuario-a", 10)).not.toEqual(
      queryKeys.clientes.detail("usuario-b", 10),
    );
  });
});
