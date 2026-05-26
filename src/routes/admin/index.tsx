import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Users, Package, Wallet, TrendingUp } from "lucide-react";

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
        supabase.from("deliveries").select("livreur_id,prix,frais_livraison,devise,statut,created_at"),
        supabase.from("profiles").select("id,full_name,badge_number"),
      ]);
      const ds = deliveries ?? [];
      const now = new Date();
      const startToday = new Date(now); startToday.setHours(0,0,0,0);
      const startWeek = new Date(now); startWeek.setDate(now.getDate()-7);
      const startPeriod = new Date(now); startPeriod.setDate(now.getDate()-PERIOD_DAYS);

      const sum = (list: any[], devise: string) =>
        list.filter((d) => d.devise === devise).reduce((a, b) => a + Number(b.prix) + Number(b.frais_livraison), 0);

      const today = ds.filter((d) => new Date(d.created_at) >= startToday);
      const week = ds.filter((d) => new Date(d.created_at) >= startWeek);
      const period = ds.filter((d) => new Date(d.created_at) >= startPeriod);

      setStats({
        livreurs: (livreurs ?? 1) - 1, // exclude admin
        livraisons: ds.length,
        usdDay: sum(today, "USD"), cdfDay: sum(today, "CDF"),
        usdWeek: sum(week, "USD"), cdfWeek: sum(week, "CDF"),
        usdPeriod: sum(period, "USD"), cdfPeriod: sum(period, "CDF"),
      });

      // chart 7 days
      const c = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const day = d.toISOString().slice(0, 10);
        const dd = ds.filter((dl) => dl.created_at.startsWith(day));
        return {
          jour: d.toLocaleDateString("fr", { weekday: "short" }),
          USD: dd.filter((x) => x.devise === "USD").reduce((a, b) => a + Number(b.prix) + Number(b.frais_livraison), 0),
          CDF: dd.filter((x) => x.devise === "CDF").reduce((a, b) => a + Number(b.prix) + Number(b.frais_livraison), 0),
        };
      });
      setChart(c);

      // top livreurs
      const byLivreur: Record<string, { usd: number; cdf: number; count: number }> = {};
      period.forEach((d) => {
        const k = d.livreur_id;
        if (!byLivreur[k]) byLivreur[k] = { usd: 0, cdf: 0, count: 0 };
        if (d.devise === "USD") byLivreur[k].usd += Number(d.prix) + Number(d.frais_livraison);
        else byLivreur[k].cdf += Number(d.prix) + Number(d.frais_livraison);
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
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Cycle de paie : {PERIOD_DAYS} jours (dimanche off)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Livreurs" value={stats.livreurs.toString()} icon={<Users className="size-4" />} />
        <Stat label="Livraisons" value={stats.livraisons.toString()} icon={<Package className="size-4" />} />
        <Stat label="CA période USD" value={`$${stats.usdPeriod.toFixed(2)}`} icon={<TrendingUp className="size-4" />} highlight />
        <Stat label="CA période CDF" value={`${stats.cdfPeriod.toLocaleString()} FC`} icon={<TrendingUp className="size-4" />} />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <RevenueCard title="Aujourd'hui" usd={stats.usdDay} cdf={stats.cdfDay} />
        <RevenueCard title="Cette semaine" usd={stats.usdWeek} cdf={stats.cdfWeek} />
        <RevenueCard title={`Période ${PERIOD_DAYS}j`} usd={stats.usdPeriod} cdf={stats.cdfPeriod} highlight />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="size-4" /> Commission à payer (10%)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-muted-foreground">USD</div>
              <div className="text-3xl font-bold">${(stats.usdPeriod * 0.1).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">CDF</div>
              <div className="text-3xl font-bold">{(stats.cdfPeriod * 0.1).toLocaleString()} FC</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Revenus 7 derniers jours</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="USD" fill="oklch(0.86 0.18 95)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="CDF" fill="oklch(0.15 0 0)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Top livreurs (période)</CardTitle></CardHeader>
        <CardContent>
          {topLivreurs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {topLivreurs.map((l, i) => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="size-8 grid place-items-center rounded-full bg-[var(--brand-yellow)] text-black font-bold">{i + 1}</div>
                    <div>
                      <div className="font-semibold">{l.profile?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{l.profile?.badge_number} · {l.count} livraisons</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-bold">${l.usd.toFixed(2)}</div>
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

function Stat({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "bg-black text-white" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className={`text-xs ${highlight ? "text-white/70" : "text-muted-foreground"}`}>{label}</div>
        <span className={`inline-flex size-7 items-center justify-center rounded-full ${highlight ? "bg-[var(--brand-yellow)] text-black" : "bg-accent"}`}>{icon}</span>
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  );
}

function RevenueCard({ title, usd, cdf, highlight }: { title: string; usd: number; cdf: number; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-2 border-[var(--brand-yellow)]" : ""}>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2"><span className="text-xs text-muted-foreground">USD</span><span className="text-xl font-bold">${usd.toFixed(2)}</span></div>
          <div className="flex items-baseline gap-2"><span className="text-xs text-muted-foreground">CDF</span><span className="text-xl font-bold">{cdf.toLocaleString()} FC</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
