import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Lock } from "lucide-react";

export const Route = createFileRoute("/admin/paie")({ component: AdminPaie });

const PERIOD_DAYS = 12;

type Row = { id: string; full_name: string; badge_number: string; usd: number; cdf: number; commUSD: number; commCDF: number; count: number };

function AdminPaie() {
  const [rows, setRows] = useState<Row[]>([]);
  const [periodStart, setPeriodStart] = useState<Date>(new Date());

  useEffect(() => {
    (async () => {
      const start = new Date(); start.setDate(start.getDate() - PERIOD_DAYS); start.setHours(0,0,0,0);
      setPeriodStart(start);
      const [{ data: dels }, { data: profs }, { data: admins }] = await Promise.all([
        supabase.from("deliveries").select("livreur_id,prix,frais_livraison,devise,created_at").gte("created_at", start.toISOString()),
        supabase.from("profiles").select("id,full_name,badge_number"),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
      ]);
      const adminIds = (admins ?? []).map((a) => a.user_id);
      const livreurs = (profs ?? []).filter((p) => !adminIds.includes(p.id));
      const r = livreurs.map((p) => {
        const list = (dels ?? []).filter((d) => d.livreur_id === p.id);
        const usd = list.filter((d) => d.devise === "USD").reduce((a, b) => a + Number(b.prix) + Number(b.frais_livraison), 0);
        const cdf = list.filter((d) => d.devise === "CDF").reduce((a, b) => a + Number(b.prix) + Number(b.frais_livraison), 0);
        return { id: p.id, full_name: p.full_name, badge_number: p.badge_number, usd, cdf, commUSD: usd * 0.1, commCDF: cdf * 0.1, count: list.length };
      });
      setRows(r);
    })();
  }, []);

  const exportCSV = () => {
    const header = "Badge,Nom,Livraisons,Total USD,Total CDF,Commission USD,Commission CDF";
    const lines = rows.map((r) => `${r.badge_number},"${r.full_name}",${r.count},${r.usd.toFixed(2)},${r.cdf.toFixed(0)},${r.commUSD.toFixed(2)},${r.commCDF.toFixed(0)}`);
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `paie-${periodStart.toISOString().slice(0,10)}.csv`; a.click();
  };

  const closePeriod = async () => {
    if (!confirm(`Clôturer la période et archiver dans la table paie ? (${PERIOD_DAYS} jours)`)) return;
    const today = new Date();
    const inserts = rows.map((r) => ({
      livreur_id: r.id,
      periode_debut: periodStart.toISOString().slice(0,10),
      periode_fin: today.toISOString().slice(0,10),
      total_genere_usd: r.usd, total_genere_cdf: r.cdf,
      commission_usd: r.commUSD, commission_cdf: r.commCDF,
    }));
    const { error } = await supabase.from("payrolls").insert(inserts);
    if (error) return toast.error(error.message);
    toast.success("Période clôturée et archivée");
  };

  const totalUSD = rows.reduce((a, b) => a + b.usd, 0);
  const totalCDF = rows.reduce((a, b) => a + b.cdf, 0);
  const totalCommUSD = rows.reduce((a, b) => a + b.commUSD, 0);
  const totalCommCDF = rows.reduce((a, b) => a + b.commCDF, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Paie & Commissions</h1>
          <p className="text-sm text-muted-foreground">Période en cours : {periodStart.toLocaleDateString("fr")} → aujourd'hui ({PERIOD_DAYS}j)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="size-4" /> CSV</Button>
          <Button onClick={closePeriod} className="bg-black text-white"><Lock className="size-4" /> Clôturer</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Box label="CA USD" value={`$${totalUSD.toFixed(2)}`} />
        <Box label="CA CDF" value={`${totalCDF.toLocaleString()} FC`} />
        <Box label="Commission USD" value={`$${totalCommUSD.toFixed(2)}`} highlight />
        <Box label="Commission CDF" value={`${totalCommCDF.toLocaleString()} FC`} highlight />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Détail par livreur</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Livreur</th>
                  <th className="text-right">Livr.</th>
                  <th className="text-right">USD</th>
                  <th className="text-right">CDF</th>
                  <th className="text-right">Comm. USD</th>
                  <th className="text-right">Comm. CDF</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2"><div className="font-medium">{r.full_name}</div><div className="text-xs text-muted-foreground">{r.badge_number}</div></td>
                    <td className="text-right">{r.count}</td>
                    <td className="text-right">${r.usd.toFixed(2)}</td>
                    <td className="text-right">{r.cdf.toLocaleString()}</td>
                    <td className="text-right font-semibold">${r.commUSD.toFixed(2)}</td>
                    <td className="text-right font-semibold">{r.commCDF.toLocaleString()}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Aucun livreur</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Box({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "bg-[var(--brand-yellow)] text-black" : "bg-card"}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  );
}
