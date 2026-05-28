import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/livraisons")({ component: AdminLivraisons });

type Profile = {
  id: string;
  full_name: string;
  badge_number: string;
};

type Delivery = {
  id: string;
  client: string;
  produit: string;
  prix: number;
  frais_livraison: number;
  devise: string;
  mode_paiement: string | null;
  statut: string;
  observation: string | null;
  created_at: string;
  livreur_id: string;
  usd_received?: number | null;
  cdf_received?: number | null;
  exchange_rate?: number | null;
  commission_usd?: number | null;
  commission_cdf?: number | null;
  livreur?: Profile | null;
};

function AdminLivraisons() {
  const [list, setList] = useState<Delivery[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: deliveries } = await supabase.from("deliveries").select("*").order("created_at", { ascending: false }).limit(100);
      if (!deliveries) {
        setList([]);
        return;
      }

      const livreurIds = Array.from(new Set(deliveries.map((d) => d.livreur_id).filter(Boolean)));
      const { data: profiles } = livreurIds.length
        ? await supabase.from("profiles").select("id,full_name,badge_number").in("id", livreurIds)
        : { data: [] };

      const profileMap = new Map<string, Profile>();
      profiles?.forEach((profile) => {
        if (profile?.id) profileMap.set(profile.id, profile);
      });

      setList(
        deliveries.map((delivery) => ({
          ...delivery,
          livreur: profileMap.get(delivery.livreur_id) ?? null,
        })),
      );
    };

    load();
  }, []);

  const totals = useMemo(() => {
    const totalUsd = list.reduce((sum, delivery) => sum + Number(delivery.usd_received ?? 0), 0);
    const totalCdf = list.reduce((sum, delivery) => sum + Number(delivery.cdf_received ?? 0), 0);
    const totalGeneralUsd = list.reduce(
      (sum, delivery) => sum + Number(delivery.usd_received ?? 0) + Number(delivery.cdf_received ?? 0) / (Number(delivery.exchange_rate ?? 2300) || 1),
      0,
    );
    return { totalUsd, totalCdf, totalGeneralUsd };
  }, [list]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Toutes les livraisons</h1>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-card p-4">
            <div className="text-xs text-muted-foreground">Total USD</div>
            <div className="mt-1 text-xl font-semibold">${totals.totalUsd.toFixed(2)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-card p-4">
            <div className="text-xs text-muted-foreground">Total CDF</div>
            <div className="mt-1 text-xl font-semibold">{totals.totalCdf.toLocaleString()} FC</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-card p-4">
            <div className="text-xs text-muted-foreground">Total général USD</div>
            <div className="mt-1 text-xl font-semibold">${totals.totalGeneralUsd.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {list.map((d) => {
          const generalTotalUsd = Number(d.usd_received ?? 0) + Number(d.cdf_received ?? 0) / (Number(d.exchange_rate ?? 2300) || 1);
          return (
            <Card key={d.id}>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-base font-semibold">{d.client} · {d.produit}</div>
                    <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("fr")}</div>
                    {d.livreur && (
                      <div className="text-sm text-muted-foreground">Livreur: {d.livreur.full_name} · Badge {d.livreur.badge_number}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{d.devise === "CDF" ? `${(Number(d.prix) + Number(d.frais_livraison)).toLocaleString()} FC` : `$${(Number(d.prix) + Number(d.frais_livraison)).toFixed(2)}`}</div>
                    <div className="text-xs text-muted-foreground">{d.statut}</div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-card p-3">
                    <div className="text-xs text-muted-foreground">Reçu USD</div>
                    <div className="font-semibold">${Number(d.usd_received ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-card p-3">
                    <div className="text-xs text-muted-foreground">Reçu CDF</div>
                    <div className="font-semibold">{Number(d.cdf_received ?? 0).toLocaleString()} FC</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-card p-3">
                    <div className="text-xs text-muted-foreground">Total général USD</div>
                    <div className="font-semibold">${generalTotalUsd.toFixed(2)}</div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-[var(--brand-yellow)] p-3 text-black font-semibold">
                    <div className="text-xs">Commission USD</div>
                    <div className="font-semibold">${Number(d.commission_usd ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[var(--brand-yellow)] p-3 text-black font-semibold">
                    <div className="text-xs">Commission CDF</div>
                    <div className="font-semibold">{Number(d.commission_cdf ?? 0).toLocaleString()} FC</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-card p-3">
                    <div className="text-xs text-muted-foreground">Taux de change</div>
                    <div className="font-semibold">{Number(d.exchange_rate ?? 0).toLocaleString()} CDF / USD</div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
                  <div>Mode de paiement: {d.mode_paiement ?? "—"}</div>
                  <div>Devise facturée: {d.devise}</div>
                </div>
                {d.observation && <div className="rounded-xl border border-gray-200 bg-card p-3 text-sm text-muted-foreground">Observation: {d.observation}</div>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
