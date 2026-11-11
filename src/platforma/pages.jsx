import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth, ROLURI, STATUSURI, etichetaRol, esteRolAdmin } from '../auth/AuthContext.jsx'
import { DESCRIERI, MENIURI, menuPentru } from './menu.js'

export function PageHeader({ titlu, text, children }) {
  useEffect(() => {
    document.title = `${titlu} · Cantus Mundi`
  }, [titlu])
  return (
    <header className="pl-head">
      <div>
        <h1>{titlu}</h1>
        {text && <p>{text}</p>}
      </div>
      {children}
    </header>
  )
}

export function Acasa() {
  const { profil, esteAdmin } = useAuth()
  const [n, setN] = useState({ pending: 0, aprobati: 0, regiuni: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('profile').select('id', { count: 'exact', head: true }).eq('status', 'in_asteptare').in('rol', ['dirijor', 'corist']),
      supabase.from('profile').select('id', { count: 'exact', head: true }).eq('status', 'aprobat').in('rol', ['dirijor', 'corist']),
      supabase.from('regiuni').select('id', { count: 'exact', head: true }),
    ]).then(([a, b, c]) => setN({ pending: a.count || 0, aprobati: b.count || 0, regiuni: c.count || 0 }))
  }, [])

  const prenume = (profil?.nume || '').split(' ')[0]
  return (
    <>
      <PageHeader titlu={`Bun venit${prenume ? ', ' + prenume : ''}`} text={`${etichetaRol(profil.rol)}. Imaginea de ansamblu a platformei.`} />
      <section className="pl-cards">
        <Link to="/platforma/conturi" className="pl-card">
          <div className="n">{n.pending}</div>
          <div>conturi de utilizatori de aprobat</div>
        </Link>
        <div className="pl-card">
          <div className="n">{n.aprobati}</div>
          <div>utilizatori aprobați</div>
        </div>
        {esteAdmin && (
          <Link to="/platforma/regiuni" className="pl-card">
            <div className="n">{n.regiuni}</div>
            <div>regiuni definite</div>
          </Link>
        )}
      </section>
      <p className="note">Statisticile despre coruri, coriști și evenimente apar aici după ce construim acele secțiuni.</p>
    </>
  )
}

// Pagina de start a platformei: Prezentare generală pentru admini; utilizatorii merg direct la prima lor secțiune.
export function Index() {
  const { profil, esteAdmin, esteReprezentant } = useAuth()
  if (esteAdmin || esteReprezentant) return <Acasa />
  const rol = profil.status === 'aprobat' || !esteRolAdmin(profil.rol) ? profil.rol : 'dirijor'
  const prima = menuPentru(rol).find((e) => e.grup)?.items[0]?.path || '/platforma/profil'
  return <Navigate to={prima} replace />
}

export function InCurand() {
  const { pathname } = useLocation()
  const id = pathname.split('/').pop()
  const gasit = Object.values(MENIURI).flat().flatMap((e) => (e.grup ? e.items : [e])).find((i) => i.path === pathname)
  const titlu = gasit?.label || 'Secțiune'
  return (
    <>
      <PageHeader titlu={titlu} text="Această secțiune se construiește într-una din etapele următoare." />
      <div className="alert alert-info">{DESCRIERI[id] || 'Detalii în curând.'}</div>
    </>
  )
}

export function Profil() {
  const { profil, user, reincarca } = useAuth()
  const [f, setF] = useState({ nume: '', telefon: '', localitate: '', institutie: '' })
  const [mesaj, setMesaj] = useState('')
  useEffect(() => {
    if (profil) setF({ nume: profil.nume || '', telefon: profil.telefon || '', localitate: profil.localitate || '', institutie: profil.institutie || '' })
  }, [profil])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function salveaza(e) {
    e.preventDefault()
    setMesaj('')
    const { error } = await supabase.from('profile').update(f).eq('id', user.id)
    if (error) return setMesaj('Nu s-au putut salva modificările.')
    await reincarca()
    setMesaj('Modificările au fost salvate.')
  }

  return (
    <>
      <PageHeader titlu="Profilul meu" text={`${ROLURI[profil.rol]} · ${STATUSURI[profil.status]}`} />
      <form className="form pl-form" onSubmit={salveaza}>
        <label>E-mail (nu se poate schimba aici)<input value={profil.email} disabled /></label>
        <label>Nume și prenume<input value={f.nume} onChange={set('nume')} required /></label>
        <label>Telefon<input value={f.telefon} onChange={set('telefon')} /></label>
        <label>Localitate<input value={f.localitate} onChange={set('localitate')} /></label>
        <label>Școala sau instituția<input value={f.institutie} onChange={set('institutie')} /></label>
        {mesaj && <div className="alert alert-info" role="status">{mesaj}</div>}
        <button className="btn btn-primary">Salvează</button>
      </form>
    </>
  )
}
