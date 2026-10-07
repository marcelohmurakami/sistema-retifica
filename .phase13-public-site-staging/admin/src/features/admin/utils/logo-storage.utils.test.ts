import { describe, expect, it } from 'vitest'
import {
  companyLogoPathFromUrl,
  getCompanyLogoExtension,
} from './logo-storage.utils'

describe('logo storage utils', () => {
  it('aceita somente os formatos de imagem permitidos', () => {
    expect(getCompanyLogoExtension('image/png')).toBe('png')
    expect(getCompanyLogoExtension('image/jpeg')).toBe('jpg')
    expect(getCompanyLogoExtension('image/webp')).toBe('webp')
    expect(getCompanyLogoExtension('image/svg+xml')).toBeNull()
  })

  it('extrai apenas o caminho de uma logo da própria empresa', () => {
    const url =
      'https://projeto.supabase.co/storage/v1/object/public/company-assets/12/logos/logo-abc.webp'

    expect(companyLogoPathFromUrl(12, url)).toBe('12/logos/logo-abc.webp')
    expect(companyLogoPathFromUrl(13, url)).toBeNull()
  })

  it('ignora URLs externas e valores inválidos', () => {
    expect(companyLogoPathFromUrl(12, 'https://cdn.exemplo.com/logo.png')).toBeNull()
    expect(companyLogoPathFromUrl(12, 'não é uma url')).toBeNull()
  })
})
