import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { homePathForRole } from "@/lib/auth";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { loading, session, role } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center">Chargement…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(role)} replace />;
}
