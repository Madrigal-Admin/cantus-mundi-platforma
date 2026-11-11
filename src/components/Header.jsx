import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SmartLink } from '../lib/format.jsx'
import { useSite } from './SiteContext.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Header() {
  const { settings } = useSite()
  const { user, profil, iesire } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const brand = settings.brand || {}
  const menu = settings.menu || { elemente: [], butoane: [] }

  // Antetul rămâne fix sus; înălțimea lui o folosește meniul lateral al platformei.
  useLayoutEffect(() => {
    const set = () => document.documentElement.style.setProperty('--header-h', `${ref.current?.offsetHeight || 66}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  return (
    <header className="header" ref={ref}>
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
            {user ? (
              <>
                <SmartLink href="/platforma/profil" className="account-name" onClick={() => setOpen(false)}>
                  {profil?.nume || user.email}
                </SmartLink>
                <SmartLink href="/platforma" className="btn btn-primary btn-small" onClick={() => setOpen(false)}>
                  Platforma
                </SmartLink>
                <button className="btn btn-outline btn-small" onClick={iesire}>
                  Ieși din cont
                </button>
              </>
            ) : (
              menu.butoane.map((b) => (
              <SmartLink key={b.eticheta} href={b.href} className={`btn ${b.stil === 'primary' ? 'btn-primary' : 'btn-outline'} btn-small`} onClick={() => setOpen(false)}>
                {b.eticheta}
              </SmartLink>
            )))}
          </div>
        </nav>
      </div>
    </header>
  )
}
