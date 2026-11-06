import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth, ROLURI, STATUSURI } from '../auth/AuthContext.jsx'
import { PageHeader } from '../platforma/pages.jsx'

export function Utilizatori() {
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
      <PageHeader titlu={esteAdmin ? 'Conturi și aprobări' : 'Dirijori de aprobat'} text={esteAdmin ? 'Aprobă dirijorii noi, schimbă roluri și dezactivează conturi.' : 'Vezi și aprobi dirijorii din regiunile tale.'} />
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
