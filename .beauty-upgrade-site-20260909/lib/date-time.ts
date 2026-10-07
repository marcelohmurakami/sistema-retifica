const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function formatInTimeZone(
  value: string | number | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("pt-BR", { ...options, timeZone }).format(
    new Date(value),
  );
}

export function dateIsoInTimeZone(
  timeZone: string,
  dayOffset = 0,
  now: Date = new Date(),
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const today = `${byType.year}-${byType.month}-${byType.day}`;

  if (!ISO_DATE.test(today)) {
    throw new Error("Não foi possível calcular a data local da empresa.");
  }

  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + dayOffset))
    .toISOString()
    .slice(0, 10);
}
