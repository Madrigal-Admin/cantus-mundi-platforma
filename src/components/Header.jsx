import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SmartLink } from '../lib/format.jsx'
import { useSite } from './SiteContext.jsx'

export default function Header() {
  const { settings } = useSite()
  const [open, setOpen] = useState(false)
  const brand = settings.brand || {}
  const menu = settings.menu || { elemente: [], butoane: [] }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand" aria-label={`${brand.nume || 'Cantus Mundi'} – pagina de start`} onClick={() => setOpen(false)}>
          {brand.logo_url ? <img src={brand.logo_url} alt={brand.nume || 'Cantus Mundi'} /> : <span>{brand.nume}</span>}
        </Link>

        <button className="menu-toggle" aria-expanded={open} aria-controls="meniu" onClick={() => setOpen(!open)}>
          {open ? 'Închide' : 'Meniu'}
        </button>

        <nav id="meniu" className={`nav ${open ? 'open' : ''}`} aria-label="Meniu principal">
          <ul className="nav-list">
            {menu.elemente.map((el) => (
              <li key={el.eticheta} className={el.copii && el.copii.length ? 'has-children' : ''}>
                <SmartLink href={el.href} onClick={() => setOpen(false)}>
                  {el.eticheta}
                  {el.copii && el.copii.length ? ' ▾' : ''}
                </SmartLink>
                {el.copii && el.copii.length > 0 && (
                  <ul className="submenu">
                    {el.copii.map((c) => (
                      <li key={c.eticheta}>
                        <SmartLink href={c.href} onClick={() => setOpen(false)}>
                          {c.eticheta}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="nav-buttons">
            {menu.butoane.map((b) => (
              <SmartLink key={b.eticheta} href={b.href} className={`btn ${b.stil === 'primary' ? 'btn-primary' : 'btn-outline'} btn-small`} onClick={() => setOpen(false)}>
                {b.eticheta}
              </SmartLink>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}
