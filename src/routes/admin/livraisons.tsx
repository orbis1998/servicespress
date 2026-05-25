import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/livraisons")({ component: AdminLivraisons });

function AdminLivraisons() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("deliveries").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => setList(data ?? []));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Toutes les livraisons</h1>
      <div className="space-y-2">
        {list.map((d) => (
          <Card key={d.id}><CardContent className="pt-4 flex justify-between">
            <div><div className="font-semibold">{d.client} · {d.produit}</div><div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("fr")}</div></div>
            <div className="text-right"><div className="font-bold">{(Number(d.prix) + Number(d.frais_livraison)).toLocaleString()} {d.devise}</div><div className="text-xs">{d.statut}</div></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
