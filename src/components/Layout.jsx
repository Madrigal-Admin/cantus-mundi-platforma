import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <>
      <a className="skip" href="#continut">Sari la conținut</a>
      <Header />
      <main id="continut">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
