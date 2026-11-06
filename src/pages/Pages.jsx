import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchArticle, fetchPage } from '../lib/content.js'
import { Blocks } from '../blocks/index.jsx'
import { longDate, RichText } from '../lib/format.jsx'

function setSeo(title, description) {
  document.title = !title ? 'Cantus Mundi' : title.includes('Cantus Mundi') ? title : `${title} · Cantus Mundi`
  let m = document.querySelector('meta[name="description"]')
  if (!m) {
    m = document.createElement('meta')
    m.name = 'description'
    document.head.appendChild(m)
  }
  m.content = description || ''
}

export function NotFound() {
  useEffect(() => setSeo('Pagina nu a fost găsită'), [])
  return (
    <section className="page-hero">
      <div className="container">
        <h1 className="title">Pagina nu a fost găsită</h1>
        <p className="lead">Adresa nu există sau a fost mutată.</p>
        <Link className="btn btn-primary" to="/">Înapoi la prima pagină</Link>
      </div>
    </section>
  )
}

export function PageView({ slug: fixed }) {
  const params = useParams()
  const slug = fixed || params.slug
  const [state, setState] = useState({ loading: true, page: null, error: null })

  useEffect(() => {
    let alive = true
    setState({ loading: true, page: null, error: null })
    fetchPage(slug)
      .then((page) => {
        if (!alive) return
        setState({ loading: false, page, error: null })
        if (page) setSeo(page.seo?.titlu || (slug === 'acasa' ? '' : page.titlu), page.seo?.descriere)
      })
      .catch((error) => alive && setState({ loading: false, page: null, error }))
    return () => {
      alive = false
    }
  }, [slug])

  if (state.loading) return <div className="container status">Se încarcă…</div>
  if (state.error) return <div className="container status">Conținutul nu poate fi încărcat momentan. ({state.error.message})</div>
  if (!state.page) return <NotFound />
  return <Blocks blocks={state.page.blocks} />
}

export function NewsArticle() {
  const { slug } = useParams()
  const [state, setState] = useState({ loading: true, a: null, error: null })
  useEffect(() => {
    let alive = true
    fetchArticle(slug)
      .then((a) => {
        if (!alive) return
        setState({ loading: false, a, error: null })
        if (a) setSeo(a.titlu, a.rezumat)
      })
      .catch((error) => alive && setState({ loading: false, a: null, error }))
    return () => {
      alive = false
    }
  }, [slug])
  if (state.loading) return <div className="container status">Se încarcă…</div>
  if (state.error) return <div className="container status">Articolul nu poate fi încărcat momentan.</div>
  if (!state.a) return <NotFound />
  const a = state.a
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">{longDate(a.data_publicare)}</div>
          <h1 className="title">{a.titlu}</h1>
          {a.rezumat && <p className="lead">{a.rezumat}</p>}
        </div>
      </section>
      <section className="section">
        <div className="container narrow">
          {a.imagine_url && <div className="article-img" style={{ backgroundImage: `url('${a.imagine_url}')` }} />}
          <RichText text={a.continut} />
          <Link className="text-link mt" to="/noutati">← Toate noutățile</Link>
        </div>
      </section>
    </>
  )
}
