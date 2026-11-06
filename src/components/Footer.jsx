import { SmartLink } from '../lib/format.jsx'
import { useSite } from './SiteContext.jsx'

export default function Footer() {
  const { settings } = useSite()
  const brand = settings.brand || {}
  const footer = settings.subsol || { coloane: [], legale: [] }
  const news = settings.newsletter || {}

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            {brand.logo_url && <img src={brand.logo_url} alt={brand.nume || 'Cantus Mundi'} className="footer-logo" />}
            <p>{footer.descriere}</p>
          </div>
          <div className="footer-news">
            <h2>{news.titlu}</h2>
            <p>{news.text}</p>
            <form className="inline-form" onSubmit={(e) => e.preventDefault()}>
              <label className="sr-only" htmlFor="nl-email">Adresa de e-mail</label>
              <input id="nl-email" type="email" placeholder="Adresa de e-mail" disabled />
              <button type="submit" className="btn btn-primary" disabled title="Abonarea va fi activată într-o etapă următoare">
                Abonează-te
              </button>
            </form>
            <p className="small">{news.consimtamant}</p>
          </div>
        </div>

        <div className="footer-cols">
          {footer.coloane.map((c) => (
            <div key={c.titlu}>
              <div className="footer-col-title">{c.titlu}</div>
              <ul>
                {c.linkuri.map((l) => (
                  <li key={l.eticheta}>
                    <SmartLink href={l.href}>{l.eticheta}</SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>{footer.copyright}</span>
          <span className="footer-legal">
            {footer.legale.map((l) => (
              <SmartLink key={l.eticheta} href={l.href}>
                {l.eticheta}
              </SmartLink>
            ))}
          </span>
        </div>
      </div>
    </footer>
  )
}
