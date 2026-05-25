import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/livreurs")({ component: AdminLivreurs });

type P = { id: string; badge_number: string; full_name: string; phone: string | null; status: string };

function AdminLivreurs() {
  const [list, setList] = useState<P[]>([]);
  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => setList((data as P[] | null) ?? []));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Livreurs</h1>
      <p className="text-sm text-muted-foreground">Pour créer un nouveau livreur, partagez le lien d'inscription /register.</p>
      <div className="grid gap-2 md:grid-cols-2">
        {list.map((p) => (
          <Card key={p.id}><CardContent className="pt-4 flex justify-between">
            <div><div className="font-semibold">{p.full_name}</div><div className="text-xs text-muted-foreground">{p.phone ?? "—"}</div></div>
            <div className="text-right"><div className="font-mono font-bold text-[var(--brand-yellow)] bg-black px-2 py-1 rounded">{p.badge_number}</div><div className="text-xs mt-1">{p.status}</div></div>
          </CardContent></Card>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun livreur</p>}
      </div>
    </div>
  );
}
