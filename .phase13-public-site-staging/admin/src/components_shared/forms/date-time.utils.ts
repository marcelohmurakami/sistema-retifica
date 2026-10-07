import type { DateTimeValue } from './DateTimePicker'

export function dateTimeValueToIso(value: DateTimeValue) {
  if (!value.date || !value.time) return null
  return `${value.date}T${value.time}`
}

export function isDateTimeRangeValid(
  start: DateTimeValue,
  end: DateTimeValue,
) {
  const startValue = dateTimeValueToIso(start)
  const endValue = dateTimeValueToIso(end)

  if (!startValue || !endValue) return false
  return new Date(endValue).getTime() > new Date(startValue).getTime()
}
