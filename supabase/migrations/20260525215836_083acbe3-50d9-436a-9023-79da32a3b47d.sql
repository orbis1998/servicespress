
-- Roles enum & user_roles table (security)
CREATE TYPE public.app_role AS ENUM ('admin','livreur');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  date_integration DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livreur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client TEXT NOT NULL,
  adresse TEXT,
  produit TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix NUMERIC(12,2) NOT NULL DEFAULT 0,
  frais_livraison NUMERIC(12,2) NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'USD' CHECK (devise IN ('USD','CDF')),
  mode_paiement TEXT,
  statut TEXT NOT NULL DEFAULT 'reussie',
  observation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deliveries_livreur ON public.deliveries(livreur_id, created_at DESC);

CREATE TABLE public.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livreur_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  produit TEXT NOT NULL,
  taille TEXT,
  couleur TEXT,
  quantite INTEGER NOT NULL DEFAULT 0,
  commentaire TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payrolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livreur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  total_genere_usd NUMERIC(12,2) DEFAULT 0,
  total_genere_cdf NUMERIC(12,2) DEFAULT 0,
  commission_usd NUMERIC(12,2) DEFAULT 0,
  commission_cdf NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin insert profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR auth.uid() = id);
CREATE POLICY "admin delete profile" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- deliveries
CREATE POLICY "livreur view own deliveries" ON public.deliveries FOR SELECT TO authenticated
  USING (livreur_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "livreur insert own deliveries" ON public.deliveries FOR INSERT TO authenticated
  WITH CHECK (livreur_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "livreur update own deliveries" ON public.deliveries FOR UPDATE TO authenticated
  USING (livreur_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete deliveries" ON public.deliveries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- stock
CREATE POLICY "view stock" ON public.stock FOR SELECT TO authenticated
  USING (livreur_id = auth.uid() OR livreur_id IS NULL OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "insert stock" ON public.stock FOR INSERT TO authenticated
  WITH CHECK (livreur_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "update stock" ON public.stock FOR UPDATE TO authenticated
  USING (livreur_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "delete stock" ON public.stock FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- payrolls
CREATE POLICY "view own payroll" ON public.payrolls FOR SELECT TO authenticated
  USING (livreur_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage payroll" ON public.payrolls FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
