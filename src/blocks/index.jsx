import { useEffect, useState } from 'react'
import { fetchEvents, fetchNews } from '../lib/content.js'
import { SmartLink, TextLink, Eyebrow, RichText, dayMonth, longDate } from '../lib/format.jsx'

// Fiecare "tip" de secțiune din baza de date are aici o componentă.
// Pentru o secțiune nouă: adaugi componenta și o înregistrezi în REGISTRY, jos.

const Title = ({ children, as: Tag = 'h2' }) => {
  if (!children) return null
  const lines = String(children).split('\n')
  return (
    <Tag className="title">
      {lines.map((l, i) => (
        <span key={i}>
          {l}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </Tag>
  )
}

const Section = ({ children, bg = 'none', id, className = '' }) => (
  <section id={id} className={`section bg-${bg} ${className}`}>
    <div className="container">{children}</div>
  </section>
)

const Head = ({ d }) => (
  <div className="head">
    <div>
      <Eyebrow>{d.eyebrow}</Eyebrow>
      <Title>{d.titlu}</Title>
    </div>
    <TextLink link={d.link} />
  </div>
)

function Hero({ d }) {
  return (
    <section className="hero-wrap">
      <div className="hero">
        <div className="hero-text">
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <Title as="h1">{d.titlu}</Title>
          <p className="hero-sub">{d.subtitlu}</p>
          <p className="hero-p">{d.text}</p>
          <div className="actions">
            {d.buton && (
              <SmartLink href={d.buton.href} className="btn btn-light">
                {d.buton.text} ↗
              </SmartLink>
            )}
            {d.link && (
              <SmartLink href={d.link.href} className="hero-link">
                {d.link.text} ↓
              </SmartLink>
            )}
          </div>
        </div>
        <div className="hero-img" style={d.imagine_url ? { backgroundImage: `url('${d.imagine_url}')` } : undefined} role="img" aria-label={d.credit || ''}>
          {d.credit && <span className="credit">{d.credit}</span>}
        </div>
      </div>
    </section>
  )
}

function HeroPagina({ d }) {
  return (
    <section className="page-hero">
      <div className="container">
        <Eyebrow>{d.eyebrow}</Eyebrow>
        <Title as="h1">{d.titlu}</Title>
        {d.text && <p className="lead">{d.text}</p>}
      </div>
    </section>
  )
}

function Cifre({ d }) {
  return (
    <section className="section stats" aria-label="Cantus Mundi în cifre">
      <div className="container">
        <div className="stats-row">
          {(d.elemente || []).map((e) => (
            <div className="stat" key={e.eticheta}>
              <div className="stat-n">{e.valoare}</div>
              <div className="stat-l">{e.eticheta}</div>
            </div>
          ))}
        </div>
        {d.nota && <div className="note">{d.nota}</div>}
      </div>
    </section>
  )
}

function TextMare({ d }) {
  return (
    <Section bg={d.fundal || 'none'} className="two-col">
      <div className="split">
        <div>
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <Title>{d.titlu}</Title>
        </div>
        <div>
          <RichText text={d.text} />
          <TextLink link={d.link} className="mt" />
        </div>
      </div>
    </Section>
  )
}

function TextImagine({ d }) {
  return (
    <Section>
      <div className={`split center ${d.pozitie_imagine === 'stanga' ? 'reverse' : ''}`}>
        <div>
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <Title>{d.titlu}</Title>
          <RichText text={d.text} />
          <TextLink link={d.link} className="mt" />
        </div>
        <div className="img-box" style={d.imagine_url ? { backgroundImage: `url('${d.imagine_url}')` } : undefined} role="img" aria-label={d.titlu || ''} />
      </div>
    </Section>
  )
}

function Carduri({ d }) {
  return (
    <Section bg={d.fundal || 'none'}>
      <Head d={d} />
      <div className="cols">
        {(d.elemente || []).map((e) => (
          <article className="col-card" key={e.titlu}>
            {e.pictograma && (
              <div className="icon" aria-hidden="true">
                {e.pictograma}
              </div>
            )}
            <h3>{e.titlu}</h3>
            <p>{e.text}</p>
            <TextLink link={e.link} />
          </article>
        ))}
      </div>
    </Section>
  )
}

function Cronologie({ d }) {
  return (
    <Section bg="sand">
      <Head d={d} />
      <ol className="timeline">
        {(d.elemente || []).map((e) => (
          <li key={e.an}>
            <span className="year">{e.an}</span>
            <span>{e.text}</span>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function useData(loader, deps) {
  const [state, setState] = useState({ loading: true, data: [], error: null })
  useEffect(() => {
    let alive = true
    loader()
      .then((data) => alive && setState({ loading: false, data, error: null }))
      .catch((error) => alive && setState({ loading: false, data: [], error }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

const STARE = { deschise: 'Înscrieri deschise', curand: 'Înscrieri în curând', informare: 'Doar informare' }

function Evenimente({ d }) {
  const { loading, data, error } = useData(() => fetchEvents(d.numar || 3), [d.numar])
  return (
    <Section bg="sand">
      <Head d={d} />
      {loading && <p className="muted">Se încarcă…</p>}
      {error && <p className="muted">Evenimentele nu pot fi afișate momentan.</p>}
      {!loading && !error && data.length === 0 && <p className="muted">{d.gol}</p>}
      <div className="events">
        {data.map((e) => {
          const { day, month } = dayMonth(e.data_start)
          return (
            <article className="event" key={e.id}>
              <div className="date-box">
                <div className="d">{day}</div>
                <div className="m">{month}</div>
              </div>
              <div>
                <div className="meta">{[e.oras, STARE[e.stare_inscrieri]].filter(Boolean).join(' · ')}</div>
                <h3>{e.titlu}</h3>
              </div>
            </article>
          )
        })}
      </div>
      {d.nota && <div className="note">{d.nota}</div>}
    </Section>
  )
}

function Noutati({ d }) {
  const { loading, data, error } = useData(() => fetchNews(d.numar || 3), [d.numar])
  return (
    <Section>
      <Head d={d} />
      {loading && <p className="muted">Se încarcă…</p>}
      {error && <p className="muted">Noutățile nu pot fi afișate momentan.</p>}
      {!loading && !error && data.length === 0 && <p className="muted">{d.gol}</p>}
      <div className="news">
        {data.map((n) => (
          <article className="news-card" key={n.id}>
            <SmartLink href={`/noutati/${n.slug}`} className="news-link">
              <div className="news-img" style={n.imagine_url ? { backgroundImage: `url('${n.imagine_url}')` } : undefined} />
              <h3>{n.titlu}</h3>
              {n.rezumat && <p>{n.rezumat}</p>}
              <div className="meta">{longDate(n.data_publicare)}</div>
            </SmartLink>
          </article>
        ))}
      </div>
    </Section>
  )
}

function Sprijin({ d }) {
  return (
    <Section id="sustine">
      <div className="split end">
        <div>
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <Title>{d.titlu}</Title>
        </div>
        <div>
          <p className="strong">{d.intro_titlu}</p>
          <p className="muted">{d.intro_text}</p>
        </div>
      </div>
      <div className="support">
        <div className="support-img" style={d.imagine_url ? { backgroundImage: `url('${d.imagine_url}')` } : undefined} />
        <div className="support-main">
          <div className="eyebrow-muted">
            <span className="accent">{d.numar}</span> / {d.categorie}
          </div>
          <Title as="h3">{d.titlu_card}</Title>
          <p className="muted">{d.text_card}</p>
          {d.buton && (
            <SmartLink href={d.buton.href} className="btn btn-primary">
              {d.buton.text} ↗
            </SmartLink>
          )}
        </div>
        <div className="support-sums">
          <div className="eyebrow-muted">{d.concret_titlu}</div>
          {(d.sume || []).map((s) => (
            <div key={s.text}>
              <div className="sum-t">{s.text}</div>
              <div className="sum-v">{s.valoare}</div>
            </div>
          ))}
        </div>
      </div>
      {d.nota && <div className="note">{d.nota}</div>}
    </Section>
  )
}

function Cta({ d }) {
  return (
    <Section bg={d.fundal || 'peach'}>
      <div className="cta">
        <div>
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <Title>{d.titlu}</Title>
          <p className="muted">{d.text}</p>
        </div>
        <div className="cta-buttons">
          {(d.butoane || []).map((b) => (
            <SmartLink key={b.text} href={b.href} className={`btn btn-wide ${b.stil === 'primary' ? 'btn-primary' : 'btn-outline-deep'}`}>
              <span>{b.text}</span>
              <span>↗</span>
            </SmartLink>
          ))}
          <TextLink link={d.link} />
        </div>
      </div>
    </Section>
  )
}

function Galerii({ d }) {
  return (
    <Section>
      <Title>{d.titlu}</Title>
      <div className="albums">
        {(d.albume || []).map((a) => (
          <div className="album" key={a.titlu}>
            <div className="strong">{a.titlu}</div>
            <div className="album-imgs">
              {(a.imagini || []).map((u, i) => (
                <div key={i} className="album-img" style={{ backgroundImage: `url('${u}')` }} role="img" aria-label={a.titlu} />
              ))}
            </div>
            <TextLink link={a.link} className="mt" />
          </div>
        ))}
      </div>
      {d.nota && <div className="note">{d.nota}</div>}
    </Section>
  )
}

function TextBogat({ d }) {
  return (
    <Section>
      <div className="narrow">
        <RichText text={d.text} />
      </div>
    </Section>
  )
}

function FormularContact({ d }) {
  return (
    <Section>
      <div className="narrow">
        <Title>{d.titlu}</Title>
        <p className="muted">{d.text}</p>
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <label>
            Nume
            <input type="text" disabled />
          </label>
          <label>
            E-mail
            <input type="email" disabled />
          </label>
          <label>
            Mesaj
            <textarea rows="5" disabled />
          </label>
          <button className="btn btn-primary" disabled>
            Trimite
          </button>
        </form>
        {d.nota && <div className="note">{d.nota}</div>}
      </div>
    </Section>
  )
}

export const REGISTRY = {
  hero: Hero,
  hero_pagina: HeroPagina,
  cifre: Cifre,
  text_mare: TextMare,
  text_imagine: TextImagine,
  carduri: Carduri,
  cronologie: Cronologie,
  evenimente: Evenimente,
  noutati: Noutati,
  sprijin: Sprijin,
  cta: Cta,
  galerii: Galerii,
  text_bogat: TextBogat,
  formular_contact: FormularContact,
}

export function Blocks({ blocks }) {
  return blocks.map((b) => {
    const C = REGISTRY[b.tip]
    return C ? <C key={b.id} d={b.date || {}} /> : null
  })
}
