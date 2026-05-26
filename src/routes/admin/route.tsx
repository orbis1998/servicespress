import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { loading, session, role } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center">Chargement…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!role) {
    return (
      <div className="min-h-screen grid place-items-center p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Compte sans rôle. Contactez l&apos;administrateur ou exécutez create-admin.sql.
        </p>
      </div>
    );
  }
  if (role !== "admin") return <Navigate to="/livreur" />;
  return (
    <AppShell role="admin">
      <Outlet />
    </AppShell>
  );
}
