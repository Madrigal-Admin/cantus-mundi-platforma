import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { PageHeader } from './pages.jsx'

const GOL = { id: null, nume: '', judete: new Set(), reprezentanti: new Set() }

export function Regiuni() {
  const [regiuni, setRegiuni] = useState([])
  const [judete, setJudete] = useState([])
  const [reps, setReps] = useState([])
  const [legaturi, setLegaturi] = useState([])
  const [form, setForm] = useState(null)
  const [cauta, setCauta] = useState('')
  const [eroare, setEroare] = useState('')
  const [ocupat, setOcupat] = useState(false)

  const incarca = useCallback(async () => {
    const [r, j, p, l] = await Promise.all([
      supabase.from('regiuni').select('*').order('nume'),
      supabase.from('judete').select('id, nume, regiune_id').order('nume'),
      supabase.from('profile').select('id, nume, email').eq('rol', 'reprezentant_zonal').eq('status', 'aprobat').order('nume'),
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

  const numeRegiune = (id) => regiuni.find((r) => r.id === id)?.nume
  const numeRep = (id) => reps.find((x) => x.id === id)?.nume || reps.find((x) => x.id === id)?.email || '—'

  function deschide(r) {
    setEroare('')
    setCauta('')
    setForm(
      r
        ? {
            id: r.id,
            nume: r.nume,
            judete: new Set(judete.filter((j) => j.regiune_id === r.id).map((j) => j.id)),
            reprezentanti: new Set(legaturi.filter((l) => l.regiune_id === r.id).map((l) => l.profil_id)),
          }
        : { ...GOL, judete: new Set(), reprezentanti: new Set() },
    )
  }
  function bifeaza(camp, id) {
    const s = new Set(form[camp])
    s.has(id) ? s.delete(id) : s.add(id)
    setForm({ ...form, [camp]: s })
  }
  async function ruleaza(promise, inchide = true) {
    setEroare('')
    setOcupat(true)
    const { error } = await promise
    setOcupat(false)
    if (error) {
      setEroare(error.message.includes('duplicate') ? 'Există deja o regiune cu acest nume.' : error.message)
      return
    }
    if (inchide) setForm(null)
    await incarca()
  }
  const salveaza = (e) => {
    e.preventDefault()
    ruleaza(supabase.rpc('salveaza_regiune', { p_id: form.id, p_nume: form.nume, p_judete: [...form.judete], p_reprezentanti: [...form.reprezentanti] }))
  }
  const sterge = () => {
    if (window.confirm(`Ștergi regiunea „${form.nume}”? Județele ei rămân fără regiune. Istoricul nu se mută.`)) ruleaza(supabase.rpc('sterge_regiune', { p_id: form.id }))
  }

  const fara = judete.filter((j) => !j.regiune_id)
  const judeteVizibile = judete.filter((j) => j.nume.toLowerCase().includes(cauta.trim().toLowerCase()))

  return (
    <>
      <PageHeader titlu="Regiuni și județe" text="O regiune grupează județe și are unul sau mai mulți reprezentanți. Totul se poate modifica oricând.">
        {!form && <button className="btn btn-primary btn-small" onClick={() => deschide(null)}>+ Regiune nouă</button>}
      </PageHeader>
      {eroare && <div className="alert alert-err" role="alert">{eroare}</div>}

      {form && (
        <form className="card-form" onSubmit={salveaza}>
          <h2>{form.id ? 'Modifică regiunea' : 'Regiune nouă'}</h2>
          <label className="field">Numele regiunii<input value={form.nume} onChange={(e) => setForm({ ...form, nume: e.target.value })} required /></label>

          <fieldset>
            <legend>Județe ({form.judete.size} bifate)</legend>
            <input className="search" value={cauta} onChange={(e) => setCauta(e.target.value)} placeholder="Caută un județ" aria-label="Caută un județ" />
            <div className="checks">
              {judeteVizibile.map((j) => {
                const alta = j.regiune_id && j.regiune_id !== form.id ? numeRegiune(j.regiune_id) : null
                return (
                  <label key={j.id} className="check">
                    <input type="checkbox" checked={form.judete.has(j.id)} onChange={() => bifeaza('judete', j.id)} />
                    <span>{j.nume}{alta && <small> (acum în {alta})</small>}</span>
                  </label>
                )
              })}
            </div>
            <p className="note">Un județ bifat care aparține altei regiuni se mută în aceasta la salvare.</p>
          </fieldset>

          <fieldset>
            <legend>Reprezentanți zonali</legend>
            <div className="checks">
              {reps.map((x) => (
                <label key={x.id} className="check">
                  <input type="checkbox" checked={form.reprezentanti.has(x.id)} onChange={() => bifeaza('reprezentanti', x.id)} />
                  <span>{x.nume || x.email}</span>
                </label>
              ))}
              {reps.length === 0 && <span className="meta">Nu există încă Reprezentanți Zonali. Numește-i din Conturi și aprobări, tabul Admini.</span>}
            </div>
          </fieldset>

          <div className="row-actions">
            <button className="btn btn-primary" disabled={ocupat}>Salvează</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Renunță</button>
            {form.id && <button type="button" className="btn btn-outline danger" disabled={ocupat} onClick={sterge}>Șterge regiunea</button>}
          </div>
        </form>
      )}

      <div className="regions">
        {regiuni.map((r) => {
          const ale = judete.filter((j) => j.regiune_id === r.id)
          const repsR = legaturi.filter((l) => l.regiune_id === r.id)
          return (
            <article className="region" key={r.id}>
              <h3>{r.nume}</h3>
              <div className="meta">Județe ({ale.length}): {ale.length ? ale.map((j) => j.nume).join(', ') : 'niciunul'}</div>
              <div className="meta">Reprezentanți: {repsR.length ? repsR.map((l) => numeRep(l.profil_id)).join(', ') : 'niciunul'}</div>
              <div><button className="btn btn-small btn-outline" onClick={() => deschide(r)}>Modifică</button></div>
            </article>
          )
        })}
        {regiuni.length === 0 && <p className="muted">Nu există regiuni.</p>}
      </div>
      <p className="note">Județe fără regiune ({fara.length}): {fara.length ? fara.map((j) => j.nume).join(', ') : 'niciunul'}</p>
    </>
  )
}
