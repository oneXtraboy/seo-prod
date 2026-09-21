import type { CSSProperties, ReactNode } from 'react'
import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import { Section } from '../components/ui'
import { caseAutoServiceData } from '../data/autoServiceCaseData'

const researchSteps = [
  'Анализировал паттерны поисковых запросов через Яндекс Wordstat и GSC',
  'Изучал тепловые карты кликов на сайте клиента через Метрику',
  'Смотрел, как ведёт себя мобильный трафик — откуда заходят, на каких страницах уходят, какие точки выбирают',
  'Совместно с клиентом разбирал реальные маршруты движения по городу и загрузку станций по часам',
]

const mobileFeatures = [
  'Человек в машине за несколько секунд видит рекомендации точек строго по своему текущему маршруту',
  'Система мягко предлагает альтернативу, если на ближайшей точке небольшая загрузка — с дополнительным бонусом за небольшое отклонение',
  'Один тап — и клиент уже едет к свободному боксу без звонков и лишних действий',
]

const roles = [
  'Исследование спроса и поведения пользователей',
  'Разработка стратегии Zero-Detour',
  'Структура страниц и требования к контенту',
  'SEO-приоритеты и технические требования',
  'Контроль внедрения и проверка результата',
]

const formatNumber = new Intl.NumberFormat('ru-RU').format

type ChartSeries = {
  readonly color: string
  readonly label: string
  readonly values: readonly number[]
}

function SourceLabel({ children }: { children: ReactNode }) {
  return <p className="auto-viz-source">{children}</p>
}

function LineChart({ ariaLabel, months, series }: {
  ariaLabel: string
  months: readonly string[]
  series: readonly ChartSeries[]
}) {
  const width = 720
  const height = 300
  const inset = { top: 28, right: 28, bottom: 46, left: 42 }
  const values = series.flatMap((item) => [...item.values])
  const max = Math.max(...values) * 1.12
  const plotWidth = width - inset.left - inset.right
  const plotHeight = height - inset.top - inset.bottom
  const x = (index: number) => inset.left + (plotWidth * index) / Math.max(months.length - 1, 1)
  const y = (value: number) => inset.top + plotHeight - (value / max) * plotHeight

  return (
    <div className="auto-viz-line-chart">
      <svg aria-label={ariaLabel} role="img" viewBox={`0 0 ${width} ${height}`}>
        {[0, 1, 2, 3, 4].map((step) => {
          const lineY = inset.top + (plotHeight * step) / 4
          return <line className="auto-viz-line-chart__grid" key={step} x1={inset.left} x2={width - inset.right} y1={lineY} y2={lineY} />
        })}
        {series.map((item) => {
          const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
          return (
            <g key={item.label}>
              <polyline fill="none" points={points} stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
              {item.values.map((value, index) => (
                <g key={`${item.label}-${months[index]}`}>
                  <circle cx={x(index)} cy={y(value)} fill="#fff" r="6" stroke={item.color} strokeWidth="4" />
                  {(index === 0 || index === item.values.length - 1) && <text className="auto-viz-line-chart__value" x={x(index)} y={y(value) - 13}>{formatNumber(value)}</text>}
                </g>
              ))}
            </g>
          )
        })}
        {months.map((month, index) => <text className="auto-viz-line-chart__month" key={month} x={x(index)} y={height - 16}>{month}</text>)}
      </svg>
      {series.length > 1 && (
        <div className="auto-viz-legend">
          {series.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}
        </div>
      )}
    </div>
  )
}

function HorizontalBars({ items, compact = false }: {
  compact?: boolean
  items: readonly { readonly query: string; readonly value: number }[]
}) {
  const max = Math.max(...items.map((item) => item.value))
  return (
    <div className={`auto-viz-bars${compact ? ' auto-viz-bars--compact' : ''}`}>
      {items.map((item) => (
        <div className="auto-viz-bars__row" key={item.query}>
          <div><span>{item.query}</span><strong>{formatNumber(item.value)}</strong></div>
          <i><b style={{ '--bar-width': `${Math.max((item.value / max) * 100, 2.5)}%` } as CSSProperties} /></i>
        </div>
      ))}
    </div>
  )
}

function MetricStrip({ items }: { items: readonly { readonly label: string; readonly value: string }[] }) {
  return (
    <div className="auto-viz-metric-strip">
      {items.map((item) => <article key={item.label}><strong>{item.value}</strong><span>{item.label}</span></article>)}
    </div>
  )
}

export function AutomotiveServiceCasePage() {
  const data = caseAutoServiceData
  const clicks = data.gsc.rows.map((row) => row.clicks)
  const impressions = data.gsc.rows.map((row) => row.impressions)
  const conversion = data.metrika.rows.map((row) => row.conversion)
  const districtMax = Math.max(...data.districts.flatMap((row) => [row.service.value, row.oil.value]))

  return (
    <>
      <PageHero
        aside={(
          <figure className="auto-case-hero-visual">
            <img
              alt="Схема выбора 1–2 подходящих автосервисов по маршруту среди 38 точек сети"
              height="820"
              src="/images/cases/local-seo-avtoservisy/set-avtoservisov-38-tochek-marshrut.webp"
              title="Выбор ближайшего автосервиса по маршруту"
              width="634"
            />
          </figure>
        )}
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Все кейсы', path: '/cases/' }, { label: 'Сеть автосервисов · 38 точек · B2C' }]}
        eyebrow="B2C · локальный спрос · сеть автосервисов · 38 точек"
        summary="Исследование спонтанного спроса, разработка инструмента Zero-Detour и рост загрузки на 34% без открытия новых точек"
        title="Как сеть из 38 пунктов обслуживания перестала терять клиентов из-за «слепой зоны»"
      >
        <div aria-label="Результаты проекта" className="auto-case-hero-metrics">
          {data.networkResults.items.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label.toLocaleLowerCase('ru')}</span></div>)}
        </div>
      </PageHero>

      <Section className="auto-case-section" id="context" title="Клиент и задача">
        <div className="auto-case-copy auto-case-copy--lead">
          <p>Сеть автосервисов в крупном городе: {data.network.fullStations} полноценные станции, в общей сложности {data.network.servicePoints} пунктов обслуживания. Более 10 лет на рынке, узнаваемый бренд, хорошая видимость в поиске.</p>
          <p>Задача — сделать органический поиск стабильным источником заказов и перестать терять клиентов, которые уже находят сеть в поиске, но не доезжают до точки.</p>
        </div>
      </Section>

      <Section className="auto-case-section" id="problem" title="Проблема: масштаб создавал «слепую зону»" tone="muted">
        <div className="auto-case-problem">
          <div className="auto-case-problem__number"><strong>{data.network.servicePoints}</strong><span>адресов</span></div>
          <div className="auto-case-copy">
            <p>Водитель, которому прямо сейчас нужно поменять масло или фильтр, открывает поиск и видит {data.network.servicePoints} адресов. Он не понимает, в какой именно точке его готовы принять без лишних звонков и отклонений от маршрута.</p>
            <p>В итоге многие клиенты сворачивали к одиночным сервисам конкурентов — там хотя бы было видно, что подъёмник свободен.</p>
            <p className="auto-case-emphasis">Масштаб сети, который должен был быть преимуществом, работал против бизнеса.</p>
          </div>
        </div>
        <p className="auto-case-explainer">Когда у сети десятки точек, клиенту сложнее быстро понять, куда ехать именно сейчас. Вместо звонков и проверки загрузки части водителей проще выбрать ближайший небольшой сервис. Масштаб сети начинал работать против бизнеса, пока мы не упростили этот выбор.</p>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="market-demand" title="Спрос был большим. Проблема находилась уже после перехода на сайт">
        <p className="eyebrow">Поисковый спрос</p>
        <HorizontalBars items={data.wordstat.market} />
        <p className="auto-viz-note">Высокий спрос сам по себе не решал задачу сети. Для клиента с готовностью заехать важнее было быстро понять, какая точка находится по пути и может принять автомобиль.</p>
        <SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="nearby-demand" title="Часть клиентов уже искала не сервис вообще, а ближайшую точку" tone="blue">
        <p className="eyebrow">Спонтанный спрос</p>
        <HorizontalBars compact items={data.wordstat.nearby} />
        <p className="auto-viz-note">Эти запросы не доказывают заезд сами по себе, но показывают отдельный сценарий выбора: расстояние и расположение становятся частью услуги. Частотности пересекаются и не суммируются.</p>
        <SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="map-demand" title="Пользователь искал точку, а не только описание услуги">
        <p className="eyebrow">Локальный выбор</p>
        <div className="auto-viz-table-wrap">
          <table className="auto-viz-demand-table">
            <thead><tr><th>Запрос</th><th>Частотность</th><th>Что важно клиенту</th></tr></thead>
            <tbody>{data.wordstat.map.map((item) => <tr key={item.query}><td>{item.query}</td><td><strong>{formatNumber(item.value)}</strong></td><td>{item.need}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="auto-viz-note">Список из {data.network.servicePoints} адресов не решал эту задачу. Пользователю нужен был быстрый выбор между ближайшими точками. Частотности не суммируются.</p>
        <SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section" id="research" title="Исследование: я начал не с сайта, а с поведения водителей" tone="muted">
        <div className="auto-case-copy auto-case-copy--narrow"><p>Я провёл глубокое исследование в течение нескольких недель. Работал с данными сам — не делегировал аналитику:</p></div>
        <div className="auto-case-research-grid">{researchSteps.map((step, index) => <article key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></article>)}</div>
        <p className="auto-case-closing-line">Результат исследования оказался неожиданным даже для меня.</p>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="insight" title="Инсайт: два типа спроса" tone="blue">
        <div className="auto-case-copy auto-case-copy--narrow"><p>Я обнаружил, что спрос на услуги автосервиса чётко делится на два типа:</p></div>
        <div className="auto-viz-demand-split">
          {[data.localIntent.planned, data.localIntent.spontaneous].map((item) => (
            <article key={item.label}>
              <header><span>{item.label}</span><strong>{item.range}</strong></header>
              <i><b style={{ '--split-width': `${item.width}%` } as CSSProperties} /></i>
              <ul>{item.actions.map((action) => <li key={action}>{action}</li>)}</ul>
            </article>
          ))}
        </div>
        <p className="auto-case-explainer">Мы увидели два разных сценария: плановый и срочный. Обычный сайт хорошо работал с теми, кто заранее сравнивает услуги и цены, но хуже помогал водителям, которым нужно быстро найти подходящий сервис по пути.</p>
        <p className="auto-case-insight-note">Обычные сайты отлично закрывают плановый спрос, но почти полностью теряют спонтанный. Именно здесь скрывался большой неиспользованный потенциал.</p>
        <SourceLabel>{data.localIntent.note}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-case-solution-section" id="solution" title="Решение: стратегия Zero-Detour">
        <div className="auto-case-copy auto-case-copy--lead">
          <p>На основе исследования я разработал стратегию и предложил клиенту создать операционный инструмент, который я назвал Zero-Detour — «нулевое отклонение от маршрута».</p>
          <p>Это не просто «доработка сайта», а двойная стратегия:</p>
        </div>
        <div className="auto-case-solution-grid">
          <article><div aria-hidden="true" className="auto-case-solution-grid__icon">↗</div><h3>Десктоп-версия — фундамент доверия и планового трафика</h3><p>Я разработал структуру и требования к наполнению: подробные карточки каждого масла и фильтра, экспертные статьи под популярные марки автомобилей, разборы нюансов замены. Сайт превратился в авторитетную экспертную площадку, которая стабильно привлекает органический трафик и формирует доверие к бренду.</p></article>
          <article className="auto-case-solution-grid__mobile"><div aria-hidden="true" className="auto-case-solution-grid__icon">◎</div><h3>Мобильная версия — операционный продукт Zero-Detour</h3><p>Я разработал концепцию инструмента, которого на рынке практически нет. Мобильная версия стала «умным навигатором» для спонтанных решений:</p><ul>{mobileFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul></article>
        </div>
        <div className="auto-viz-zero-detour">
          <p className="eyebrow">Zero-Detour</p>
          <h2>Сократили выбор с {data.network.servicePoints} адресов до {data.network.suggestedPoints} точек по маршруту</h2>
          <ol>
            {data.localIntent.zeroDetour.map((step, index) => (
              <li key={step.label}>
                <span>{String(index + 1).padStart(2, '0')}</span><strong>{step.value}</strong><p>{step.label}</p>{step.note && <small>{step.note}</small>}
                {step.value === 'Статус' && <div className="auto-viz-zero-detour__status">{data.localIntent.stationStatuses.map((point) => <i className={`is-${point.tone}`} key={point.label}>{point.label} · {point.status}</i>)}</div>}
              </li>
            ))}
          </ol>
        </div>
        <p className="auto-case-explainer">Вместо стандартного списка адресов мобильная версия сайта стала помогать выбрать подходящую точку по маршруту. Пользователь видит 1–2 удобные станции и может быстрее перейти к записи без перебора десятков адресов.</p>
        <div className="auto-viz-before-after">
          <article><span>До</span><ul>{data.localIntent.before.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><span>После</span><ul>{data.localIntent.after.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <p>Масштаб сети перестал усложнять выбор и начал работать как преимущество.</p>
        </div>
        <div className="auto-case-solution-footer"><p>Я подготовил SEO-требования к структуре, контенту и технической реализации, проконтролировал внедрение и проверил результат после запуска.</p><p>Такой операционный инструмент особенно эффективен именно для сетей от 30 и более станций. Когда точек уже много, без правильной логистики клиентопотока масштаб начинает работать против бизнеса.</p></div>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="districts" title="Спрос распределялся по городу неравномерно" tone="muted">
        <p className="eyebrow">География</p>
        <div className="auto-viz-table-wrap">
          <table className="auto-viz-heatmap">
            <thead><tr><th>Район</th><th>Автосервис</th><th>Замена масла</th></tr></thead>
            <tbody>{data.districts.map((row) => (
              <tr key={row.district}>
                <th>{row.district}</th>
                {[row.service, row.oil].map((cell) => <td key={cell.query} style={{ '--heat': 0.12 + (cell.value / districtMax) * 0.62 } as CSSProperties}><span>{cell.query}</span><strong>{formatNumber(cell.value)}</strong></td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="auto-viz-note">Показаны отдельные репрезентативные запросы. Значения внутри района не суммируются.</p>
        <SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="action-intent" title="Часть запросов уже содержала следующее действие клиента">
        <p className="eyebrow">Готовность к заезду</p>
        <div className="auto-viz-intents">{data.wordstat.transactional.map((item) => <article key={item.query}><span>{item.intent}</span><strong>{formatNumber(item.value)}</strong><p>«{item.query}»</p></article>)}</div>
        <p className="auto-viz-note">Это разные формулировки спроса, а не последовательные этапы воронки. Запрос про бесплатную замену показан только как пример коммерческого предложения.</p>
        <SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="topvisor" title="Поисковая видимость росла вместе с внедрением стратегии" tone="blue">
        <p className="eyebrow">Topvisor</p>
        <div className="auto-viz-proof-layout">
          <LineChart ariaLabel="Динамика запросов в ТОП-3, ТОП-10 и ТОП-20" months={data.topvisor.months} series={data.topvisor.series} />
          <div className="auto-viz-proof-context"><span><strong>{data.topvisor.querySet}</strong> контрольных запросов</span><span><strong>{data.topvisor.monthlyImpressions}</strong> показов в месяц</span><span><strong>{data.topvisor.cluster}</strong> кластер</span><span><strong>{data.topvisor.period}</strong> период наблюдения</span></div>
        </div>
        <MetricStrip items={data.topvisor.kpis} />
        <SourceLabel>{data.topvisor.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="gsc" title="Органический спрос стал чаще доходить до сайта">
        <p className="eyebrow">Google Search Console</p>
        <div className="auto-viz-chart-pair">
          <figure><figcaption>Клики</figcaption><LineChart ariaLabel="Динамика кликов из Google" months={data.gsc.months} series={[{ label: 'Клики', color: '#2563eb', values: clicks }]} /></figure>
          <figure><figcaption>Показы</figcaption><LineChart ariaLabel="Динамика показов в Google" months={data.gsc.months} series={[{ label: 'Показы', color: '#13875b', values: impressions }]} /></figure>
        </div>
        <MetricStrip items={data.gsc.kpis} />
        <p className="auto-viz-note">Данные GSC показывают поисковую динамику и не смешиваются с физическими заездами.</p>
        <SourceLabel>{data.gsc.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="metrika" title="Мобильный пользователь стал быстрее переходить к целевому действию" tone="muted">
        <p className="eyebrow">Яндекс Метрика</p>
        <div className="auto-viz-proof-layout auto-viz-proof-layout--metrika">
          <LineChart ariaLabel="Конверсия мобильного органического трафика" months={data.metrika.months} series={[{ label: 'Конверсия, %', color: '#2563eb', values: conversion }]} />
          <div className="auto-viz-phone">
            <span>Мобильный сценарий</span>
            <strong>{data.metrika.kpis[0].value}</strong>
            <p>конверсия органического трафика в целевое действие</p>
            <i>+42%</i>
          </div>
        </div>
        <MetricStrip items={data.metrika.kpis} />
        <SourceLabel>{data.metrika.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="result" title="Три результата одной механики">
        <div className="auto-viz-results">
          {data.networkResults.items.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong><h3>{item.label}</h3><p>{item.note}</p>
              <div><span><b>{formatNumber(item.before)}{item.unit}</b>до</span><i>→</i><span><b>{formatNumber(item.after)}{item.unit}</b>после</span></div>
            </article>
          ))}
        </div>
        <p className="auto-case-explainer">Эта механика помогла эффективнее использовать уже существующую сеть без открытия новых точек. Трафик распределился между станциями лучше: выросла конверсия, увеличилась загрузка сети и стало больше заездов в периферийные сервисы.</p>
        <p className="auto-viz-result-line">Новые точки не открывали.</p>
        <SourceLabel>{data.networkResults.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="local-presence" title="Привели сайт и локальные профили к одной системе" tone="blue">
        <p className="eyebrow">Локальное присутствие</p>
        <div className="auto-viz-ecosystem">{data.localPresence.system.map((item, index) => <div key={item}><span>{item}</span>{index < data.localPresence.system.length - 1 && <b>↔</b>}</div>)}</div>
        <div className="auto-viz-local-groups">{data.localPresence.dataGroups.map((group) => <article key={group.title}><h3>{group.title}</h3><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
        <p className="auto-viz-result-line">{data.network.servicePoints} точек · единый стандарт локальной информации</p>
        <SourceLabel>Источник: данные проекта</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="yandex-business" title="Карточка точки должна помогать выбрать сервис до перехода на сайт">
        <div className="auto-viz-business-layout">
          <div className="auto-viz-checklist">{data.localPresence.businessChecklist.map((item) => <span key={item}><b>✓</b>{item}</span>)}</div>
          <div className="auto-viz-services"><p className="eyebrow">Яндекс Услуги</p><h3>Услуги вынесли туда, где пользователь уже выбирает исполнителя</h3>{data.localPresence.services.map((service) => <span key={service}>{service}</span>)}<small>Для каждой: {data.localPresence.serviceFields.join(' · ')}</small></div>
        </div>
        <p className="auto-viz-note">Яндекс Бизнес использовался как отдельная точка контакта с локальным спросом.</p>
        <SourceLabel>Источник: Яндекс Бизнес · Карты · Яндекс Услуги · данные проекта</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="reputation" title="Отзывы использовали как источник проблем, а не только как рейтинг" tone="muted">
        <p className="eyebrow">Отзывы</p>
        <div className="auto-viz-review-process">{data.reputation.process.map((step, index) => <div key={step}><span>{step}</span>{index < data.reputation.process.length - 1 && <b>→</b>}</div>)}</div>
        <div className="auto-viz-review-topics">{data.reputation.topics.map((topic) => <div key={topic.label}><span>{topic.label}<strong>{topic.value}%</strong></span><i><b style={{ '--bar-width': `${topic.value}%` } as CSSProperties} /></i></div>)}</div>
        <SourceLabel>{data.reputation.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section auto-viz-section" id="ai-visibility" title="Отдельно контролировали, как компания представлена в AI-ответах" tone="blue">
        <p className="eyebrow">AI-видимость</p>
        <div className="auto-viz-ai-layout">
          <LineChart ariaLabel="Динамика Share of Voice в Алисе AI" months={data.aiVisibility.months} series={[{ label: 'Share of Voice, %', color: '#7c3aed', values: data.aiVisibility.shareOfVoice }]} />
          <div className="auto-viz-ai-panel"><span>Яндекс Вебмастер → Видимость сайта в Алисе AI</span><strong>{data.aiVisibility.shareOfVoice[0]}% → {data.aiVisibility.shareOfVoice.at(-1)}%</strong><p>Share of Voice</p><b>{data.aiVisibility.mentions.before} → {data.aiVisibility.mentions.after}</b><small>контрольных запросов с упоминанием сайта</small><ul>{data.aiVisibility.controls.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <p className="auto-case-explainer">Поисковые сценарии меняются: часть пользователей получает готовый ответ прямо от ИИ. После оптимизации данных видимость сети в ответах Алисы выросла в 4 раза, поэтому бренд стал чаще появляться в новых форматах поиска.</p>
        <p className="auto-viz-note">Контролировали присутствие сайта среди источников и примеры запросов, по которым он появлялся в ответах.</p>
        <SourceLabel>{data.aiVisibility.source}</SourceLabel>
      </Section>

      <Section className="auto-case-section" id="conclusion" title="Вывод: урок для владельцев сетей">
        <div className="auto-case-conclusion"><p>Главный потенциал роста для сетей от 30+ точек лежит не только в привлечении нового трафика, а в умении превращать существующий трафик в ровную загрузку всех станций.</p><p>Я помогаю находить такие скрытые инсайты через глубокие исследования поведения клиентов и превращать их в конкретные SEO-стратегии и операционные решения. Zero-Detour — пример того, как одно качественное исследование может дать конкурентное преимущество, которого пока практически ни у кого нет.</p></div>
      </Section>

      <Section className="auto-case-section" id="role" title="Моя роль в проекте" tone="muted">
        <div className="auto-case-role-grid"><ol>{roles.map((role) => <li key={role}>{role}</li>)}</ol><p>Проект вёлся в рамках SEO-сопровождения. Срок — {data.network.firstResults} до первых измеримых результатов. Период февраль — август отражает более длинное наблюдение за поисковой динамикой.</p></div>
      </Section>

      <Section className="auto-case-cta" id="contact" tone="muted">
        <div className="auto-case-cta__layout"><div className="auto-case-cta__copy"><p className="eyebrow">Следующий шаг</p><h2>Проверим, где сеть теряет готовых клиентов</h2><p>Посмотрю, как локальный спрос проходит путь от поиска до выбора точки, и отмечу места, где сеть недополучает обращения и заезды.</p><ul><li>Какие запросы уже дают потенциал роста</li><li>Какие точки недополучают локальный трафик</li><li>Что изменить в страницах и маршрутах клиента</li></ul></div><div className="auto-case-cta__form"><LeadForm compact context="Локальное SEO для сети точек" description="Достаточно ссылки и контакта. Я посмотрю публичные данные и вернусь с предметной предварительной оценкой." eyebrow="Разбор локального спроса" serviceCode="case_3" submitLabel="Проверить точки роста" title="Получить предварительную оценку" /></div></div>
      </Section>
    </>
  )
}
