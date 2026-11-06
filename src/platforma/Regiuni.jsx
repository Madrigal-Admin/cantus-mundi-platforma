import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

import { PageHeader } from '../platforma/pages.jsx'

export function Regiuni() {
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
      <PageHeader titlu="Regiuni și județe" text="Regiunile grupează județe, iar fiecare regiune are unul sau mai mulți reprezentanți." />
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
