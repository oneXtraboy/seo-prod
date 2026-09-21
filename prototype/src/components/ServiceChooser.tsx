import { useEffect, useRef, useState } from 'react'
import { services } from '../data/services'
import { trackAnalyticsGoal } from '../lib/analytics'
import { ButtonLink, StartingPriceNote } from './ui'

const situations = [
  { id: 'no-growth', title: 'SEO есть, но роста нет', route: 'анализ данных → аудит → сопровождение', note: 'Я отделю проблему спроса, сайта, внедрения и измерения, а затем предложу подходящий формат.', services: ['seo-audit', 'seo-prodvizhenie'], sequence: true },
  { id: 'decline', title: 'Позиции или трафик упали', route: 'анализ причин → техническая и контентная проверка', note: 'Я сравню периоды, публикации, индексирование, конкурентов и изменения выдачи.', services: ['seo-audit', 'technical-seo-audit'], sequence: false },
  { id: 'contractor', title: 'Хочу проверить работу подрядчика', route: 'независимая оценка → выводы → приоритеты', note: 'Я проверю решения и помогу оценить текущую работу на основе доступных данных.', services: ['seo-consulting', 'seo-audit'], sequence: true },
  { id: 'team', title: 'Есть своя команда', route: 'стратегия → задачи → контроль внедрения', note: 'Ваша команда сохраняет разработку и контент, а я готовлю SEO-решения и провожу SEO-QA.', services: ['seo-strategy', 'seo-consulting'], sequence: false },
  { id: 'new-site', title: 'Запускаем новый сайт', route: 'спрос → архитектура → требования → контроль запуска', note: 'Я подключу SEO до утверждения структуры и помогу избежать дорогих переделок после запуска.', services: ['seo-prodvizhenie-novogo-sayta', 'seo-strategy'], sequence: false },
  { id: 'ecommerce', title: 'Интернет-магазин плохо растёт', route: 'каталог → индексация → категории → фильтры → товары', note: 'Я проверю масштабируемость каталога и связь органического трафика с продажами.', services: ['seo-prodvizhenie-internet-magazina', 'technical-seo-audit'], sequence: false },
  { id: 'b2b', title: 'B2B-сайт получает мало качественных обращений', route: 'спрос → посадочные → доказательства → качество лида', note: 'Свяжу поисковый запрос, содержание страницы и критерии квалифицированного обращения.', services: ['seo-for-b2b', 'seo-strategy'], sequence: false },
  { id: 'retainer', title: 'Нужно постоянное SEO', route: 'приоритеты → внедрение → QA → аналитика → новый этап', note: 'Подходит, когда команда регулярно публикует изменения и готова оценивать их результат.', services: ['seo-prodvizhenie', 'seo-strategy'], sequence: false },
  { id: 'ai', title: 'Нужно появляться в AI-ответах', route: 'исходная видимость → сущности → источники → контент → повторный замер', note: 'Я зафиксирую системы, запросы и исходную видимость, а затем подготовлю план улучшений.', services: ['geo-aeo-ai-seo', 'seo-strategy'], sequence: false },
  { id: 'local', title: 'Локальный бизнес', route: 'локальный спрос → карты → страницы → единые факты', note: 'Свяжу сайт, фактическое присутствие, карточки организаций и путь до обращения.', services: ['local-seo-spb', 'seo-for-small-business'], sequence: false },
]

const serviceCtaLabels: Record<string, string> = {
  'seo-audit': 'Посмотреть аудит',
  'technical-seo-audit': 'Посмотреть технический аудит',
  'seo-strategy': 'Посмотреть стратегию',
  'seo-consulting': 'Посмотреть консультацию',
  'seo-prodvizhenie': 'Посмотреть сопровождение',
}

export function ServiceChooser({ compact = false }: { compact?: boolean }) {
  const [selectedId, setSelectedId] = useState(situations[0].id)
  const selected = situations.find((item) => item.id === selectedId) || situations[0]
  const recommended = selected.services.map((id) => services.find((service) => service.id === id)).filter(Boolean)
  const resultRef = useRef<HTMLDivElement>(null)
  const hasInteractedRef = useRef(false)

  useEffect(() => {
    if (!hasInteractedRef.current) return
    const frame = window.requestAnimationFrame(() => {
      const result = resultRef.current
      if (!result) return
      const rect = result.getBoundingClientRect()
      const headerBottom = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().bottom || 0
      const sectionNavHeight = document.querySelector<HTMLElement>('.section-nav')?.getBoundingClientRect().height || 0
      const controlTop = headerBottom + sectionNavHeight + 20
      const viewportBottom = window.innerHeight - 20
      const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, controlTop))
      const sufficientlyVisible = rect.top >= controlTop && visibleHeight >= Math.min(rect.height, window.innerHeight * 0.55)
      if (sufficientlyVisible) return
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      const top = Math.max(0, window.scrollY + rect.top - controlTop)
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selectedId])

  function selectSituation(id: string) {
    hasInteractedRef.current = true
    setSelectedId(id)
    trackAnalyticsGoal('situation_select', { situation: id })
  }

  return (
    <div className={'service-chooser ' + (compact ? 'service-chooser--compact' : '')}>
      <div aria-label="Выберите ситуацию" className="service-chooser__options" role="group">
        {situations.map((situation) => (
          <button aria-pressed={selected.id === situation.id} className={selected.id === situation.id ? 'is-active' : undefined} data-situation={situation.id} key={situation.id} onClick={() => selectSituation(situation.id)} type="button">
            {situation.title}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="service-chooser__result" ref={resultRef}>
        <div className="service-chooser__summary">
          <p className="eyebrow">Подходящий маршрут</p>
          <h3>{selected.title}</h3>
          <p className="service-chooser__route">{selected.route}</p>
          <p>{selected.note}</p>
        </div>
        <div className="service-chooser__featured-grid">
          {recommended.map((service, index) => service && (
            <article className={'service-featured-card service-featured-card--' + (index + 1)} key={service.id}>
              <span className="service-featured-card__badge">{index === 0 ? 'Основной вариант' : selected.sequence ? 'Следующий этап' : 'Дополнительный вариант'}</span>
              <p className="eyebrow">{service.group}</p>
              <h3>{service.title}</h3>
              <p>{service.summary}</p>
              <dl><div><dt>Стоимость</dt><dd>{service.price}<StartingPriceNote price={service.price} /></dd></div><div><dt>Срок</dt><dd>{service.duration}</dd></div></dl>
              <ButtonLink analytics="service_cta_click" analyticsParams={{ service: service.id, situation: selected.id, placement: 'situation_result' }} dataCta="situation_service" dataContext={selected.id} to={service.path}>
                {serviceCtaLabels[service.id] || 'Посмотреть услугу'}
              </ButtonLink>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
