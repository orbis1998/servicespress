
-- Add address to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adresse text;

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Stock: only admin can insert/delete; drivers keep view, admin keeps update
DROP POLICY IF EXISTS "insert stock" ON public.stock;
DROP POLICY IF EXISTS "delete stock" ON public.stock;
DROP POLICY IF EXISTS "update stock" ON public.stock;

CREATE POLICY "admin insert stock" ON public.stock
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admin delete stock" ON public.stock
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admin update stock" ON public.stock
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Ensure trigger creating role on new auth user exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
