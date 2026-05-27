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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link to={role === "admin" ? "/admin" : "/livreur"} className="flex items-center gap-3">
            <Logo className="h-11 rounded-2xl bg-white/10 p-2" />
            <div className="hidden md:block">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">ServicExpress</p>
              <p className="text-sm font-semibold">Espace {role === "admin" ? "Admin" : "Livreur"}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--brand-yellow)] px-3 py-1 text-xs font-semibold text-black">
              {role === "admin" ? "Admin" : "Livreur"}
            </span>
            <Button variant="ghost" size="icon" onClick={logout} className="text-slate-100 hover:bg-white/10">
              <LogOut className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-slate-100 hover:bg-white/10" onClick={() => setOpen((o) => !o)}>
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden xl:block w-72 shrink-0 border-r border-white/10 bg-slate-950/90 min-h-[calc(100vh-72px)] p-6">
          <div className="mb-8 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tableau de bord</p>
            <p className="mt-2 text-sm font-semibold text-white">Accès rapide aux sections clés</p>
          </div>
          <nav className="space-y-2">
            {items.map((it) => (
              <Link key={it.to} to={it.to}
                className="group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                activeProps={{ className: "active" }}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-200 transition group-hover:bg-[var(--brand-yellow)] group-hover:text-black">
                  {it.icon}
                </span>
                <span className="truncate">{it.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {open && (
          <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)}>
            <aside className="absolute left-0 top-[72px] w-72 bg-slate-950/95 border-r border-white/10 h-full p-5" onClick={(e) => e.stopPropagation()}>
              <nav className="space-y-2">
                {items.map((it) => (
                  <Link key={it.to} to={it.to} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800"
                    activeProps={{ className: "active" }}>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-200">
                      {it.icon}
                    </span>
                    <span>{it.label}</span>
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
