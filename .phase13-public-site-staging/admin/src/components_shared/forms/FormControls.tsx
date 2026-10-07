import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import type { LucideIcon } from 'lucide-react'

type FieldMetadata = {
  label: string
  hint?: string
  error?: string
  required?: boolean
  wrapperClassName?: string
}

function getDescribedBy(
  providedId: string | undefined,
  hintId: string | undefined,
  errorId: string | undefined,
) {
  return [providedId, hintId, errorId].filter(Boolean).join(' ') || undefined
}

export type FormFieldProps = FieldMetadata & {
  htmlFor: string
  children: ReactNode
}

export function FormField({
  htmlFor,
  label,
  hint,
  error,
  required,
  wrapperClassName = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`field ${wrapperClassName}`.trim()}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required && <span className="field__required"> *</span>}
      </label>
      {children}
      {hint && !error && <small className="field__hint">{hint}</small>}
      {error && (
        <small className="field__error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}

export type TextFieldProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'size'
> &
  FieldMetadata & {
    leadingIcon?: LucideIcon
    trailingContent?: ReactNode
  }

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      id,
      label,
      hint,
      error,
      required,
      wrapperClassName = '',
      leadingIcon: LeadingIcon,
      trailingContent,
      className = '',
      'aria-describedby': providedDescribedBy,
      ...inputProps
    },
    ref,
  ) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const hintId = hint && !error ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className={`field ${wrapperClassName}`.trim()}>
        <label className="field__label" htmlFor={inputId}>
          {label}
          {required && <span className="field__required"> *</span>}
        </label>
        <div
          className={`form-control ${LeadingIcon ? 'form-control--leading' : ''} ${trailingContent ? 'form-control--trailing' : ''}`.trim()}
        >
          {LeadingIcon && (
            <LeadingIcon
              className="form-control__leading"
              size={18}
              aria-hidden="true"
            />
          )}
          <input
            {...inputProps}
            ref={ref}
            id={inputId}
            className={`input ${className}`.trim()}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={getDescribedBy(
              providedDescribedBy,
              hintId,
              errorId,
            )}
          />
          {trailingContent && (
            <span className="form-control__trailing">{trailingContent}</span>
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
      </div>
    )
  },
)

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectFieldProps = ComponentPropsWithoutRef<'select'> &
  FieldMetadata & {
    options: SelectOption[]
    placeholder?: string
  }

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    {
      id,
      label,
      hint,
      error,
      required,
      wrapperClassName = '',
      options,
      placeholder,
      className = '',
      'aria-describedby': providedDescribedBy,
      ...selectProps
    },
    ref,
  ) {
    const generatedId = useId()
    const selectId = id ?? generatedId
    const hintId = hint && !error ? `${selectId}-hint` : undefined
    const errorId = error ? `${selectId}-error` : undefined

    return (
      <div className={`field ${wrapperClassName}`.trim()}>
        <label className="field__label" htmlFor={selectId}>
          {label}
          {required && <span className="field__required"> *</span>}
        </label>
        <select
          {...selectProps}
          ref={ref}
          id={selectId}
          className={`select ${className}`.trim()}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={getDescribedBy(
            providedDescribedBy,
            hintId,
            errorId,
          )}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
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
      </div>
    )
  },
)

export type TextAreaFieldProps = ComponentPropsWithoutRef<'textarea'> &
  FieldMetadata

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(function TextAreaField(
  {
    id,
    label,
    hint,
    error,
    required,
    wrapperClassName = '',
    className = '',
    'aria-describedby': providedDescribedBy,
    ...textareaProps
  },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const hintId = hint && !error ? `${textareaId}-hint` : undefined
  const errorId = error ? `${textareaId}-error` : undefined

  return (
    <div className={`field ${wrapperClassName}`.trim()}>
      <label className="field__label" htmlFor={textareaId}>
        {label}
        {required && <span className="field__required"> *</span>}
      </label>
      <textarea
        {...textareaProps}
        ref={ref}
        id={textareaId}
        className={`textarea ${className}`.trim()}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={getDescribedBy(
          providedDescribedBy,
          hintId,
          errorId,
        )}
      />
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
    </div>
  )
})

export type CheckboxFieldProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'type'
> & {
  label: string
  description?: string
  error?: string
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  function CheckboxField(
    { id, label, description, error, className = '', ...inputProps },
    ref,
  ) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const descriptionId = description ? `${inputId}-description` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className="field">
        <label className="checkbox-field" htmlFor={inputId}>
          <input
            {...inputProps}
            ref={ref}
            id={inputId}
            className={className}
            type="checkbox"
            aria-invalid={Boolean(error)}
            aria-describedby={getDescribedBy(
              undefined,
              descriptionId,
              errorId,
            )}
          />
          <span>
            <strong>{label}</strong>
            {description && <small id={descriptionId}>{description}</small>}
          </span>
        </label>
        {errorId && (
          <small className="field__error" id={errorId} role="alert">
            {error}
          </small>
        )}
      </div>
    )
  },
)

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="form-actions">{children}</div>
}
