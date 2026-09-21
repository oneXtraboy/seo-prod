import type { CSSProperties, ReactNode } from 'react'
import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import { Section } from '../components/ui'
import { caseBoardGamesData } from '../data/caseBoardGamesData'

const mismatchCards = [
  {
    number: '01',
    label: 'Цветовой дрейф',
    title: 'Иллюзия единой игры',
    text: 'Настольная игра — это микрогофрокартон для коробки, мелованная бумага для правил, плотный картон для поля и акрил или дерево для фишек. Конкуренты обещали «производство любой сложности», но не гарантировали цветового совпадения всех элементов.',
    risk: 'Если коробку и карточки печатают на разных станках или в разные дни, оттенки расходятся — и игра выглядит дёшево.',
  },
  {
    number: '02',
    label: 'Допечатная подготовка',
    title: 'Пропасть между идеей и станком',
    text: 'Авторы игр — художники и геймдизайнеры. Они создают сильные иллюстрации, но не обязаны знать, что такое наступ на вырубку, вылеты под обрез или цветовой профиль FOGRA39.',
    risk: 'Сухая стена требований «PDF/X-1a, шрифты в кривых» пугала автора и выталкивала его к тому, кто обещал сделать всё сам.',
  },
  {
    number: '03',
    label: 'Фулфилмент',
    title: 'Логистический тупик',
    text: 'Типография печатала 2000 коробок и предлагала доставить паллеты в одну точку. Но автор краудфандинга не может принять пять тонн коробок в квартиру.',
    risk: 'Ему нужна готовая система: хранение, интеграция со сбором заказов, индивидуальная комплектация и отправка по всей стране.',
  },
]

const audiences = [
  { label: 'Kickstarter · Boomstarter', title: 'Краудфандинг', text: 'Отсутствие цветовых искажений, контрольный экземпляр и фулфилмент с интеграцией в формы сбора.' },
  { label: 'NDA · бренд · сроки', title: 'B2B-корпорации', text: 'Секретность проекта, точность брендирования и предсказуемый производственный график.' },
  { label: 'Макеты · микро-тираж', title: 'Локальные авторы', text: 'Помощь с допечатной подготовкой, понятные требования и возможность начать с небольшого тиража.' },
]

const mechanics = [
  { label: 'Спецификация', title: 'Инженерия описаний', text: 'Убрал общие фразы «качественные материалы». Вместо них появилась жёсткая спецификация: единый цветовой профиль для всех компонентов партии и общий цветовой контекст для коробки и карт.' },
  { label: 'UX технолога', title: 'Личный кабинет технолога', text: 'Добавил пошаговый гайд по подготовке файлов человеческим языком: пиксельную графику можно векторизовать, а забытые вылеты под обрез — добавить до печати.' },
  { label: 'Новая услуга', title: 'Фулфилмент как сервис', text: 'Логистическую цепочку подробно показали ещё до первого разговора с менеджером. Клиент видел не «доставку паллет», а готовую систему исполнения обязательств перед покупателями.' },
]

const fulfillmentSteps = [
  'Принимаем готовый тираж',
  'Храним паллеты на складе',
  'Интегрируемся по XML или API',
  'Собираем индивидуальный набор',
  'Упаковываем для отправки',
  'Передаём СДЭК или Почте России',
]

const projectRoles = [
  'Аудит конкурентов и выявление «слепой зоны» в нише',
  'Разработка стратегии: три гипотезы и три аудитории',
  'SEO-приоритеты и архитектура сайта под разные паттерны поведения',
  'Требования к контенту: инженерные описания, гайды, логика фулфилмента',
  'Контроль внедрения и проверка результата',
]

const formatNumber = new Intl.NumberFormat('ru-RU').format

type ChartSeries = {
  readonly color: string
  readonly label: string
  readonly values: readonly number[]
}

function SourceLabel({ children }: { children: ReactNode }) {
  return <p className="board-proof-source">{children}</p>
}

function HorizontalBars({ items }: { items: readonly { readonly query: string; readonly value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value))
  return (
    <div className="board-proof-bars">
      {items.map((item) => (
        <div key={item.query}>
          <p><span>{item.query}</span><strong>{formatNumber(item.value)}</strong></p>
          <i><b style={{ '--board-bar': `${Math.max((item.value / max) * 100, 4)}%` } as CSSProperties} /></i>
        </div>
      ))}
    </div>
  )
}

function LineChart({ ariaLabel, months, series }: {
  ariaLabel: string
  months: readonly string[]
  series: readonly ChartSeries[]
}) {
  const width = 720
  const height = 310
  const inset = { top: 34, right: 32, bottom: 50, left: 42 }
  const values = series.flatMap((item) => [...item.values])
  const max = Math.max(...values) * 1.15
  const plotWidth = width - inset.left - inset.right
  const plotHeight = height - inset.top - inset.bottom
  const x = (index: number) => inset.left + (plotWidth * index) / Math.max(months.length - 1, 1)
  const y = (value: number) => inset.top + plotHeight - (value / max) * plotHeight

  return (
    <div className="board-proof-chart">
      <svg aria-label={ariaLabel} role="img" viewBox={`0 0 ${width} ${height}`}>
        {[0, 1, 2, 3, 4].map((step) => {
          const lineY = inset.top + (plotHeight * step) / 4
          return <line className="board-proof-chart__grid" key={step} x1={inset.left} x2={width - inset.right} y1={lineY} y2={lineY} />
        })}
        {series.map((item) => (
          <g key={item.label}>
            <polyline fill="none" points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')} stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
            {item.values.map((value, index) => (
              <g key={`${item.label}-${months[index]}`}>
                <circle cx={x(index)} cy={y(value)} fill="#fff" r="6" stroke={item.color} strokeWidth="4" />
                <text className="board-proof-chart__value" x={x(index)} y={y(value) - 13}>{formatNumber(value)}</text>
              </g>
            ))}
          </g>
        ))}
        {months.map((month, index) => <text className="board-proof-chart__month" key={month} x={x(index)} y={height - 17}>{month.replace('Месяц ', 'М')}</text>)}
      </svg>
      {series.length > 1 && <div className="board-proof-legend">{series.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}</div>}
    </div>
  )
}

function MetricStrip({ items }: { items: readonly { readonly label: string; readonly value: string }[] }) {
  return <div className="board-proof-metrics">{items.map((item) => <article key={item.label}><strong>{item.value}</strong><span>{item.label}</span></article>)}</div>
}

function ProcessFlow({ items }: { items: readonly string[] }) {
  return <ol className="board-proof-process">{items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></li>)}</ol>
}

export function BoardGameProductionCasePage() {
  const data = caseBoardGamesData
  const resultMetrics = [
    { value: data.businessResults.averageCheckFlowLabel, label: 'средний чек проекта', text: 'Рост за счёт логистики, предпечатной подготовки и комплексных партий.' },
    { value: data.businessResults.fulfillmentShare, label: 'выручки — фулфилмент', text: 'Ранее этот сервис почти не продавался.' },
    { value: data.businessResults.cycle, label: 'цикл сделки', text: '80% технических вопросов закрывались на сайте без менеджера.' },
    { value: data.businessResults.errorReduction, label: 'допечаточные ошибки', text: 'Клиенты присылали макеты, адаптированные благодаря гайдам.' },
  ]
  const gscClicks = data.gsc.rows.map((row) => row.clicks)
  const gscImpressions = data.gsc.rows.map((row) => row.impressions)
  const metrikaConversion = data.metrika.rows.map((row) => row.conversion)

  return (
    <>
      <PageHero
        aside={(
          <figure className="board-case-hero-visual board-case-hero-visual--image">
            <img
              alt="Производство настольной игры из нескольких компонентов с упаковкой и фулфилментом"
              height="1254"
              src="/images/cases/seo-proizvodstvo-nastolnyh-igr/kontraktnoe-proizvodstvo-nastolnyh-igr-fulfilment.webp"
              title="Контрактное производство настольных игр и фулфилмент"
              width="1254"
            />
          </figure>
        )}
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Все кейсы', path: '/cases/' }, { label: 'Контрактное производство · настольные игры' }]}
        eyebrow="B2B · контрактное производство · настольные игры"
        summary="Перестроил сайт типографии вокруг технологических рисков, допечатной подготовки и фулфилмента — вместо продажи картона и печатных мощностей"
        title="Как типография перестала продавать «картон» и выросла в 5 раз за счёт фулфилмента"
      >
        <div aria-label="Результаты проекта" className="board-case-hero-metrics board-case-hero-metrics--proof">
          <div><strong>{data.businessResults.averageCheckFlowLabel}</strong><span>средний чек</span></div>
          <div><strong>{data.businessResults.fulfillmentShare}</strong><span>выручки от фулфилмента</span></div>
          <div><strong>{data.businessResults.cycle}</strong><span>цикл сделки</span></div>
          <div><strong>{data.businessResults.errorReduction}</strong><span>ошибок</span></div>
          <div><strong>{data.businessResults.period}</strong><span>проект</span></div>
        </div>
      </PageHero>

      <Section className="board-case-section" id="market" title="Рынок: аномальный рост и слепая зона">
        <div className="board-case-market">
          <p>Рынок настольных игр переживает аномальный рост. Запуски на Boomstarter и Kickstarter собирают десятки миллионов рублей. Корпорации заказывают custom-игры для тимбилдинга вместо стандартных футболок.</p>
          <div><strong>Производство было. Продукта на сайте — не было.</strong><p>Крупная производственная типография с мощным парком оборудования могла отпечатать всё: от визиток до гигантских постеров. В прайсе давно висела строчка «производство настольных игр», но она приносила лишь единичные, хаотичные заказы.</p></div>
        </div>
      </Section>

      <Section className="board-case-section board-proof-section" id="search-demand" title="Клиент начинал поиск с печати или производства" tone="blue">
        <p className="eyebrow">Поисковый спрос</p>
        <HorizontalBars items={data.wordstat.entryDemand} />
        <p className="board-proof-note">Показаны отдельные запросы Wordstat. Частотности пересекаются и не суммируются. В поиске задача выглядит простой: найти, кто напечатает или произведёт игру. Для крупного тиража выбор подрядчика начинается дальше.</p>
        <SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="commercial-demand" title="В части запросов уже виден выбор конкретного исполнителя">
        <p className="eyebrow">Коммерческий спрос</p>
        <div className="board-proof-table-wrap">
          <table className="board-proof-table"><thead><tr><th>Запрос</th><th>Частотность</th><th>Что хочет пользователь</th><th>Что должен показать сайт</th></tr></thead><tbody>{data.wordstat.commercial.map((item) => <tr key={item.query}><td>{item.query}</td><td><strong>{formatNumber(item.value)}</strong></td><td>{item.need}</td><td>{item.proof}</td></tr>)}</tbody></table>
        </div>
        <SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section" id="problem" title="Проблема: не станки, а разговор с рынком" tone="muted">
        <div className="board-case-intro"><p>Проблема была не в качестве оборудования. Проблема была в том, как типография общалась с рынком.</p><p>На сайте продавали услуги так, будто настольная игра — это просто плотный картон. На самом деле это сложнейший сборный конструктор из {data.production.componentCount} разных материалов, где цена ошибки — репутация автора на краудфандинговой платформе.</p></div>
        <p className="board-case-findings-label">Я провёл аудит конкурентов и нашёл три критические несостыковки между ожиданиями заказчика и тем, что предлагал рынок.</p>
        <div className="board-case-mismatches">{mismatchCards.map((item) => <article key={item.number}><header><span>{item.number}</span><small>{item.label}</small></header><h3>{item.title}</h3><p>{item.text}</p><aside>{item.risk}</aside></article>)}</div>
        <p className="board-case-explainer">Обычные типографии продают прежде всего печать, хотя настольная игра — это сложный продукт из множества материалов и производственных этапов. Мы перестроили сайт так, чтобы показать авторам и издателям: компания понимает риски разнотона, ошибок в макетах и проблем с логистикой и умеет решать их ещё до запуска тиража.</p>
      </Section>

      <Section className="board-case-section board-proof-section" id="search-to-product" title="В поиске клиент просил печать. На производстве ему требовалось значительно больше">
        <p className="eyebrow">От запроса к бизнес-задаче</p>
        <div className="board-proof-search-product">
          <article><h3>Что вводят в поиск</h3>{data.wordstat.entryDemand.map((item) => <p key={item.query}><span>{item.query}</span><strong>{formatNumber(item.value)}</strong></p>)}</article>
          <article><h3>Что может пойти не так</h3><ul>{data.production.searchRisks.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><h3>Что на самом деле покупает клиент</h3><ul>{data.production.productScope.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
        <div className="board-proof-check"><span>Средний чек</span><strong>{data.businessResults.averageCheckFlowLabel}</strong></div>
        <p className="board-case-explainer">В поиске клиент может начинать с запроса вроде "печать коробок", но в реальности ему нужен полный цикл: от проверки макетов до комплектации готовой игры. Расширение структуры сайта под реальные этапы производства помогло продавать не отдельные операции, а готовый продукт целиком, а средний чек проекта вырос в 5 раз.</p>
        <p className="board-proof-note">Сайт перестал ограничивать предложение стоимостью печати и начал показывать полный объём производственной задачи.</p>
        <SourceLabel>{data.businessResults.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="components" title="Настольная игра собирается не из одного вида печати" tone="blue">
        <p className="eyebrow">Сложность продукта</p>
        <div className="board-proof-component-map"><div><strong>Настольная<br />игра</strong><span>до {data.production.componentCount} материалов и компонентов</span></div>{data.production.components.map((item) => <span key={item}>{item}</span>)}</div>
        <p className="board-proof-note">Разные компоненты требуют разных материалов, технологий печати и контроля.</p>
        <div className="board-proof-component-demand">{data.wordstat.components.slice(0, 4).map((item) => <span key={item.query}><b>{formatNumber(item.value)}</b>{item.query}</span>)}</div>
        <p className="board-proof-caption">Отдельные компоненты тоже ищут как самостоятельные производственные задачи. Эти значения не используются как отдельная SEO-стратегия.</p>
        <SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="risk-matrix" title="Риски нужно было снять до запуска тиража">
        <div className="board-proof-table-wrap"><table className="board-proof-table board-proof-risk-table"><thead><tr><th>Риск</th><th>Когда обнаруживается</th><th>Что происходит без проверки</th><th>Что сделали</th></tr></thead><tbody>{data.production.risks.map((item) => <tr key={item.risk}><th>{item.risk}</th><td>{item.moment}</td><td>{item.consequence}</td><td>{item.solution}</td></tr>)}</tbody></table></div>
        <p className="board-case-explainer">В настольной игре ошибка даже в одном компоненте может испортить весь тираж. Эта матрица показывает, какие риски проверяются заранее и как клиент видит контроль качества ещё до запуска производства.</p>
        <SourceLabel>{data.businessResults.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-case-strategy" id="strategy" title="Стратегия: продажа спокойствия, а не бумаги" tone="blue">
        <div className="board-case-strategy__intro"><p>Я понял: чтобы продавать игры дорого, нужно перестать быть типографией и стать технологическим продюсером проекта.</p><span>Старый раздел сайта был заблокирован. Вместо него появилась архитектура под риски и поведение разных заказчиков.</span></div>
        <article className="board-case-hypothesis"><header><span>Гипотеза 01</span><h3>Разделение аудиторий по уровню стресса</h3></header><p>Отказался от одной страницы «Настольные игры». Создал три отдельных лендинга под разные паттерны поведения.</p><div className="board-case-audiences">{audiences.map((audience) => <div key={audience.title}><span>{audience.label}</span><h4>{audience.title}</h4><p>{audience.text}</p></div>)}</div></article>
        <article className="board-case-hypothesis"><header><span>Гипотеза 02</span><h3>Допечатная подготовка как инструмент конверсии</h3></header><div className="board-case-audit-offer"><div><span>Новый лид-магнит</span><strong>Бесплатный технологический аудит макета</strong></div><p>«Прикрепите ваши черновики — хоть в JPG. Технолог проверит вылеты и наложения и объяснит, как макет поведёт себя при вырубке, до того как вы заплатите за печать».</p></div><p>Вместо того чтобы пугать клиента требованиями к макетам, я перевернул процесс и снял барьер входа.</p></article>
        <article className="board-case-hypothesis"><header><span>Гипотеза 03</span><h3>Визуализация «нулевого брака»</h3></header><div className="board-case-zero-defect"><p>В настольных играх брак 2% на листовках — это норма. Недостающая фишка в одной из 1000 коробок — смерть репутации проекта.</p><ol><li>Технолог вручную собирает одну игру</li><li>Проверяет компоненты по чек-листу</li><li>Только после этого запускает весь тираж</li></ol></div><p>Процесс сборки контрольного экземпляра вынесли на сайт и показали фото и видео — как главное доказательство ответственности.</p></article>
        <div className="board-proof-hypotheses">{data.production.hypothesisSummary.map((item) => <article key={item.label}><span>{item.label}</span><p><b>Проблема</b>{item.problem}</p><i>↓</i><p><b>Изменение</b>{item.change}</p><i>↓</i><p><b>Какой риск сняли</b>{item.risk}</p><i>↓</i><p><b>Результат</b>{item.result}</p></article>)}</div>
      </Section>

      <Section className="board-case-section board-proof-section" id="control-copy" title="Ошибку дешевле найти на одном экземпляре, чем на всём тираже">
        <p className="eyebrow">Контроль до тиража</p>
        <div className="board-proof-control"><ProcessFlow items={data.production.controlProcess} /><div><strong>{data.businessResults.errorReduction}</strong><span>ошибок</span></div></div>
        <SourceLabel>{data.businessResults.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="offer-before-after" title="Из типографии в производственного подрядчика" tone="muted">
        <p className="eyebrow">Перестройка предложения</p>
        <div className="board-proof-before-after">
          <article><span>До</span><h3>Сайт продаёт печать</h3><ul>{data.production.beforeOffer.map((item) => <li key={item}>{item}</li>)}</ul><p>«Сколько стоит напечатать?»</p></article>
          <article><span>После</span><h3>Сайт показывает полный процесс</h3><ul>{data.production.afterOffer.map((item) => <li key={item}>{item}</li>)}</ul><p>«Кому можно передать производство проекта целиком?»</p></article>
        </div>
        <div className="board-proof-check"><span>Средний чек</span><strong>{data.businessResults.averageCheckFlowLabel}</strong></div>
        <SourceLabel>{data.businessResults.source}</SourceLabel>
      </Section>

      <Section className="board-case-section" id="mechanics" title="Механика: что было внедрено на сайте">
        <div className="board-case-mechanics">{mechanics.map((item) => <article key={item.title}><span>{item.label}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
        <div className="board-case-fulfillment"><header><span>Фулфилмент как готовый продукт</span><h3>От тиража до покупателя — одна прозрачная цепочка</h3></header><ol>{fulfillmentSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}</ol></div>
      </Section>

      <Section className="board-case-section board-proof-section" id="topvisor" title="Коммерческие запросы становились заметнее в поиске" tone="blue">
        <p className="eyebrow">Topvisor</p>
        <div className="board-proof-chart-layout"><LineChart ariaLabel="Динамика позиций 32 коммерческих запросов" months={data.topvisor.months} series={data.topvisor.series} /><aside><strong>{data.topvisor.querySet}</strong><span>коммерческих запросов в контрольном наборе</span><small>{data.period}</small></aside></div>
        <MetricStrip items={data.topvisor.kpis} />
        <SourceLabel>{data.topvisor.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="gsc" title="Поисковая видимость привела больше целевых переходов">
        <p className="eyebrow">Google Search Console</p>
        <div className="board-proof-chart-pair"><figure><figcaption>Клики</figcaption><LineChart ariaLabel="Динамика кликов из поиска" months={data.gsc.months} series={[{ label: 'Клики', color: '#6941c6', values: gscClicks }]} /></figure><figure><figcaption>Показы</figcaption><LineChart ariaLabel="Динамика показов в поиске" months={data.gsc.months} series={[{ label: 'Показы', color: '#13875b', values: gscImpressions }]} /></figure></div>
        <MetricStrip items={data.gsc.kpis} />
        <SourceLabel>{data.gsc.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="metrika" title="Коммерческие страницы стали приводить более качественные посещения" tone="muted">
        <p className="eyebrow">Яндекс Метрика</p>
        <div className="board-proof-chart-layout"><LineChart ariaLabel="Динамика конверсии коммерческих страниц" months={data.metrika.months} series={[{ label: 'Конверсия, %', color: '#6941c6', values: metrikaConversion }]} /><aside><strong>{data.metrika.kpis[2].value}</strong><span>конверсия коммерческих страниц</span><small>{data.period}</small></aside></div>
        <MetricStrip items={data.metrika.kpis} />
        <p className="board-proof-note">Метрика показывает изменение качества посещений коммерческих страниц. Эти данные не доказывают, что SEO единолично вызвало рост среднего чека.</p>
        <SourceLabel>{data.metrika.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="seo-to-revenue" title="Поисковый трафик стал входом в более дорогой продукт">
        <p className="eyebrow">От SEO к выручке</p>
        <ProcessFlow items={data.production.causalFlow} />
        <p className="board-proof-note">SEO привело целевой спрос на страницы, где предложение уже было перестроено вокруг полного производственного процесса.</p>
        <SourceLabel>Источники: Яндекс Wordstat · Topvisor · Google Search Console · Яндекс Метрика · данные проекта</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="cycle-and-errors" title="Единый процесс сократил согласования и перенёс контроль до тиража" tone="blue">
        <div className="board-proof-outcomes">
          <article><span>Срок</span><div><strong>{data.production.timeline.before} дней</strong><i style={{ '--board-length': '100%' } as CSSProperties} /></div><ul>{data.production.timeline.negotiations.map((item) => <li key={item}>{item}</li>)}</ul><b>↓</b><div><strong>{data.production.timeline.after} дней</strong><i style={{ '--board-length': `${(data.production.timeline.after / data.production.timeline.before) * 100}%` } as CSSProperties} /></div><p>{data.production.timeline.afterLabel}</p></article>
          <article><span>Ошибки</span><strong className="board-proof-outcomes__value">{data.production.errors.reduction}</strong><div className="board-proof-error-compare"><ul>{data.production.errors.before.map((item) => <li key={item}>до: {item}</li>)}</ul><ul>{data.production.errors.after.map((item) => <li key={item}>после: {item}</li>)}</ul></div></article>
        </div>
        <SourceLabel>{data.businessResults.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="fulfillment-product" title="Фулфилмент стал продолжением производственного процесса">
        <div className="board-proof-fulfillment"><ProcessFlow items={data.fulfillment.flow} /><aside><strong>{data.fulfillment.revenueShare}</strong><span>выручки от фулфилмента</span></aside></div>
        <p className="board-case-explainer">После производства крупный тираж нужно где-то хранить, комплектовать и отправлять покупателям. Поэтому складское хранение и поштучную отправку вынесли в отдельную часть предложения. Услуга, которая раньше почти не продавалась через сайт, стала полноценным продолжением производственного цикла.</p>
        <p className="board-proof-note">После производства клиенту не обязательно забирать весь тираж и самостоятельно организовывать хранение и отправку. Фулфилмент — развитие продукта компании, а не вывод из Wordstat.</p>
        <SourceLabel>{data.businessResults.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="value-expansion" title="Как меняется ценность одного клиента" tone="muted">
        <div className="board-proof-value-expansion"><article><span>Было</span><strong>печать тиража</strong></article><b>→</b><article><span>Стало</span><div>{data.fulfillment.productExpansion.map((item, index) => <span key={item}>{index > 0 && <i>+</i>}{item}</span>)}</div></article></div>
        <div className="board-proof-check board-proof-check--split"><span>Средний чек: <b>{data.businessResults.averageCheckFlowLabel}</b></span><span>Изменение: <b>{data.businessResults.averageCheckMultiplier}</b></span></div>
        <SourceLabel>{data.businessResults.source}</SourceLabel>
      </Section>

      <Section className="board-case-section" id="result" title="Результаты" tone="muted">
        <div className="board-case-result-intro"><p>Через {data.period} после перестройки сайта под технологический подход:</p></div>
        <div className="board-case-results">{resultMetrics.map((metric) => <article key={metric.label}><strong>{metric.value}</strong><h3>{metric.label}</h3><p>{metric.text}</p></article>)}</div>
        <div className="board-case-trust-factor"><span>Фактор доверия</span><p>Когда автор крупного крауд-проекта увидел блок про ручную проверку контрольного экземпляра и интеграцию фулфилмента, он перестал сравнивать типографии по цене квадратного метра картона. Он понял, что покупает гарантию того, что проект не захлебнётся на этапе сборки.</p></div>
        <div className="board-proof-dashboard">
          <article className="is-main"><strong>{data.businessResults.averageCheckAfterLabel}</strong><span>средний чек после изменений</span></article>
          <article><strong>{data.businessResults.averageCheckFlowLabel}</strong><span>динамика среднего чека</span></article>
          <article><strong>{data.businessResults.averageCheckMultiplier}</strong><span>изменение среднего чека</span></article>
          <article><strong>{data.businessResults.fulfillmentShare}</strong><span>выручки от фулфилмента</span></article>
          <article><strong>{data.businessResults.cycle}</strong><span>цикл сделки</span></article>
          <article><strong>{data.businessResults.errorReduction}</strong><span>допечаточных ошибок</span></article>
          <article><strong>{data.businessResults.period}</strong><span>проект</span></article>
        </div>
        <SourceLabel>{data.businessResults.source}</SourceLabel>
      </Section>

      <Section className="board-case-section board-proof-section" id="evidence" title="Разные показатели контролировались в разных системах">
        <p className="eyebrow">Как проверяли результат</p>
        <div className="board-proof-evidence-map"><article><strong>Яндекс Wordstat</strong><p>что искали потенциальные клиенты</p></article><article><strong>Topvisor</strong><p>как менялись позиции коммерческих запросов</p></article><article><strong>Google Search Console</strong><p>показы, клики, CTR, средняя позиция</p></article><article><strong>Яндекс Метрика</strong><p>поведение и целевые действия</p></article><article><strong>Данные проекта</strong><p>средний чек, срок, ошибки, доля фулфилмента</p></article></div>
      </Section>

      <Section className="board-case-section" id="conclusion" title="Вывод: клиент покупает страховку от репутационных потерь" tone="blue">
        <div className="board-case-conclusion"><p>В сложном контрактном производстве — будь то настольные игры, упаковка или электроника — сайт не должен быть каталогом станков. Клиент покупает не краску и не картон. Он покупает <strong>страховку от репутационных потерь.</strong></p><div><p>Пока конкуренты писали о «высочайшем качестве печати», мы заняли нишу, рассказывая, как решаем проблему цветового дрейфа между коробкой и карточками. Пока другие ждали идеальные макеты, мы сделали технологическую подготовку главным конверсионным инструментом.</p><p><strong>В B2B побеждает не тот, у кого лучше станки.</strong> Побеждает тот, кто лучше понимает технологию производства клиента и берёт на себя ответственность за скрытые риски, о которых клиент даже не подозревал.</p></div></div>
      </Section>

      <Section className="board-case-section" id="role" title="Моя роль в проекте">
        <div className="board-case-role"><ol>{projectRoles.map((role) => <li key={role}>{role}</li>)}</ol><aside><strong>{data.period}</strong><p>Проект вёлся в рамках SEO-сопровождения.</p></aside></div>
      </Section>

      <Section className="board-case-disclaimer" id="disclaimer" title="Как читать результат" tone="muted">
        <p>Рост среднего чека — результат комплексной работы с позиционированием, структурой сайта и продуктовой логикой. Конкретная динамика заказов зависит также от качества производства, сроков и работы отдела продаж клиента. Я фиксирую состав работ и способ проверки результата.</p>
      </Section>

      <Section className="board-case-cta" id="contact" tone="muted">
        <div className="board-case-cta__layout"><div className="board-case-cta__copy"><p className="eyebrow">Следующий шаг</p><h2>Производите сложную продукцию, а сайт продаёт только отдельные операции?</h2><p>Покажу, как перестать конкурировать по цене за единицу материала и начать продавать гарантию результата.</p></div><div className="board-case-cta__form"><LeadForm compact context="B2B-сайт контрактного производства" description="Обычно отвечаю в рабочий день или на следующий. Для первой оценки достаточно ссылки на сайт и краткого описания производства." eyebrow="Предварительная оценка" serviceCode="case_4" submitLabel="Получить предварительный разбор" title="Разобрать производственный сайт" /></div></div>
      </Section>
    </>
  )
}
