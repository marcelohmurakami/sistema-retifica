import { TextField, type TextFieldProps } from './FormControls'
import { applyMask, onlyDigits, type MaskType } from './masks'

export type MaskedInputProps = Omit<
  TextFieldProps,
  'value' | 'onChange' | 'type' | 'inputMode'
> & {
  mask: MaskType
  value: string
  onValueChange: (formattedValue: string, digits: string) => void
}

export function MaskedInput({
  mask,
  value,
  onValueChange,
  ...fieldProps
}: MaskedInputProps) {
  return (
    <TextField
      {...fieldProps}
      type="text"
      inputMode={mask === 'telefone' ? 'tel' : 'numeric'}
      autoComplete={
        fieldProps.autoComplete ?? (mask === 'telefone' ? 'tel' : 'off')
      }
      value={value ? applyMask(value, mask) : ''}
      onChange={(event) => {
        const formattedValue = applyMask(event.target.value, mask)
        onValueChange(formattedValue, onlyDigits(formattedValue))
      }}
    />
  )
}
