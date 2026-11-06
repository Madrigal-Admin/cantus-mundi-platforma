import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

// Învelește paginile care cer autentificare (și, opțional, un anumit rol).
export default function Protejat({ children, doarStaff = false }) {
  const { loading, user, profil, esteAdmin, esteReprezentant } = useAuth()
  if (loading) return <div className="container status">Se încarcă…</div>
  if (!user) return <Navigate to="/cont" replace />
  if (doarStaff && profil && !esteAdmin && !esteReprezentant)
    return (
      <div className="container status">
        <h1 className="title">Acces restricționat</h1>
        <p>Această pagină este pentru echipa Cantus Mundi.</p>
      </div>
    )
  return children
}
