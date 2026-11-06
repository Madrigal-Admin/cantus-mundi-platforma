import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { SITE_URL } from '../../lib/config.js'
import { useAuth, ROLURI, STATUSURI } from '../../auth/AuthContext.jsx'

const mesajEroare = (e) => {
  const m = (e?.message || '').toLowerCase()
  if (m.includes('invalid login')) return 'E-mail sau parolă incorecte.'
  if (m.includes('email not confirmed')) return 'Adresa de e-mail nu a fost confirmată încă. Verifică-ți e-mailul.'
  if (m.includes('already registered')) return 'Există deja un cont cu această adresă de e-mail.'
  if (m.includes('password') && m.includes('characters')) return 'Parola trebuie să aibă cel puțin 8 caractere.'
  if (m.includes('rate limit')) return 'Prea multe încercări. Încearcă din nou peste câteva minute.'
  return e?.message || 'A apărut o eroare. Încearcă din nou.'
}

function Pagina({ eyebrow = 'Platforma Cantus Mundi', titlu, children }) {
  useEffect(() => {
    document.title = `${titlu} · Cantus Mundi`
  }, [titlu])
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="title">{titlu}</h1>
        </div>
      </section>
      <section className="section">
        <div className="container narrow">{children}</div>
      </section>
    </>
  )
}

export function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [parola, setParola] = useState('')
  const [eroare, setEroare] = useState('')
  const [ocupat, setOcupat] = useState(false)

  if (!loading && user) return <Navigate to="/cont/panou" replace />

  async function trimite(e) {
    e.preventDefault()
    setEroare('')
    setOcupat(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: parola })
    setOcupat(false)
    if (error) return setEroare(mesajEroare(error))
    navigate('/cont/panou')
  }

  return (
    <Pagina titlu="Contul meu">
      <form className="form" onSubmit={trimite}>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Parolă
          <input type="password" value={parola} onChange={(e) => setParola(e.target.value)} required autoComplete="current-password" />
        </label>
        {eroare && <div className="alert alert-err" role="alert">{eroare}</div>}
        <button className="btn btn-primary" disabled={ocupat}>{ocupat ? 'Se verifică…' : 'Intră în cont'}</button>
      </form>
      <p className="form-links">
        <Link to="/cont/resetare">Ai uitat parola?</Link> · <Link to="/cont/nou">Creează cont de dirijor</Link>
      </p>
    </Pagina>
  )
}

export function Inregistrare() {
  const [judete, setJudete] = useState([])
  const [f, setF] = useState({ nume: '', email: '', parola: '', telefon: '', judet_id: '', localitate: '', institutie: '', acord: false })
  const [eroare, setEroare] = useState('')
  const [gata, setGata] = useState(false)
  const [ocupat, setOcupat] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => {
    supabase.from('judete').select('id, nume').order('nume').then(({ data }) => setJudete(data || []))
  }, [])

  async function trimite(e) {
    e.preventDefault()
    setEroare('')
    if (f.parola.length < 8) return setEroare('Parola trebuie să aibă cel puțin 8 caractere.')
    if (!f.acord) return setEroare('Trebuie să accepți termenii și politica de confidențialitate.')
    setOcupat(true)
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.parola,
      options: {
        emailRedirectTo: `${SITE_URL}/cont`,
        data: { nume: f.nume.trim(), telefon: f.telefon.trim(), judet_id: f.judet_id, localitate: f.localitate.trim(), institutie: f.institutie.trim() },
      },
    })
    setOcupat(false)
    if (error) return setEroare(mesajEroare(error))
    setGata(true)
  }

  if (gata)
    return (
      <Pagina titlu="Verifică-ți e-mailul">
        <p className="rich">
          Ți-am trimis un e-mail la <strong>{f.email}</strong>. Deschide-l și apasă pe linkul de confirmare. După confirmare, contul tău
          va fi verificat de reprezentantul Cantus Mundi din județul tău, iar tu vei primi acces complet după aprobare.
        </p>
        <Link className="btn btn-primary mt" to="/cont">Mergi la autentificare</Link>
      </Pagina>
    )

  return (
    <Pagina titlu="Creează cont de dirijor">
      <form className="form" onSubmit={trimite}>
        <label>Nume și prenume<input value={f.nume} onChange={set('nume')} required autoComplete="name" /></label>
        <label>E-mail<input type="email" value={f.email} onChange={set('email')} required autoComplete="email" /></label>
        <label>Parolă (minimum 8 caractere)<input type="password" value={f.parola} onChange={set('parola')} required minLength={8} autoComplete="new-password" /></label>
        <label>Telefon<input type="tel" value={f.telefon} onChange={set('telefon')} autoComplete="tel" /></label>
        <label>
          Județ
          <select value={f.judet_id} onChange={set('judet_id')} required>
            <option value="">Alege județul</option>
            {judete.map((j) => (
              <option key={j.id} value={j.id}>{j.nume}</option>
            ))}
          </select>
        </label>
        <label>Localitate<input value={f.localitate} onChange={set('localitate')} required /></label>
        <label>Școala sau instituția<input value={f.institutie} onChange={set('institutie')} /></label>
        <label className="check">
          <input type="checkbox" checked={f.acord} onChange={set('acord')} />
          <span>Sunt de acord cu <Link to="/termeni-si-conditii">termenii</Link> și cu <Link to="/confidentialitate">politica de confidențialitate</Link>.</span>
        </label>
        {eroare && <div className="alert alert-err" role="alert">{eroare}</div>}
        <button className="btn btn-primary" disabled={ocupat}>{ocupat ? 'Se creează…' : 'Creează cont'}</button>
      </form>
      <p className="form-links">Ai deja cont? <Link to="/cont">Intră în cont</Link></p>
    </Pagina>
  )
}

export function Resetare() {
  const [email, setEmail] = useState('')
  const [gata, setGata] = useState(false)
  const [eroare, setEroare] = useState('')

  async function trimite(e) {
    e.preventDefault()
    setEroare('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${SITE_URL}/cont/parola-noua` })
    if (error) return setEroare(mesajEroare(error))
    setGata(true)
  }

  return (
    <Pagina titlu="Resetare parolă">
      {gata ? (
        <p className="rich">Dacă adresa există în platformă, ai primit un e-mail cu linkul de resetare.</p>
      ) : (
        <form className="form" onSubmit={trimite}>
          <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          {eroare && <div className="alert alert-err" role="alert">{eroare}</div>}
          <button className="btn btn-primary">Trimite linkul</button>
        </form>
      )}
      <p className="form-links"><Link to="/cont">Înapoi la autentificare</Link></p>
    </Pagina>
  )
}

export function ParolaNoua() {
  const [parola, setParola] = useState('')
  const [eroare, setEroare] = useState('')
  const [gata, setGata] = useState(false)

  async function trimite(e) {
    e.preventDefault()
    setEroare('')
    if (parola.length < 8) return setEroare('Parola trebuie să aibă cel puțin 8 caractere.')
    const { error } = await supabase.auth.updateUser({ password: parola })
    if (error) return setEroare(mesajEroare(error))
    setGata(true)
  }

  return (
    <Pagina titlu="Parolă nouă">
      {gata ? (
        <>
          <p className="rich">Parola a fost schimbată.</p>
          <Link className="btn btn-primary mt" to="/cont/panou">Mergi în cont</Link>
        </>
      ) : (
        <form className="form" onSubmit={trimite}>
          <label>Parola nouă (minimum 8 caractere)<input type="password" value={parola} onChange={(e) => setParola(e.target.value)} required minLength={8} autoComplete="new-password" /></label>
          {eroare && <div className="alert alert-err" role="alert">{eroare}</div>}
          <button className="btn btn-primary">Salvează parola</button>
        </form>
      )}
    </Pagina>
  )
}

export function Panou() {
  const { profil, user, esteAdmin, esteReprezentant, reincarca, iesire } = useAuth()
  const [f, setF] = useState(null)
  const [mesaj, setMesaj] = useState('')

  useEffect(() => {
    if (profil) setF({ nume: profil.nume || '', telefon: profil.telefon || '', localitate: profil.localitate || '', institutie: profil.institutie || '' })
  }, [profil])

  async function salveaza(e) {
    e.preventDefault()
    setMesaj('')
    const { error } = await supabase.from('profile').update(f).eq('id', user.id)
    if (error) return setMesaj('Nu s-au putut salva modificările.')
    await reincarca()
    setMesaj('Modificările au fost salvate.')
  }

  if (!profil || !f)
    return (
      <Pagina titlu="Contul meu">
        <p className="muted">Profilul nu a putut fi încărcat. Dacă ai creat contul recent, reîncarcă pagina.</p>
        <button className="btn btn-outline mt" onClick={iesire}>Ieși din cont</button>
      </Pagina>
    )

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <Pagina titlu={`Bun venit${profil.nume ? ', ' + profil.nume.split(' ')[0] : ''}`}>
      <div className={`alert ${profil.status === 'aprobat' ? 'alert-ok' : 'alert-info'}`}>
        <strong>{ROLURI[profil.rol]}</strong> · {STATUSURI[profil.status]}
        <p>
          {profil.status === 'in_asteptare' && 'Contul tău așteaptă aprobarea reprezentantului Cantus Mundi din județul tău. Vei putea folosi platforma imediat după aprobare.'}
          {profil.status === 'respins' && 'Cererea de cont nu a fost aprobată. Poți scrie echipei Cantus Mundi pentru detalii.'}
          {profil.status === 'inactiv' && 'Contul este dezactivat.'}
          {profil.status === 'aprobat' && 'Contul este activ. Funcțiile pentru coruri, evenimente și materiale vor apărea aici în etapele următoare.'}
        </p>
      </div>

      {(esteAdmin || esteReprezentant) && (
        <p className="mt"><Link className="btn btn-primary" to="/admin">Deschide panoul de administrare</Link></p>
      )}

      <h2 className="sub">Datele tale</h2>
      <form className="form" onSubmit={salveaza}>
        <label>E-mail (nu se poate schimba aici)<input value={profil.email} disabled /></label>
        <label>Nume și prenume<input value={f.nume} onChange={set('nume')} required /></label>
        <label>Telefon<input value={f.telefon} onChange={set('telefon')} /></label>
        <label>Localitate<input value={f.localitate} onChange={set('localitate')} /></label>
        <label>Școala sau instituția<input value={f.institutie} onChange={set('institutie')} /></label>
        {mesaj && <div className="alert alert-info" role="status">{mesaj}</div>}
        <button className="btn btn-primary">Salvează</button>
      </form>
      <p className="mt"><button className="btn btn-outline" onClick={iesire}>Ieși din cont</button></p>
    </Pagina>
  )
}
