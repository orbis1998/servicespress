import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { DollarSign, Package, TrendingUp, Calendar } from "lucide-react";

export const Route = createFileRoute("/livreur/")({ component: LivreurDashboard });

type Delivery = { id: string; prix: number; frais_livraison: number; devise: string; statut: string; created_at: string };

const PERIOD_DAYS = 12; // cycle de paie 12 jours (dimanche off)
const QUOTA_USD = 100;

function LivreurDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [profile, setProfile] = useState<{ full_name: string; badge_number: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("full_name,badge_number").eq("id", user.id).maybeSingle();
      setProfile(p);
      const { data } = await supabase.from("deliveries")
        .select("id,prix,frais_livraison,devise,statut,created_at")
        .eq("livreur_id", user.id).order("created_at", { ascending: false });
      setDeliveries(data ?? []);
    })();
  }, []);

  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const startWeek = new Date(now); startWeek.setDate(now.getDate() - 7);
  const startPeriod = new Date(now); startPeriod.setDate(now.getDate() - PERIOD_DAYS);

  const sum = (list: Delivery[], devise: string) =>
    list.filter((d) => d.devise === devise).reduce((a, b) => a + Number(b.prix) + Number(b.frais_livraison), 0);

  const today = deliveries.filter((d) => new Date(d.created_at) >= startToday);
  const week = deliveries.filter((d) => new Date(d.created_at) >= startWeek);
  const period = deliveries.filter((d) => new Date(d.created_at) >= startPeriod);

  const usdDay = sum(today, "USD");
  const cdfDay = sum(today, "CDF");
  const usdWeek = sum(week, "USD");
  const cdfWeek = sum(week, "CDF");
  const usdPeriod = sum(period, "USD");
  const cdfPeriod = sum(period, "CDF");

  const commissionUSD = usdPeriod * 0.1;
  const commissionCDF = cdfPeriod * 0.1;
  const quotaProgress = Math.min(100, (usdPeriod / QUOTA_USD) * 100);

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const day = d.toISOString().slice(0, 10);
    const dd = deliveries.filter((dl) => dl.created_at.startsWith(day));
    return {
      jour: d.toLocaleDateString("fr", { weekday: "short" }),
      USD: dd.filter((d) => d.devise === "USD").reduce((a, b) => a + Number(b.prix) + Number(b.frais_livraison), 0),
      CDF: dd.filter((d) => d.devise === "CDF").reduce((a, b) => a + Number(b.prix) + Number(b.frais_livraison), 0),
    };
  });

  const reussies = deliveries.filter((d) => d.statut === "reussie").length;
  const annulees = deliveries.filter((d) => d.statut === "annulee").length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Bonjour, {profile?.full_name?.split(" ")[0] ?? "Livreur"} 👋</h1>
        <p className="text-sm text-muted-foreground">Badge {profile?.badge_number}</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DualStat label="Aujourd'hui" usd={usdDay} cdf={cdfDay} icon={<Calendar className="size-4" />} highlight />
        <DualStat label="Semaine" usd={usdWeek} cdf={cdfWeek} icon={<TrendingUp className="size-4" />} />
        <DualStat label={`${PERIOD_DAYS} jours`} usd={usdPeriod} cdf={cdfPeriod} icon={<Package className="size-4" />} />
        <DualStat label="Commission 10%" usd={commissionUSD} cdf={commissionCDF} icon={<DollarSign className="size-4" />} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Quota période ({PERIOD_DAYS}j — dimanche off)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span>${usdPeriod.toFixed(2)} / ${QUOTA_USD}</span>
            <span className="font-semibold">{quotaProgress.toFixed(0)}%</span>
          </div>
          <Progress value={quotaProgress} className="h-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Revenus 7 derniers jours</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="USD" fill="oklch(0.86 0.18 95)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="CDF" fill="oklch(0.15 0 0)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Réussies</div><div className="text-2xl font-bold">{reussies}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Annulées</div><div className="text-2xl font-bold">{annulees}</div></CardContent></Card>
      </div>
    </div>
  );
}

function DualStat({ label, usd, cdf, icon, highlight }: { label: string; usd: number; cdf: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <motion.div whileHover={{ y: -2 }} className={`rounded-2xl border p-4 ${highlight ? "bg-black text-white" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs ${highlight ? "text-white/70" : "text-muted-foreground"}`}>{label}</span>
        <span className={`inline-flex size-7 items-center justify-center rounded-full ${highlight ? "bg-[var(--brand-yellow)] text-black" : "bg-accent"}`}>{icon}</span>
      </div>
      <div className="mt-2 text-lg font-bold">${usd.toFixed(2)}</div>
      <div className={`text-xs ${highlight ? "text-[var(--brand-yellow)]" : "text-foreground"} font-semibold`}>{cdf.toLocaleString()} FC</div>
    </motion.div>
  );
}
