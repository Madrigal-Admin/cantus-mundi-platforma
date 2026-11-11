import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth, ROLURI, STATUSURI } from '../auth/AuthContext.jsx'
import { PageHeader } from './pages.jsx'

const TIPURI_ADMIN = ['admin_general', 'reprezentant_zonal']

function Ajutor() {
  return (
    <details className="pl-help">
      <summary>Cine este Admin și cine este Utilizator?</summary>
      <p><strong>Adminii</strong> sunt angajații care gestionează platforma: <strong>Admin General</strong> (vede și gestionează tot, inclusiv site-ul public) și <strong>Reprezentant Zonal</strong> (aprobă conturi și lucrează cu regiunile lui).</p>
      <p><strong>Utilizatorii</strong> sunt <strong>Dirijorii</strong> (își înregistrează corurile și coriștii) și <strong>Coriștii</strong>. Dirijorii își creează singuri cont pe site și sunt aprobați de reprezentantul regiunii.</p>
    </details>
  )
}

function useReincarcare(incarca) {
  const [eroare, setEroare] = useState('')
  const [ocupat, setOcupat] = useState(false)
  async function ruleaza(promise) {
    setEroare('')
    setOcupat(true)
    const { error } = await promise
    setOcupat(false)
    if (error) setEroare(error.message)
    await incarca()
    return !error
  }
  return { eroare, ocupat, ruleaza }
}

function Utilizatori() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [judete, setJudete] = useState({})
  const [filtru, setFiltru] = useState('in_asteptare')
  const [eroareIncarcare, setEroareIncarcare] = useState('')

  const incarca = useCallback(async () => {
    const [p, j] = await Promise.all([
      supabase.from('profile').select('*').in('rol', ['dirijor', 'corist']).order('creat_la', { ascending: false }),
      supabase.from('judete').select('id, nume'),
    ])
    setEroareIncarcare(p.error ? p.error.message : '')
    setRows(p.data || [])
    setJudete(Object.fromEntries((j.data || []).map((x) => [x.id, x.nume])))
  }, [])
  useEffect(() => {
    incarca()
  }, [incarca])
  const { eroare, ocupat, ruleaza } = useReincarcare(incarca)
  const seteaza = (id, status) => ruleaza(supabase.rpc('seteaza_status', { p_profil: id, p_status: status }))

  const vizibile = rows.filter((r) => filtru === 'toate' || r.status === filtru)
  return (
    <>
      <div className="filters">
        {['in_asteptare', 'aprobat', 'respins', 'inactiv', 'toate'].map((s) => (
          <button key={s} className={`chip ${filtru === s ? 'on' : ''}`} onClick={() => setFiltru(s)}>
            {s === 'toate' ? 'Toate' : STATUSURI[s]} ({s === 'toate' ? rows.length : rows.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>
      {(eroare || eroareIncarcare) && <div className="alert alert-err" role="alert">{eroare || eroareIncarcare}</div>}
      {vizibile.length === 0 && <p className="muted">Nu există utilizatori în această categorie.</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Nume</th><th>Contact</th><th>Județ / localitate</th><th>Rol</th><th>Status</th><th>Acțiuni</th></tr>
          </thead>
          <tbody>
            {vizibile.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.nume || '—'}</strong><div className="meta">{r.institutie}</div></td>
                <td>{r.email}<div className="meta">{r.telefon}</div></td>
                <td>{judete[r.judet_id] || '—'}<div className="meta">{r.localitate}</div></td>
                <td>{ROLURI[r.rol]}</td>
                <td><span className={`badge badge-${r.status}`}>{STATUSURI[r.status]}</span></td>
                <td className="row-actions">
                  {r.status !== 'aprobat' && <button className="btn btn-small btn-primary" disabled={ocupat} onClick={() => seteaza(r.id, 'aprobat')}>Aprobă</button>}
                  {r.status === 'in_asteptare' && <button className="btn btn-small btn-outline" disabled={ocupat} onClick={() => seteaza(r.id, 'respins')}>Respinge</button>}
                  {r.status === 'aprobat' && r.id !== user.id && <button className="btn btn-small btn-outline" disabled={ocupat} onClick={() => seteaza(r.id, 'inactiv')}>Dezactivează</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Admini() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [regiuni, setRegiuni] = useState([])
  const [legaturi, setLegaturi] = useState([])
  const [nou, setNou] = useState({ email: '', rol: 'reprezentant_zonal' })
  const [editat, setEditat] = useState(null) // { id, selectate: Set }

  const incarca = useCallback(async () => {
    const [p, r, l] = await Promise.all([
      supabase.from('profile').select('*').in('rol', TIPURI_ADMIN).eq('status', 'aprobat').order('nume'),
      supabase.from('regiuni').select('id, nume').order('nume'),
      supabase.from('reprezentanti_regiuni').select('*'),
    ])
    setRows(p.data || [])
    setRegiuni(r.data || [])
    setLegaturi(l.data || [])
  }, [])
  useEffect(() => {
    incarca()
  }, [incarca])
  const { eroare, ocupat, ruleaza } = useReincarcare(incarca)

  const numeRegiuni = (id) =>
    legaturi.filter((l) => l.profil_id === id).map((l) => regiuni.find((r) => r.id === l.regiune_id)?.nume).filter(Boolean)

  async function adauga(e) {
    e.preventDefault()
    if (await ruleaza(supabase.rpc('numeste_admin', { p_email: nou.email, p_rol: nou.rol }))) setNou({ ...nou, email: '' })
  }
  function deschide(a) {
    setEditat({ id: a.id, selectate: new Set(legaturi.filter((l) => l.profil_id === a.id).map((l) => l.regiune_id)) })
  }
  function bifeaza(rid) {
    const s = new Set(editat.selectate)
    s.has(rid) ? s.delete(rid) : s.add(rid)
    setEditat({ ...editat, selectate: s })
  }
  async function salveaza() {
    if (await ruleaza(supabase.rpc('seteaza_regiuni_admin', { p_profil: editat.id, p_regiuni: [...editat.selectate] }))) setEditat(null)
  }

  return (
    <>
      {eroare && <div className="alert alert-err" role="alert">{eroare}</div>}
      <form className="inline-form" onSubmit={adauga}>
        <input type="email" required value={nou.email} onChange={(e) => setNou({ ...nou, email: e.target.value })} placeholder="E-mailul contului" aria-label="E-mailul contului de numit admin" />
        <select value={nou.rol} onChange={(e) => setNou({ ...nou, rol: e.target.value })} aria-label="Tipul de admin">
          {TIPURI_ADMIN.map((t) => (<option key={t} value={t}>{ROLURI[t]}</option>))}
        </select>
        <button className="btn btn-primary btn-small" disabled={ocupat}>Numește admin</button>
      </form>
      <p className="note">Deocamdată, persoana își creează mai întâi un cont pe site, apoi o numești aici după e-mail.</p>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Nume</th><th>E-mail</th><th>Tip de admin</th><th>Regiuni</th><th>Acțiuni</th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.nume || '—'}</strong></td>
                <td>{a.email}</td>
                <td>
                  <select value={a.rol} disabled={ocupat || a.id === user.id} aria-label={`Tipul de admin pentru ${a.nume || a.email}`}
                    onChange={(e) => ruleaza(supabase.rpc('numeste_admin', { p_email: a.email, p_rol: e.target.value }))}>
                    {TIPURI_ADMIN.map((t) => (<option key={t} value={t}>{ROLURI[t]}</option>))}
                  </select>
                </td>
                <td>
                  {a.rol === 'admin_general' ? 'Toate' : editat?.id === a.id ? (
                    <div className="checks">
                      {regiuni.map((r) => (
                        <label key={r.id} className="check"><input type="checkbox" checked={editat.selectate.has(r.id)} onChange={() => bifeaza(r.id)} />{r.nume}</label>
                      ))}
                      {regiuni.length === 0 && <span className="meta">Nu există regiuni încă.</span>}
                    </div>
                  ) : (numeRegiuni(a.id).join(', ') || <span className="meta">nicio regiune</span>)}
                </td>
                <td className="row-actions">
                  {a.rol === 'reprezentant_zonal' && (editat?.id === a.id ? (
                    <>
                      <button className="btn btn-small btn-primary" disabled={ocupat} onClick={salveaza}>Salvează</button>
                      <button className="btn btn-small btn-outline" onClick={() => setEditat(null)}>Renunță</button>
                    </>
                  ) : (
                    <button className="btn btn-small btn-outline" onClick={() => deschide(a)}>Alege regiuni</button>
                  ))}
                  {a.id !== user.id && (
                    <button className="btn btn-small btn-outline" disabled={ocupat}
                      onClick={() => window.confirm(`Retragi drepturile de admin pentru ${a.nume || a.email}? Contul devine inactiv.`) && ruleaza(supabase.rpc('retrage_admin', { p_profil: a.id }))}>
                      Retrage drepturile
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function Conturi() {
  const { esteAdmin } = useAuth()
  const [tab, setTab] = useState('utilizatori')
  return (
    <>
      <PageHeader
        titlu="Conturi și aprobări"
        text={esteAdmin ? 'Adminii și utilizatorii platformei: numiri, aprobări și dezactivări.' : 'Vezi și aprobi conturile de utilizatori din regiunile tale.'}
      />
      <Ajutor />
      {esteAdmin && (
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'utilizatori'} className={tab === 'utilizatori' ? 'on' : ''} onClick={() => setTab('utilizatori')}>Utilizatori</button>
          <button role="tab" aria-selected={tab === 'admini'} className={tab === 'admini' ? 'on' : ''} onClick={() => setTab('admini')}>Admini</button>
        </div>
      )}
      {tab === 'admini' && esteAdmin ? <Admini /> : <Utilizatori />}
    </>
  )
}
