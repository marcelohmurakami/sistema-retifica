import "server-only";

import { timingSafeEqual } from "node:crypto";

export function isN8nAuthorized(headers: Headers) {
  const expectedValue = process.env.N8N_INTEGRATION_SECRET?.trim();
  const bearer = headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const suppliedValue = bearer || headers.get("x-n8n-secret")?.trim();
  if (!expectedValue || !suppliedValue) return false;
  const expected = Buffer.from(expectedValue);
  const supplied = Buffer.from(suppliedValue);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function hasN8nConfiguration() {
  return Boolean(process.env.N8N_INTEGRATION_SECRET?.trim());
}
