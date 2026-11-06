# Cantus Mundi – platformă și site public

Stack: React + Vite, Supabase (bază de date, autentificare, stocare), Netlify (publicare).

## Structură
- `src/` – codul aplicației
- `supabase/migrations/` – scripturile SQL, în ordine (0001, 0002, ...). Se rulează în Supabase > SQL Editor.
- `netlify.toml` – setările de publicare
- `.env.example` – numele variabilelor de mediu necesare (valorile se pun în Netlify, nu în cod)

## Reguli de proiect
- Nicio adresă de site nu se scrie în cod; se folosește `SITE_URL` din `src/lib/config.js`.
  Astfel mutarea pe domeniul propriu nu cere modificări de cod.
- Orice tabel nou: RLS + grant-uri explicite în aceeași migrare (vezi `0001_app_info.sql`).
- Cheile secrete (service_role, Brevo) nu se pun niciodată în cod sau în GitHub.
