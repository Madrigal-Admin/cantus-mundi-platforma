import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabaseConfigured } from './lib/supabase.js'
import { fetchSettings } from './lib/content.js'
import { SiteContext } from './components/SiteContext.jsx'
import Layout from './components/Layout.jsx'
import { PageView, NewsArticle, NotFound } from './pages/Pages.jsx'
import { Login, Inregistrare, Resetare, ParolaNoua } from './pages/cont/Cont.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import Protejat from './auth/Protejat.jsx'
import DoarStaff from './auth/DoarStaff.jsx'
import Shell from './platforma/Shell.jsx'
import { Index, InCurand, Profil } from './platforma/pages.jsx'
import { Conturi } from './platforma/Conturi.jsx'
import { Regiuni } from './platforma/Regiuni.jsx'

// Aplică culorile din baza de date (setari_site.design) ca variabile CSS.
function applyDesign(design = {}) {
  const root = document.documentElement
  for (const [k, v] of Object.entries(design)) root.style.setProperty(`--${k}`, v)
}

export default function App() {
  const [state, setState] = useState({ loading: true, settings: null, error: null })

  useEffect(() => {
    if (!supabaseConfigured) {
      setState({ loading: false, settings: null, error: new Error('Lipsesc variabilele VITE_SUPABASE_URL și VITE_SUPABASE_ANON_KEY din Netlify.') })
      return
    }
    fetchSettings()
      .then((settings) => {
        applyDesign(settings.design)
        setState({ loading: false, settings, error: null })
      })
      .catch((error) => setState({ loading: false, settings: null, error }))
  }, [])

  if (state.loading) return <div className="boot">Se încarcă…</div>
  if (state.error)
    return (
      <div className="boot">
        <h1>Site-ul nu poate fi afișat încă</h1>
        <p>{state.error.message}</p>
        <p className="small">Dacă tocmai ai configurat baza de date, verifică că ai rulat fișierele din folderul supabase/migrations în Supabase (SQL Editor), în ordine.</p>
      </div>
    )

  return (
    <SiteContext.Provider value={{ settings: state.settings }}>
      <AuthProvider>
        <Routes>
          {/* Site public */}
          <Route element={<Layout />}>
            <Route index element={<PageView slug="acasa" />} />
            <Route path="noutati/:slug" element={<NewsArticle />} />
            <Route path="cont" element={<Login />} />
            <Route path="cont/nou" element={<Inregistrare />} />
            <Route path="cont/resetare" element={<Resetare />} />
            <Route path="cont/parola-noua" element={<ParolaNoua />} />
            <Route path=":slug" element={<PageView />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Platforma (cu autentificare), același cadru pentru toate rolurile */}
          <Route path="platforma" element={<Protejat><Shell /></Protejat>}>
            <Route index element={<Index />} />
            <Route path="conturi" element={<DoarStaff><Conturi /></DoarStaff>} />
            <Route path="regiuni" element={<DoarStaff doarAdmin><Regiuni /></DoarStaff>} />
            <Route path="profil" element={<Profil />} />
            <Route path="*" element={<InCurand />} />
          </Route>
        </Routes>
      </AuthProvider>
    </SiteContext.Provider>
  )
}
