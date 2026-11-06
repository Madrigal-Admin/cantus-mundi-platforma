# Igiena tehnică a platformei Cantus Mundi

Regulile de mai jos se aplică la FIECARE modificare sau funcție nouă. Verificările periodice (backup, conturi, costuri) sunt în nota „Igiena tehnică pentru Hub” din proiectul Claude și se aplică și aici.

## 1. La orice modificare (înainte de livrare)
1. `npm run lint` fără erori (prinde importuri și variabile nefolosite).
2. `npm run build` reușește.
3. Cod mort șters pe loc: pagini, componente, funcții, rute care nu mai sunt folosite. Nu se păstrează „pentru orice eventualitate”; istoricul rămâne în GitHub.
4. Redirecturile se țin doar pentru adrese deja folosite public (indexate, trimise în e-mailuri, salvate de utilizatori). Pentru adrese interne, se șterge ruta veche.
5. Fiecare fișier are un singur rol. O pagină nouă = un fișier nou, nu o adăugire într-un fișier mare.
6. Texte, culori, meniuri și liste de valori se țin în baza de date sau într-un fișier de configurare (`src/platforma/menu.js`), nu împrăștiate prin cod.
7. README și acest document se actualizează în aceeași livrare cu schimbarea.

## 2. La orice modificare în baza de date
1. Doar prin migrări numerotate în `supabase/migrations/` (următorul număr liber). O migrare rulată nu se mai modifică; se adaugă una nouă.
2. Tabel nou: RLS pornit și grant-uri explicite în aceeași migrare; implicit nimic public.
3. Drepturile se impun în baza de date (RLS și funcții `security definer`), nu doar prin ascunderea unui buton sau a unei pagini.
4. Orice acțiune care schimbă rolul sau statusul unui cont trece printr-o funcție verificată, nu printr-un `update` direct.
5. Backup înainte de orice migrare pe date reale.
6. În migrare nu apar parole, chei sau date personale reale.

## 3. Securitate și secrete
- În repo nu intră niciodată `service_role`, cheia Brevo sau parole. Pe Netlify se pun doar `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY` (cheia publică).
- Variabilele `VITE_*` sunt vizibile oricui în browser: nimic secret nu are voie să le folosească.
- Nicio adresă de site nu se scrie în cod; se folosește `SITE_URL` (`src/lib/config.js`).
- Date personale: doar ce e necesar (nume, e-mail, dată naștere). Fără CNP.

## 4. Lunar / la trei luni
- `npm audit` și actualizarea versiunilor minore, cu testare înainte de publicare. Actualizările majore (React, Vite, React Router) se planifică separat, o dată pe an.
- Se verifică în Supabase, la Advisors, avertismentele de securitate.
- Tabelele sau rutele rămase nefolosite se șterg, după backup.

## 5. Structura codului (unde se pune ce)
- `src/pages/` – pagini ale site-ului public și ale conturilor (autentificare, înregistrare).
- `src/blocks/` – secțiunile site-ului public.
- `src/platforma/` – cadrul și paginile panoului (meniu pe roluri în `menu.js`).
- `src/auth/` – autentificare și protecția paginilor.
- `src/lib/` – acces la baza de date și funcții comune.
- `supabase/migrations/` – schema bazei de date.

## 6. Avertismente cunoscute
- `npm audit` raportează probleme în `vite` și `esbuild` (versiunile 5.x / 0.21). Ele afectează doar serverul de dezvoltare local (`npm run dev`), nu site-ul publicat. Se rezolvă prin actualizarea majoră a lui Vite, planificată o dată pe an (stare la 7 nov 2026: neactualizat).
- `react-router` 6.30: avertisment de severitate medie (redirecționare deschisă prin backslash în `<Link>`); se rezolvă doar prin trecerea la React Router 7, o actualizare majoră. Riscul este mic aici: linkurile vin din conținutul editat doar de Admin General, iar `SmartLink` trimite adresele externe prin `<a>`, nu prin router. Se reevaluează la actualizarea anuală.
