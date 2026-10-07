import { afterEach, describe, expect, it } from "vitest";
import { isN8nAuthorized } from "./n8n-auth";

const previous = process.env.N8N_INTEGRATION_SECRET;
afterEach(() => { process.env.N8N_INTEGRATION_SECRET = previous; });

describe("n8n private authentication", () => {
  it("accepts only the exact bearer secret", () => {
    process.env.N8N_INTEGRATION_SECRET = "segredo-com-mais-de-32-caracteres-123";
    expect(isN8nAuthorized(new Headers({ authorization: "Bearer segredo-com-mais-de-32-caracteres-123" }))).toBe(true);
    expect(isN8nAuthorized(new Headers({ authorization: "Bearer segredo-errado" }))).toBe(false);
  });

  it("supports x-n8n-secret and rejects missing configuration", () => {
    process.env.N8N_INTEGRATION_SECRET = "outro-segredo-seguro";
    expect(isN8nAuthorized(new Headers({ "x-n8n-secret": "outro-segredo-seguro" }))).toBe(true);
    delete process.env.N8N_INTEGRATION_SECRET;
    expect(isN8nAuthorized(new Headers({ "x-n8n-secret": "outro-segredo-seguro" }))).toBe(false);
  });
});
