import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Wallet, TrendingUp } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { RevenueBarChart } from "@/components/RevenueBarChart";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

const PERIOD_DAYS = 12;

function AdminDashboard() {
  const [stats, setStats] = useState({
    livreurs: 0, livraisons: 0,
    usdDay: 0, cdfDay: 0, usdWeek: 0, cdfWeek: 0, usdPeriod: 0, cdfPeriod: 0,
  });
  const [chart, setChart] = useState<any[]>([]);
  const [topLivreurs, setTopLivreurs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: livreurs }, { data: deliveries }, { data: profiles }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("deliveries").select("livreur_id,prix,frais_livraison,devise,statut,created_at,usd_received,cdf_received,exchange_rate"),
        supabase.from("profiles").select("id,full_name,badge_number"),
      ]);
      const ds = deliveries ?? [];
      const now = new Date();
      const startToday = new Date(now); startToday.setHours(0,0,0,0);
      const startWeek = new Date(now); startWeek.setDate(now.getDate()-7);
      const startPeriod = new Date(now); startPeriod.setDate(now.getDate()-PERIOD_DAYS);

      const receivedUsd = (d: any) => Number(d.usd_received ?? (d.devise === "USD" ? Number(d.prix) + Number(d.frais_livraison) : 0));
      const receivedCdf = (d: any) => Number(d.cdf_received ?? (d.devise === "CDF" ? Number(d.prix) + Number(d.frais_livraison) : 0));

      const today = ds.filter((d) => new Date(d.created_at) >= startToday);
      const week = ds.filter((d) => new Date(d.created_at) >= startWeek);
      const period = ds.filter((d) => new Date(d.created_at) >= startPeriod);

      setStats({
        livreurs: (livreurs ?? 1) - 1, // exclude admin
        livraisons: ds.length,
        usdDay: today.reduce((sum, d) => sum + receivedUsd(d), 0),
        cdfDay: today.reduce((sum, d) => sum + receivedCdf(d), 0),
        usdWeek: week.reduce((sum, d) => sum + receivedUsd(d), 0),
        cdfWeek: week.reduce((sum, d) => sum + receivedCdf(d), 0),
        usdPeriod: period.reduce((sum, d) => sum + receivedUsd(d), 0),
        cdfPeriod: period.reduce((sum, d) => sum + receivedCdf(d), 0),
      });

      const c = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const day = d.toISOString().slice(0, 10);
        const dd = ds.filter((dl) => dl.created_at.startsWith(day));
        return {
          jour: d.toLocaleDateString("fr", { weekday: "short" }),
          USD: dd.reduce((sum, x) => sum + receivedUsd(x), 0),
          CDF: dd.reduce((sum, x) => sum + receivedCdf(x), 0),
        };
      });
      setChart(c);

      const byLivreur: Record<string, { usd: number; cdf: number; count: number }> = {};
      period.forEach((d) => {
        const k = d.livreur_id;
        if (!byLivreur[k]) byLivreur[k] = { usd: 0, cdf: 0, count: 0 };
        byLivreur[k].usd += receivedUsd(d);
        byLivreur[k].cdf += receivedCdf(d);
        byLivreur[k].count++;
      });
      const top = Object.entries(byLivreur)
        .map(([id, v]) => ({ id, ...v, profile: profiles?.find((p) => p.id === id) }))
        .sort((a, b) => b.usd - a.usd).slice(0, 5);
      setTopLivreurs(top);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Cycle de paie : {PERIOD_DAYS} jours (dimanche off)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Stat label="Livreurs" value={stats.livreurs.toString()} icon={<Users className="size-4" />} />
        <Stat label="Livraisons" value={stats.livraisons.toString()} icon={<Package className="size-4" />} />
        <Stat label="CA période USD" value={`$${stats.usdPeriod.toFixed(2)}`} icon={<TrendingUp className="size-4" />} highlight />
        <Stat label="CA période CDF" value={`${stats.cdfPeriod.toLocaleString()} FC`} icon={<TrendingUp className="size-4" />} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <RevenueCard title="Aujourd'hui" usd={stats.usdDay} cdf={stats.cdfDay} />
        <RevenueCard title="Cette semaine" usd={stats.usdWeek} cdf={stats.cdfWeek} />
        <RevenueCard title={`Période ${PERIOD_DAYS}j`} usd={stats.usdPeriod} cdf={stats.cdfPeriod} highlight />
      </div>

      <Card className="border-gray-200 bg-white">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="size-4" /> Commission à payer (10%)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs text-muted-foreground">USD</div>
              <div className="mt-2 text-3xl font-semibold text-foreground">${(stats.usdPeriod * 0.1).toFixed(2)}</div>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs text-muted-foreground">CDF</div>
              <div className="mt-2 text-3xl font-semibold text-foreground">{(stats.cdfPeriod * 0.1).toLocaleString()} FC</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white">
        <CardHeader><CardTitle className="text-base">Revenus 7 derniers jours</CardTitle></CardHeader>
        <CardContent>
          <ClientOnly fallback={<div className="h-64 animate-pulse rounded-3xl bg-gray-200" />}>
            <div className="h-64 rounded-3xl bg-gray-50 p-4">
              <RevenueBarChart data={chart} showLegend />
            </div>
          </ClientOnly>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white">
        <CardHeader><CardTitle className="text-base">Top livreurs (période)</CardTitle></CardHeader>
        <CardContent>
          {topLivreurs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {topLivreurs.map((l, i) => (
                <div key={l.id} className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-9 grid h-11 w-11 place-items-center rounded-full bg-[var(--brand-yellow)] text-black font-semibold">{i + 1}</div>
                    <div>
                      <div className="font-semibold text-foreground">{l.profile?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{l.profile?.badge_number} · {l.count} livraisons</div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-foreground">
                    <div className="font-semibold text-foreground">${l.usd.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{l.cdf.toLocaleString()} FC</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon, highlight }: { label: string; value: string; icon: ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl border p-5 ${highlight ? "bg-slate-900 text-white border-white/10" : "bg-slate-950/90 border-white/10"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={`text-xs uppercase tracking-[0.18em] ${highlight ? "text-slate-400" : "text-slate-500"}`}>{label}</div>
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-3xl ${highlight ? "bg-[var(--brand-yellow)] text-black" : "bg-slate-800 text-slate-100"}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function RevenueCard({ title, usd, cdf, highlight }: { title: string; usd: number; cdf: number; highlight?: boolean }) {
  return (
    <Card className={`rounded-3xl border p-5 ${highlight ? "border-[var(--brand-yellow)] bg-slate-950/90" : "border-white/10 bg-slate-950/90"}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-[0.15em] text-slate-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-400">USD</span>
            <span className="text-2xl font-semibold text-white">${usd.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-400">CDF</span>
            <span className="text-2xl font-semibold text-white">{cdf.toLocaleString()} FC</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
