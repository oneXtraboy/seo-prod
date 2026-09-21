import type { ReactNode } from 'react'
import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import { Section } from '../components/ui'
import { threePLCaseData as data, threePLSummary as summary } from '../data/threePLCaseData'

const number = new Intl.NumberFormat('ru-RU')
const decimal = (value: number) => String(value).replace('.', ',')

function Source({ children }: { children: ReactNode }) {
  return <p className="threepl-proof-source">{children}</p>
}

function chartPoints(values: readonly number[], max: number) {
  return values.map((value, index) => `${24 + index * (552 / (values.length - 1))},${190 - value / max * 150}`).join(' ')
}

function TrendChart({ label, labels, series }: { label: string; labels: readonly string[]; series: readonly { className: string; values: readonly number[] }[] }) {
  const max = Math.max(...series.flatMap((item) => item.values))
  return (
    <div className="threepl-proof-chart">
      <svg aria-label={label} role="img" viewBox="0 0 600 220">
        {[.25, .5, .75, 1].map((part) => <line key={part} x1="24" x2="576" y1={190 - part * 150} y2={190 - part * 150} />)}
        {series.map((item) => <polyline className={item.className} key={item.className} points={chartPoints(item.values, max)} />)}
        {labels.map((item, index) => <text key={item} x={24 + index * (552 / (labels.length - 1))} y="214">{item}</text>)}
      </svg>
    </div>
  )
}

function BusinessDashboard({ compact = false }: { compact?: boolean }) {
  const business = data.business
  const items = [
    [number.format(business.newClients), 'новых B2B-клиентов'],
    [`${number.format(business.cpaBefore)} → ${number.format(business.cpaAfter)} ₽`, 'CPA контракта'],
    [`${business.salesCycleBefore} → ${business.salesCycleAfter} дня`, 'цикл сделки'],
    [`${business.revenueShareBefore}% → ${business.revenueShareAfter}%`, 'доля 3PL в выручке'],
    [`${business.irrelevantLeadsChange}%`, 'нецелевых заявок'],
    [data.duration, 'срок проекта'],
  ]
  return <div className={`threepl-proof-dashboard${compact ? ' is-compact' : ''}`}>{items.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
}

export function ThreePLLogisticsCasePage() {
  const demandMax = Math.max(...data.demand.map((item) => item[1]))
  return (
    <>
      <PageHero
        aside={<div className="threepl-hero-dashboard"><BusinessDashboard compact /><Source>Источник: данные проекта</Source></div>}
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Все кейсы', path: '/cases/' }, { label: '3PL · B2B-логистика' }]}
        eyebrow="B2B · 3PL-логистика · Санкт-Петербург"
        summary="Перестроил сайт из витрины складских площадей в инструмент выбора и предварительной квалификации клиентов для фулфилмента и 3PL."
        title="Как 3PL-оператор перестал продавать только площадь и начал привлекать клиентов на складские операции"
      />

      <Section className="threepl-proof-section" id="demand" eyebrow="Спрос рынка" title="Клиенты искали не только аренду склада">
        <p className="threepl-proof-explainer">Обычно логистические компании продвигают прежде всего аренду складских площадей. Но анализ спроса показал, что бизнесу нужны и более комплексные услуги — обработка заказов, фулфилмент и доставка. Мы увидели более перспективное направление спроса и перенаправили сайт на привлечение более крупных B2B-клиентов.</p>
        <div className="threepl-demand-bars">{data.demand.map(([label, value]) => <div key={label}><span>{label}</span><i><b style={{ width: `${value / demandMax * 100}%` }} /></i><strong>{number.format(value)}</strong></div>)}</div>
        <p className="threepl-proof-note">Базовые запросы Wordstat. Частотности показаны отдельно и не суммируются.</p>
        <Source>Яндекс Wordstat</Source>
      </Section>

      <Section className="threepl-proof-section" id="operations" eyebrow="От площади к операциям" title="Чем больше задач клиент передаёт подрядчику, тем меньше ему нужен просто склад" tone="blue">
        <p className="threepl-proof-explainer">Эта схема наглядно объясняет стратегию продвижения. Вместо конкуренции только за аренду склада мы выстроили цепочку услуг: от хранения до комплексного 3PL-обслуживания. Посетитель сайта сразу видит, что компания может закрыть весь комплекс складских и логистических задач под ключ.</p>
        <div className="threepl-operation-steps">{data.operationSteps.map(([title, value, text], index) => <article key={title}><span>{index + 1}</span><strong>{title}</strong><b>{number.format(value)}</b><p>{text}</p></article>)}</div>
        <aside className="threepl-cross-docking"><span>{data.crossDocking[0]}</span><strong>{number.format(data.crossDocking[1] as number)}</strong><p>{data.crossDocking[2]}</p></aside>
        <Source>Яндекс Wordstat</Source>
      </Section>

      <Section className="threepl-proof-section" id="semantics" eyebrow="Семантика" title="Как был разделён поисковый спрос">
        <div className="threepl-cluster-map">{data.clusters.map((cluster) => <article key={cluster.name}><h3>{cluster.name}</h3><dl>{cluster.queries.map(([query, value]) => <div key={query}><dt>{query}</dt><dd>{number.format(value)}</dd></div>)}</dl></article>)}</div>
        <Source>Яндекс Wordstat</Source>
      </Section>

      <Section className="threepl-proof-section" id="offer" eyebrow="До / после" title="Почему сайт про аренду ограничивал рост" tone="muted">
        <p className="threepl-proof-explainer">Старый сайт показывал компанию в первую очередь как склад. Для привлечения более крупных клиентов нужно было показать саму логистическую инфраструктуру: приёмку, обработку заказов, WMS, интеграции и другие операции, которые бизнес может передать подрядчику.</p>
        <div className="threepl-offer-compare">
          <article><span>До</span><h3>Сайт продавал площадь</h3><strong>Фокус: аренда склада</strong><h4>Что видел клиент</h4><ul><li>площадь</li><li>класс склада</li><li>инфраструктура</li><li>охрана</li><li>расположение</li></ul><p>Бизнес получал много обращений от тех, кому нужен был просто склад.</p></article>
          <b aria-hidden="true">→</b>
          <article className="is-after"><span>После</span><h3>Сайт продавал работу с товаром</h3><strong>Фокус: фулфилмент · 3PL · складские услуги · кросс-докинг</strong><h4>Что видел клиент</h4><ul><li>хранение</li><li>приёмка</li><li>обработка</li><li>комплектация</li><li>упаковка</li><li>отгрузка</li><li>WMS и API</li></ul><p>Бизнес получал больше обращений от компаний, которым нужен подрядчик по складским операциям.</p></article>
        </div>
        <p className="threepl-proof-highlight">Проблема была не в отсутствии спроса. Сайт отвечал только на одну часть потребности клиента.</p>
      </Section>

      <Section className="threepl-proof-section" id="economics" eyebrow="Экономика лида" title="Почему дешёвый лид не приносил дешёвый контракт">
        <p className="threepl-proof-explainer">Низкая стоимость заявки ещё не означает выгодного клиента. После изменения структуры и позиционирования сайт начал привлекать более целевые обращения, а CPA квалифицированного обращения снизился в 3 раза.</p>
        <div className="threepl-economics"><div><strong>{number.format(data.economics.cpl)} ₽</strong><span>CPL</span></div><i>↓</i><div><strong>{decimal(data.economics.leadToContract)}%</strong><span>конверсия из лида в договор</span></div><i>↓</i><div><strong>{number.format(data.economics.cpaBefore)} ₽</strong><span>CPA контракта</span></div><b>→</b><aside><strong>{number.format(data.economics.cpaAfter)} ₽</strong><span>CPA после изменений</span><em>−66%</em></aside></div>
        <div className="threepl-economics-result"><strong>{data.economics.irrelevantLeadsChange}%</strong><span>нецелевых заявок</span></div>
        <Source>Источник: данные проекта</Source>
      </Section>

      <Section className="threepl-proof-section" id="qualification" eyebrow="Квалификация" title="Как сайт начал фильтровать клиентов до разговора с менеджером" tone="blue">
        <p className="threepl-proof-explainer">На сайте заранее показали формат работы, условия и порог входа. Благодаря этому часть неподходящих клиентов отсеивалась ещё до разговора с менеджером, а отдел продаж получал более подходящие обращения.</p>
        <div className="threepl-qualification-flow">{data.qualification.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong>{index < data.qualification.length - 1 && <i aria-hidden="true">→</i>}</div>)}</div>
        <div className="threepl-mini-kpis"><div><strong>{data.qualificationResults.irrelevantLeadsChange}%</strong><span>нецелевых заявок</span></div><div><strong>+{data.qualificationResults.meetingConversionChange}%</strong><span>конверсия во встречу</span></div><div><strong>{data.qualificationResults.responseSlaMinutes} минут</strong><span>SLA первого ответа</span></div></div>
        <Source>Источник: данные проекта</Source>
      </Section>

      <Section className="threepl-proof-section" id="wms" eyebrow="WMS · API" title="Как показали клиенту контроль над складскими операциями">
        <div className="threepl-system-flow"><span>Система клиента</span><b>↔</b><span>API</span><b>↔</b><span>WMS</span><b>↔</b><span>Складские операции</span></div>
        <div className="threepl-capabilities">{data.capabilities.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
        <p className="threepl-proof-note">Схема возможностей WMS и API</p><Source>Источник: данные проекта</Source>
      </Section>

      <Section className="threepl-proof-section" id="hypotheses" eyebrow="Гипотезы" title="Какие гипотезы отработали" tone="muted">
        <div className="threepl-hypotheses">{data.hypotheses.map((item, index) => <article key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><dl><div><dt>Было</dt><dd>{item.before}</dd></div><div><dt>Стало</dt><dd>{item.after}</dd></div></dl><strong>{item.result}</strong></article>)}</div>
      </Section>

      <Section className="threepl-proof-section" id="topvisor" eyebrow="Позиции" title="Как менялась видимость коммерческих запросов" tone="blue">
        <p className="threepl-proof-explainer">Позиции показывают, насколько легко потенциальный клиент может найти компанию по нужной ему услуге. За период работы сайт вышел в ТОП-3 и ТОП-10 Яндекса по приоритетным запросам, связанным с фулфилментом и 3PL.</p>
        <div className="threepl-chart-layout"><TrendChart label="Динамика контрольной группы запросов в Topvisor" labels={data.topvisor.trend.map((item) => item.date)} series={[{ className: 'is-top3', values: data.topvisor.trend.map((item) => item.top3) }, { className: 'is-top10', values: data.topvisor.trend.map((item) => item.top10) }, { className: 'is-top20', values: data.topvisor.trend.map((item) => item.top20) }]} /><div className="threepl-chart-summary"><div><strong>{summary.top10} из {data.topvisor.total}</strong><span>запросов в ТОП-10</span></div><div><strong>{summary.top3} из {data.topvisor.total}</strong><span>в ТОП-3</span></div><div><strong>{summary.top20} из {data.topvisor.total}</strong><span>в ТОП-20</span></div></div></div>
        <div className="threepl-table-wrap" tabIndex={0}><table><thead><tr><th>Запрос</th><th>Март</th><th>Август</th><th>Изменение</th></tr></thead><tbody>{data.topvisor.queries.map(([query, before, after]) => <tr key={query}><th scope="row">{query}</th><td>{before}</td><td><strong>{after}</strong></td><td>+{before - after}</td></tr>)}</tbody></table></div>
        <Source>Источник: Topvisor</Source>
      </Section>

      <Section className="threepl-proof-section" id="gsc" eyebrow="Google Search Console" title="Как росла видимость в Google">
        <p className="threepl-proof-explainer">По мере появления новых посадочных страниц росло количество показов и переходов из Google. Сайт стал чаще появляться по коммерческим запросам, связанным не только со складом, но и с комплексной логистикой.</p>
        <div className="threepl-analytics-kpis"><div><strong>{summary.gscBefore.clicks} → {summary.gscAfter.clicks}</strong><span>клики</span></div><div><strong>8,9 → 35,7 тыс.</strong><span>показы</span></div><div><strong>{decimal(summary.gscBefore.position)} → {decimal(summary.gscAfter.position)}</strong><span>средняя позиция</span></div><div className="is-minor"><strong>{decimal(summary.gscBefore.ctr)}% → {decimal(summary.gscAfter.ctr)}%</strong><span>CTR</span></div></div>
        <TrendChart label="Динамика кликов и показов Google Search Console" labels={data.gsc.map((item) => item.month)} series={[{ className: 'is-clicks', values: data.gsc.map((item) => item.clicks) }, { className: 'is-impressions', values: data.gsc.map((item) => item.impressions / 50) }]} />
        <div className="threepl-month-grid">{data.gsc.map((item) => <span key={item.month}><b>{item.month}</b>{item.clicks} кликов · {number.format(item.impressions)} показов · позиция {decimal(item.position)}</span>)}</div>
        <Source>Источник: Google Search</Source>
      </Section>

      <Section className="threepl-proof-section" id="metrika" eyebrow="Яндекс Метрика" title="Как менялись объём и качество органического трафика" tone="muted">
        <p className="threepl-proof-explainer">Рост трафика сам по себе не был главной целью. Важно было привлечь больше подходящих B2B-клиентов: органический трафик вырос примерно в 3 раза, при этом снизилась доля отказов.</p>
        <div className="threepl-dual-charts"><div><h3>Органические сеансы</h3><TrendChart label="Динамика органических сеансов" labels={data.metrika.map((item) => item.month)} series={[{ className: 'is-sessions', values: data.metrika.map((item) => item.sessions) }]} /></div><div><h3>Заявки</h3><TrendChart label="Динамика заявок из органического трафика" labels={data.metrika.map((item) => item.month)} series={[{ className: 'is-leads', values: data.metrika.map((item) => item.leads) }]} /></div></div>
        <div className="threepl-quality-dashboard"><div><strong>{number.format(summary.metrikaBefore.sessions)} → {number.format(summary.metrikaAfter.sessions)}</strong><span>органические сеансы</span></div><div><strong>{summary.metrikaBefore.leads} → {summary.metrikaAfter.leads}</strong><span>заявки</span></div><div><strong>{summary.metrikaBefore.bounce}% → {summary.metrikaAfter.bounce}%</strong><span>отказы</span></div><div><strong>{decimal(summary.metrikaBefore.depth)} → {decimal(summary.metrikaAfter.depth)}</strong><span>глубина просмотра</span></div><div><strong>{summary.metrikaBefore.time} → {summary.metrikaAfter.time}</strong><span>время на сайте</span></div></div>
        <Source>Источник: Яндекс Метрика</Source>
      </Section>

      <Section className="threepl-proof-section" id="result" eyebrow="Бизнес-результат" title="Что изменилось за шесть месяцев" tone="blue">
        <BusinessDashboard />
        <div className="threepl-extra-dashboard"><div><strong>от {number.format(data.business.averageCheck)} ₽/мес.</strong><span>средний чек</span></div><div><strong>+{data.business.meetingConversionChange}%</strong><span>конверсия во встречу</span></div><div><strong>{data.business.responseSlaMinutes} минут</strong><span>SLA первого ответа</span></div></div>
        <Source>Источник: данные проекта</Source>
      </Section>

      <Section className="threepl-proof-section" id="reading" eyebrow="Контекст результата" title="Как читать результат">
        <div className="threepl-reading-box"><h3>Что здесь относится к SEO и структуре сайта</h3><div><article><span>Повлияло со стороны сайта</span><ul><li>семантика</li><li>структура предложения</li><li>разделение спроса</li><li>коммерческие страницы</li><li>квалификация клиента</li><li>доказательные блоки</li><li>сценарии выбора услуги</li></ul></article><article><span>Дополнительно влияли</span><ul><li>работа отдела продаж</li><li>скорость ответа</li><li>условия входа</li><li>качество продукта</li><li>экономика клиента</li></ul></article></div></div>
      </Section>

      <Section className="threepl-case-cta" id="contact" tone="muted">
        <div className="threepl-case-cta__layout"><div className="threepl-case-cta__copy"><p className="eyebrow">Следующий шаг</p><h2>Продаёте B2B-услуги, а сайт собирает не тех?</h2><p>Покажу, где предложение смешивает разные задачи клиентов и что стоит разделить на сайте.</p></div><div className="threepl-case-cta__form"><LeadForm compact context="B2B-воронка и квалификация лидов" description="Обычно отвечаю в рабочий день или на следующий. Для первой оценки достаточно ссылки на сайт и краткого описания услуги." eyebrow="Предварительная оценка" serviceCode="case_2" submitLabel="Получить предварительный разбор" title="Разобрать B2B-воронку" /></div></div>
      </Section>
    </>
  )
}
