import { Link, useRouter } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import {
  Home, Package, Boxes, IdCard, Users, LogOut, Menu, User, Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: ReactNode };

export function AppShell({
  role, children,
}: { role: "admin" | "livreur"; children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = role === "admin"
    ? [
        { to: "/admin", label: "Tableau de bord", icon: <Home className="size-4" /> },
        { to: "/admin/livreurs", label: "Livreurs", icon: <Users className="size-4" /> },
        { to: "/admin/livraisons", label: "Livraisons", icon: <Package className="size-4" /> },
        { to: "/admin/stock", label: "Stock", icon: <Boxes className="size-4" /> },
        { to: "/admin/paie", label: "Paie & Commissions", icon: <Wallet className="size-4" /> },
      ]
    : [
        { to: "/livreur", label: "Tableau de bord", icon: <Home className="size-4" /> },
        { to: "/livreur/livraisons", label: "Mes livraisons", icon: <Package className="size-4" /> },
        { to: "/livreur/stock", label: "Mon stock", icon: <Boxes className="size-4" /> },
        { to: "/livreur/badge", label: "Mon badge", icon: <IdCard className="size-4" /> },
        { to: "/livreur/profil", label: "Mon profil", icon: <User className="size-4" /> },
      ];

  const logout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-black text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to={role === "admin" ? "/admin" : "/livreur"} className="flex items-center gap-2">
            <Logo className="h-10 bg-white rounded-md p-1" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--brand-yellow)] px-3 py-1 text-xs font-semibold text-black">
              {role === "admin" ? "Admin" : "Livreur"}
            </span>
            <Button variant="ghost" size="icon" onClick={logout} className="text-white hover:bg-white/10">
              <LogOut className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10" onClick={() => setOpen((o) => !o)}>
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden md:block w-60 shrink-0 border-r bg-card min-h-[calc(100vh-57px)] p-4">
          <nav className="space-y-1">
            {items.map((it) => (
              <Link key={it.to} to={it.to}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors [&.active]:bg-[var(--brand-yellow)] [&.active]:text-black"
                activeProps={{ className: "active" }}>
                {it.icon}{it.label}
              </Link>
            ))}
          </nav>
        </aside>

        {open && (
          <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)}>
            <aside className="absolute left-0 top-[57px] w-64 bg-card border-r h-full p-4" onClick={(e) => e.stopPropagation()}>
              <nav className="space-y-1">
                {items.map((it) => (
                  <Link key={it.to} to={it.to} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent [&.active]:bg-[var(--brand-yellow)] [&.active]:text-black"
                    activeProps={{ className: "active" }}>
                    {it.icon}{it.label}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
