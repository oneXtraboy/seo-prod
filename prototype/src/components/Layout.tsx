import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { contactDetails, footerNavigation, normalizePath, primaryNavigation } from '../data/routes'
import { serviceGroups, services } from '../data/services'
import { ButtonLink, Container, StickySectionNav, TextLink } from './ui'
import { AnalyticsBridge } from './AnalyticsBridge'

function Logo() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogoClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (normalizePath(location.pathname) !== "/") return
    event.preventDefault()
    if (location.hash || location.search) navigate("/", { replace: true })
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? "auto" : "smooth" })
  }

  return (
    <Link aria-label="Synapsee — на главную" className="logo" onClick={handleLogoClick} to="/">
      <span className="logo__mark" aria-hidden="true"><i /><i /><i /></span>
      <span>
        <strong>Synapsee</strong>
        <small>SEO-практика Фёдора Магери</small>
      </span>
    </Link>
  )
}

export function ServicesDropdown() {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  const closeDropdown = useCallback(() => {
    const details = detailsRef.current
    if (!details?.open) return
    details.open = false
  }, [])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const details = detailsRef.current
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) closeDropdown()
    }

    function handleKeyDown(event: KeyboardEvent) {
      const details = detailsRef.current
      if (event.key !== 'Escape' || !details?.open) return
      event.preventDefault()
      closeDropdown()
      details.querySelector<HTMLElement>('summary')?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeDropdown])

  return (
    <details className="services-dropdown" ref={detailsRef}>
      <summary>Услуги <span aria-hidden="true">⌄</span></summary>
      <div className="services-dropdown__panel" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) closeDropdown() }}>
        {serviceGroups.map((group) => (
          <div key={group}>
            <p>{group}</p>
            <ul>
              {services.filter((service) => service.group === group).map((service) => (
                <li key={service.path}><Link to={service.path}>{service.title}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <div className="services-dropdown__all"><TextLink to="/services/">Все услуги</TextLink></div>
      </div>
    </details>
  )
}

function DesktopNavigation() {
  return (
    <nav aria-label="Основная навигация" className="desktop-nav">
      <ServicesDropdown />
      {primaryNavigation.slice(1).map((item) => (
        <NavLink className={({ isActive }) => (isActive ? 'is-active' : undefined)} key={item.path} to={item.path}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const selector = 'button, a, [tabindex]:not([tabindex="-1"])'
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>(selector) ?? [])
    focusable()[0]?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('is-locked')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('is-locked')
      previousFocus?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="mobile-menu" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }} role="presentation">
      <div
        aria-label="Мобильное меню"
        aria-modal="true"
        className="mobile-menu__panel"
        onClick={(event) => { if ((event.target as HTMLElement).closest('a')) onClose() }}
        ref={panelRef}
        role="dialog"
      >
        <div className="mobile-menu__topline">
          <Logo />
          <button aria-label="Закрыть меню" className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <nav aria-label="Мобильная навигация">
          <ul className="mobile-menu__primary">
            {primaryNavigation.map((item) => <li key={item.path}><NavLink to={item.path}>{item.label}</NavLink></li>)}
            <li><NavLink to="/contacts/">Контакты</NavLink></li>
          </ul>
          <details className="mobile-menu__services">
            <summary>Все услуги</summary>
            <ul>{services.map((service) => <li key={service.path}><Link to={service.path}>{service.title}</Link></li>)}</ul>
          </details>
        </nav>
        <div className="mobile-menu__cta">
          <ButtonLink to="/contacts/">Разобрать сайт</ButtonLink>
          <p>Первый шаг: адрес сайта и один удобный контакт.</p>
        </div>
      </div>
    </div>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const updateHeight = () => document.documentElement.style.setProperty('--current-header-height', `${Math.round(header.getBoundingClientRect().height)}px`)
    updateHeight()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateHeight)
    observer?.observe(header)
    window.addEventListener('resize', updateHeight)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return (
    <>
      <header className={`site-header ${scrolled ? 'site-header--compact' : ''}`.trim()} ref={headerRef}>
        <Container className="site-header__inner">
          <Logo />
          <DesktopNavigation />
          <ButtonLink className="site-header__cta" to="/contacts/">Разобрать сайт</ButtonLink>
          <button aria-expanded={menuOpen} aria-label="Открыть меню" className="menu-button" onClick={() => setMenuOpen(true)} type="button">
            <span /><span /><span />
          </button>
        </Container>
      </header>
      <MobileMenu onClose={closeMenu} open={menuOpen} />
    </>
  )
}

function Footer({ showCta }: { showCta: boolean }) {
  return (
    <footer className="site-footer">
      <Container>
        {showCta && <div className="site-footer__cta">
          <div>
            <p className="eyebrow">Следующий шаг</p>
            <h2>Покажите сайт — я предложу следующий шаг</h2>
          </div>
          <ButtonLink to="/contacts/">Обсудить задачу</ButtonLink>
        </div>}
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Logo />
            <p>Независимая SEO-практика: я лично определяю стратегию и проверяю внедрение.</p>
            <p className="site-footer__source">Актуальные контакты и форматы работы — на странице контактов.</p>
          </div>
          <div>
            <h3>Разделы</h3>
            <ul>{footerNavigation.map((item) => <li key={item.path}><Link to={item.path}>{item.label}</Link></li>)}</ul>
          </div>
          <div>
            <h3>Популярные услуги</h3>
            <ul>
              <li><Link to="/services/seo-audit/">SEO-аудит</Link></li>
              <li><Link to="/services/seo-strategy/">SEO-стратегия</Link></li>
              <li><Link to="/services/seo-prodvizhenie/">SEO-продвижение</Link></li>
              <li><Link to="/services/geo-aeo-ai-seo/">GEO / AEO / AI SEO</Link></li>
            </ul>
          </div>
          <div>
            <h3>Связаться</h3>
            <ul>
              <li><a data-analytics="telegram_click" href={contactDetails.telegramHref}>{contactDetails.telegramLabel}</a></li>
              <li><a data-analytics="phone_click" href={contactDetails.phoneHref}>{contactDetails.phoneLabel}</a></li>
              <li><span>MAX (мессенджер) · {contactDetails.phoneLabel}</span></li>
              <li><a data-analytics="email_click" href={contactDetails.emailHref}>{contactDetails.emailLabel}</a></li>
            </ul>
            <p>{contactDetails.region}</p>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© 2026 Synapsee · SEO-практика Фёдора Магери</span>
          <Link to="/journal/kak-podgotovit-sayt-k-seo-rostu-bez-haosa/">Как подготовиться к SEO-росту</Link>
        </div>
      </Container>
    </footer>
  )
}

function MobileBottomCTA() {
  const location = useLocation()
  const legalRoute = ["/privacy/", "/terms/", "/consent/"].includes(normalizePath(location.pathname))
  const [formVisible, setFormVisible] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const forms = Array.from(document.querySelectorAll('.lead-form'))
    const visible = new Set<Element>()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      })
      setFormVisible(visible.size > 0)
    }, { threshold: 0.05 })
    forms.forEach((form) => observer.observe(form))
    return () => observer.disconnect()
  }, [location.pathname])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const onResize = () => setKeyboardOpen(window.innerHeight - viewport.height > 140)
    viewport.addEventListener('resize', onResize)
    return () => viewport.removeEventListener("resize", onResize)
  }, [])

  if (legalRoute) return null

  return (
    <div className={`mobile-bottom-cta ${formVisible || keyboardOpen ? 'mobile-bottom-cta--hidden' : ''}`.trim()}>
      <ButtonLink to="/contacts/">Разобрать сайт</ButtonLink>
    </div>
  )
}

export function ScrollManager() {
  const location = useLocation()

  useEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = previous }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        const id = decodeURIComponent(location.hash.slice(1))
        const target = document.getElementById(id)
        if (target) {
          target.scrollIntoView({ block: 'start', behavior: 'auto' })
          return
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.hash, location.key, location.pathname])

  return null
}

export function SiteLayout() {
  const location = useLocation()
  const path = normalizePath(location.pathname)
  const hasPageForm = path === "/" || path.startsWith("/services/") || ["/pricing/", "/process/", "/about/", "/contacts/"].includes(path) || (path.startsWith("/cases/") && path !== "/cases/") || ((path.startsWith("/journal/") && path !== "/journal/") || (path.startsWith("/blog/") && path !== "/blog/"))
  const isLegal = ["/privacy/", "/terms/", "/consent/"].includes(path)

  return (
    <>
      <a className="skip-link" href="#main-content">Перейти к содержанию</a>
      <AnalyticsBridge />
      <ScrollManager />
      <Header />
      <main id="main-content"><StickySectionNav /><Outlet /></main>
      <Footer showCta={!hasPageForm && !isLegal} />
      <MobileBottomCTA />
    </>
  )
}

