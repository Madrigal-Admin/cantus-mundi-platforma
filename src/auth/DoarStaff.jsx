import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

// Pagini rezervate echipei. Ceilalți sunt trimiși în prima pagină a platformei.
// Atenție: aceasta ascunde doar pagina; accesul real la date îl impune baza de date (RLS).
export default function DoarStaff({ doarAdmin = false, children }) {
  const { esteAdmin, esteReprezentant } = useAuth()
  const ok = doarAdmin ? esteAdmin : esteAdmin || esteReprezentant
  return ok ? children : <Navigate to="/platforma" replace />
}
