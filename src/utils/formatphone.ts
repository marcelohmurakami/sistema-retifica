export type PhoneFormatOptions = {
  showDDD?: boolean;      // força exibir DDD quando existir (default: true)
  dddOptional?: boolean;  // se true, permite formatar mesmo sem DDD (default: true)
};

export function formatPhone(
  value: string | number | null | undefined,
  options: PhoneFormatOptions = {},
) {
  const { showDDD = true } = options;

  if (value === null || value === undefined) return "";

  const digits = String(value).replace(/\D/g, "");

  if (!digits) return "";

  // 11 dígitos: (DD) 9XXXX-XXXX (celular com DDD)
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const first = digits.slice(2, 7);
    const last = digits.slice(7);
    return showDDD ? `(${ddd}) ${first}-${last}` : `${first}-${last}`;
  }

  // 10 dígitos: (DD) XXXX-XXXX (fixo com DDD)
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const first = digits.slice(2, 6);
    const last = digits.slice(6);
    return showDDD ? `(${ddd}) ${first}-${last}` : `${first}-${last}`;
  }

  // 9 dígitos: 9XXXX-XXXX (celular sem DDD)
  if (digits.length === 9) {
    const first = digits.slice(0, 5);
    const last = digits.slice(5);
    return `${first}-${last}`;
  }

  // 8 dígitos: XXXX-XXXX (fixo sem DDD)
  if (digits.length === 8) {
    const first = digits.slice(0, 4);
    const last = digits.slice(4);
    return `${first}-${last}`;
  }

  // Se vier com 12/13 dígitos (ex: 55 + DDD + número), tenta remover o 55
  if (digits.length === 12 || digits.length === 13) {
    if (digits.startsWith("55")) {
      return formatPhone(digits.slice(2), options);
    }
  }

  // Se não bateu em nenhum formato conhecido, devolve o que tem (melhor que quebrar)
  return digits;
}