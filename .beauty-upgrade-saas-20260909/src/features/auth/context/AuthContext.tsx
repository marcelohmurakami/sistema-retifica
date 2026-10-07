import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { supabase } from '../../../supabase/supabaseApi'
import { getActiveCompanyMemberships } from '../api/auth.api'
import { authKeys } from '../auth.keys'
import type { AuthContextValue } from '../types/auth.types'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const previousUserId = useRef<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const nextUserId = nextSession?.user.id ?? null

      if (
        previousUserId.current !== null &&
        previousUserId.current !== nextUserId
      ) {
        queryClient.clear()
      }

      previousUserId.current = nextUserId
      setSession(nextSession)
      setIsSessionLoading(false)

      if (event === 'SIGNED_OUT') {
        queryClient.clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  const userId = session?.user.id
  const accessQuery = useQuery({
    queryKey: authKeys.memberships(userId ?? 'sem-usuario'),
    queryFn: () => getActiveCompanyMemberships(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const vinculos = useMemo(() => accessQuery.data ?? [], [accessQuery.data])
  const vinculoAtual = vinculos[0] ?? null

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      vinculos,
      vinculoAtual,
      empresaAtual: vinculoAtual?.empresa ?? null,
      isSessionLoading,
      isLoading:
        isSessionLoading || Boolean(session && accessQuery.isPending),
      accessError:
        accessQuery.error instanceof Error ? accessQuery.error : null,
      refetchAccess: accessQuery.refetch,
    }),
    [
      accessQuery.error,
      accessQuery.isPending,
      accessQuery.refetch,
      isSessionLoading,
      session,
      vinculoAtual,
      vinculos,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
