-- Signer au nom d'une organisation, sur le modèle de l'appel du 26 septembre (02/11/2026).
-- Une signature d'organisation garde les coordonnées de la personne qui l'engage (prénom, nom, email,
-- code postal) et ajoute le nom de la structure et, si elle le donne, sa fonction.

alter table public.signature
  add column if not exists type_signataire text not null default 'individu'
    check (type_signataire in ('individu', 'organisation')),
  add column if not exists organisation text
    check (organisation is null or char_length(organisation) between 1 and 160),
  add column if not exists fonction text
    check (fonction is null or char_length(fonction) <= 120);

-- Une organisation sans nom n'a pas de sens.
alter table public.signature drop constraint if exists signature_organisation_nommee;
alter table public.signature add constraint signature_organisation_nommee
  check (type_signataire = 'individu' or organisation is not null);

-- Une même personne peut signer en son nom ET au nom de chacune de ses organisations :
-- l'unicité porte désormais sur le couple (email, organisation).
drop index if exists public.signature_email_unique;
create unique index if not exists signature_email_orga_unique
  on public.signature (lower(email), lower(coalesce(organisation, '')));

-- Nombre d'organisations signataires, sans exposer de données personnelles.
create or replace function public.compter_organisations()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(distinct lower(organisation)) from public.signature where type_signataire = 'organisation';
$$;
revoke all on function public.compter_organisations() from public, anon, authenticated;
grant execute on function public.compter_organisations() to service_role;
