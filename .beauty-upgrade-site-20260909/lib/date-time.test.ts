import { describe, expect, it } from "vitest";
import { dateIsoInTimeZone, formatInTimeZone } from "./date-time";

describe("datas no fuso da empresa", () => {
  it("não muda o horário do salão conforme o fuso do navegador", () => {
    const instant = "2026-09-10T00:30:00.000Z";
    expect(
      formatInTimeZone(instant, "America/Sao_Paulo", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    ).toContain("09/09/2026, 21:30");
    expect(
      formatInTimeZone(instant, "Asia/Tokyo", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    ).toContain("10/09/2026, 09:30");
  });

  it("calcula hoje e amanhã pela data da empresa, inclusive perto da meia-noite", () => {
    const instant = new Date("2026-09-10T01:30:00.000Z");
    expect(dateIsoInTimeZone("America/Sao_Paulo", 0, instant)).toBe(
      "2026-09-09",
    );
    expect(dateIsoInTimeZone("America/Sao_Paulo", 1, instant)).toBe(
      "2026-09-10",
    );
    expect(dateIsoInTimeZone("Asia/Tokyo", 0, instant)).toBe("2026-09-10");
  });
});
