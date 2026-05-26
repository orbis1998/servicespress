import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/livreur/badge")({ component: Badge });

type Profile = { id: string; badge_number: string; full_name: string; phone: string | null; photo_url: string | null };

function Badge() {
  const [p, setP] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("id,badge_number,full_name,phone,photo_url").eq("id", user.id).maybeSingle();
      setP(data as Profile | null);
    })();
  }, []);

  if (!p) return <div>Chargement…</div>;

  // Extract number from badge (e.g. ADM-001 -> 01, B-N02 -> 02)
  const numMatch = p.badge_number.match(/(\d+)\s*$/);
  const num = numMatch ? numMatch[1].padStart(2, "0") : p.badge_number.slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Mon badge</h1>
        <Button onClick={() => window.print()} className="bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90">
          <Printer className="size-4" /> Imprimer
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 justify-items-center">
        {/* RECTO */}
        <div className="w-[280px] h-[440px] rounded-3xl bg-white shadow-2xl overflow-hidden relative border">
          <div className="absolute inset-x-0 top-0 h-28 bg-black rounded-b-[60%]" />
          <div className="relative pt-10 flex flex-col items-center px-6 h-full">
            <div className="text-xl font-semibold text-center mt-4">Livreur N°</div>
            <div className="mt-3 size-28 rounded-2xl bg-[var(--brand-yellow)] grid place-items-center shadow-lg rotate-3">
              <span className="text-5xl font-black text-black">{num}</span>
            </div>
            <div className="mt-auto mb-4 flex flex-col items-center gap-2">
              <Logo className="h-12" />
              <div className="text-[10px] font-semibold tracking-wide flex items-center gap-1">
                <span>JM Enterprise</span>
                <span className="text-[var(--brand-yellow)]">»</span>
                <span className="font-black">JM</span>
              </div>
              <div className="text-[8px] italic text-muted-foreground">the Business world</div>
            </div>
          </div>
        </div>

        {/* VERSO */}
        <div className="w-[280px] h-[440px] rounded-3xl bg-black shadow-2xl overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-44 bg-[var(--brand-yellow)] rounded-b-[60%]" />
          <div className="relative h-full flex flex-col items-center px-5 pt-6">
            <div className="size-28 rounded-full bg-white overflow-hidden grid place-items-center border-4 border-white shadow-xl">
              {p.photo_url
                ? <img src={p.photo_url} alt={p.full_name} className="size-full object-cover" />
                : <span className="text-4xl font-bold text-black">{p.full_name.charAt(0)}</span>}
            </div>
            <div className="mt-3 bg-white rounded-md px-2 py-1">
              <Logo className="h-6" />
            </div>
            <div className="mt-4 text-white text-lg font-bold text-center leading-tight">{p.full_name}</div>
            <div className="mt-1 inline-flex items-center gap-2 text-white text-xs">
              <span className="h-[2px] w-3 bg-[var(--brand-yellow)]" />
              Livreur
              <span className="h-[2px] w-3 bg-[var(--brand-yellow)]" />
            </div>
            <div className="mt-auto mb-3 flex items-end justify-between w-full gap-2">
              <div className="text-[8px] text-white/80">
                <div className="font-semibold">JM Enterprise »JM</div>
                <div className="italic">the Business world</div>
              </div>
              <div className="bg-white p-1 rounded">
                <QRCodeSVG value={`SERVICEXPRESS:${p.badge_number}:${p.id}`} size={70} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
