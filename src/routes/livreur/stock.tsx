import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

export const Route = createFileRoute("/livreur/stock")({ component: Stock });

type StockItem = { id: string; produit: string; taille: string | null; couleur: string | null; quantite: number; commentaire: string | null };

function Stock() {
  const [list, setList] = useState<StockItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("stock").select("*").eq("livreur_id", user.id).order("created_at", { ascending: false });
      setList((data as StockItem[] | null) ?? []);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mon stock</h1>
      <p className="text-sm text-muted-foreground">
        Le stock est attribué par l'administrateur. Contactez-le pour tout ajustement.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        {list.length === 0 && (
          <div className="col-span-full grid place-items-center py-12 text-muted-foreground">
            <Package className="size-10 mb-2 opacity-40" />
            <p className="text-sm">Aucun produit attribué pour le moment</p>
          </div>
        )}
        {list.map((s) => (
          <Card key={s.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{s.produit}</div>
                <div className="text-xs text-muted-foreground">
                  {[s.taille, s.couleur].filter(Boolean).join(" · ") || "—"}
                </div>
                {s.commentaire && <div className="text-xs italic text-muted-foreground mt-1">{s.commentaire}</div>}
              </div>
              <div className="text-3xl font-bold text-[var(--brand-yellow)] bg-black rounded-lg px-3 py-1">{s.quantite}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
