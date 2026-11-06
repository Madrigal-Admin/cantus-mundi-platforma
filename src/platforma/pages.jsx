import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth, ROLURI, STATUSURI } from '../auth/AuthContext.jsx'
import { DESCRIERI, MENIURI } from './menu.js'

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
  const { profil, esteAdmin, esteReprezentant } = useAuth()
  const [n, setN] = useState({ pending: 0, aprobati: 0, regiuni: 0 })
  const staff = esteAdmin || esteReprezentant

  useEffect(() => {
    if (!staff) return
    Promise.all([
      supabase.from('profile').select('id', { count: 'exact', head: true }).eq('status', 'in_asteptare').eq('rol', 'dirijor'),
      supabase.from('profile').select('id', { count: 'exact', head: true }).eq('status', 'aprobat').eq('rol', 'dirijor'),
      supabase.from('regiuni').select('id', { count: 'exact', head: true }),
    ]).then(([a, b, c]) => setN({ pending: a.count || 0, aprobati: b.count || 0, regiuni: c.count || 0 }))
  }, [staff])

  const prenume = (profil?.nume || '').split(' ')[0]
  return (
    <>
      <PageHeader titlu={`Bun venit${prenume ? ', ' + prenume : ''}`} text={`${ROLURI[profil.rol]} · ${STATUSURI[profil.status]}`} />
      {profil.status === 'in_asteptare' && (
        <div className="alert alert-info">Contul tău așteaptă aprobarea reprezentantului Cantus Mundi din județul tău. Vei putea folosi platforma imediat după aprobare.</div>
      )}
      {staff && (
        <>
          <section className="pl-cards">
            <Link to="/platforma/conturi" className="pl-card">
              <div className="n">{n.pending}</div>
              <div>conturi de dirijori de aprobat</div>
            </Link>
            <div className="pl-card">
              <div className="n">{n.aprobati}</div>
              <div>dirijori aprobați</div>
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
      )}
      {!staff && profil.status === 'aprobat' && (
        <div className="alert alert-ok">Contul este activ. Secțiunile din meniu apar aici pe măsură ce sunt construite.</div>
      )}
    </>
  )
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

const MATRICE = [
  ['Gestionează site-ul public', 'Da', '–', '–', '–'],
  ['Creează regiuni și atribuie județe', 'Da', '–', '–', '–'],
  ['Vede toate conturile', 'Da', 'Doar regiunea lui', '–', '–'],
  ['Aprobă dirijori', 'Da', 'Din regiunea lui', '–', '–'],
  ['Schimbă roluri', 'Da', '–', '–', '–'],
  ['Înregistrează coruri și coriști', 'Da', '–', 'Da (dirijor principal)', '–'],
  ['Vede calendarul și materialele', 'Da', 'Da', 'Da', 'Da'],
]

export function Roluri() {
  return (
    <>
      <PageHeader titlu="Roluri și drepturi" text="Cele patru roluri ale platformei și ce poate face fiecare. Rolul unui cont se schimbă din „Conturi și aprobări”." />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Drept</th><th>Admin General</th><th>Reprezentant Zonal</th><th>Dirijor</th><th>Corist</th>
            </tr>
          </thead>
          <tbody>
            {MATRICE.map((r) => (
              <tr key={r[0]}>
                {r.map((c, i) => (i === 0 ? <td key={i}><strong>{c}</strong></td> : <td key={i}>{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">Tabelul descrie regulile actuale. Rolurile sunt aplicate de baza de date, nu doar de meniu.</p>
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
