-- Migrarea 0001: tabel mic de verificare a legăturii aplicație <-> Supabase.
-- Urmează convenția: RLS + grant-uri explicite în aceeași migrare.

create table if not exists public.app_info (
  cheie text primary key,
  valoare text not null
);

alter table public.app_info enable row level security;

-- Pagina de verificare citește tabelul fără autentificare (conține doar un mesaj public).
drop policy if exists "app_info citire publica" on public.app_info;
create policy "app_info citire publica"
  on public.app_info for select
  to anon, authenticated
  using (true);

grant select on public.app_info to anon, authenticated;
grant select, insert, update, delete on public.app_info to service_role;

insert into public.app_info (cheie, valoare)
values ('mesaj_verificare', 'Conexiunea cu Supabase funcționează.')
on conflict (cheie) do nothing;
