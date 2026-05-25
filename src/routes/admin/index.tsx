import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const [stats, setStats] = useState({ livreurs: 0, livraisons: 0, totalUSD: 0, totalCDF: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: livreurs }, { data: deliveries }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("deliveries").select("prix,frais_livraison,devise"),
      ]);
      const totalUSD = (deliveries ?? [])
        .filter((d: any) => d.devise === "USD")
        .reduce((a: number, b: any) => a + Number(b.prix) + Number(b.frais_livraison), 0);
      const totalCDF = (deliveries ?? [])
        .filter((d: any) => d.devise === "CDF")
        .reduce((a: number, b: any) => a + Number(b.prix) + Number(b.frais_livraison), 0);
      setStats({ livreurs: livreurs ?? 0, livraisons: deliveries?.length ?? 0, totalUSD, totalCDF });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Livreurs" value={stats.livreurs.toString()} />
        <Stat label="Livraisons" value={stats.livraisons.toString()} />
        <Stat label="Total USD" value={`$${stats.totalUSD.toFixed(2)}`} highlight />
        <Stat label="Total CDF" value={`${stats.totalCDF.toLocaleString()} FC`} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Commission à payer (10%)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(stats.totalUSD * 0.1).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">+ {(stats.totalCDF * 0.1).toLocaleString()} FC</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "bg-black text-white" : "bg-card"}`}>
      <div className={`text-xs ${highlight ? "text-white/70" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  );
}
