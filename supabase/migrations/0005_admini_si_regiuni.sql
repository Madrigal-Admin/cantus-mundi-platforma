-- 0005: gestionarea adminilor și a regiunilor prin funcții controlate
-- Rulează o singură dată în Supabase > SQL Editor (după 0001–0004).
-- Curățenie: scrierile directe pe regiuni/județe/reprezentanți se desființează;
-- de acum totul trece prin funcțiile de mai jos, care verifică dreptul de Admin General.

-- ============ Funcții pentru admini ============
create or replace function public.numeste_admin(p_email text, p_rol text) returns void
language plpgsql security definer set search_path = public as
$$
declare v_id uuid;
begin
  if not public.este_admin() then raise exception 'Doar Admin General poate numi admini'; end if;
  if p_rol not in ('admin_general','reprezentant_zonal') then raise exception 'Tip de admin invalid'; end if;
  select id into v_id from public.profile where lower(email) = lower(trim(p_email));
  if not found then
    raise exception 'Nu există un cont cu această adresă. Persoana trebuie mai întâi să-și creeze cont pe site.';
  end if;
  if v_id = auth.uid() and p_rol <> 'admin_general' then
    raise exception 'Nu îți poți retrage singur rolul de Admin General';
  end if;
  update public.profile set rol = p_rol, status = 'aprobat' where id = v_id;
  if p_rol = 'admin_general' then
    delete from public.reprezentanti_regiuni where profil_id = v_id;  -- Admin General vede tot, nu are regiuni
  end if;
end;
$$;

create or replace function public.retrage_admin(p_profil uuid) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not public.este_admin() then raise exception 'Doar Admin General poate retrage drepturi'; end if;
  if p_profil = auth.uid() then raise exception 'Nu îți poți retrage singur drepturile'; end if;
  update public.profile set rol = 'dirijor', status = 'inactiv'
    where id = p_profil and rol in ('admin_general','reprezentant_zonal');
  delete from public.reprezentanti_regiuni where profil_id = p_profil;
end;
$$;

create or replace function public.seteaza_regiuni_admin(p_profil uuid, p_regiuni uuid[]) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not public.este_admin() then raise exception 'Doar Admin General poate atribui regiuni'; end if;
  if not exists (select 1 from public.profile where id = p_profil and rol = 'reprezentant_zonal' and status = 'aprobat') then
    raise exception 'Regiunile se atribuie doar Reprezentanților Zonali aprobați';
  end if;
  delete from public.reprezentanti_regiuni where profil_id = p_profil and regiune_id <> all(coalesce(p_regiuni, '{}'));
  insert into public.reprezentanti_regiuni (profil_id, regiune_id)
    select p_profil, r.id from public.regiuni r where r.id = any(coalesce(p_regiuni, '{}'))
    on conflict do nothing;
end;
$$;

-- ============ Funcții pentru regiuni ============
-- Creează (p_id null) sau modifică o regiune, cu județele și reprezentanții ei, dintr-o singură mișcare.
create or replace function public.salveaza_regiune(p_id uuid, p_nume text, p_judete int[], p_reprezentanti uuid[]) returns uuid
language plpgsql security definer set search_path = public as
$$
declare v_id uuid := p_id;
begin
  if not public.este_admin() then raise exception 'Doar Admin General poate gestiona regiunile'; end if;
  if coalesce(trim(p_nume), '') = '' then raise exception 'Numele regiunii este obligatoriu'; end if;

  if v_id is null then
    insert into public.regiuni (nume) values (trim(p_nume)) returning id into v_id;
  else
    update public.regiuni set nume = trim(p_nume) where id = v_id;
    if not found then raise exception 'Regiune inexistentă'; end if;
  end if;

  -- județe: cele debifate rămân fără regiune; cele bifate se mută în această regiune
  update public.judete set regiune_id = null
    where regiune_id = v_id and id <> all(coalesce(p_judete, '{}'));
  update public.judete set regiune_id = v_id
    where id = any(coalesce(p_judete, '{}'));

  -- reprezentanți: doar Reprezentanți Zonali aprobați
  delete from public.reprezentanti_regiuni
    where regiune_id = v_id and profil_id <> all(coalesce(p_reprezentanti, '{}'));
  insert into public.reprezentanti_regiuni (profil_id, regiune_id)
    select pr.id, v_id from public.profile pr
    where pr.id = any(coalesce(p_reprezentanti, '{}')) and pr.rol = 'reprezentant_zonal' and pr.status = 'aprobat'
    on conflict do nothing;

  return v_id;
end;
$$;

create or replace function public.sterge_regiune(p_id uuid) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not public.este_admin() then raise exception 'Doar Admin General poate șterge regiuni'; end if;
  delete from public.regiuni where id = p_id;  -- județele rămân fără regiune, legăturile cu reprezentanții se șterg
end;
$$;

-- ============ Curățenie: ce nu se mai folosește ============
drop function if exists public.seteaza_rol(uuid, text);

drop policy if exists "scriere admin" on public.regiuni;
drop policy if exists "scriere admin" on public.judete;
drop policy if exists "scriere admin" on public.reprezentanti_regiuni;
revoke insert, update, delete on public.regiuni from authenticated;
revoke update on public.judete from authenticated;
revoke insert, delete on public.reprezentanti_regiuni from authenticated;

-- ============ Drepturi pe funcții noi ============
revoke all on function public.numeste_admin(text, text), public.retrage_admin(uuid),
  public.seteaza_regiuni_admin(uuid, uuid[]), public.salveaza_regiune(uuid, text, int[], uuid[]),
  public.sterge_regiune(uuid) from public, anon;
grant execute on function public.numeste_admin(text, text), public.retrage_admin(uuid),
  public.seteaza_regiuni_admin(uuid, uuid[]), public.salveaza_regiune(uuid, text, int[], uuid[]),
  public.sterge_regiune(uuid) to authenticated;
