import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Header from '../components/Header.jsx'
import { useAuth, ROLURI, etichetaRol, esteRolAdmin } from '../auth/AuthContext.jsx'
import { ICONS, menuPentru } from './menu.js'

export const Icon = ({ name }) => (
  <svg className="pl-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
)

export default function Shell() {
  const { profil, esteAdmin } = useAuth()
  const [deschis, setDeschis] = useState(false)
  const [previzualizare, setPrevizualizare] = useState(null)
  const [pending, setPending] = useState(0)
  const [pliate, setPliate] = useState({})
  const location = useLocation()

  // Un cont de admin care nu este aprobat nu primește meniul de admin.
  const rolReal = profil && (profil.status === 'aprobat' || !esteRolAdmin(profil.rol)) ? profil.rol : 'dirijor'
  const rolMeniu = esteAdmin && previzualizare ? previzualizare : rolReal
  const meniu = useMemo(() => menuPentru(rolMeniu), [rolMeniu])
  const staff = profil?.status === 'aprobat' && esteRolAdmin(profil.rol)

  useEffect(() => setDeschis(false), [location.pathname])
  useEffect(() => {
    if (!staff) return
    supabase
      .from('profile')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_asteptare')
      .in('rol', ['dirijor', 'corist'])
      .then(({ count }) => setPending(count || 0))
  }, [staff, location.pathname])

  const link = (it) => (
    <NavLink key={it.id} to={it.path} end={it.end} className={({ isActive }) => (isActive ? 'on' : '')}>
      <Icon name={it.icon} />
      <span>{it.label}</span>
      {it.badge === 'pending' && pending > 0 && <span className="pl-badge">{pending}</span>}
    </NavLink>
  )

  return (
    <>
      <Header />
      {!profil ? (
        <div className="boot">
          <p>Profilul nu a putut fi încărcat. Dacă ai creat contul recent, reîncarcă pagina.</p>
        </div>
      ) : (
        <div className="pl">
          <button className="pl-toggle" aria-expanded={deschis} aria-controls="pl-meniu" onClick={() => setDeschis(!deschis)}>
            {deschis ? 'Închide meniul' : 'Meniul platformei'}
          </button>

          <aside id="pl-meniu" className={`pl-side ${deschis ? 'open' : ''}`} aria-label="Meniu platformă">
            <div className="pl-brand">
              <span className="pl-role">{etichetaRol(rolMeniu)}</span>
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

            {esteAdmin && (
              <div className="pl-user">
                <label className="pl-viewas">
                  Vezi ca
                  <select value={previzualizare || ''} onChange={(e) => setPrevizualizare(e.target.value || null)}>
                    <option value="">Admin General (eu)</option>
                    <option value="reprezentant_zonal">{ROLURI.reprezentant_zonal}</option>
                    <option value="dirijor">{ROLURI.dirijor}</option>
                    <option value="corist">{ROLURI.corist}</option>
                  </select>
                </label>
              </div>
            )}
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
      )}
    </>
  )
}
