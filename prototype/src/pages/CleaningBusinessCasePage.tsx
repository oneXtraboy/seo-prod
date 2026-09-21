import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import { Section } from '../components/ui'
import { cleaningCaseData as data, cleaningCaseSummary as summary } from '../data/cleaningCaseData'

const formatNumber = new Intl.NumberFormat('ru-RU')
const decimal = (value: number) => String(value).replace('.', ',')

function chartPoints(values: readonly number[], max: number) {
  return values.map((value, index) => `${24 + index * (552 / (values.length - 1))},${190 - value / max * 150}`).join(' ')
}

function PositionsChart() {
  return (
    <div className="cleaning-case-chart">
      <div className="cleaning-case-chart__legend"><span className="is-top5">ТОП-5</span><span className="is-top10">ТОП-10</span><span className="is-top20">ТОП-20</span></div>
      <svg aria-label="Динамика количества контрольных запросов в ТОП-5, ТОП-10 и ТОП-20 с января по август 2026 года" role="img" viewBox="0 0 600 220">
        {[5, 10, 15, 20].map((value) => <g key={value}><line x1="24" x2="576" y1={190 - value / summary.monitored * 150} y2={190 - value / summary.monitored * 150} /><text x="2" y={194 - value / summary.monitored * 150}>{value}</text></g>)}
        <polyline className="is-top20" points={chartPoints(data.positionsTrend.map((item) => item.top20), summary.monitored)} />
        <polyline className="is-top10" points={chartPoints(data.positionsTrend.map((item) => item.top10), summary.monitored)} />
        <polyline className="is-top5" points={chartPoints(data.positionsTrend.map((item) => item.top5), summary.monitored)} />
        {data.positionsTrend.map((item, index) => <text className="cleaning-case-chart__date" key={item.date} x={24 + index * (552 / (data.positionsTrend.length - 1))} y="215">{item.date}</text>)}
      </svg>
      <div className="cleaning-case-chart__values">{data.positionsTrend.map((item) => <span key={item.date}><b>{item.date}</b>{item.top5} / {item.top10} / {item.top20}</span>)}</div>
    </div>
  )
}

function TrafficChart({ label, items }: { label: string; items: readonly { month: string; clicks: number; impressions: number; position: number }[] }) {
  const max = Math.max(...items.map((item) => item.clicks))
  return (
    <div className="cleaning-case-chart cleaning-case-chart--traffic">
      <svg aria-label={label} role="img" viewBox="0 0 600 220">
        {[.33, .66, 1].map((part) => <line key={part} x1="24" x2="576" y1={190 - part * 150} y2={190 - part * 150} />)}
        <polyline className="is-top10" points={chartPoints(items.map((item) => item.clicks), max)} />
        {items.map((item, index) => <text className="cleaning-case-chart__date" key={item.month} x={24 + index * (552 / (items.length - 1))} y="215">{item.month}</text>)}
      </svg>
      <div className="cleaning-case-chart__values">{items.map((item) => <span key={item.month}><b>{item.month}</b>{formatNumber.format(item.clicks)} кликов · {formatNumber.format(item.impressions)} показов · позиция {decimal(item.position)}</span>)}</div>
    </div>
  )
}

export function CleaningBusinessCasePage() {
  return (
    <>
      <PageHero
        aside={(
          <div className="cleaning-case-hero-proof">
            <span>Главный результат</span>
            <strong>{summary.top5} из {summary.monitored}</strong>
            <p>запросов — в ТОП-5</p>
            <div><b>{summary.top10} из {summary.monitored}</b><span>контрольных запросов — в ТОП-10</span></div>
            <small>Контроль позиций · Санкт-Петербург · январь — август 2026</small>
          </div>
        )}
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Все кейсы', path: '/cases/' }, { label: 'B2B-клининг · Санкт-Петербург' }]}
        eyebrow="B2B-клининг · Санкт-Петербург"
        meta={<div className="case-hero-role"><span>Моя работа</span><strong>Семантика · структура · техническое SEO · локальные страницы · контроль позиций</strong><span>Период: {data.duration}</span></div>}
        summary="Проверил спрос по основным услугам, добавил недостающие посадочные, исправил технические ошибки и создал локальные страницы под районы и станции метро."
        title="Как расширили SEO клининговой компании по реальному поисковому спросу"
      />

      <Section className="cleaning-case-section" id="start" eyebrow="Что было на старте" title="Под сильные услуги не хватало отдельных страниц">
        <div className="cleaning-case-intro"><p>Проверил спрос и увидел, что сайт недобирает запросы по уборке помещений, генеральной уборке, уборке после ремонта, территории, офисов и производственных помещений.</p><p>Часть услуг была собрана на общих страницах, часть не имела отдельной посадочной.</p><p>Отдельно проверил технические ошибки, внутренние ссылки и информацию, которая нужна клиенту перед заказом.</p></div>
        <div className="cleaning-case-start-grid">{data.startCards.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
      </Section>

      <Section className="cleaning-case-section" id="demand" eyebrow="Поисковый спрос" title="Какие услуги сделали приоритетными" tone="muted">
        <p className="cleaning-case-explainer">Мы не стали гадать, какие услуги нужны клиентам, а собрали реальные запросы бизнеса Петербурга. График показывает, сколько раз ежемесячно ищут конкретный вид уборки — именно под эти популярные услуги мы и создавали новые страницы, чтобы сайт не терял готовых обратиться клиентов.</p>
        <p className="cleaning-case-lead">Проверил спрос по Санкт-Петербургу и Ленинградской области и оставил отдельные посадочные только для направлений, которые действительно ищут. Общие запросы оставил на главной и в разделе услуг.</p>
        <div className="cleaning-case-demand-grid">{data.wordstat.map((service) => <article key={service.title}><h3>{service.title}</h3><dl>{service.queries.map(([query, value], index) => <div className={index === 0 ? 'is-primary' : undefined} key={query}><dt>{query}</dt><dd>{formatNumber.format(value)}</dd></div>)}</dl></article>)}</div>
        <p className="cleaning-case-source">Яндекс Wordstat</p>
      </Section>

      <Section className="cleaning-case-section" id="work" eyebrow="Работы" title="Что изменил на сайте">
        <div className="cleaning-case-actions">{data.works.map(([title, text], index) => <article key={title}><header><span>{String(index + 1).padStart(2, '0')}</span></header><h3>{title}</h3><p>{text}</p></article>)}</div>
      </Section>

      <Section className="cleaning-case-section" id="local" eyebrow="Local SEO" title="Добавил страницы под районы и станции метро" tone="blue">
        <div className="cleaning-case-local"><p>Для локального спроса создал отдельные посадочные по районам Санкт-Петербурга и станциям метро. На них привязал соответствующие услуги и переходы на основные коммерческие страницы.</p><p>Общие запросы остались на основных страницах услуг, а локальные сочетания получили отдельные страницы для переходов из поиска.</p></div>
      </Section>

      <Section className="cleaning-case-section" id="technical" eyebrow="Technical SEO" title="Исправил технические ошибки на коммерческих страницах">
        <p className="cleaning-case-explainer">Поисковые роботы не любят «сломанные» сайты с кучей скрытых ошибок — они могут мешать страницам нормально индексироваться и занимать высокие позиции. Таблица наглядно показывает, как мы очистили сайт от технических проблем и открыли ему «зелёный свет» для дальнейшего роста в поиске.</p>
        <p className="cleaning-case-lead">Сравнение первого и контрольного обхода сайта.</p>
        <div className="cleaning-case-crawl-head"><span>До · 12.01.2026</span><span>После · 31.08.2026</span></div>
        <div className="cleaning-case-crawl">{data.crawl.map((item) => <article key={item.label}><h3>{item.label}</h3><div><span>{item.before}</span><i aria-hidden="true"><b style={{ width: '100%' }} /></i></div><div className="is-after"><span>{item.after}</span><i aria-hidden="true"><b style={{ width: item.after ? `${item.after / item.before * 100}%` : '0%' }} /></i></div></article>)}</div>
      </Section>

      <Section className="cleaning-case-section" id="positions" eyebrow="Контрольные запросы" title="Как изменились позиции по основным услугам" tone="blue">
        <p className="cleaning-case-explainer">Позиция сайта в поиске — это его видимость для клиента. Здесь видно, как за 8 месяцев работы сайт клининговой компании заметно вырос: если раньше по ключевым услугам он находился на 30–50 местах, где его почти не видели потенциальные клиенты, то теперь по большинству контрольных запросов находится в первой десятке Яндекса и Google.</p>
        <div className="cleaning-case-visibility-lead"><div><strong>{summary.top5} из {summary.monitored}</strong><span>в ТОП-5</span></div><div><strong>{summary.top10} из {summary.monitored}</strong><span>в ТОП-10</span></div><div><strong>{summary.top20} из {summary.monitored}</strong><span>в ТОП-20</span></div></div>
        <p className="cleaning-case-source">Контроль позиций · Санкт-Петербург · январь — август 2026</p>
        <PositionsChart />
        <div className="cleaning-case-table-wrap" tabIndex={0}><table className="cleaning-case-table cleaning-case-table--positions"><thead><tr><th>Запрос</th><th>12.01.2026</th><th>31.08.2026</th><th>Изменение</th></tr></thead><tbody>{data.monitoredQueries.map((item) => <tr key={item.query}><th scope="row">{item.query}</th><td>{item.before}</td><td><strong>{item.after}</strong></td><td>+{item.before - item.after}</td></tr>)}</tbody></table></div>
      </Section>

      <Section className="cleaning-case-section" id="google" eyebrow="Google" title="После расширения структуры вырос трафик из Google">
        <p className="cleaning-case-explainer">Главное следствие хороших позиций — реальные люди, которые приходят на сайт из поиска. График показывает стабильный рост переходов из Google: бизнес начал получать больше потенциальных клиентов без необходимости платить за каждый переход в рекламе.</p>
        <p className="cleaning-case-lead">Новые и переработанные страницы начали получать больше показов и переходов по коммерческим запросам.</p>
        <div className="cleaning-case-metrics"><article><strong>{formatNumber.format(summary.gscClicksBefore)} → {formatNumber.format(summary.gscClicksAfter)}</strong><span>клики в месяц · +{summary.gscClicksGrowth}%</span></article><article><strong>21,6 → 60,8 тыс.</strong><span>показы · +{summary.gscImpressionsGrowth}%</span></article><article><strong>{decimal(summary.gscPositionBefore)} → {decimal(summary.gscPositionAfter)}</strong><span>средняя позиция</span></article></div>
        <TrafficChart items={data.gsc} label="Динамика кликов из Google с января по август 2026 года" />
        <p className="cleaning-case-source">Источник: Google Search</p>
      </Section>

      <Section className="cleaning-case-section" id="yandex" eyebrow="Яндекс" title="Поисковый трафик из Яндекса тоже вырос" tone="muted">
        <p className="cleaning-case-explainer">Главное следствие хороших позиций — реальные люди, которые приходят на сайт из поиска. График показывает стабильный рост переходов из Яндекса: бизнес начал получать больше потенциальных клиентов без необходимости платить за каждый переход в рекламе.</p>
        <div className="cleaning-case-metrics"><article><strong>{formatNumber.format(summary.yandexClicksBefore)} → {formatNumber.format(summary.yandexClicksAfter)}</strong><span>клики в месяц · +{summary.yandexClicksGrowth}%</span></article><article><strong>33,4 → 84,7 тыс.</strong><span>показы · +{summary.yandexImpressionsGrowth}%</span></article><article><strong>{decimal(summary.yandexPositionBefore)} → {decimal(summary.yandexPositionAfter)}</strong><span>средняя позиция</span></article></div>
        <TrafficChart items={data.yandex} label="Динамика кликов из Яндекса с января по август 2026 года" />
        <p className="cleaning-case-source">Источник: Яндекс Вебмастер</p>
      </Section>

      <Section className="cleaning-case-section" id="commercial" title="Добавил информацию, которую клиент проверяет перед заказом">
        <p className="cleaning-case-lead">На страницах услуг добавил данные, которые помогают сразу понять стоимость, состав работ и условия сотрудничества.</p>
        <div className="cleaning-case-checklist">{data.commercial.map(([title, text]) => <article key={title}><span aria-hidden="true">✓</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      </Section>

      <Section className="cleaning-case-section" id="roles" eyebrow="Роли" title="Что делал я и что было нужно от бизнеса" tone="blue">
        <div className="cleaning-case-roles"><article><span>Моя работа</span><p>Собрал семантику, выбрал приоритетные услуги, подготовил структуру страниц, провёл технический аудит, настроил локальное направление и контролировал позиции после внедрения.</p></article><article><span>Бизнес</span><p>Передал цены, состав услуг, условия договора, график работы и информацию по объектам.</p></article></div>
      </Section>

      <Section className="cleaning-case-section" id="result" eyebrow="Результат" title={`Что изменилось за ${data.duration}`} tone="muted">
        <div className="cleaning-case-result"><div><strong>{summary.top5} из {summary.monitored}</strong><span>запросов в ТОП-5</span></div><div><strong>{summary.top10} из {summary.monitored}</strong><span>запросов в ТОП-10</span></div><div><strong>{formatNumber.format(summary.gscClicksBefore)} → {formatNumber.format(summary.gscClicksAfter)}</strong><span>клики из Google в месяц</span></div><div><strong>{formatNumber.format(summary.yandexClicksBefore)} → {formatNumber.format(summary.yandexClicksAfter)}</strong><span>клики из Яндекса в месяц</span></div><div><strong>{summary.directions}</strong><span>приоритетных направлений услуг</span></div></div>
        <p className="cleaning-case-local-result">Созданы локальные посадочные по районам Санкт-Петербурга и станциям метро.</p>
        <p className="cleaning-case-result__summary">Сайт перестал опираться только на общие страницы. Под услуги с подтверждённым спросом появились отдельные посадочные, для локальных запросов — страницы по районам и метро. Технические ошибки исправлены, а основные коммерческие запросы поднялись в выдаче.</p>
      </Section>

      <Section className="cleaning-case-disclaimer" id="disclaimer" title="Что показывают эти цифры">
        <p>Позиции, показы и переходы показывают изменение поисковой видимости сайта.</p><p>Количество продаж и договоров отдельно не использую: на них кроме SEO влияют цена, работа отдела продаж, условия сотрудничества и качество услуги.</p>
      </Section>

      <Section className="cleaning-case-cta" id="contact" tone="muted">
        <div className="cleaning-case-cta__layout"><div><h2>Покажите ваш сайт</h2><p>Проверю, под какие услуги уже есть спрос, каких посадочных не хватает и какие страницы сейчас мешают друг другу в поиске.</p></div><LeadForm compact context="SEO B2B-клининга" description="Обычно отвечаю в рабочий день или на следующий. Для первой оценки достаточно ссылки на сайт." eyebrow="Предварительная оценка" serviceCode="case_1" submitLabel="Получить предварительный разбор" title="Разобрать структуру сайта" /></div>
      </Section>
    </>
  )
}
