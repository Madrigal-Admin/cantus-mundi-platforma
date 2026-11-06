import { Link } from 'react-router-dom'

const MONTHS = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']
const MONTHS_SHORT = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function longDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function dayMonth(iso) {
  const d = new Date(iso)
  return { day: String(d.getDate()).padStart(2, '0'), month: MONTHS_SHORT[d.getMonth()] }
}

// Link care alege singur între link intern (fără reîncărcare) și extern.
export function SmartLink({ href, children, className, ...rest }) {
  if (!href) return <span className={className}>{children}</span>
  if (/^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a href={href} className={className} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    )
  }
  if (href.startsWith('#')) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={className} {...rest}>
      {children}
    </Link>
  )
}

export function TextLink({ link, className = '' }) {
  if (!link || !link.text) return null
  return (
    <SmartLink href={link.href} className={`text-link ${className}`}>
      {link.text} ↗
    </SmartLink>
  )
}

export function Eyebrow({ children }) {
  return children ? <div className="eyebrow">{children}</div> : null
}

// Randare simplă și sigură pentru texte: paragrafe separate prin rând gol,
// "## " pentru subtitlu, "- " pentru liste, **text** pentru îngroșat. Fără HTML.
function inline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p))
}

export function RichText({ text }) {
  if (!text) return null
  const blocks = String(text).split(/\n\s*\n/)
  return (
    <div className="rich">
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2))}</li>
              ))}
            </ul>
          )
        }
        if (b.startsWith('## ')) return <h3 key={i}>{inline(b.slice(3))}</h3>
        return <p key={i}>{inline(b)}</p>
      })}
    </div>
  )
}
