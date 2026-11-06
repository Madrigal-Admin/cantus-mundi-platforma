import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'
import { SITE_URL, APP_NAME } from './lib/config.js'

// Pagină temporară de verificare: confirmă că GitHub -> Netlify -> Supabase sunt legate corect.
// O înlocuim cu site-ul public în pasul următor.
export default function App() {
  const [db, setDb] = useState({ state: 'loading', message: 'Se verifică...' })

  useEffect(() => {
    async function check() {
      if (!supabaseConfigured) {
        setDb({
          state: 'error',
          message: 'Lipsesc variabilele VITE_SUPABASE_URL și VITE_SUPABASE_ANON_KEY (se setează în Netlify).',
        })
        return
      }
      const { data, error } = await supabase.from('app_info').select('cheie, valoare')
      if (error) {
        setDb({ state: 'error', message: `Conectat la Supabase, dar citirea a eșuat: ${error.message}` })
        return
      }
      const mesaj = data.find((r) => r.cheie === 'mesaj_verificare')
      setDb({ state: 'ok', message: mesaj ? mesaj.valoare : 'Conexiune reușită.' })
    }
    check()
  }, [])

  return (
    <main className="page">
      <h1>{APP_NAME}</h1>
      <p className="muted">Pagină de verificare tehnică</p>

      <ul className="checks">
        <li className="ok">
          <strong>Netlify:</strong> aplicația rulează pe <code>{SITE_URL}</code>
        </li>
        <li className={db.state}>
          <strong>Supabase:</strong> {db.message}
        </li>
      </ul>
    </main>
  )
}
