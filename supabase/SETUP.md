# Configuration Supabase — ServiceXpress Flow

Projet : **hojhdavvqmejfkydousk**

## 1. Ancien projet

Supprime l’ancien projet manuellement dans [Supabase Dashboard](https://supabase.com/dashboard) si tu n’en as plus besoin (l’agent ne peut pas le faire à ta place).

## 2. Schéma SQL

1. Ouvre ton projet **hojhdavvqmejfkydousk**
2. **SQL Editor** → New query
3. Colle tout le fichier `supabase/full-schema.sql`
4. **Run**

## 3. Variables d’environnement

Dans `.env` (déjà mis à jour pour l’URL et la clé anon) :

| Variable | Où la trouver |
|----------|----------------|
| `SUPABASE_URL` | Déjà configuré |
| `SUPABASE_PUBLISHABLE_KEY` | API → anon / publishable |
| `VITE_SUPABASE_*` | Mêmes valeurs côté client |
| **`SUPABASE_SERVICE_ROLE_KEY`** | API → **service_role** (secret, ne jamais committer) |

Sans `SUPABASE_SERVICE_ROLE_KEY`, la création de livreurs par l’admin échouera.

## 4. Créer le compte admin

### Option A — SQL Editor (recommandé si « Invalid login credentials »)

1. Ouvre **SQL Editor** → New query  
2. Colle tout le fichier **`supabase/create-admin.sql`**  
3. **Run**  
4. Vérifie qu’une ligne apparaît avec `role = admin` en bas

Connexion app :

- **Badge :** `ADM-001`  
- **Mot de passe :** `Admin2026!`

### Option B — Script Node (si `SUPABASE_SERVICE_ROLE_KEY` est dans `.env`)

```bash
npm run create-admin
```

Connexion : http://localhost:8080/login avec le **badge** (ex. `ADM-001`) et le mot de passe.

## 5. Livreurs

Les livreurs sont créés uniquement par l’admin dans **Livreurs → Nouveau livreur** (pas d’inscription publique).

## 6. Redémarrer l’app (local)

```powershell
npm.cmd run dev:clean
```

## 7. Déploiement Vercel

Le build utilise **Nitro** (preset `vercel`), pas Cloudflare Workers.

1. Importer le repo sur [Vercel](https://vercel.com)
2. **Build Command** : `npm run build`
3. **Variables d'environnement** (Production + Preview) :

| Variable | Valeur |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://hojhdavvqmejfkydousk.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | clé anon Supabase |
| `VITE_SUPABASE_PROJECT_ID` | `hojhdavvqmejfkydousk` |
| `SUPABASE_URL` | même URL |
| `SUPABASE_PUBLISHABLE_KEY` | même clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service_role (secret) |

> Important : les variables `VITE_*` sont nécessaires côté client pour que la page de login et l’authentification fonctionnent. Les variables `SUPABASE_*` sont utilisées côté serveur par les fonctions et l’admin Supabase.

4. Redéployer après chaque changement de variables.

Ne pas committer `.env` — utiliser le dashboard Vercel pour les secrets.
