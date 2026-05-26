-- =============================================================================
-- Créer / réinitialiser l'admin directement dans Supabase (SQL Editor)
-- Prérequis : avoir exécuté full-schema.sql avant
-- =============================================================================
-- Connexion app : badge ADM-001  |  mot de passe Admin2026!
-- (email interne auth : adm-001@servicexpress.local)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email       text := 'adm-001@servicexpress.local';
  v_password    text := 'Admin2026!';
  v_badge       text := 'ADM-001';
  v_full_name   text := 'Administrateur';
  v_user_id     uuid := gen_random_uuid();
  v_instance_id uuid;
BEGIN
  -- instance_id du projet (fallback standard Supabase cloud)
  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) INTO v_instance_id;

  -- Supprime l'ancien compte (cascade : profiles, user_roles, identities…)
  DELETE FROM auth.users WHERE lower(email) = lower(v_email);

  -- Utilisateur Auth (email confirmé, mot de passe hashé)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_instance_id,
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')), -- si erreur : extensions.crypt(v_password, extensions.gen_salt('bf'))
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', v_full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Identité email (obligatoire pour signInWithPassword)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  );

  -- Profil + rôle admin (on écrase le rôle éventuel du trigger)
  INSERT INTO public.profiles (id, badge_number, full_name, phone, status)
  VALUES (v_user_id, v_badge, v_full_name, null, 'active')
  ON CONFLICT (id) DO UPDATE SET
    badge_number = EXCLUDED.badge_number,
    full_name    = EXCLUDED.full_name,
    status       = 'active';

  DELETE FROM public.user_roles WHERE user_id = v_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin');

  RAISE NOTICE 'OK — Badge: % | Mot de passe: % | Email auth: %', v_badge, v_password, v_email;
END $$;

-- Vérification
SELECT u.id, u.email, u.email_confirmed_at, p.badge_number, p.full_name, r.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email = 'adm-001@servicexpress.local';
