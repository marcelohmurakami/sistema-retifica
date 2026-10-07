import { File, UploadCloud, X } from 'lucide-react'
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )

  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function fileMatchesAccept(file: File, accept?: string) {
  if (!accept) return true

  return accept.split(',').some((rawRule) => {
    const rule = rawRule.trim().toLowerCase()
    const fileName = file.name.toLowerCase()
    const fileType = file.type.toLowerCase()

    if (rule.startsWith('.')) return fileName.endsWith(rule)
    if (rule.endsWith('/*')) return fileType.startsWith(rule.slice(0, -1))

    return fileType === rule
  })
}

export type FileUploadProps = {
  label: string
  files: File[]
  onFilesChange: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  helperText?: string
  error?: string
  disabled?: boolean
}

export function FileUpload({
  label,
  files,
  onFilesChange,
  accept,
  multiple = false,
  maxFiles = multiple ? 5 : 1,
  maxSizeMB = 10,
  helperText,
  error,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const displayedError = error ?? validationError

  function addFiles(incomingFiles: File[]) {
    setValidationError(null)

    const validFiles: File[] = []

    for (const file of incomingFiles) {
      if (!fileMatchesAccept(file, accept)) {
        setValidationError(`O arquivo “${file.name}” possui um formato inválido.`)
        continue
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setValidationError(
          `O arquivo “${file.name}” ultrapassa o limite de ${maxSizeMB} MB.`,
        )
        continue
      }

      const isDuplicate = [...files, ...validFiles].some(
        (currentFile) =>
          currentFile.name === file.name &&
          currentFile.size === file.size &&
          currentFile.lastModified === file.lastModified,
      )

      if (!isDuplicate) validFiles.push(file)
    }

    const nextFiles = multiple
      ? [...files, ...validFiles].slice(0, maxFiles)
      : validFiles.slice(0, 1)

    if (multiple && files.length + validFiles.length > maxFiles) {
      setValidationError(`Selecione no máximo ${maxFiles} arquivos.`)
    }

    onFilesChange(nextFiles)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return

    addFiles(Array.from(event.dataTransfer.files))
  }

  function removeFile(fileToRemove: File) {
    setValidationError(null)
    onFilesChange(files.filter((file) => file !== fileToRemove))
  }

  return (
    <div className="field file-upload-field">
      <span className="field__label">{label}</span>
      <div
        className={`file-dropzone ${isDragging ? 'is-dragging' : ''} ${displayedError ? 'has-error' : ''}`.trim()}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragging(false)
          }
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          tabIndex={-1}
        />
        <span className="file-dropzone__icon" aria-hidden="true">
          <UploadCloud size={26} />
        </span>
        <div className="file-dropzone__copy">
          <strong>Arraste arquivos para esta área</strong>
          <span>ou</span>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || files.length >= maxFiles}
          >
            Selecionar {multiple ? 'arquivos' : 'arquivo'}
          </button>
        </div>
        <small>
          {helperText ??
            `Até ${maxFiles} ${maxFiles === 1 ? 'arquivo' : 'arquivos'}, com no máximo ${maxSizeMB} MB cada.`}
        </small>
      </div>

      {displayedError && (
        <small className="field__error" role="alert">
          {displayedError}
        </small>
      )}

      {files.length > 0 && (
        <ul className="file-list" aria-label="Arquivos selecionados">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`}>
              <File size={18} aria-hidden="true" />
              <span>
                <strong>{file.name}</strong>
                <small>{formatFileSize(file.size)}</small>
              </span>
              <button
                className="btn btn--icon btn--ghost"
                type="button"
                onClick={() => removeFile(file)}
                disabled={disabled}
                aria-label={`Remover ${file.name}`}
              >
                <X size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
