-- 0002: schema conținutului site-ului public (șablon editabil)
-- Rulează o singură dată în Supabase > SQL Editor.

create table if not exists public.setari_site (
  cheie text primary key,
  valoare jsonb not null,
  actualizat_la timestamptz not null default now()
);

create table if not exists public.pagini (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,            -- 'acasa' = pagina de start
  titlu text not null,
  seo jsonb not null default '{}'::jsonb, -- {titlu, descriere}
  creat_la timestamptz not null default now(),
  actualizat_la timestamptz not null default now()
);

create table if not exists public.blocuri_pagina (
  id uuid primary key default gen_random_uuid(),
  pagina_id uuid not null references public.pagini(id) on delete cascade,
  pozitie int not null,
  tip text not null,                    -- tipul de secțiune (hero, cifre, carduri...)
  date jsonb not null default '{}'::jsonb,
  vizibil boolean not null default true,
  unique (pagina_id, pozitie)
);

create table if not exists public.articole (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titlu text not null,
  data_publicare date not null,
  rezumat text,
  imagine_url text,
  continut text
);

create table if not exists public.evenimente_publice (
  id uuid primary key default gen_random_uuid(),
  titlu text not null,
  data_start timestamptz not null,
  oras text,
  tip text,
  stare_inscrieri text not null default 'informare'  -- deschise | curand | informare
);

-- Securitate: oricine poate CITI conținutul public; nimeni nu poate scrie din site.
alter table public.setari_site enable row level security;
alter table public.pagini enable row level security;
alter table public.blocuri_pagina enable row level security;
alter table public.articole enable row level security;
alter table public.evenimente_publice enable row level security;

drop policy if exists "citire publica" on public.setari_site;
drop policy if exists "citire publica" on public.pagini;
drop policy if exists "citire publica" on public.blocuri_pagina;
drop policy if exists "citire publica" on public.articole;
drop policy if exists "citire publica" on public.evenimente_publice;

create policy "citire publica" on public.setari_site for select to anon, authenticated using (true);
create policy "citire publica" on public.pagini for select to anon, authenticated using (true);
create policy "citire publica" on public.blocuri_pagina for select to anon, authenticated using (vizibil);
create policy "citire publica" on public.articole for select to anon, authenticated using (true);
create policy "citire publica" on public.evenimente_publice for select to anon, authenticated using (true);

grant select on public.setari_site, public.pagini, public.blocuri_pagina,
  public.articole, public.evenimente_publice to anon, authenticated;
grant all on public.setari_site, public.pagini, public.blocuri_pagina,
  public.articole, public.evenimente_publice to service_role;
