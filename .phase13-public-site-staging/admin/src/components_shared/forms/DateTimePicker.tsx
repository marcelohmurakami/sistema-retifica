import { CalendarDays, Clock } from 'lucide-react'
import { useId } from 'react'

export type DateTimeValue = {
  date: string
  time: string
}

export type DateTimePickerProps = {
  label: string
  value: DateTimeValue
  onChange: (value: DateTimeValue) => void
  minDate?: string
  maxDate?: string
  minuteStep?: number
  showTime?: boolean
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

export function DateTimePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  minuteStep = 5,
  showTime = true,
  required = false,
  disabled = false,
  error,
  hint,
}: DateTimePickerProps) {
  const generatedId = useId()
  const errorId = error ? `${generatedId}-error` : undefined
  const hintId = hint && !error ? `${generatedId}-hint` : undefined

  return (
    <fieldset
      className="field date-time-picker"
      aria-invalid={Boolean(error)}
      aria-describedby={errorId ?? hintId}
    >
      <legend className="field__label">
        {label}
        {required && <span className="field__required"> *</span>}
      </legend>
      <div className="date-time-picker__controls" data-show-time={showTime}>
        <label className="date-time-picker__field">
          <span>Data</span>
          <span className="date-time-picker__input">
            <CalendarDays size={18} aria-hidden="true" />
            <input
              type="date"
              value={value.date}
              min={minDate}
              max={maxDate}
              required={required}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...value, date: event.target.value })
              }
            />
          </span>
        </label>
        {showTime && (
          <label className="date-time-picker__field">
            <span>Horário</span>
            <span className="date-time-picker__input">
              <Clock size={18} aria-hidden="true" />
              <input
                type="time"
                value={value.time}
                step={minuteStep * 60}
                required={required}
                disabled={disabled}
                onChange={(event) =>
                  onChange({ ...value, time: event.target.value })
                }
              />
            </span>
          </label>
        )}
      </div>
      {hintId && (
        <small className="field__hint" id={hintId}>
          {hint}
        </small>
      )}
      {errorId && (
        <small className="field__error" id={errorId} role="alert">
          {error}
        </small>
      )}
    </fieldset>
  )
}

export type DateTimeRangeValue = {
  start: DateTimeValue
  end: DateTimeValue
}

export type DateTimeRangePickerProps = {
  value: DateTimeRangeValue
  onChange: (value: DateTimeRangeValue) => void
  minDate?: string
  maxDate?: string
  minuteStep?: number
  showTime?: boolean
  disabled?: boolean
  required?: boolean
  error?: string
}

export function DateTimeRangePicker({
  value,
  onChange,
  minDate,
  maxDate,
  minuteStep = 5,
  showTime = true,
  disabled,
  required,
  error,
}: DateTimeRangePickerProps) {
  return (
    <div className="date-time-range">
      <DateTimePicker
        label="Início"
        value={value.start}
        onChange={(start) => onChange({ ...value, start })}
        minDate={minDate}
        maxDate={maxDate}
        minuteStep={minuteStep}
        showTime={showTime}
        disabled={disabled}
        required={required}
      />
      <DateTimePicker
        label="Fim"
        value={value.end}
        onChange={(end) => onChange({ ...value, end })}
        minDate={value.start.date || minDate}
        maxDate={maxDate}
        minuteStep={minuteStep}
        showTime={showTime}
        disabled={disabled}
        required={required}
        error={error}
      />
    </div>
  )
}
