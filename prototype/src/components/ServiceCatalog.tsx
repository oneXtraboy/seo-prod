import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { serviceDirectionById, serviceDirections, type ServiceDirection, type ServiceDirectionId } from '../data/serviceCatalog'
import { services } from '../data/services'
import { getServicePresentation } from '../data/servicePresentation'
import { trackAnalyticsGoal } from '../lib/analytics'
import { ArrowIcon } from './ui'

const directionGroups: Array<{ title: string; note: string; ids: ServiceDirectionId[] }> = [
  { title: 'Исследование и стратегия', note: 'Понять спрос, рынок, данные и порядок инвестиций.', ids: ['semantics', 'competitors', 'analytics', 'strategy'] },
  { title: 'Техническая основа', note: 'Индексирование, шаблоны страниц, внутренняя перелинковка и контроль технических изменений.', ids: ['technical', 'internal_links', 'schema', 'migration'] },
  { title: 'Содержание и доверие', note: 'Усилить ответ страницы, репутацию и внешние сигналы.', ids: ['content', 'links', 'reputation'] },
  { title: 'Специальные контуры', note: 'Каталоги, локальный спрос и видимость в AI-ответах.', ids: ['ecommerce', 'local', 'ai_seo'] },
]

function normalize(value: string) { return value.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim() }
function directionText(direction: ServiceDirection) { return normalize([direction.title, direction.summary, direction.result, ...direction.tags, ...direction.groups.flatMap((group) => [group.title, ...group.items])].join(' ')) }

export function ServiceCatalog() {
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<ServiceDirectionId | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const normalizedQuery = normalize(query)
  const visible = useMemo(() => {
    if (!normalizedQuery) return serviceDirections
    const words = normalizedQuery.split(/\s+/).filter(Boolean)
    return serviceDirections.filter((direction) => { const text = directionText(direction); return words.every((word) => text.includes(word)) })
  }, [normalizedQuery])
  const active = activeId ? serviceDirectionById.get(activeId) : undefined

  useEffect(() => {
    if (normalizedQuery.length < 2) return
    const words = normalizedQuery.split(/\s+/).filter(Boolean)
    const timer = window.setTimeout(() => { trackAnalyticsGoal('services_search', { query_length: normalizedQuery.length, word_count: words.length, results: visible.length }) }, 500)
    return () => window.clearTimeout(timer)
  }, [normalizedQuery, visible.length])

  const openDirection = useCallback((direction: ServiceDirection, trigger: HTMLElement) => {
    triggerRef.current = trigger
    window.history.pushState({ ...(window.history.state || {}), synapseeServiceDrawer: true }, '', window.location.href)
    setActiveId(direction.id)
    trackAnalyticsGoal('services_category_open', { category: direction.id })
  }, [])
  const closeDirection = useCallback(() => { if (window.history.state?.synapseeServiceDrawer) window.history.back(); else setActiveId(null) }, [])
  useEffect(() => { const handlePopState = () => setActiveId(null); window.addEventListener('popstate', handlePopState); return () => window.removeEventListener('popstate', handlePopState) }, [])
  useEffect(() => { if (!activeId) triggerRef.current?.focus() }, [activeId])

  function renderCard(direction: ServiceDirection) {
    const proof = direction.countLabel.match(/^(\d+\+|14)\s*(.*)$/)
    return (
      <button aria-haspopup="dialog" className={`direction-card ${direction.featured ? 'direction-card--featured' : ''}`.trim()} data-category={direction.id} key={direction.id} onClick={(event) => openDirection(direction, event.currentTarget)} type="button">
        <span className="direction-card__number">{String(serviceDirections.findIndex((item) => item.id === direction.id) + 1)}</span>
        {direction.featured && <span className="direction-card__tag">В фокусе</span>}
        <h3>{direction.title}</h3><p>{direction.summary}</p>
        <span className="direction-card__footer"><small className="direction-card__proof">{proof ? <><strong>{proof[1]}</strong><span>{proof[2]}</span></> : <strong>{direction.countLabel}</strong>}</small><span className="button button--secondary">Перечень работ <ArrowIcon /></span></span>
      </button>
    )
  }

  return (
    <div className="service-catalog">
      <div className="service-catalog__search"><label htmlFor="service-catalog-search">Что нужно решить?</label><div><span aria-hidden="true">⌕</span><input autoComplete="off" id="service-catalog-search" onChange={(event) => setQuery(event.target.value)} placeholder="Например: индексация, просели позиции, ChatGPT" type="search" value={query} />{query && <button aria-label="Очистить поиск" onClick={() => setQuery('')} type="button">×</button>}</div><p aria-live="polite">{normalizedQuery ? `Найдено направлений: ${visible.length}` : 'Можно искать по проблеме, инструменту или типу сайта.'}</p></div>

      {visible.length ? normalizedQuery ? (
        <section className="service-catalog__group"><header><h3>Результаты поиска</h3><p>Откройте карточку, чтобы увидеть перечень работ и подходящий формат сотрудничества.</p></header><div className="service-catalog__grid">{visible.map(renderCard)}</div></section>
      ) : (
        <div className="service-catalog__groups">{directionGroups.map((group) => { const items = group.ids.map((id) => serviceDirectionById.get(id)).filter((item): item is ServiceDirection => Boolean(item)); return <section className="service-catalog__group" key={group.title}><header><h3>{group.title}</h3><p>{group.note}</p></header><div className="service-catalog__grid">{items.map(renderCard)}</div></section> })}</div>
      ) : (
        <div className="service-catalog__empty"><h3>Точного совпадения нет</h3><p>Выберите ситуацию ниже — SEO-терминологию знать не нужно.</p><a className="button button--secondary" href="#situations"><span>Перейти к ситуациям</span><ArrowIcon /></a></div>
      )}
      {active && <ServiceDirectionDrawer direction={active} onClose={closeDirection} />}
    </div>
  )
}

function ServiceDirectionDrawer({ direction, onClose }: { direction: ServiceDirection; onClose: () => void }) {
  const relatedService = services.find((service) => service.path === direction.relatedPath)
  const serviceCode = relatedService ? getServicePresentation(relatedService.id).serviceCode : direction.relatedPath
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const selector = 'button, a, input, [tabindex]:not([tabindex="-1"])'
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>(selector) ?? [])
    focusable()[0]?.focus(); document.body.classList.add('is-locked')
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const items = focusable(); const first = items[0]; const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.classList.remove('is-locked'); previousFocus?.focus() }
  }, [onClose])

  return (
    <div className="service-drawer" onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }} role="presentation">
      <div aria-labelledby={`service-direction-${direction.id}`} aria-modal="true" className="service-drawer__panel" ref={panelRef} role="dialog">
        <header className="service-drawer__header"><div><span>{direction.countLabel}</span><h2 id={`service-direction-${direction.id}`}>{direction.title}</h2></div><button aria-label="Закрыть состав направления" className="icon-button" onClick={onClose} type="button">×</button></header>
        <p className="service-drawer__result">{direction.result}</p>
        <div className="service-drawer__groups">{direction.groups.map((group) => <section key={group.title}><h3>{group.title}</h3><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}</div>
        <footer className="service-drawer__footer"><div><span>Подходящий коммерческий формат</span><strong>{direction.relatedLabel}</strong></div><Link className="button button--primary" data-analytics="service_cta_click" data-analytics-params={JSON.stringify({ service: serviceCode, category: direction.id, placement: 'services_drawer' })} to={direction.relatedPath}><span>Обсудить задачу</span><ArrowIcon /></Link></footer>
      </div>
    </div>
  )
}
