import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { SITE_URL } from '../../lib/config.js'
import { useAuth } from '../../auth/AuthContext.jsx'

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

  if (!loading && user) return <Navigate to="/platforma" replace />

  async function trimite(e) {
    e.preventDefault()
    setEroare('')
    setOcupat(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: parola })
    setOcupat(false)
    if (error) return setEroare(mesajEroare(error))
    navigate('/platforma')
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
          <Link className="btn btn-primary mt" to="/platforma">Mergi în cont</Link>
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
