import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/stock")({ component: AdminStock });

function AdminStock() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("stock").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stock global</h1>
      <div className="grid gap-2 md:grid-cols-2">
        {list.map((s) => (
          <Card key={s.id}><CardContent className="pt-4 flex justify-between">
            <div><div className="font-semibold">{s.produit}</div><div className="text-xs text-muted-foreground">{[s.taille, s.couleur].filter(Boolean).join(" · ")}</div></div>
            <div className="text-2xl font-bold">{s.quantite}</div>
          </CardContent></Card>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun stock</p>}
      </div>
    </div>
  );
}
