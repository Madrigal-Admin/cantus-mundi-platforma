import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export const ROLURI = {
  admin_general: 'Admin General',
  reprezentant_zonal: 'Reprezentant Zonal',
  dirijor: 'Dirijor',
  corist: 'Corist',
}
export const STATUSURI = {
  in_asteptare: 'În așteptare',
  aprobat: 'Aprobat',
  respins: 'Respins',
  inactiv: 'Inactiv',
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)

  const incarcaProfil = useCallback(async (userId) => {
    if (!userId) {
      setProfil(null)
      return
    }
    const { data } = await supabase.from('profile').select('*').eq('id', userId).maybeSingle()
    setProfil(data || null)
  }, [])

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return
      setSession(data.session)
      await incarcaProfil(data.session?.user?.id)
      if (alive) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      // Nu facem apeluri către baza de date direct în acest handler (ar bloca autentificarea).
      setTimeout(() => incarcaProfil(s?.user?.id), 0)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [incarcaProfil])

  const value = {
    session,
    user: session?.user || null,
    profil,
    loading,
    esteAdmin: profil?.rol === 'admin_general' && profil?.status === 'aprobat',
    esteReprezentant: profil?.rol === 'reprezentant_zonal' && profil?.status === 'aprobat',
    reincarca: () => incarcaProfil(session?.user?.id),
    iesire: () => supabase.auth.signOut(),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
