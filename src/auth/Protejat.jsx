import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

// Învelește paginile care cer autentificare.
export default function Protejat({ children }) {
  const { loading, user } = useAuth()
  if (loading) return <div className="container status">Se încarcă…</div>
  if (!user) return <Navigate to="/cont" replace />
  return children
}
