import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabaseApi";
import { clearEmpresaAtualCache } from "../components/empresas/empresasApi";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Erro ao recuperar sessão:", error.message);
      }

      currentUserIdRef.current = data.session?.user.id ?? null;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;

      if (currentUserIdRef.current !== nextUserId) {
        clearEmpresaAtualCache();
        queryClient.clear();
        currentUserIdRef.current = nextUserId;
      }

      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  async function signIn(email: string, password: string) {
    clearEmpresaAtualCache();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    setSession(data.session);
    setUser(data.user);

    return { error: null };
  }

  async function signOut() {
    setLoading(true);
    clearEmpresaAtualCache();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error.message);
      setLoading(false);
      return;
    }

    setSession(null);
    setUser(null);

    localStorage.removeItem("usuarioEmpresa");
    localStorage.removeItem("empresaAtual");
    localStorage.removeItem("perfil");

    setLoading(false);
  }

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signOut,
    }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// O hook fica junto do provider para manter a API pública de contexto em um só módulo.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider");
  }

  return context;
}
