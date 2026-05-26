import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/livreur")({ component: LivreurLayout });

function LivreurLayout() {
  const { loading, session, role } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center">Chargement…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" />;
  return (
    <AppShell role="livreur">
      <Outlet />
    </AppShell>
  );
}
