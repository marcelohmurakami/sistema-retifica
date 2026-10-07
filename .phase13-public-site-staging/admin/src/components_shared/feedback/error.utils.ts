export function getErrorMessage(
  error: unknown,
  fallback = 'Ocorreu um erro inesperado. Tente novamente.',
) {
  if (error instanceof Error && error.message.trim()) return error.message

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message
  }

  return fallback
}
