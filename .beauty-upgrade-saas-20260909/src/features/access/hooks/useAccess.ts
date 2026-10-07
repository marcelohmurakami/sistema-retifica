import { useContext } from 'react'
import { AccessContext } from '../context/access-context'

export function useAccess() {
  const context = useContext(AccessContext)

  if (!context) {
    throw new Error('useAccess deve ser utilizado dentro de AccessProvider.')
  }

  return context
}
