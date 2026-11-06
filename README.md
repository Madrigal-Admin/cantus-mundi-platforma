# Cantus Mundi – platformă și site public

Stack: React + Vite, Supabase (bază de date, autentificare, stocare), Netlify (publicare).

## Structură
- `src/` – codul aplicației
- `supabase/migrations/` – scripturile SQL, în ordine (0001, 0002, ...). Se rulează în Supabase > SQL Editor.
- `netlify.toml` – setările de publicare
- `.env.example` – numele variabilelor de mediu necesare (valorile se pun în Netlify, nu în cod)

## Reguli de proiect
Regulile complete (la fiecare modificare, la baza de date, secrete, mentenanță) sunt în `docs/IGIENA-TEHNICA.md`. Pe scurt:
- `npm run lint` și `npm run build` trec înainte de fiecare livrare.
- Cod nefolosit se șterge; redirecturile se țin doar pentru adrese folosite public.
- Orice tabel nou: RLS + grant-uri explicite în aceeași migrare, iar drepturile se impun în baza de date.
- Nicio adresă de site în cod (`SITE_URL`) și nicio cheie secretă în GitHub.

## Ce conține
- Site public: pagini și secțiuni din Supabase (migrările 0002, 0003). Secțiunile sunt în `src/blocks/index.jsx`, înregistrate în `REGISTRY`.
- Conturi, roluri, regiuni, județe (migrarea 0004). Rolurile: Admin General, Reprezentant Zonal, Dirijor, Corist.
- Platforma la `/platforma`: un cadru comun, cu meniu pe roluri în `src/platforma/menu.js`. Secțiunile marcate `soon: true` sunt încă neconstruite.
- Culorile site-ului se schimbă din `setari_site` (cheia `design`).
- `0001_app_info.sql` rămâne doar ca istoric (tabel de verificare a legăturii inițiale).

## Comenzi
- `npm install` – instalează dependențele
- `npm run dev` – rulează local
- `npm run lint` – verifică codul
- `npm run build` – construiește pentru publicare
