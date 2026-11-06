import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth, ROLURI } from '../auth/AuthContext.jsx'
import { ICONS, menuPentru } from './menu.js'

export const Icon = ({ name }) => (
  <svg className="pl-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
)

export default function Shell() {
  const { profil, esteAdmin, iesire } = useAuth()
  const [deschis, setDeschis] = useState(false)
  const [previzualizare, setPrevizualizare] = useState(null)
  const [pending, setPending] = useState(0)
  const [pliate, setPliate] = useState({})
  const location = useLocation()

  const rolReal = profil?.rol || 'corist'
  const rolMeniu = esteAdmin && previzualizare ? previzualizare : rolReal
  const meniu = useMemo(() => menuPentru(rolMeniu), [rolMeniu])

  useEffect(() => setDeschis(false), [location.pathname])
  useEffect(() => {
    if (!profil || !(profil.status === 'aprobat' && ['admin_general', 'reprezentant_zonal'].includes(profil.rol))) return
    supabase
      .from('profile')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_asteptare')
      .eq('rol', 'dirijor')
      .then(({ count }) => setPending(count || 0))
  }, [profil, location.pathname])

  if (!profil)
    return (
      <div className="boot">
        <p>Profilul nu a putut fi încărcat. Dacă ai creat contul recent, reîncarcă pagina.</p>
        <button className="btn btn-outline" onClick={iesire}>Ieși din cont</button>
      </div>
    )

  const link = (it) => (
    <NavLink key={it.id} to={it.path} end={it.end} className={({ isActive }) => (isActive ? 'on' : '')}>
      <Icon name={it.icon} />
      <span>{it.label}</span>
      {it.badge === 'pending' && pending > 0 && <span className="pl-badge">{pending}</span>}
    </NavLink>
  )

  return (
    <div className="pl">
      <button className="pl-toggle" aria-expanded={deschis} aria-controls="pl-meniu" onClick={() => setDeschis(!deschis)}>
        {deschis ? 'Închide meniul' : 'Meniu'}
      </button>

      <aside id="pl-meniu" className={`pl-side ${deschis ? 'open' : ''}`} aria-label="Meniu platformă">
        <div className="pl-brand">
          <Link to="/">Cantus Mundi</Link>
          <span className="pl-role">{ROLURI[rolMeniu]}</span>
        </div>
        <nav>
          {meniu.map((el) =>
            el.grup ? (
              <div key={el.grup}>
                <button className="pl-grp" aria-expanded={!pliate[el.grup]} onClick={() => setPliate({ ...pliate, [el.grup]: !pliate[el.grup] })}>
                  <span>{el.grup}</span>
                  <span aria-hidden="true">{pliate[el.grup] ? '+' : '–'}</span>
                </button>
                {!pliate[el.grup] && el.items.map(link)}
              </div>
            ) : (
              link(el)
            ),
          )}
        </nav>

        <div className="pl-user">
          <NavLink to="/platforma/profil" className={({ isActive }) => (isActive ? 'on' : '')}>
            <Icon name="user" />
            <span>
              <strong>{profil.nume || 'Profilul meu'}</strong>
              <small>{profil.email}</small>
            </span>
          </NavLink>
          {esteAdmin && (
            <label className="pl-viewas">
              Vezi ca
              <select value={previzualizare || ''} onChange={(e) => setPrevizualizare(e.target.value || null)}>
                <option value="">Admin General (eu)</option>
                <option value="reprezentant_zonal">Reprezentant Zonal</option>
                <option value="dirijor">Dirijor</option>
                <option value="corist">Corist</option>
              </select>
            </label>
          )}
          <button className="pl-out" onClick={iesire}>Ieși din cont</button>
        </div>
      </aside>

      <div className="pl-main">
        {esteAdmin && previzualizare && (
          <div className="pl-preview" role="status">
            Previzualizezi meniul pentru <strong>{ROLURI[previzualizare]}</strong>. Drepturile reale rămân cele de Admin General.{' '}
            <button className="link-btn" onClick={() => setPrevizualizare(null)}>Revino la meniul tău</button>
          </div>
        )}
        {profil.status !== 'aprobat' && (
          <div className="pl-preview" role="status">
            Contul tău are statusul <strong>{profil.status === 'in_asteptare' ? 'în așteptare' : profil.status}</strong>. Funcțiile se activează după aprobare.
          </div>
        )}
        <Outlet />
      </div>
    </div>
  )
}
