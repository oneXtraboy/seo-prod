import type { CSSProperties, ReactNode } from 'react'
import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import { Section } from '../components/ui'
import { caseMerchData } from '../data/merchCaseData'

const workStreams = [
  { number: '01', label: 'Техническая база', title: 'Вернуть страницы в поиск', text: 'Проверил индексацию, robots.txt, sitemap, редиректы, скорость загрузки. Выявил, что 13 из 20 страниц практически не участвовали в выдаче из-за дублей, отсутствия canonical и конфликтов hreflang. Устранил технические ограничения, оптимизировал Core Web Vitals до зелёной зоны, сделал мобильную версию полностью функциональной.' },
  { number: '02', label: 'SEO-структура', title: 'Собрать спрос корпоративных клиентов', text: 'Пересобрал семантическое ядро под реальные запросы корпоративных клиентов: «мерч на заказ», «корпоративный мерч оптом», «печать на одежде оптом Москва» и т.д. Перекластеризовал запросы, перераспределил релевантность между страницами, усилил метатеги, заголовки H1–H3, внедрил микроразметку Schema.org. Сделал перелинковку с учётом коммерческих приоритетов.' },
  { number: '03', label: '42 новые страницы', title: 'Открыть Московскую область', text: 'Добавил региональные страницы по направлениям и городам Подмосковья. Это открыло стабильное присутствие в городах-спутниках — появились регулярные заявки из Московской области.' },
  { number: '04', label: 'UX и коммерческая подача', title: 'Показать производителя, а не посредника', text: 'Проработал страницы услуг и технологий нанесения, ускорил путь от поискового запроса до заявки. Усилил визуальную подачу — добавил качественные фото реализованных проектов с описаниями. Доработал коммерческие блоки, сделал их заметнее.' },
  { number: '05', label: 'Калькулятор и кейсы', title: 'Снять два главных возражения B2B', text: 'Добавил калькулятор стоимости тиража прямо от 10 штук — клиент сразу видит выгодные условия и скидки. Создал раздел «Кейсы и реализованные проекты» — фотографии, описания задач, результаты. Это сняло главное возражение B2B: «А есть ли опыт?»' },
  { number: '06', label: 'Работа по динамике', title: 'Корректировать после каждого внедрения', text: 'На протяжении 9 месяцев отслеживал позиции, динамику по кластерам, распределение запросов. Оперативно вносил корректировки после каждого внедрения и апдейта поисковых систем.' },
]

const results = [
  ['Количество страниц с контентом', '20 (шаблонные, без текстов)', 'Полностью наполнен + 42 новые'],
  ['Коммерческие запросы (Москва)', 'ТОП-40–60', '68% в ТОП-10, 51% в ТОП-3'],
  ['Доля органики в заявках', '12%', '38%'],
  ['Органический трафик', 'Базовый', '×4,2'],
  ['Корпоративные заказы', 'Минимальные и нестабильные', '×3,1'],
  ['Средний чек по органике', '—', '+28%'],
  ['Общая выручка от органического канала', '—', '×4,7'],
  ['ROI SEO-канала', 'Отрицательный / нулевой', '380%'],
  ['Окупаемость инвестиций в SEO', '—', '4 месяца'],
]

const beforeAfter = [
  ['20 пустых страниц и нерабочая мобильная версия', 'Полноценный сайт, который отражает ценности компании'],
  ['Запросы в ТОП-40–60', '68% в ТОП-10 — видимость среди целевых клиентов'],
  ['Скрытые преимущества и условия', 'Калькулятор, кейсы, коммерческие блоки — заказы ×3,1'],
  ['SEO как статья расходов', 'Предсказуемый канал роста с ROI 380%'],
]

const projectRoles = [
  'Технический аудит и устранение ограничений',
  'Пересборка семантики, кластеров и релевантности страниц',
  'Требования к контенту, структуре и мобильной версии',
  'Контроль внедрения калькулятора, кейсов и коммерческих блоков',
  'Регулярный мониторинг динамики и оперативные корректировки',
]

const formatNumber = new Intl.NumberFormat('ru-RU').format

type ChartSeries = { readonly color: string; readonly label: string; readonly values: readonly number[] }

function SourceLabel({ children }: { children: ReactNode }) {
  return <p className="merch-proof-source">{children}</p>
}

function HorizontalBars({ items }: { items: readonly { readonly query: string; readonly value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value))
  return <div className="merch-proof-bars">{items.map((item) => <div key={item.query}><p><span>{item.query}</span><strong>{formatNumber(item.value)}</strong></p><i><b style={{ '--merch-bar': `${Math.max((item.value / max) * 100, 3)}%` } as CSSProperties} /></i></div>)}</div>
}

function LineChart({ ariaLabel, months, series, suffix = '' }: { ariaLabel: string; months: readonly string[]; series: readonly ChartSeries[]; suffix?: string }) {
  const width = 760
  const height = 320
  const inset = { top: 37, right: 34, bottom: 48, left: 44 }
  const values = series.flatMap((item) => [...item.values])
  const rawMin = Math.min(0, ...values)
  const rawMax = Math.max(0, ...values)
  const padding = Math.max((rawMax - rawMin) * .1, 1)
  const min = rawMin < 0 ? rawMin - padding : 0
  const max = rawMax + padding
  const range = max - min
  const plotWidth = width - inset.left - inset.right
  const plotHeight = height - inset.top - inset.bottom
  const x = (index: number) => inset.left + (plotWidth * index) / Math.max(months.length - 1, 1)
  const y = (value: number) => inset.top + plotHeight - ((value - min) / range) * plotHeight

  return (
    <div className="merch-proof-chart">
      <svg aria-label={ariaLabel} role="img" viewBox={`0 0 ${width} ${height}`}>
        {[0, 1, 2, 3, 4].map((step) => { const lineY = inset.top + (plotHeight * step) / 4; return <line className="merch-proof-chart__grid" key={step} x1={inset.left} x2={width - inset.right} y1={lineY} y2={lineY} /> })}
        {min < 0 && <line className="merch-proof-chart__zero" x1={inset.left} x2={width - inset.right} y1={y(0)} y2={y(0)} />}
        {series.map((item) => <g key={item.label}><polyline fill="none" points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')} stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />{item.values.map((value, index) => <g key={`${item.label}-${months[index]}`}><circle cx={x(index)} cy={y(value)} fill="#fff" r="5.5" stroke={item.color} strokeWidth="4" /><text className="merch-proof-chart__value" x={x(index)} y={y(value) - 12}>{value > 999 ? formatNumber(value) : value}{suffix}</text></g>)}</g>)}
        {months.map((month, index) => <text className="merch-proof-chart__month" key={month} x={x(index)} y={height - 16}>{month}</text>)}
      </svg>
      {series.length > 1 && <div className="merch-proof-legend">{series.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}</div>}
    </div>
  )
}

function MetricStrip({ items }: { items: readonly { readonly label: string; readonly value: string }[] }) {
  return <div className="merch-proof-metrics">{items.map((item) => <article key={item.label}><strong>{item.value}</strong><span>{item.label}</span></article>)}</div>
}

function ProcessFlow({ items }: { items: readonly string[] }) {
  return <ol className="merch-proof-process">{items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></li>)}</ol>
}

export function MerchProductionCasePage() {
  const data = caseMerchData
  const scaleDemand = [...data.wordstat.general, data.wordstat.regional[0], data.wordstat.regional[1], ...data.wordstat.products]
  const logoDemand = [...data.wordstat.logo, data.wordstat.regional[4], data.wordstat.regional[5]]
  const commercialRows = [data.wordstat.commercial[0], data.wordstat.price, data.wordstat.wholesale[0], data.wordstat.commercial[1], data.wordstat.regional[6], data.wordstat.wholesale[1], ...data.wordstat.commercial.slice(2)]
  const clicks = data.gsc.series.map((row) => row.clicks)
  const impressions = data.gsc.series.map((row) => row.impressions)

  return (
    <>
      <PageHero
        aside={<figure className="merch-case-hero-visual merch-case-hero-visual--image"><img alt="Рост SEO-показателей сайта производства корпоративного мерча: 20 страниц, 42 новые страницы и ROI 380%" height="1024" loading="eager" src="/images/cases/seo-proizvodstvo-mercha/seo-proizvodstvo-mercha-roi-380.webp" title="SEO для производства мерча: рост заказов и ROI 380%" width="1536" /></figure>}
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Все кейсы', path: '/cases/' }, { label: 'B2B · производство мерча' }]}
        eyebrow="B2B · производство мерча · Москва и Московская область"
        summary="Производство корпоративного мерча с собственным цехом: пошив, нанесение, работа по брендбуку и тиражи от 10 штук"
        title="Как производство мерча превратило сайт из 20 пустых страниц в канал с ROI 380%"
      >
        <div aria-label="Результаты проекта" className="merch-case-hero-metrics merch-case-hero-metrics--proof">
          <div><strong>{data.business.roi}%</strong><span>ROI</span></div><div><strong>×{data.business.organicTrafficGrowth}</strong><span>органический трафик</span></div><div><strong>×{data.business.corporateOrdersGrowth}</strong><span>корпоративные заказы</span></div><div><strong>{data.business.organicLeadShare}%</strong><span>органики в заявках</span></div><div><strong>{data.business.top10Share}%</strong><span>запросов в ТОП-10</span></div><div><strong>{data.business.paybackMonth} месяца</strong><span>до окупаемости</span></div><div><strong>{data.period}</strong><span>работы</span></div>
        </div>
      </PageHero>

      <Section className="board-case-section merch-case-section" id="client" title="Клиент и задача">
        <div className="merch-case-client"><p>Производство корпоративного мерча с собственным цехом. Пошив, нанесение (шелкография, ДТФ, вышивка), работа по брендбуку. Минимальный тираж — от 10 штук, гибкая система оптовых скидок. Клиенты — средний и крупный бизнес, event-агентства, организаторы мероприятий.</p><aside><span>Задача</span><p>Превратить сайт из пустой витрины в стабильный канал B2B-продаж, чтобы клиенты из поиска сразу видели: это производитель, а не посредник, и условия выгодные.</p></aside></div>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="printing-demand" title="Печать на одежде — отдельный большой слой спроса" tone="blue">
        <p className="eyebrow">Поисковый спрос</p><HorizontalBars items={scaleDemand} /><p className="merch-proof-note">Показаны отдельные запросы Wordstat. Частотности пересекаются и не суммируются. Этот блок показывает масштаб спроса и не заменяет основной бизнес-сюжет кейса.</p><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="demand-structure" title="Клиент ищет не просто печать">
        <p className="eyebrow">Структура спроса</p>
        <div className="merch-proof-semantic-map"><div><strong>Печать<br />на одежде</strong></div>{data.structure.semanticBranches.map((branch) => <article key={branch.title}><h3>{branch.title}</h3>{branch.items.map((item) => <span key={item}>{item}</span>)}</article>)}</div>
        <p className="merch-proof-note">Поиск разделяется не только по изделию. Пользователь уточняет технологию, тип нанесения, объём и условия заказа.</p><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="different-tasks" title="Один запрос ведёт к разным бизнес-задачам" tone="muted">
        <div className="merch-proof-branch"><div className="merch-proof-branch__start">Нужна печать на одежде</div>{data.structure.branchQuestions.map((branch, index) => <article key={branch.question}><span>{String(index + 1).padStart(2, '0')}</span><h3>{branch.question}</h3><p>{branch.items.join(' · ')}</p></article>)}</div>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="technologies" title="Один запрос на печать может требовать разных технологий">
        <p className="eyebrow">Выбор технологии</p>
        <div className="merch-proof-tech"><article><span>Шелкография</span><strong>{formatNumber(data.wordstat.technologies[0].value)}</strong><p>«{data.wordstat.technologies[0].query}»</p><strong>{formatNumber(data.wordstat.regional[2].value)}</strong><p>«{data.wordstat.regional[2].query}»</p><small>Подходит для крупных тиражей и задач, где технология действительно соответствует макету и материалу.</small></article><article><span>DTF</span><strong>{formatNumber(data.wordstat.technologies[1].value)}</strong><p>«{data.wordstat.technologies[1].query}»</p><strong>{formatNumber(data.wordstat.regional[3].value)}</strong><p>«{data.wordstat.regional[3].query}»</p><small>Подходит для других типов изображений, материалов и тиражей.</small></article></div>
        <p className="merch-proof-note">Сайт должен помочь определить подходящий способ нанесения под конкретный заказ — без утверждения абсолютного превосходства одной технологии.</p><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="logo-demand" title="В запросах отдельно видна задача брендирования" tone="blue">
        <p className="eyebrow">B2B-интент</p><HorizontalBars items={logoDemand} /><p className="merch-proof-note">Здесь пользователь ищет уже не просто изделие, а услугу нанесения фирменной символики.</p><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="commercial-intent" title="Часть запросов уже содержит условия выбора подрядчика">
        <p className="eyebrow">Готовность к заказу</p><div className="merch-proof-table-wrap"><table className="merch-proof-table"><thead><tr><th>Запрос</th><th>Частотность</th><th>Что показывает интент</th></tr></thead><tbody>{commercialRows.map((item) => <tr key={item.query}><td>{item.query}</td><td><strong>{formatNumber(item.value)}</strong></td><td>{item.intent}</td></tr>)}</tbody></table></div><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="structure-logic" title="Спрос переводится в релевантную коммерческую структуру" tone="muted">
        <ProcessFlow items={data.structure.pageLogic.map((item) => `${item.title}: ${item.items.join(', ')}`)} /><p className="merch-proof-note">Это схема логики структуры. Новые маршруты или страницы в рамках этой задачи не создавались.</p><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section" id="problem" title="Проблема: сайт был, но не продавал" tone="muted">
        <div className="merch-case-problem"><div><p>На старте — 20 страниц. Без описаний услуг, без преимуществ, без примеров работ. Мобильная версия нефункциональная — отпугивала корпоративных клиентов, которые заходят с телефона.</p><ul><li>Основные коммерческие запросы держались в ТОП-40–60</li><li>Доля органического трафика в новых заявках — всего 12%</li><li>SEO воспринималось как статья расходов с отрицательным ROI</li><li>Новые клиенты приходили через знакомства и холодные продажи — масштабировать было невозможно</li></ul></div><aside><span>Сильные условия уже были</span><p>Тираж от 10 штук, реальные оптовые скидки, качество материалов и нанесения по брендбуку, опыт работы с крупными заказчиками.</p><strong>Но потенциальные клиенты об этом не знали — потому что сайт не говорил.</strong></aside></div>
        <p className="merch-case-explainer">У компании уже был собственный цех, выгодные цены и готовность шить тиражи от 10 штук — но сайт об этом просто молчал. Из-за отсутствия нормальных посадочных страниц поисковые роботы хуже понимали структуру сайта, а потенциальные клиенты не видели подтверждений опыта и уходили к другим подрядчикам.</p>
      </Section>

      <Section className="board-case-section merch-case-section" id="work" title="Что я сделал" tone="blue">
        <p className="merch-case-work-intro">Я работал с проектом сам — от аудита до контроля внедрения.</p><div className="merch-case-work-grid">{workStreams.map((item) => <article key={item.number}><header><span>{item.number}</span><small>{item.label}</small></header><h3>{item.title}</h3><p>{item.text}</p>{item.number === '05' && <p className="merch-case-explainer merch-case-explainer--card">В B2B-закупках клиенту важно быстро закрыть два вопроса: сколько это стоит и можно ли доверять подрядчику. Поэтому на сайте появились калькулятор стоимости и кейсы с реальными фотографиями. Теперь заказчик может заранее оценить тираж и увидеть подтверждение опыта ещё до обращения.</p>}</article>)}</div>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="semantic-before-after" title="Из общего спроса — в конкретную задачу клиента">
        <div className="merch-proof-before-after"><article><span>До</span><h3>Одна широкая услуга</h3><ul>{data.structure.before.map((item) => <li key={item}>{item}</li>)}</ul></article><article><span>После</span><h3>Страница отвечает на сценарий</h3><ul>{data.structure.after.map((item) => <li key={item}>{item}</li>)}</ul></article></div>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="topvisor" title="68% контрольных запросов вышли в ТОП-10" tone="blue">
        <p className="eyebrow">Topvisor</p><div className="merch-proof-chart-layout"><LineChart ariaLabel="Динамика 50 коммерческих запросов" months={data.topvisor.months} series={data.topvisor.series} /><aside><strong>{data.topvisor.top10Final} из {data.topvisor.querySet}</strong><span>запросов в ТОП-10</span><b>{data.topvisor.top10Share}%</b></aside></div><MetricStrip items={data.topvisor.kpis} /><SourceLabel>{data.topvisor.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="gsc" title="Поисковая видимость росла вместе с целевыми переходами">
        <p className="eyebrow">Google Search Console</p><div className="merch-proof-chart-pair"><figure><figcaption>Клики</figcaption><LineChart ariaLabel="Динамика кликов Google Search Console" months={data.gsc.months} series={[{ label: 'Клики', color: '#d95d31', values: clicks }]} /></figure><figure><figcaption>Показы</figcaption><LineChart ariaLabel="Динамика показов Google Search Console" months={data.gsc.months} series={[{ label: 'Показы', color: '#2563eb', values: impressions }]} /></figure></div><MetricStrip items={data.gsc.kpis} /><SourceLabel>{data.gsc.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="metrika" title="Органический трафик вырос в 4,2 раза" tone="muted">
        <p className="eyebrow">Яндекс Метрика</p><div className="merch-proof-chart-layout"><LineChart ariaLabel="Динамика органического трафика" months={data.metrika.months} series={[{ label: 'Органический трафик', color: '#d95d31', values: data.metrika.organicTraffic }]} /><aside><strong>×{data.business.organicTrafficGrowth}</strong><span>органический трафик</span><small>{formatNumber(data.metrika.organicTraffic[0])} → {formatNumber(data.metrika.organicTraffic.at(-1) ?? 0)}</small></aside></div>
        <div className="merch-proof-quality"><article><strong>{data.metrika.behavior.bounce.before}% → {data.metrika.behavior.bounce.after}%</strong><span>{data.metrika.behavior.bounce.label}</span></article><article><strong>{data.metrika.behavior.depth.before} → {data.metrika.behavior.depth.after}</strong><span>{data.metrika.behavior.depth.label}</span></article><article><strong>{data.metrika.behavior.time.before} → {data.metrika.behavior.time.after}</strong><span>{data.metrika.behavior.time.label}</span></article></div><p className="merch-proof-note">Показатели описывают качество посещений и не используются как утверждение о поведенческих факторах ранжирования.</p><SourceLabel>{data.metrika.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="orders" title="Корпоративные заказы росли одновременно с поисковой видимостью">
        <div className="merch-proof-chart-layout"><LineChart ariaLabel="Обезличенный индекс корпоративных заказов" months={data.gsc.months} series={[{ label: 'Индекс заказов', color: '#13875b', values: data.orders.series }]} /><aside><strong>×{data.business.corporateOrdersGrowth}</strong><span>корпоративные заказы</span><small>{data.orders.series[0]} → {data.orders.series.at(-1)}</small></aside></div><p className="merch-proof-note">Показан нормализованный обезличенный индекс, а не абсолютное количество заказов.</p><SourceLabel>{data.orders.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="organic-share" title="Органический поиск стал значимым источником заявок" tone="blue">
        <div className="merch-proof-contribution"><div style={{ '--merch-share': `${data.business.organicLeadShare}%` } as CSSProperties}><strong>{data.business.organicLeadShare}%</strong><span>Органика</span></div><div><strong>{data.business.otherLeadShare}%</strong><span>Остальные каналы</span></div></div><p className="merch-proof-note">К концу периода органический поиск формировал {data.business.organicLeadShare}% заявок.</p><SourceLabel>{data.business.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="roi" title="SEO окупилось на четвёртом месяце">
        <p className="eyebrow">Экономика канала</p><div className="merch-proof-roi"><LineChart ariaLabel="Накопительная динамика ROI" months={data.gsc.months} series={[{ label: 'ROI', color: '#d95d31', values: data.business.roiSeries }]} suffix="%" /><aside><span>М{data.business.paybackMonth}</span><strong>точка окупаемости</strong><span>М{data.business.periodMonths}</span><b>ROI {data.business.roi}%</b></aside></div><p className="merch-case-explainer">Этот график показывает, что SEO стало не просто источником трафика, а рабочим каналом привлечения B2B-клиентов. После запуска новых страниц и усиления коммерческой подачи вложения начали окупаться, а к концу периода SEO-канал вышел на ROI 380%.</p><SourceLabel>{data.business.roiSource}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="search-to-order" title="Поиск стал одним из входов в корпоративный заказ" tone="muted">
        <ProcessFlow items={data.structure.causalFlow} /><div className="merch-proof-causal-kpis"><span><strong>×{data.business.organicTrafficGrowth}</strong>органический трафик</span><span><strong>{data.business.organicLeadShare}%</strong>заявок из органики</span><span><strong>×{data.business.corporateOrdersGrowth}</strong>корпоративные заказы</span></div><p className="merch-proof-note">Рост поисковой видимости и органического трафика происходил одновременно с ростом корпоративных заказов. Эти показатели не соединяются как доказанная прямая причинность.</p>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="b2b-page" title="Запрос приводит на страницу. Решение о заявке принимается уже на ней">
        <div className="merch-proof-checklist">{data.structure.pageChecklist.map((item) => <article key={item.title}><span>✓</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </Section>

      <Section className="board-case-section merch-case-section" id="result" title="Результаты">
        <div className="merch-case-result-lead"><div><strong>42</strong><span>новые страницы по Московской области</span></div><p>Стабильные заявки из городов-спутников.</p></div><div className="merch-case-table-wrap"><table className="merch-case-table"><thead><tr><th>Показатель</th><th>Было</th><th>Стало</th></tr></thead><tbody>{results.map(([metric, before, after]) => <tr key={metric}><th scope="row">{metric}</th><td>{before}</td><td><strong>{after}</strong></td></tr>)}</tbody></table></div>
        <div className="merch-proof-dashboard"><article><strong>{data.business.roi}%</strong><span>ROI</span></article><article><strong>×{data.business.organicTrafficGrowth}</strong><span>органический трафик</span></article><article><strong>×{data.business.corporateOrdersGrowth}</strong><span>корпоративные заказы</span></article><article><strong>{data.business.organicLeadShare}%</strong><span>органики в заявках</span></article><article><strong>{data.business.top10Share}%</strong><span>запросов в ТОП-10</span></article><article><strong>{data.business.paybackMonth} месяца</strong><span>до окупаемости</span></article><article><strong>{data.period}</strong><span>работы</span></article></div><p className="merch-case-explainer">Итоговые цифры показывают, что сайт перестал быть пустой витриной и начал работать как полноценный канал продаж. Рост произошел не только по посещаемости: увеличилось количество корпоративных заказов, расширилось присутствие в поиске и вырос вклад органики в заявки.</p><SourceLabel>{data.business.source}</SourceLabel>
      </Section>

      <Section className="board-case-section merch-case-section" id="change" title="Что изменилось по сути" tone="muted">
        <div className="merch-case-before-after"><header><span>До</span><span>После</span></header>{beforeAfter.map(([before, after]) => <article key={before}><p>{before}</p><b aria-hidden="true">→</b><p>{after}</p></article>)}</div>
      </Section>

      <Section className="board-case-section merch-case-section merch-proof-section" id="evidence" title="Каждый источник отвечает только за свои данные">
        <div className="merch-proof-evidence"><article><strong>Wordstat</strong><p>что ищут пользователи</p></article><article><strong>Topvisor</strong><p>видимость коммерческих запросов</p></article><article><strong>Google Search Console</strong><p>показы, клики, CTR, позиции</p></article><article><strong>Яндекс Метрика</strong><p>органический трафик и поведение</p></article><article><strong>Данные проекта</strong><p>заказы, доля органики, ROI и окупаемость</p></article></div>
      </Section>

      <Section className="board-case-section merch-case-section" id="conclusion" title="Вывод" tone="blue">
        <div className="merch-case-conclusion"><p>Сайт начал чётко отражать все сильные стороны: качество производства, подтверждённый опыт, гибкость и выгодные условия работы от 10 штук. Клиенты из поиска сразу понимают, с кем имеют дело — с надёжным производителем, а не посредником.</p><aside><p>SEO превратилось из «непонятной статьи расходов» в один из главных предсказуемых каналов роста.</p><strong>Руководство теперь может планировать продажи, опираясь на стабильный приток заявок из органического поиска.</strong></aside></div>
      </Section>

      <Section className="board-case-section merch-case-section" id="role" title="Моя роль в проекте"><div className="board-case-role merch-case-role"><ol>{projectRoles.map((role) => <li key={role}>{role}</li>)}</ol><aside><strong>{data.period}</strong><p>Проект вёлся в рамках SEO-сопровождения.</p></aside></div></Section>

      <Section className="board-case-disclaimer" id="disclaimer" title="Примечание" tone="muted"><p>Рост заказов и выручки — результат комплексной работы с сайтом, структурой и коммерческой подачей. ROI 380% зависит также от качества производства, цен и работы отдела продаж клиента. Я фиксирую состав работ, критерии качества и способ проверки результата.</p></Section>

      <Section className="board-case-cta merch-case-cta" id="contact" tone="muted"><div className="board-case-cta__layout"><div className="board-case-cta__copy"><p className="eyebrow">Следующий шаг</p><h2>Производите мерч или корпоративную продукцию, а сайт не приносит заказы?</h2><p>Покажу, как раскрыть ваши сильные условия в поиске и превратить сайт в канал B2B-продаж.</p></div><div className="board-case-cta__form"><LeadForm compact context="B2B-сайт производства мерча" description="Обычно отвечаю в рабочий день или на следующий. Для первой оценки достаточно ссылки на сайт." eyebrow="Предварительная оценка" serviceCode="case_5" submitLabel="Получить предварительный разбор" title="Разобрать сайт производства" /></div></div></Section>
    </>
  )
}
