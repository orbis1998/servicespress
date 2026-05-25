import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/livreur/badge")({ component: Badge });

type Profile = { id: string; badge_number: string; full_name: string; phone: string | null; photo_url: string | null; date_integration: string | null };

function Badge() {
  const [p, setP] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setP(data as Profile | null);
    })();
  }, []);

  if (!p) return <div>Chargement…</div>;

  return (
    <div className="grid place-items-center py-6">
      <Card className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-black shadow-2xl">
        <div className="bg-black text-white p-4 flex items-center justify-between">
          <Logo className="h-10 bg-white rounded-md p-1" />
          <span className="rounded-full bg-[var(--brand-yellow)] px-3 py-1 text-xs font-bold text-black">BADGE</span>
        </div>
        <div className="p-6 flex flex-col items-center gap-3 bg-white">
          <div className="size-28 rounded-full bg-accent grid place-items-center text-4xl font-bold text-black overflow-hidden">
            {p.photo_url ? <img src={p.photo_url} alt={p.full_name} className="size-full object-cover" /> : p.full_name.charAt(0)}
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{p.full_name}</div>
            <div className="text-xs text-muted-foreground">{p.phone ?? "—"}</div>
          </div>
          <div className="w-full rounded-lg bg-black text-white text-center py-2">
            <div className="text-xs opacity-70">N° de badge</div>
            <div className="text-xl font-bold tracking-widest text-[var(--brand-yellow)]">{p.badge_number}</div>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <QRCodeSVG value={`SERVICEXPRESS:${p.badge_number}:${p.id}`} size={120} />
          </div>
          <p className="text-xs italic text-muted-foreground">Your fast delivery service</p>
        </div>
      </Card>
    </div>
  );
}
