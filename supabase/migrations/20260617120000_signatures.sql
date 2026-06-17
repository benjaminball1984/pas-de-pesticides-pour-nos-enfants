-- Table des signatures de la pétition « Pas de pesticides pour nos enfants »
-- Responsable de traitement : Bio Consom'acteurs. Hébergement : Supabase (Europe / Frankfurt).
-- Principe RGPD : données minimales, aucun traçage, aucune IP stockée.

create table if not exists public.signature (
  id            uuid primary key default gen_random_uuid(),
  prenom        text not null check (char_length(prenom) between 1 and 80),
  nom           text not null check (char_length(nom) between 1 and 80),
  email         text not null check (char_length(email) between 3 and 160),
  code_postal   text not null check (code_postal ~ '^[0-9]{5}$'),
  telephone     text          check (telephone is null or char_length(telephone) <= 30),
  info_campagne boolean not null default true,   -- soutien à la campagne (intérêt légitime)
  newsletter    boolean not null default false,  -- lettre d'information BCA (consentement explicite)
  source        text not null default 'site',
  created_at    timestamptz not null default now()
);

-- Un email = une signature (anti-doublon). L'insertion en double renvoie l'erreur 23505,
-- traitée applicativement comme « vous aviez déjà signé ».
create unique index if not exists signature_email_unique on public.signature (lower(email));
create index if not exists signature_code_postal_idx on public.signature (code_postal);
create index if not exists signature_created_at_idx on public.signature (created_at);

-- Sécurité : RLS activée SANS aucune policy publique.
-- => Aucun accès en lecture/écriture depuis le client (anon). La PII est protégée.
--    Le serveur écrit et compte via la clé service_role, qui contourne la RLS.
alter table public.signature enable row level security;
-- Défense en profondeur : retirer aussi les droits de table (au-delà de la RLS) aux rôles publics.
revoke all on table public.signature from anon, authenticated;

-- Nombre de communes mobilisées = codes postaux distincts, SANS exposer de PII.
create or replace function public.compter_communes()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(distinct code_postal) from public.signature;
$$;

revoke all on function public.compter_communes() from public, anon, authenticated;
grant execute on function public.compter_communes() to service_role;

-- Demandes diverses (commande de matériel, déclaration de distribution) — capture générique.
create table if not exists public.demande (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('commande','distribution','autre')),
  email      text,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists demande_type_idx on public.demande (type);
create index if not exists demande_created_at_idx on public.demande (created_at);
alter table public.demande enable row level security;
revoke all on table public.demande from anon, authenticated;
