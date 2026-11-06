import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth, ROLURI, STATUSURI } from '../../auth/AuthContext.jsx'

function Utilizatori() {
  const { esteAdmin, user } = useAuth()
  const [rows, setRows] = useState([])
  const [judete, setJudete] = useState({})
  const [filtru, setFiltru] = useState('in_asteptare')
  const [eroare, setEroare] = useState('')
  const [ocupat, setOcupat] = useState(false)

  const incarca = useCallback(async () => {
    const [p, j] = await Promise.all([
      supabase.from('profile').select('*').order('creat_la', { ascending: false }),
      supabase.from('judete').select('id, nume'),
    ])
    if (p.error) setEroare(p.error.message)
    setRows(p.data || [])
    setJudete(Object.fromEntries((j.data || []).map((x) => [x.id, x.nume])))
  }, [])
  useEffect(() => {
    incarca()
  }, [incarca])

  async function actiune(promise) {
    setEroare('')
    setOcupat(true)
    const { error } = await promise
    setOcupat(false)
    if (error) setEroare(error.message)
    await incarca()
  }

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
      {eroare && <div className="alert alert-err" role="alert">{eroare}</div>}
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
                <td>
                  {esteAdmin ? (
                    <select value={r.rol} disabled={ocupat || r.id === user.id} onChange={(e) => actiune(supabase.rpc('seteaza_rol', { p_profil: r.id, p_rol: e.target.value }))} aria-label={`Rol pentru ${r.nume}`}>
                      {Object.entries(ROLURI).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                    </select>
                  ) : ROLURI[r.rol]}
                </td>
                <td><span className={`badge badge-${r.status}`}>{STATUSURI[r.status]}</span></td>
                <td className="row-actions">
                  {r.status !== 'aprobat' && <button className="btn btn-small btn-primary" disabled={ocupat} onClick={() => actiune(supabase.rpc('seteaza_status', { p_profil: r.id, p_status: 'aprobat' }))}>Aprobă</button>}
                  {r.status === 'in_asteptare' && <button className="btn btn-small btn-outline" disabled={ocupat} onClick={() => actiune(supabase.rpc('seteaza_status', { p_profil: r.id, p_status: 'respins' }))}>Respinge</button>}
                  {r.status === 'aprobat' && r.id !== user.id && <button className="btn btn-small btn-outline" disabled={ocupat} onClick={() => actiune(supabase.rpc('seteaza_status', { p_profil: r.id, p_status: 'inactiv' }))}>Dezactivează</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Regiuni() {
  const [regiuni, setRegiuni] = useState([])
  const [judete, setJudete] = useState([])
  const [reps, setReps] = useState([])
  const [legaturi, setLegaturi] = useState([])
  const [nou, setNou] = useState('')
  const [eroare, setEroare] = useState('')

  const incarca = useCallback(async () => {
    const [r, j, p, l] = await Promise.all([
      supabase.from('regiuni').select('*').order('nume'),
      supabase.from('judete').select('id, nume, regiune_id').order('nume'),
      supabase.from('profile').select('id, nume, email').eq('rol', 'reprezentant_zonal').eq('status', 'aprobat'),
      supabase.from('reprezentanti_regiuni').select('*'),
    ])
    setRegiuni(r.data || [])
    setJudete(j.data || [])
    setReps(p.data || [])
    setLegaturi(l.data || [])
  }, [])
  useEffect(() => {
    incarca()
  }, [incarca])

  async function run(promise) {
    setEroare('')
    const { error } = await promise
    if (error) setEroare(error.message.includes('duplicate') ? 'Există deja o regiune cu acest nume.' : error.message)
    await incarca()
  }
  const numeRep = (id) => reps.find((x) => x.id === id)?.nume || reps.find((x) => x.id === id)?.email || '—'

  return (
    <>
      <p className="muted">Regiunile grupează județe. Un județ poate rămâne și fără regiune. Istoricul nu se mută atunci când un județ schimbă regiunea.</p>
      {eroare && <div className="alert alert-err" role="alert">{eroare}</div>}
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); if (nou.trim()) { run(supabase.from('regiuni').insert({ nume: nou.trim() })); setNou('') } }}>
        <input value={nou} onChange={(e) => setNou(e.target.value)} placeholder="Numele regiunii noi" aria-label="Numele regiunii noi" />
        <button className="btn btn-primary btn-small">Adaugă regiune</button>
      </form>
      <div className="regions">
        {regiuni.map((r) => {
          const ale = judete.filter((j) => j.regiune_id === r.id)
          const repsR = legaturi.filter((l) => l.regiune_id === r.id)
          return (
            <article className="region" key={r.id}>
              <h3>{r.nume}</h3>
              <div className="meta">Județe: {ale.length ? ale.map((j) => j.nume).join(', ') : 'niciunul'}</div>
              <div className="meta">Reprezentanți:</div>
              <ul className="plain">
                {repsR.length === 0 && <li className="meta">niciunul</li>}
                {repsR.map((l) => (
                  <li key={l.profil_id}>{numeRep(l.profil_id)}{' '}
                    <button className="link-btn" onClick={() => run(supabase.from('reprezentanti_regiuni').delete().match({ profil_id: l.profil_id, regiune_id: r.id }))}>elimină</button>
                  </li>
                ))}
              </ul>
              <select value="" aria-label={`Adaugă reprezentant în ${r.nume}`} onChange={(e) => e.target.value && run(supabase.from('reprezentanti_regiuni').insert({ profil_id: e.target.value, regiune_id: r.id }))}>
                <option value="">+ Adaugă reprezentant</option>
                {reps.filter((x) => !repsR.some((l) => l.profil_id === x.id)).map((x) => (<option key={x.id} value={x.id}>{x.nume || x.email}</option>))}
              </select>
            </article>
          )
        })}
      </div>

      <h3 className="sub">Județele și regiunile lor</h3>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Județ</th><th>Regiune</th></tr></thead>
          <tbody>
            {judete.map((j) => (
              <tr key={j.id}>
                <td>{j.nume}</td>
                <td>
                  <select value={j.regiune_id || ''} aria-label={`Regiunea județului ${j.nume}`} onChange={(e) => run(supabase.from('judete').update({ regiune_id: e.target.value || null }).eq('id', j.id))}>
                    <option value="">Fără regiune</option>
                    {regiuni.map((r) => (<option key={r.id} value={r.id}>{r.nume}</option>))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function Admin() {
  const { esteAdmin } = useAuth()
  const [tab, setTab] = useState('utilizatori')
  useEffect(() => {
    document.title = 'Administrare · Cantus Mundi'
  }, [])
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Administrare</div>
          <h1 className="title">Panou de administrare</h1>
          <p className="lead">{esteAdmin ? 'Admin General: vezi toți utilizatorii și gestionezi regiunile.' : 'Reprezentant Zonal: vezi și aprobi dirijorii din regiunile tale.'}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'utilizatori'} className={tab === 'utilizatori' ? 'on' : ''} onClick={() => setTab('utilizatori')}>Utilizatori</button>
            {esteAdmin && <button role="tab" aria-selected={tab === 'regiuni'} className={tab === 'regiuni' ? 'on' : ''} onClick={() => setTab('regiuni')}>Regiuni</button>}
          </div>
          {tab === 'utilizatori' ? <Utilizatori /> : <Regiuni />}
        </div>
      </section>
    </>
  )
}
