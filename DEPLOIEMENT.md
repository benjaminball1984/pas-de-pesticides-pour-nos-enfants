# Déploiement — Pas de pesticides pour nos enfants

Site **Astro** (statique + quelques routes serveur `/api/*`), signatures stockées dans **Supabase** (Europe), déployé sur **Cloudflare** (Workers) connecté à **GitHub**.

Tant qu'aucune clé Supabase n'est configurée, le site tourne en **mode mock** (les signatures restent en mémoire) : pratique en local, mais rien n'est conservé.

---

## 1. Supabase (à faire en premier) — projet dédié BCA

1. Sur https://supabase.com → **New project**.
   - Organisation : la tienne. Nom : `pas-de-pesticides` (par ex.).
   - **Region : Frankfurt (eu-central-1)** ← important (RGPD, données en Europe).
   - Note le mot de passe de la base (pas nécessaire pour le site).
2. **Créer la table** : menu **SQL Editor** → coller le contenu de
   [`supabase/migrations/20260617120000_signatures.sql`](supabase/migrations/20260617120000_signatures.sql) → **Run**.
   (Crée la table `signature`, l'anti-doublon par email, la sécurité RLS et la fonction de comptage des communes.)
3. **Récupérer les clés** : menu **Settings → API** :
   - `Project URL`  → ce sera `SUPABASE_URL`
   - `service_role` (section *Project API keys*, cliquer *Reveal*) → ce sera `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ La clé `service_role` est **secrète** : jamais dans le navigateur, jamais commitée.

### Tester en local avec la vraie base (facultatif)
Créer un fichier `.env.local` à la racine (déjà ignoré par git) à partir de `.env.example` :
```
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```
Puis `npm run dev` → signer sur le site écrit une vraie ligne dans Supabase.

---

## 2. Cloudflare — déploiement connecté à GitHub

> À faire **après** que le site complet est poussé sur GitHub. On le fera ensemble ; voici les réglages.

1. Tableau de bord Cloudflare → **Workers & Pages** → **Create** → **Connect to Git** (Workers Builds) → choisir le dépôt `pas-de-pesticides-pour-nos-enfants`, branche `main`.
2. Réglages de build :
   - **Build command** : `npm run build`
   - **Deploy / output** : géré par l'adaptateur Astro (`wrangler deploy`, dossier `dist`).
3. **Variables et secrets** (Settings → Variables and Secrets) — ajouter en **Secret** :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Déployer. Chaque `git push` sur `main` redéploiera automatiquement.
5. **Domaine** : brancher `pasdepesticidespournosenfants.fr` (ou le sous-domaine retenu) dans l'onglet *Custom domains*.

### Variante ligne de commande (si besoin)
`npx wrangler login` puis `npm run build && npx wrangler deploy`, et secrets via
`npx wrangler secret put SUPABASE_URL` / `... SUPABASE_SERVICE_ROLE_KEY`.

---

## Récapitulatif des variables

| Variable | Où | Rôle |
|---|---|---|
| `SUPABASE_URL` | `.env.local` (local) + secret Cloudflare (prod) | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | idem | Clé secrète serveur (insertion + comptage) |
