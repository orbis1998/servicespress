import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera } from "lucide-react";

export const Route = createFileRoute("/livreur/profil")({ component: Profil });

type Profile = { id: string; badge_number: string; full_name: string; phone: string | null; adresse: string | null; photo_url: string | null };

function Profil() {
  const [p, setP] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setP(data as Profile | null);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) return;
    const { error } = await supabase.from("profiles").update({
      full_name: p.full_name, phone: p.phone, adresse: p.adresse,
    }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Profil enregistré");
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!p || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${p.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ photo_url: url }).eq("id", p.id);
    setP({ ...p, photo_url: url });
    setUploading(false);
    toast.success("Photo mise à jour");
  };

  if (!p) return <div>Chargement…</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Mon profil</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Photo</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="size-24 rounded-full bg-accent overflow-hidden grid place-items-center text-3xl font-bold border-2 border-black">
            {p.photo_url ? <img src={p.photo_url} alt={p.full_name} className="size-full object-cover" /> : p.full_name.charAt(0)}
          </div>
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-[var(--brand-yellow)] text-black px-4 py-2 text-sm font-semibold">
            <Camera className="size-4" />
            {uploading ? "Envoi…" : "Changer la photo"}
            <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3">
            <div>
              <Label>Numéro de badge</Label>
              <Input value={p.badge_number} disabled />
            </div>
            <div>
              <Label>Nom complet</Label>
              <Input value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} required />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={p.phone ?? ""} onChange={(e) => setP({ ...p, phone: e.target.value })} />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input value={p.adresse ?? ""} onChange={(e) => setP({ ...p, adresse: e.target.value })} placeholder="Kinshasa, commune…" />
            </div>
            <Button type="submit" className="bg-black text-white hover:bg-black/90">Enregistrer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
