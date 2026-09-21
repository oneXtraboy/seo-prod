import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type MouseEvent as ReactMouseEvent, type PropsWithChildren, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { ArticleData, CaseData, FaqItem, ServiceData } from '../types'
import type { AnalyticsGoal } from '../lib/analytics'
import { trackAnalyticsGoal } from '../lib/analytics'

export function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
}

export function CheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20"><path d="m4.5 10.5 3.4 3.4 7.6-8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
}

export function Container({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`container ${className}`.trim()}>{children}</div>
}

export function ButtonLink({
  to,
  children,
  variant = 'primary',
  className = '',
  analytics,
  analyticsParams,
  dataCta,
  dataContext,
}: PropsWithChildren<{
  to: string
  variant?: 'primary' | 'secondary' | 'cases' | 'text'
  className?: string
  analytics?: AnalyticsGoal
  analyticsParams?: Record<string, string | number | boolean>
  dataCta?: string
  dataContext?: string
}>) {
  const inferred = to === '/pricing/' ? 'pricing_view' : to.startsWith('/cases/') && to !== '/cases/' ? 'case_open' : undefined
  return (
    <Link
      className={`button button--${variant} ${className}`.trim()}
      data-analytics={analytics || inferred}
      data-analytics-label={to}
      data-analytics-params={analyticsParams ? JSON.stringify(analyticsParams) : undefined}
      data-cta={dataCta || analytics || inferred || 'page_link'}
      data-context={dataContext || String(analyticsParams?.placement || analyticsParams?.context || to)}
      to={to}
    >
      <span>{children}</span>
      {variant !== 'secondary' && <ArrowIcon />}
    </Link>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'cases' | 'text' }) {
  return <button className={`button button--${variant} ${className}`.trim()} {...props}><span>{children}</span>{variant !== 'secondary' && <ArrowIcon />}</button>
}

export function TextLink({ to, children, analytics, analyticsParams }: PropsWithChildren<{ to: string; analytics?: AnalyticsGoal; analyticsParams?: Record<string, string | number | boolean> }>) {
  const inferred = to.startsWith('/cases/') && to !== '/cases/' ? 'case_open' : undefined
  return (
    <Link className="text-link" data-analytics={analytics || inferred} data-analytics-label={to} data-analytics-params={analyticsParams ? JSON.stringify(analyticsParams) : undefined} to={to}>
      <span>{children}</span><ArrowIcon />
    </Link>
  )
}

export function Section({ id, eyebrow, title, intro, tone = 'white', children, className = '' }: PropsWithChildren<{
  id?: string
  eyebrow?: string
  title?: string
  intro?: string
  tone?: 'white' | 'muted' | 'dark' | 'blue'
  className?: string
}>) {
  return (
    <section className={`section section--${tone} ${className}`.trim()} id={id}>
      <Container>
        {(eyebrow || title || intro) && <header className="section__header">{eyebrow && <p className="eyebrow">{eyebrow}</p>}{title && <h2>{title}</h2>}{intro && <p className="section__intro">{intro}</p>}</header>}
        {children}
      </Container>
    </section>
  )
}

export interface Crumb { label: string; path?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return <nav aria-label="Хлебные крошки" className="breadcrumbs"><ol>{items.map((item, index) => <li key={`${item.label}-${index}`}>{item.path ? <Link to={item.path}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav>
}

export function DataSourceBadge({ source }: { source: string }) {
  return <span className="data-source-badge" title={`Источник показателя: ${source}`}><span aria-hidden="true" className="data-source-badge__dot" />По данным {source}</span>
}

export function ProofCard({ item, compact = false }: { item: CaseData; compact?: boolean }) {
  return (
    <article className={compact ? 'proof-card proof-card--compact' : 'proof-card'}>
      <p className="case-data-sources">Источники: Метрика · GSC · Topvisor</p>
      <header className="proof-card__header"><p className="eyebrow">{item.niche}</p></header>
      <p className="proof-card__metric">{item.result}</p>
      <p className="proof-card__name">{item.metric}</p>
      {item.resultContext && <p className="proof-card__context">{item.resultContext}</p>}
      {!compact && <dl className="proof-card__details">{item.period && <div><dt>Период</dt><dd>{item.period}</dd></div>}<div><dt>Работа</dt><dd>{item.role}</dd></div></dl>}
      <ButtonLink analytics="proof_click" analyticsParams={{ case_id: item.id, source: item.sourceLabel || 'qualitative' }} to={item.path} variant="secondary">Посмотреть кейс</ButtonLink>
    </article>
  )
}

export const STARTING_PRICE_NOTE = 'Базовая стоимость для сайтов до 100 страниц. Для крупных сайтов, каталогов и корпоративных порталов объём и стоимость рассчитываю после оценки структуры.'

export function StartingPriceNote({ price }: { price: string }) {
  if (!price.trim().toLocaleLowerCase('ru-RU').startsWith('от ')) return null
  return <small className="starting-price-note">{STARTING_PRICE_NOTE}</small>
}

export function ServiceCard({ service }: { service: ServiceData }) {
  return (
    <article className="service-card">
      <div className="service-card__topline"><span>{service.group}</span><span>{service.duration}</span></div>
      <h3>{service.title}</h3><p>{service.summary}</p>
      <div className="service-card__footer">
        <strong>{service.price}</strong>
        <StartingPriceNote price={service.price} />
        <ButtonLink dataCta="view_service" dataContext={service.id} to={service.path} variant="secondary">Посмотреть услугу</ButtonLink>
      </div>
    </article>
  )
}

export function CaseCard({ item }: { item: CaseData }) {
  return (
    <article className="case-card">
      <p className="case-data-sources">Источники: Метрика · GSC · Topvisor</p>
      <div className="case-card__meta"><span>{item.niche}</span></div>
      <h3>{item.title}</h3><p>{item.task}</p>
      <dl><div><dt>Результат</dt><dd>{item.result}</dd></div>{item.period && <div><dt>Период</dt><dd>{item.period}</dd></div>}{item.resultContext && <div><dt>Данные</dt><dd>{item.resultContext}</dd></div>}</dl>
      <ButtonLink analyticsParams={{ case_id: item.id }} to={item.path} variant="secondary">Посмотреть кейс</ButtonLink>
    </article>
  )
}

export function ArticleCard({ article }: { article: ArticleData }) {
  return (
    <article className="article-card">
      <div className="article-card__meta"><span>{article.topic}</span><span>{article.readingTime}</span></div>
      <h3>{article.title}</h3><p>{article.summary}</p><p className="article-card__date">{article.updated}</p>
      <TextLink to={article.path}>Читать материал</TextLink>
    </article>
  )
}

export function PriceCard({ name, price, duration, result, includes, excludes, recommended = false, formatId = name, selectLabel = 'Обсудить формат', onSelect }: {
  name: string
  price: string
  duration: string
  result: string
  includes: string[]
  excludes: string
  recommended?: boolean
  formatId?: string
  selectLabel?: string
  onSelect?: (formatId: string) => void
}) {
  return (
    <article className={`price-card price-card--${formatId} ${recommended ? 'price-card--recommended' : ''}`.trim()}>
      <div className="price-card__heading"><p className="eyebrow">{recommended ? 'Подходит для регулярного роста' : 'Формат работы'}</p><h3>{name}</h3><p className="price-card__price">{price}</p><StartingPriceNote price={price} /><p>{duration}</p></div>
      <p className="price-card__result"><strong>Результат:</strong> {result}</p>
      <ul className="check-list">{includes.map((item) => <li key={item}><CheckIcon /> <span>{item}</span></li>)}</ul>
      {excludes && <p className="price-card__boundary"><strong>Следующий этап:</strong> {excludes}</p>}
      <a className="button button--primary" data-analytics="pricing_cta_click" data-analytics-params={JSON.stringify({ format: formatId, placement: 'pricing_card' })} data-cta="pricing_select" data-context={formatId} href="#pricing-contact" onClick={() => onSelect?.(formatId)}><span>{selectLabel}</span><ArrowIcon /></a>
    </article>
  )
}

export function FAQAccordion({ items }: { items: FaqItem[] }) {
  return <div className="faq-list">{items.map((item, index) => <details className="faq-item" key={item.question} open={index === 0}><summary><span>{item.question}</span><span aria-hidden="true" className="faq-item__icon">+</span></summary><div className="faq-item__answer"><p>{item.answer}</p></div></details>)}</div>
}

type SectionNavItem = { id: string; label: string }

const navLabelById: Record<string, string> = {
  directions: 'Направления', situations: 'Ситуации', quiz: 'Подбор', fit: 'Задачи', result: 'Результат',
  case: 'Кейс', includes: 'Работы', process: 'Процесс', price: 'Цена', prices: 'Форматы', comparison: 'Сравнение', faq: 'FAQ', contact: 'Контакт',
  proof: 'Доказательства', cases: 'Результаты', services: 'Услуги', why: 'Подход', author: 'Обо мне', about: 'Обо мне', practice: 'Практика', work: 'Работа', role: 'Моя роль', principles: 'Принципы', experience: 'Опыт', articles: 'Материалы', sources: 'Источники', context: 'Задача', analysis: 'Анализ', actions: 'Изменения', factors: 'Контекст', roles: 'Работа', timing: 'Сроки', stages: 'Этапы', roadmap: 'План', checklist: 'Что делать',
  'pricing-contact': 'Контакт', structure: 'Структура', executive: 'Для руководителя', team: 'Для команды',
}

const pageNavBlueprints: Record<string, SectionNavItem[]> = {
  '/': [
    { id: 'why', label: 'Как работаю' }, { id: 'situations', label: 'Ситуации' }, { id: 'cases', label: 'Кейсы' }, { id: 'services', label: 'Услуги' },
    { id: 'process', label: 'Процесс' }, { id: 'author', label: 'Обо мне' }, { id: 'faq', label: 'FAQ' }, { id: 'contact', label: 'Контакт' },
  ],
  '/services/': [
    { id: 'directions', label: 'Направления' }, { id: 'situations', label: 'Ситуации' }, { id: 'quiz', label: 'Подбор' }, { id: 'contact', label: 'Контакт' },
  ],
  '/pricing/': [
    { id: 'prices', label: 'Форматы' }, { id: 'proof', label: 'Результаты' }, { id: 'comparison', label: 'Сравнение' },
    { id: 'quiz', label: 'Подбор' }, { id: 'faq', label: 'FAQ' }, { id: 'pricing-contact', label: 'Контакт' },
  ],
  '/about/': [
    { id: 'about', label: 'Обо мне' }, { id: 'practice', label: 'Практика' }, { id: 'work', label: 'Работа' },
    { id: 'principles', label: 'Принципы' }, { id: 'experience', label: 'Опыт' }, { id: 'contact', label: 'Контакт' },
  ],
  '/process/': [
    { id: 'roles', label: 'Работа' }, { id: 'proof', label: 'Результат' }, { id: 'timing', label: 'Сроки' },
    { id: 'stages', label: 'Этапы' }, { id: 'contact', label: 'Контакт' },
  ],
  '/report-example/': [
    { id: 'structure', label: 'Структура' }, { id: 'executive', label: 'Для руководителя' }, { id: 'team', label: 'Для команды' },
  ],
}

const serviceNavBlueprint: SectionNavItem[] = [
  { id: 'fit', label: 'Задачи' }, { id: 'result', label: 'Результат' }, { id: 'case', label: 'Кейс' }, { id: 'includes', label: 'Работы' },
  { id: 'process', label: 'Процесс' }, { id: 'price', label: 'Цена' }, { id: 'faq', label: 'FAQ' }, { id: 'contact', label: 'Контакт' },
]

function curateSectionNav(items: SectionNavItem[], path: string) {
  const blueprint = path.startsWith('/services/') && path !== '/services/' ? serviceNavBlueprint : pageNavBlueprints[path]
  if (!blueprint) return items
  const available = new Set(items.map((item) => item.id))
  return blueprint.filter((item) => available.has(item.id))
}

function slugifySection(value: string, index: number) {
  const translit: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' }
  const slug = value.toLocaleLowerCase('ru-RU').split('').map((char) => translit[char] ?? char).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  return slug || 'section-' + (index + 1)
}

function shortSectionLabel(title: string, id: string) {
  if (navLabelById[id]) return navLabelById[id]
  const words = title.replace(/[—:]/g, ' ').trim().split(/\s+/).filter(Boolean)
  const short = words.slice(0, 3).join(' ')
  return short.length > 25 ? short.slice(0, 23).trim() + '…' : short
}

function pageType(path: string) {
  if (path === '/') return 'home'
  if (path === '/services/') return 'services_index'
  if (path.startsWith('/services/')) return 'service'
  if (path === '/cases/') return 'cases_index'
  if (path.startsWith('/cases/')) return 'case'
  if (path === '/journal/') return 'journal_index'
  if (path.startsWith('/journal/') || path.startsWith('/blog/')) return 'article'
  return path.split('/').filter(Boolean)[0] || 'page'
}

function expectsSectionNav(path: string, explicit: boolean) {
  if (explicit) return true
  if (path === '/' || path.startsWith('/services/')) return true
  if (['/pricing/', '/process/', '/about/', '/results/', '/report-example/', '/authors/synapsee/', '/journal/'].includes(path)) return true
  if (path.startsWith('/journal/') && path !== '/journal/') return true
  if (path.startsWith('/cases/') && path !== '/cases/') return true
  if (path.startsWith('/blog/') && path !== '/blog/') return true
  return false
}

function compactArticleNav(items: SectionNavItem[], path: string) {
  const isJournalArticle = path.startsWith('/journal/') && path !== '/journal/'
  const isLegacyArticle = path.startsWith('/blog/') && path !== '/blog/'
  if (!isJournalArticle && !isLegacyArticle) return items

  const picked: SectionNavItem[] = []
  const add = (item: SectionNavItem | undefined, label: string) => {
    if (item && !picked.some((entry) => entry.id === item.id)) picked.push({ ...item, label })
  }
  const contactIndex = items.findIndex((item) => item.id === 'contact')

  if (isLegacyArticle) {
    const beforeContact = items.slice(0, contactIndex >= 0 ? contactIndex : items.length)
    add(beforeContact[0], 'Главное')
    add(beforeContact[1], 'Услуга')
    add(beforeContact[2], 'Материалы')
    add(items.find((item) => item.id === 'contact'), 'Контакт')
    return picked
  }

  const checklistIndex = items.findIndex((item) => item.id === 'checklist')
  const sourcesIndex = items.findIndex((item) => item.id === 'sources')
  const articleEnd = checklistIndex >= 0 ? checklistIndex : sourcesIndex >= 0 ? sourcesIndex : items.length
  add(items[0], 'Главное')
  if (articleEnd > 1) add(items[1], 'Разбор')
  add(items.find((item) => item.id === 'checklist'), 'Что делать')
  add(items.find((item) => item.id === 'sources'), 'Источники')
  const afterSources = items.slice(sourcesIndex >= 0 ? sourcesIndex + 1 : articleEnd, contactIndex >= 0 ? contactIndex : items.length)
  add(afterSources[0], 'Услуга')
  add(afterSources[1], 'Материалы')
  add(items.find((item) => item.id === 'contact'), 'Контакт')
  return picked
}

export function StickySectionNav({ items }: { items?: SectionNavItem[] }) {
  const location = useLocation()
  const [autoItems, setAutoItems] = useState<SectionNavItem[]>([])
  const [activeId, setActiveId] = useState('')
  const navRef = useRef<HTMLElement>(null)
  const manualTargetRef = useRef('')
  const unlockTimerRef = useRef<number | null>(null)
  const resolvedItems = useMemo(() => items || autoItems, [autoItems, items])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (items) {
        setActiveId(items[0]?.id || '')
        return
      }
      const sections = Array.from(document.querySelectorAll<HTMLElement>('#main-content > section.section, #main-content > section.article-shell .article-body > section[id]'))
      const used = new Set<string>()
      const found = sections.flatMap((section, index) => {
        const heading = section.querySelector<HTMLElement>('h2')
        if (!heading) return []
        let id = section.id || slugifySection(heading.textContent || '', index)
        while (used.has(id)) id = id + '-' + (index + 1)
        used.add(id)
        section.id = id
        return [{ id, label: shortSectionLabel(heading.textContent || '', id) }]
      })
      const navigationItems = compactArticleNav(curateSectionNav(found, location.pathname), location.pathname)
      setAutoItems(navigationItems.length >= 2 ? navigationItems : [])
      const hashId = decodeURIComponent(location.hash.replace(/^#/, ''))
      setActiveId(navigationItems.some((item) => item.id === hashId) ? hashId : navigationItems[0]?.id || '')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [items, location.hash, location.pathname])

  useEffect(() => {
    if (!resolvedItems.length) return
    const sections = resolvedItems.map((item) => document.getElementById(item.id)).filter((section): section is HTMLElement => Boolean(section))
    let frame = 0
    const updateActive = () => {
      frame = 0
      if (manualTargetRef.current || !sections.length) return
      const headerBottom = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().bottom || 0
      const navHeight = navRef.current?.getBoundingClientRect().height || 0
      const controlLine = headerBottom + navHeight + 20
      let next = sections[0].id
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) next = sections[sections.length - 1].id
      else for (const section of sections) {
        const anchor = section.querySelector<HTMLElement>('h2') || section
        if (anchor.getBoundingClientRect().top <= controlLine + 24) next = section.id
        else break
      }
      setActiveId((current) => current === next ? current : next)
    }
    const scheduleUpdate = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateActive)
    }
    const releaseManualTarget = () => {
      manualTargetRef.current = ''
      scheduleUpdate()
    }
    const handleScroll = () => {
      if (manualTargetRef.current) {
        if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current)
        unlockTimerRef.current = window.setTimeout(releaseManualTarget, 180)
        return
      }
      scheduleUpdate()
    }
    const cancelManualTarget = () => {
      if (!manualTargetRef.current) return
      releaseManualTarget()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelManualTarget()
    }
    const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (sections.some((section) => section.id === hashId)) {
      manualTargetRef.current = hashId
      setActiveId(hashId)
      unlockTimerRef.current = window.setTimeout(releaseManualTarget, 700)
    } else scheduleUpdate()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('wheel', cancelManualTarget, { passive: true })
    window.addEventListener('touchstart', cancelManualTarget, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('wheel', cancelManualTarget)
      window.removeEventListener('touchstart', cancelManualTarget)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [location.pathname, resolvedItems])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const updateHeight = () => document.documentElement.style.setProperty('--section-nav-height', Math.round(nav.getBoundingClientRect().height) + 'px')
    updateHeight()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateHeight)
    observer?.observe(nav)
    window.addEventListener('resize', updateHeight)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [resolvedItems.length])

  useEffect(() => {
    if (!resolvedItems.length || typeof IntersectionObserver === 'undefined') return
    const observed = resolvedItems.map((item) => document.getElementById(item.id)).filter((section): section is HTMLElement => Boolean(section))
    const seen = new Set<string>()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const section = (entry.target as HTMLElement).id
        if (!entry.isIntersecting || seen.has(section)) return
        const sectionPosition = resolvedItems.findIndex((item) => item.id === section) + 1
        seen.add(section)
        trackAnalyticsGoal('section_view', { page_type: pageType(location.pathname), page_path: location.pathname, section, section_position: sectionPosition })
      })
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.01] })
    observed.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [location.pathname, resolvedItems])

  const handleNavClick = useCallback((event: ReactMouseEvent<HTMLAnchorElement>, item: SectionNavItem, index: number) => {
    const target = document.getElementById(item.id)
    if (!target) return
    event.preventDefault()
    manualTargetRef.current = item.id
    setActiveId(item.id)
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current)
    window.history.pushState(window.history.state, '', '#' + item.id)
    const headerHeight = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().height || 0
    const navHeight = navRef.current?.getBoundingClientRect().height || 0
    const anchor = target.querySelector<HTMLElement>('h2') || target
    const targetTop = Math.max(0, window.scrollY + anchor.getBoundingClientRect().top - headerHeight - navHeight - 24)
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: targetTop, left: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
    unlockTimerRef.current = window.setTimeout(() => { manualTargetRef.current = '' }, 900)
    trackAnalyticsGoal('section_nav_click', { page_type: pageType(location.pathname), page_path: location.pathname, section: item.id, section_position: index + 1 })
  }, [location.pathname])

  if (!expectsSectionNav(location.pathname, Boolean(items))) return null
  if (resolvedItems.length < 2) {
    return <nav aria-hidden="true" className="section-nav section-nav--pending" ref={navRef}><Container><ul /></Container></nav>
  }
  const activeIndex = Math.max(0, resolvedItems.findIndex((item) => item.id === activeId))
  return (
    <nav aria-label="Разделы страницы" className="section-nav" ref={navRef}>
      <Container><ul>{resolvedItems.map((item, index) => (
        <li className={index === activeIndex ? 'is-current' : index < activeIndex ? 'is-viewed' : 'is-future'} key={item.id}>
          <a
            aria-current={index === activeIndex ? 'location' : undefined}
            data-cta="section_nav"
            data-context={pageType(location.pathname) + ':' + item.id}
            href={'#' + item.id}
            onClick={(event) => handleNavClick(event, item, index)}
          >{item.label}</a>
        </li>
      ))}</ul></Container>
    </nav>
  )
}

export function AuthorCard({ compact = false, commercial = false }: { compact?: boolean; commercial?: boolean }) {
  return (
    <article className={compact ? 'author-card author-card--compact' : 'author-card'}>
      <img className="author-card__photo" src="/images/fedor-magerya.jpg" alt="Фёдор Магеря, SEO-специалист Synapsee" />
      <div><p className="eyebrow">{commercial || compact ? 'SEO-специалист' : 'Автор материалов'}</p><h3>Фёдор Магеря</h3>{!compact && <p>Я лично анализирую данные, определяю приоритеты, готовлю SEO-задачи и проверяю их внедрение.</p>}<ButtonLink to={commercial || compact ? '/about/' : '/authors/synapsee/'} variant="secondary">{commercial || compact ? 'Обо мне' : 'Материалы автора'}</ButtonLink></div>
    </article>
  )
}

export function LegacyRouteNotice({ article = false }: { article?: boolean }) {
  return <aside className="legacy-notice" role="note"><strong>Архивный раздел</strong><p>{article ? 'Материал сохранён в архиве и связан с основным журналом.' : 'Архив связан с основным журналом материалов.'}</p><TextLink to="/journal/">Перейти в журнал</TextLink></aside>
}

export function IconTile({ index, title, children }: { index?: string; title: string; children: ReactNode }) {
  return <article className="icon-tile">{index && <span className="icon-tile__number">{index}</span>}<h3>{title}</h3><div>{children}</div></article>
}
