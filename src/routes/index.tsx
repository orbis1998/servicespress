import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { loading, session, role } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center">Chargement…</div>;
  if (!session) return <Navigate to="/login" />;
  if (role === "admin") return <Navigate to="/admin" />;
  return <Navigate to="/livreur" />;
}
