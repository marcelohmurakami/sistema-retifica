import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useEmpresaAtual } from "../components/empresas/useEmpresas";
import { Spinner } from "../components/spinner/Spinner";

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  const { data: empresaAtual, isLoading: isLoadingEmpresa } = useEmpresaAtual();
  const location = useLocation();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && isLoadingEmpresa) return <Spinner />;

  if (allowedRoles && !allowedRoles.includes(empresaAtual?.role ?? "")) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
