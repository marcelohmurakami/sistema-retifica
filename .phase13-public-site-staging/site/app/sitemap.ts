import type { MetadataRoute } from "next";
import { getRequestPublicSite } from "@/lib/supabase/request-site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getRequestPublicSite();
  if (!data) return [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${data.site.dominio}`;
  return [{ url: siteUrl, changeFrequency: "weekly", priority: 1 }, { url: `${siteUrl}/agendar`, changeFrequency: "daily", priority: .9 }];
}
