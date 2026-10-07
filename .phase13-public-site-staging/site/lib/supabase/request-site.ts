import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { getPublicSite } from "./site";

export function normalizeHost(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/:\d+$/, "");
}

export const getRequestPublicSite = cache(async () => {
  const requestHeaders = await headers();
  const domain = normalizeHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
  return getPublicSite({ domain, slug: process.env.SUPABASE_SITE_SLUG ?? null });
});

export async function getPublicSiteForRequest(request: Request) {
  const domain = normalizeHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  return getPublicSite({ domain, slug: process.env.SUPABASE_SITE_SLUG ?? null });
}
