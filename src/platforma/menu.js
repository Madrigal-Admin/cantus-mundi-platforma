// Meniul panoului, pe roluri. Aici se adaugă o secțiune nouă: un rând în lista rolului potrivit.
// `soon: true` = pagina există doar ca „în curând”, până o construim.
export const ICONS = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  users: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  book: 'M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z',
  msg: 'M4 5h16v11H9l-5 4z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
  sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  bell: 'M6 17V11a6 6 0 1 1 12 0v6l2 2H4zM10 21h4',
}

const acasa = { id: 'acasa', label: 'Prezentare generală', path: '/platforma', icon: 'home', end: true }

export const MENIURI = {
  admin_general: [
    acasa,
    {
      grup: 'Platformă',
      items: [
        { id: 'dashboard', label: 'Dashboard și statistici', path: '/platforma/dashboard', icon: 'chart', soon: true },
        { id: 'conturi', label: 'Conturi și aprobări', path: '/platforma/conturi', icon: 'users', badge: 'pending' },
        { id: 'regiuni', label: 'Regiuni și județe', path: '/platforma/regiuni', icon: 'pin' },
        { id: 'coruri', label: 'Coruri', path: '/platforma/coruri', icon: 'music', soon: true },
        { id: 'evenimente', label: 'Evenimente și înscrieri', path: '/platforma/evenimente', icon: 'calendar', soon: true },
        { id: 'adeverinte', label: 'Adeverințe și GDPR', path: '/platforma/adeverinte', icon: 'file', soon: true },
        { id: 'materiale', label: 'Materiale și cursuri', path: '/platforma/materiale', icon: 'book', soon: true },
      ],
    },
    {
      grup: 'Site public',
      items: [
        { id: 'pagini', label: 'Pagini și secțiuni', path: '/platforma/pagini', icon: 'globe', soon: true },
        { id: 'noutati', label: 'Noutăți și galerii', path: '/platforma/noutati-site', icon: 'image', soon: true },
        { id: 'aspect', label: 'Meniu, subsol și aspect', path: '/platforma/aspect', icon: 'sliders', soon: true },
      ],
    },
  ],
  reprezentant_zonal: [
    acasa,
    {
      grup: 'Regiunea mea',
      items: [
        { id: 'dashboard', label: 'Statistici regiune', path: '/platforma/dashboard', icon: 'chart', soon: true },
        { id: 'conturi', label: 'Conturi de aprobat', path: '/platforma/conturi', icon: 'users', badge: 'pending' },
        { id: 'coruri', label: 'Corurile regiunii', path: '/platforma/coruri', icon: 'music', soon: true },
        { id: 'evenimente', label: 'Calendar și înscrieri', path: '/platforma/evenimente', icon: 'calendar', soon: true },
        { id: 'adeverinte', label: 'Documente GDPR și adeverințe', path: '/platforma/adeverinte', icon: 'file', soon: true },
        { id: 'tichete', label: 'Tichete de sugestii', path: '/platforma/tichete', icon: 'msg', soon: true },
      ],
    },
  ],
  dirijor: [
    acasa,
    {
      grup: 'Activitatea mea',
      items: [
        { id: 'coruri', label: 'Corurile mele', path: '/platforma/coruri', icon: 'music', soon: true },
        { id: 'corist', label: 'Coriști', path: '/platforma/corist', icon: 'users', soon: true },
        { id: 'evenimente', label: 'Evenimente și înscrieri', path: '/platforma/evenimente', icon: 'calendar', soon: true },
        { id: 'materiale', label: 'Materiale și cursuri', path: '/platforma/materiale', icon: 'book', soon: true },
      ],
    },
  ],
  corist: [
    acasa,
    {
      grup: 'Activitatea mea',
      items: [
        { id: 'evenimente', label: 'Calendar', path: '/platforma/evenimente', icon: 'calendar', soon: true },
        { id: 'materiale', label: 'Materiale și partituri', path: '/platforma/materiale', icon: 'book', soon: true },
        { id: 'adeverinte', label: 'Diplome și istoric', path: '/platforma/adeverinte', icon: 'file', soon: true },
      ],
    },
  ],
}

export const DESCRIERI = {
  dashboard: 'Statistici filtrabile pe regiune, județ, mediu urban/rural, ciclu școlar, vârstă, mărimea corului, nivel de pregătire, structură vocală și repertoriu.',
  coruri: 'Înregistrarea și confirmarea corurilor, dirijori principali și secundari, istoricul fiecărui cor.',
  corist: 'Lista coriștilor din fiecare cor, adăugați manual de dirijor, cu trimiterea linkului GDPR către corist sau părinte.',
  evenimente: 'Calendarul evenimentelor importate din Hub-ul Madrigal, sesiuni de înscriere, statusuri și prezență.',
  adeverinte: 'Lista documentelor GDPR și a adeverințelor (sortabilă) și zona de administrare a șabloanelor.',
  materiale: 'Materiale educaționale, partituri și cursuri video, vizibile conform rolului. Adminii le gestionează și le distribuie conturilor utilizatorilor.',
  tichete: 'Tichete adresate reprezentanților zonali, cu răspuns și istoric.',
  pagini: 'Editorul paginilor și al secțiunilor site-ului public, cu previzualizare, istoric de versiuni și publicare.',
  'noutati-site': 'Articole de noutăți și albume foto pentru site-ul public.',
  aspect: 'Meniul, subsolul și culorile site-ului public, aplicate pe toate paginile.',
}

export function menuPentru(rol) {
  return MENIURI[rol] || MENIURI.corist
}
