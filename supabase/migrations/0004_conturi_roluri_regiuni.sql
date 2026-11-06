-- 0004: conturi, roluri, regiuni, județe
-- Rulează o singură dată în Supabase > SQL Editor (după 0001–0003).

-- ============ Tabele ============
create table if not exists public.regiuni (
  id uuid primary key default gen_random_uuid(),
  nume text not null unique,
  creat_la timestamptz not null default now()
);

create table if not exists public.judete (
  id serial primary key,
  nume text not null unique,
  regiune_id uuid references public.regiuni(id) on delete set null  -- un județ poate fi și fără regiune
);

create table if not exists public.profile (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nume text not null default '',
  telefon text,
  rol text not null default 'dirijor' check (rol in ('admin_general','reprezentant_zonal','dirijor','corist')),
  status text not null default 'in_asteptare' check (status in ('in_asteptare','aprobat','respins','inactiv')),
  judet_id int references public.judete(id),
  localitate text,
  institutie text,
  creat_la timestamptz not null default now()
);

create table if not exists public.reprezentanti_regiuni (
  profil_id uuid not null references public.profile(id) on delete cascade,
  regiune_id uuid not null references public.regiuni(id) on delete cascade,
  primary key (profil_id, regiune_id)
);

-- ============ Funcții ajutătoare (security definer = evită bucle în reguli) ============
create or replace function public.rol_curent() returns text
language sql stable security definer set search_path = public as
$$ select rol from public.profile where id = auth.uid() and status = 'aprobat' $$;

create or replace function public.este_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(public.rol_curent() = 'admin_general', false) $$;

-- Poate gestiona un anumit județ: admin general sau reprezentantul regiunii județului
create or replace function public.gestioneaza_judet(p_judet int) returns boolean
language sql stable security definer set search_path = public as
$$
  select public.este_admin() or exists (
    select 1 from public.judete j
    join public.reprezentanti_regiuni rr on rr.regiune_id = j.regiune_id
    where j.id = p_judet and rr.profil_id = auth.uid()
      and public.rol_curent() = 'reprezentant_zonal'
  )
$$;

-- ============ Profil creat automat la înregistrare ============
create or replace function public.profil_nou() returns trigger
language plpgsql security definer set search_path = public as
$$
declare v_judet int;
begin
  begin
    v_judet := nullif(new.raw_user_meta_data->>'judet_id','')::int;
  exception when others then
    v_judet := null;
  end;
  -- Rolul NU se ia din formular: oricine se înregistrează devine dirijor în așteptare.
  insert into public.profile (id, email, nume, telefon, judet_id, localitate, institutie)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'nume',''),
          nullif(new.raw_user_meta_data->>'telefon',''),
          v_judet,
          nullif(new.raw_user_meta_data->>'localitate',''),
          nullif(new.raw_user_meta_data->>'institutie',''));
  return new;
end;
$$;

drop trigger if exists la_utilizator_nou on auth.users;
create trigger la_utilizator_nou after insert on auth.users
  for each row execute function public.profil_nou();

-- ============ Acțiuni controlate (apelate din aplicație) ============
create or replace function public.seteaza_status(p_profil uuid, p_status text) returns void
language plpgsql security definer set search_path = public as
$$
declare v_judet int; v_rol text;
begin
  if p_status not in ('aprobat','respins','inactiv','in_asteptare') then raise exception 'Status invalid'; end if;
  select judet_id, rol into v_judet, v_rol from public.profile where id = p_profil;
  if not found then raise exception 'Utilizator inexistent'; end if;
  if not (public.este_admin() or (v_rol = 'dirijor' and public.gestioneaza_judet(v_judet))) then
    raise exception 'Nu ai dreptul să faci această modificare';
  end if;
  update public.profile set status = p_status where id = p_profil;
end;
$$;

create or replace function public.seteaza_rol(p_profil uuid, p_rol text) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not public.este_admin() then raise exception 'Doar Admin General poate schimba rolurile'; end if;
  if p_rol not in ('admin_general','reprezentant_zonal','dirijor','corist') then raise exception 'Rol invalid'; end if;
  if p_profil = auth.uid() and p_rol <> 'admin_general' then raise exception 'Nu îți poți retrage singur rolul de Admin General'; end if;
  update public.profile set rol = p_rol where id = p_profil;
end;
$$;

-- ============ Securitate (RLS) ============
alter table public.regiuni enable row level security;
alter table public.judete enable row level security;
alter table public.profile enable row level security;
alter table public.reprezentanti_regiuni enable row level security;

drop policy if exists "citire" on public.regiuni;
drop policy if exists "scriere admin" on public.regiuni;
drop policy if exists "citire" on public.judete;
drop policy if exists "scriere admin" on public.judete;
drop policy if exists "citire proprie sau permisa" on public.profile;
drop policy if exists "actualizare proprie" on public.profile;
drop policy if exists "citire" on public.reprezentanti_regiuni;
drop policy if exists "scriere admin" on public.reprezentanti_regiuni;

-- Regiunile și județele sunt vizibile tuturor (formularul de înregistrare are nevoie de ele)
create policy "citire" on public.regiuni for select to anon, authenticated using (true);
create policy "scriere admin" on public.regiuni for all to authenticated using (public.este_admin()) with check (public.este_admin());
create policy "citire" on public.judete for select to anon, authenticated using (true);
create policy "scriere admin" on public.judete for update to authenticated using (public.este_admin()) with check (public.este_admin());

-- Profil: îl vezi pe al tău; Admin General vede tot; reprezentantul vede dirijorii din regiunile lui
create policy "citire proprie sau permisa" on public.profile for select to authenticated
  using (id = auth.uid() or public.este_admin() or (rol = 'dirijor' and public.gestioneaza_judet(judet_id)));
create policy "actualizare proprie" on public.profile for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "citire" on public.reprezentanti_regiuni for select to authenticated
  using (profil_id = auth.uid() or public.este_admin());
create policy "scriere admin" on public.reprezentanti_regiuni for all to authenticated
  using (public.este_admin()) with check (public.este_admin());

-- ============ Drepturi explicite ============
revoke all on public.regiuni, public.judete, public.profile, public.reprezentanti_regiuni from anon, authenticated;
grant select on public.regiuni, public.judete to anon, authenticated;
grant insert, update, delete on public.regiuni to authenticated;
grant update (regiune_id) on public.judete to authenticated;
grant select on public.profile to authenticated;
grant update (nume, telefon, localitate, institutie) on public.profile to authenticated;  -- doar câmpurile personale
grant select, insert, delete on public.reprezentanti_regiuni to authenticated;
grant all on public.regiuni, public.judete, public.profile, public.reprezentanti_regiuni to service_role;

revoke all on function public.seteaza_status(uuid, text), public.seteaza_rol(uuid, text) from public, anon;
grant execute on function public.seteaza_status(uuid, text), public.seteaza_rol(uuid, text) to authenticated;
grant execute on function public.rol_curent(), public.este_admin(), public.gestioneaza_judet(int) to authenticated;

-- ============ Date inițiale ============
insert into public.regiuni (nume) values ('București'), ('Internațional') on conflict (nume) do nothing;

insert into public.judete (nume) values
 ('Alba'),('Arad'),('Argeș'),('Bacău'),('Bihor'),('Bistrița-Năsăud'),('Botoșani'),('Brașov'),('Brăila'),
 ('București'),('Buzău'),('Caraș-Severin'),('Călărași'),('Cluj'),('Constanța'),('Covasna'),('Dâmbovița'),
 ('Dolj'),('Galați'),('Giurgiu'),('Gorj'),('Harghita'),('Hunedoara'),('Ialomița'),('Iași'),('Ilfov'),
 ('Maramureș'),('Mehedinți'),('Mureș'),('Neamț'),('Olt'),('Prahova'),('Satu Mare'),('Sălaj'),('Sibiu'),
 ('Suceava'),('Teleorman'),('Timiș'),('Tulcea'),('Vaslui'),('Vâlcea'),('Vrancea'),('Internațional (în afara țării)')
on conflict (nume) do nothing;

update public.judete set regiune_id = (select id from public.regiuni where nume = 'București') where nume = 'București' and regiune_id is null;
update public.judete set regiune_id = (select id from public.regiuni where nume = 'Internațional') where nume like 'Internațional%' and regiune_id is null;
