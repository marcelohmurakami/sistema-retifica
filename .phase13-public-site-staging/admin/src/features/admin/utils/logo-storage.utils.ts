export const COMPANY_ASSETS_BUCKET = 'company-assets'
export const MAX_COMPANY_LOGO_BYTES = 2 * 1024 * 1024

const LOGO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function getCompanyLogoExtension(mimeType: string) {
  return LOGO_EXTENSIONS[mimeType.toLowerCase()] ?? null
}

export function companyLogoPathFromUrl(companyId: number, logoUrl: string) {
  if (!logoUrl) return null

  try {
    const url = new URL(logoUrl)
    const marker = `/storage/v1/object/public/${COMPANY_ASSETS_BUCKET}/`
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex < 0) return null

    const objectPath = decodeURIComponent(
      url.pathname.slice(markerIndex + marker.length),
    )

    return objectPath.startsWith(`${companyId}/logos/`) ? objectPath : null
  } catch {
    return null
  }
}
