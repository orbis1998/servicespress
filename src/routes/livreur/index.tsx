import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { DollarSign, Package, TrendingUp, Calendar } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { RevenueBarChart } from "@/components/RevenueBarChart";

export const Route = createFileRoute("/livreur/")({ component: LivreurDashboard });

type Delivery = {
  id: string;
  prix: number;
  frais_livraison: number;
  devise: string;
  statut: string;
  created_at: string;
  usd_received?: number | null;
  cdf_received?: number | null;
  exchange_rate?: number | null;
  commission_usd?: number | null;
  commission_cdf?: number | null;
};

const PERIOD_DAYS = 12; // cycle de paie 12 jours (dimanche off)

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
        .select("id,prix,frais_livraison,devise,statut,created_at,usd_received,cdf_received,exchange_rate,commission_usd,commission_cdf")
        .eq("livreur_id", user.id).order("created_at", { ascending: false });
      setDeliveries(data ?? []);
    })();
  }, []);

  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const startWeek = new Date(now); startWeek.setDate(now.getDate() - 7);
  const startPeriod = new Date(now); startPeriod.setDate(now.getDate() - PERIOD_DAYS);

  const receivedUsd = (d: Delivery) =>
    Number(d.usd_received ?? (d.devise === "USD" ? d.prix + d.frais_livraison : 0));
  const receivedCdf = (d: Delivery) =>
    Number(d.cdf_received ?? (d.devise === "CDF" ? d.prix + d.frais_livraison : 0));
  const commissionUsdValue = (d: Delivery) => Number(d.commission_usd ?? receivedUsd(d) * 0.1);
  const commissionCdfValue = (d: Delivery) => Number(d.commission_cdf ?? receivedCdf(d) * 0.1);

  const today = deliveries.filter((d) => new Date(d.created_at) >= startToday);
  const week = deliveries.filter((d) => new Date(d.created_at) >= startWeek);
  const period = deliveries.filter((d) => new Date(d.created_at) >= startPeriod);

  const usdDay = today.reduce((sum, d) => sum + receivedUsd(d), 0);
  const cdfDay = today.reduce((sum, d) => sum + receivedCdf(d), 0);
  const usdWeek = week.reduce((sum, d) => sum + receivedUsd(d), 0);
  const cdfWeek = week.reduce((sum, d) => sum + receivedCdf(d), 0);
  const usdPeriod = period.reduce((sum, d) => sum + receivedUsd(d), 0);
  const cdfPeriod = period.reduce((sum, d) => sum + receivedCdf(d), 0);

  const commissionUSD = period.reduce((sum, d) => sum + commissionUsdValue(d), 0);
  const commissionCDF = period.reduce((sum, d) => sum + commissionCdfValue(d), 0);

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const day = d.toISOString().slice(0, 10);
    const dd = deliveries.filter((dl) => dl.created_at.startsWith(day));
    return {
      jour: d.toLocaleDateString("fr", { weekday: "short" }),
      USD: dd.reduce((sum, delivery) => sum + receivedUsd(delivery), 0),
      CDF: dd.reduce((sum, delivery) => sum + receivedCdf(delivery), 0),
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
        <CardHeader><CardTitle className="text-base">Période {PERIOD_DAYS} jours</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Suivi des recettes sur 12 jours sans plafond.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Revenus 7 derniers jours</CardTitle></CardHeader>
        <CardContent>
          <ClientOnly fallback={<div className="h-56 animate-pulse rounded-lg bg-muted" />}>
            <div className="h-56">
              <RevenueBarChart data={chartData} />
            </div>
          </ClientOnly>
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
