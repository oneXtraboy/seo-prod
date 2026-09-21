import type { CSSProperties, ReactNode } from 'react'
import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import { Section } from '../components/ui'
import { caseMedicalData } from '../data/medicalCaseData'


const problemItems = [
  'Страницы услуг были слабо связаны с реальным выбором пациента',
  'Страницы врачей не работали как фактор доверия — только ФИО и специальность',
  'Блог жил отдельно от коммерческих страниц — инфотрафик уходил в никуда',
  'Локальная выдача и карточки клиники были раскрыты не полностью',
  'Пациенту приходилось самому собирать доверие по кускам',
]

const workStreams = [
  { number: '01', label: 'Структура', title: 'Пересобрал сайт под путь пациента', text: 'Симптом → услуга → врач → доказательства → запись. Каждый шаг должен быть на сайте, без разрывов.', points: ['Отдельные страницы услуг с ценами, показаниями и contra-indications', 'Страницы врачей со стажем, образованием, повышением квалификации, отзывами и услугами', 'Понятные точки записи на каждом уровне'] },
  { number: '02', label: 'Доверие', title: 'Усилил страницы врачей', text: 'Сделал их фактором выбора, а не формальностью.', points: ['Специализация и направления работы', 'Стаж и образование', 'Отзывы пациентов', 'Прямая запись к конкретному врачу'] },
  { number: '03', label: 'Контент', title: 'Связал информационный спрос с коммерческим', text: 'Блог перестал быть «для трафика». Каждая статья получила мост к услуге и врачу: интерес → доверие → переход на услугу → запись.', note: 'В медицине инфотрафик без коммерческого продолжения почти не монетизируется. Я устранил этот разрыв.' },
  { number: '04', label: 'Локальный контур', title: 'Усилил присутствие клиники рядом с пациентом', text: 'Доработал карты, карточки клиники, каталоги, отзывы. Убедился, что данные совпадают во всех источниках — это критично для медицинской выдачи.' },
  { number: '05', label: 'Удержание', title: 'Добавил связку с Telegram', text: 'Ответы на вопросы, подготовка к процедурам, мягкий возврат к записи. Сайт перестал быть единственным касанием.' },
  { number: '06', label: 'Метрики', title: 'Работал по реальным обращениям', text: 'Отслеживал не только трафик, но и какие страницы приводят записи, где лучше работает CTR и какие разделы сильнее влияют на обращение.' },
]

const results = [
  ['Записи из органического поиска', '46/мес', '126/мес'],
  ['Видимость по коммерческим запросам', '14%', '48%'],
  ['Ключевые запросы в ТОП-10', '37', '146'],
  ['Брендовый спрос (запросы/мес)', '320', '690'],
  ['Страницы, стабильно приводящие обращения', '5', '19'],
  ['Конверсия из SEO в запись', '1,4%', '3,2%'],
]

const beforeAfter = [
  ['Сайт-витрина клиники', 'Сайт как маршрут доверия и записи'],
  ['Список услуг', 'Система: услуга → врач → доказательства → запись'],
  ['Страницы врачей как формальность', 'Страницы врачей как фактор выбора'],
  ['Блог отдельно от бизнеса', 'Блог как источник коммерческого спроса'],
  ['SEO как трафик', 'SEO как канал роста клиники'],
]

const projectRoles = [
  'Анализ спроса и структуры сайта',
  'Пересборка архитектуры под путь пациента',
  'Требования к страницам услуг, врачей и контенту',
  'Локальное SEO и работа с карточками',
  'Настройка контуров удержания (Telegram)',
  'Контроль внедрения и проверка по метрикам',
]

const formatNumber = new Intl.NumberFormat('ru-RU').format
type ChartSeries = { readonly color: string; readonly label: string; readonly values: readonly number[] }

function SourceLabel({ children }: { children: ReactNode }) {
  return <p className="medical-proof-source">{children}</p>
}

function HorizontalBars({ items }: { items: readonly { readonly query: string; readonly value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value))
  return <div className="medical-proof-bars">{items.map((item) => <div key={item.query}><p><span>{item.query}</span><strong>{formatNumber(item.value)}</strong></p><i><b style={{ '--medical-bar': `${Math.max((item.value / max) * 100, 3)}%` } as CSSProperties} /></i></div>)}</div>
}

function LineChart({ ariaLabel, months, series, suffix = '' }: { ariaLabel: string; months: readonly string[]; series: readonly ChartSeries[]; suffix?: string }) {
  const width = 730
  const height = 310
  const inset = { top: 36, right: 32, bottom: 47, left: 42 }
  const values = series.flatMap((item) => [...item.values])
  const max = Math.max(...values) * 1.14
  const plotWidth = width - inset.left - inset.right
  const plotHeight = height - inset.top - inset.bottom
  const x = (index: number) => inset.left + (plotWidth * index) / Math.max(months.length - 1, 1)
  const y = (value: number) => inset.top + plotHeight - (value / max) * plotHeight
  return <div className="medical-proof-chart"><svg aria-label={ariaLabel} role="img" viewBox={`0 0 ${width} ${height}`}>
    {[0,1,2,3,4].map((step) => { const lineY = inset.top + (plotHeight * step) / 4; return <line className="medical-proof-chart__grid" key={step} x1={inset.left} x2={width - inset.right} y1={lineY} y2={lineY} /> })}
    {series.map((item) => <g key={item.label}><polyline fill="none" points={item.values.map((value,index) => `${x(index)},${y(value)}`).join(' ')} stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />{item.values.map((value,index) => <g key={`${item.label}-${months[index]}`}><circle cx={x(index)} cy={y(value)} fill="#fff" r="5.5" stroke={item.color} strokeWidth="4" /><text className="medical-proof-chart__value" x={x(index)} y={y(value)-12}>{value > 999 ? formatNumber(value) : value}{suffix}</text></g>)}</g>)}
    {months.map((month,index) => <text className="medical-proof-chart__month" key={month} x={x(index)} y={height-16}>{month}</text>)}
  </svg>{series.length > 1 && <div className="medical-proof-legend">{series.map((item) => <span key={item.label}><i style={{ background:item.color }} />{item.label}</span>)}</div>}</div>
}

function MetricStrip({ items }: { items: readonly { readonly label: string; readonly value: string }[] }) {
  return <div className="medical-proof-metrics">{items.map((item) => <article key={item.label}><strong>{item.value}</strong><span>{item.label}</span></article>)}</div>
}

function ProcessFlow({ items }: { items: readonly string[] }) {
  return <ol className="medical-proof-process">{items.map((item,index) => <li key={item}><span>{String(index+1).padStart(2,'0')}</span><strong>{item}</strong></li>)}</ol>
}

export function MedicalClinicCasePage() {
  const data = caseMedicalData
  const specialties = [data.wordstat.gynecologist, data.wordstat.neurologist, data.wordstat.endocrinologist, data.wordstat.gastroenterologist, data.wordstat.cardiologist]
  const regionalDemand = specialties.map((item) => item.regional)
  const reputationDemand = specialties.map((item) => item.reviews)
  const neurologistPath = [data.wordstat.neurologist.regional, data.wordstat.neurologist.reviews, data.wordstat.neurologist.appointment, data.wordstat.neurologist.book, data.wordstat.neurologist.bookRegional]
  const gscClicks = data.gsc.series.map((row) => row.clicks)
  const gscImpressions = data.gsc.series.map((row) => row.impressions)
  const appointments = data.metrika.series.map((row) => row.appointments)
  const conversion = data.metrika.series.map((row) => row.conversion)

  return (
    <>
      <PageHero
        aside={<figure className="medical-case-hero-visual medical-case-hero-visual--image"><img alt="Рост записей из органического поиска медицинской клиники с 46 до 126 в месяц" height="1254" loading="eager" src="/images/cases/seo-meditsinskaya-klinika/seo-meditsinskaya-klinika-zapisi-iz-poiska.webp" title="SEO медицинской клиники: рост записей из поиска" width="1254" /></figure>}
        breadcrumbs={[{ label:'Главная', path:'/' }, { label:'Все кейсы', path:'/cases/' }, { label:'B2C · медицина · локальный спрос' }]}
        eyebrow="B2C · медицина · локальный спрос · YMYL"
        summary="Органический поиск стал стабильным каналом записей, а не просто источником переходов"
        title="Как клиника перестала терять пациентов между поиском и записью"
      >
        <div aria-label="Результаты проекта" className="medical-case-hero-metrics medical-case-hero-metrics--proof"><div><strong>{data.business.appointments}</strong><span>записей из поиска в месяц</span></div><div><strong>{data.business.conversion}</strong><span>конверсия в запись</span></div><div><strong>{data.business.visibility}</strong><span>видимость</span></div><div><strong>{data.business.top10}</strong><span>запросов в ТОП-10</span></div><div><strong>{data.business.convertingPages}</strong><span>страниц приводят обращения</span></div><div><strong>{data.business.period}</strong><span>до системного результата</span></div></div>
      </PageHero>

      <Section className="board-case-section medical-case-section" id="client" title="Клиент и задача"><div className="medical-case-client"><p>Медицинская клиника в крупном городе. Врачи, направления, лицензии, базовый сайт — всё было. Но поиск не давал того объёма записей, который мог бы давать.</p><aside><span>Задача</span><p>Превратить органический поиск в стабильный канал записей, а не просто источник переходов.</p></aside></div></Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="specialty-demand" title="Пациент уже знает специалиста и выбирает, куда обратиться" tone="blue">
        <p className="eyebrow">Коммерческий спрос</p><HorizontalBars items={regionalDemand} /><p className="medical-proof-note">Это уже не запросы о симптомах. Пользователь определился со специальностью и ищет медицинскую услугу в Санкт-Петербурге. Частотности пересекаются и не суммируются.</p><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="specialty-to-booking" title="Поисковый путь продолжается после выбора специальности">
        <div className="medical-proof-search-path">{neurologistPath.map((item,index) => <article key={item.query}><span>{['Специальность','Изучает доверие','Смотрит услугу','Готов к действию','Локализует'][index]}</span><strong>{formatNumber(item.value)}</strong><p>{item.query}</p></article>)}</div><p className="medical-proof-note">Это не воронка и не последовательные пользователи. Значения показывают разные поисковые формулировки и элементы принятия решения; конверсия между частотностями не рассчитывается.</p><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="specialty-comparison" title="Коммерческий путь повторяется у разных специальностей" tone="muted">
        <div className="medical-proof-table-wrap"><table className="medical-proof-table"><thead><tr><th>Специальность</th><th>СПб</th><th>Отзывы</th><th>Приём</th><th>Записаться</th><th>Записаться СПб</th></tr></thead><tbody>{specialties.map((item) => <tr key={item.label}><th>{item.label}</th><td>{formatNumber(item.regional.value)}</td><td>{formatNumber(item.reviews.value)}</td><td>{item.appointment ? formatNumber(item.appointment.value) : '—'}</td><td>{formatNumber(item.book.value)}</td><td>{formatNumber(item.bookRegional.value)}</td></tr>)}</tbody></table></div><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="reputation-demand" title="После выбора специальности пациент проверяет доверие к врачу">
        <HorizontalBars items={reputationDemand} /><p className="medical-proof-note">Эти значения не означают запросы именно о нашей клинике. Они показывают наличие отдельного поискового спроса на проверку репутации специалиста.</p><SourceLabel>{data.wordstat.source}</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="decision-page" title="Страница должна ответить на вопросы пациента до записи" tone="blue">
        <p className="eyebrow">Решение пациента</p><div className="medical-proof-page-map"><div><strong>Страница<br />специальности</strong></div>{data.decision.pageArchitecture.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}</div><p className="medical-proof-note">Для YMYL-страницы важны прозрачность выбора и доказательства квалификации — без обещаний результата лечения.</p>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="doctors-before-after" title="Не одна страница про всех врачей">
        <div className="medical-proof-before-after"><article><span>До</span><h3>Одна общая страница «Врачи»</h3><ul>{data.decision.before.map((item) => <li key={item}>{item}</li>)}</ul></article><article><span>После</span><h3>Отдельный коммерческий сценарий</h3><ol>{data.decision.after.map((item) => <li key={item}>{item}</li>)}</ol></article></div><p className="medical-proof-note">Структура должна соответствовать реальному спросу и фактически оказываемым услугам клиники.</p>
      </Section>

      <Section className="board-case-section medical-case-section" id="problem" title="Проблема: сайт рассказывал о клинике, но не помогал записаться" tone="muted"><div className="medical-case-problem"><div><p>Пациент приходил из поиска, но дальше не получал связной картины:</p><ul>{problemItems.map((item) => <li key={item}>{item}</li>)}</ul></div><aside><strong>Клиника недобирала записи.</strong><p>Часть пациентов уходила туда, где решение выглядело понятнее и безопаснее.</p></aside></div><p className="medical-case-explainer">В медицине человек редко принимает решение сразу. Сначала он ищет решение своей проблемы, затем изучает услугу, врача, опыт клиники и только после этого готов записаться. Поэтому сайт должен последовательно провести пациента от первого запроса до понятного и безопасного выбора.</p></Section>

      <Section className="board-case-section medical-case-section" id="work" title="Что я сделал" tone="blue"><p className="medical-case-work-intro">Я работал с проектом сам — от анализа до контроля внедрения.</p><div className="medical-case-work-grid">{workStreams.map((item) => <article key={item.number}><header><span>{item.number}</span><small>{item.label}</small></header><h3>{item.title}</h3><p>{item.text}</p>{item.points && <ul>{item.points.map((point) => <li key={point}>{point}</li>)}</ul>}{item.note && <aside>{item.note}</aside>}{item.number === '01' && <p className="medical-case-explainer medical-case-explainer--card">Раньше услуги, врачи и доказательства доверия существовали на сайте отдельно друг от друга. Мы связали их в один маршрут: симптом → услуга → врач → доказательства → запись. Пациенту больше не нужно самостоятельно собирать информацию по разным разделам сайта.</p>}{item.number === '02' && <p className="medical-case-explainer medical-case-explainer--card">Для медицинского сайта недостаточно указать только имя и специальность врача. Пациенту важно увидеть стаж, образование, направления работы, отзывы и возможность сразу записаться к выбранному специалисту. Поэтому страницы врачей стали полноценной частью пути к записи.</p>}</article>)}</div></Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="converting-pages" title="19 страниц стабильно приводят обращения">
        <div className="medical-proof-page-portfolio"><strong>{data.pages.converting}</strong><div>{data.pages.categories.map((item,index) => <span key={item}><b>{String(index+1).padStart(2,'0')}</b>{item}</span>)}</div></div><p className="medical-proof-note">Трафик и записи распределены между набором коммерческих страниц, а не зависят от одной посадочной.</p><SourceLabel>Источник: данные проекта</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="five-questions" title="Пять вопросов перед записью" tone="muted">
        <div className="medical-proof-five-questions">{data.decision.fiveQuestions.map((item,index) => <article key={item.question}><span>{index+1}</span><h3>{item.question}</h3><p>{item.items.join(' · ')}</p></article>)}<div>Записаться</div></div>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="ymyl" title="Медицинская страница должна подтверждать, кто оказывает услугу" tone="blue">
        <p className="eyebrow">YMYL</p><ProcessFlow items={data.decision.ymylFlow} /><div className="medical-proof-ymyl-details">{data.decision.ymylDetails.map((item) => <span key={item}>✓ {item}</span>)}</div><p className="medical-proof-note">Схема показывает требуемую доказательность. Номера лицензий, документы и квалификации не выдумываются.</p>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="topvisor" title="146 коммерческих запросов закрепились в ТОП-10">
        <p className="eyebrow">Topvisor</p><div className="medical-proof-chart-layout"><LineChart ariaLabel="Динамика запросов в ТОП-3, ТОП-10 и ТОП-20" months={data.topvisor.months} series={data.topvisor.series} /><aside><strong>{data.topvisor.top10}</strong><span>запросов в ТОП-10</span></aside></div><SourceLabel>{data.topvisor.source}</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="visibility" title="Поисковая видимость выросла на 34 процентных пункта" tone="muted">
        <div className="medical-proof-chart-layout"><LineChart ariaLabel="Динамика поисковой видимости" months={data.visibility.months} series={[{ label:'Видимость, %', color:'#087f74', values:data.visibility.series }]} suffix="%" /><aside><strong>{data.visibility.before}% → {data.visibility.after}%</strong><span>видимость</span><b>+{data.visibility.deltaPoints} п.п.</b></aside></div><SourceLabel>{data.visibility.source}</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="gsc" title="Рост видимости сопровождался ростом поисковых переходов">
        <p className="eyebrow">Google Search Console</p><div className="medical-proof-chart-pair"><figure><figcaption>Клики</figcaption><LineChart ariaLabel="Динамика кликов Google Search Console" months={data.gsc.months} series={[{ label:'Клики', color:'#087f74', values:gscClicks }]} /></figure><figure><figcaption>Показы</figcaption><LineChart ariaLabel="Динамика показов Google Search Console" months={data.gsc.months} series={[{ label:'Показы', color:'#2563eb', values:gscImpressions }]} /></figure></div><MetricStrip items={data.gsc.kpis} /><SourceLabel>{data.gsc.source}</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="metrika" title="Записи и конверсия росли в одном периоде" tone="blue">
        <p className="eyebrow">Яндекс Метрика</p><div className="medical-proof-dual-chart"><figure><figcaption>Записи из органического поиска</figcaption><LineChart ariaLabel="Динамика записей из органического поиска" months={data.metrika.months} series={[{ label:'Записи', color:'#087f74', values:appointments }]} /></figure><figure><figcaption>Конверсия в запись</figcaption><LineChart ariaLabel="Динамика конверсии в запись" months={data.metrika.months} series={[{ label:'Конверсия, %', color:'#d48816', values:conversion }]} suffix="%" /></figure></div><div className="medical-proof-metrika-kpis"><article><strong>{data.metrika.appointmentsBefore} → {data.metrika.appointmentsAfter}</strong><span>записей в месяц</span><b>{data.metrika.appointmentsGrowth}</b></article><article><strong>{data.metrika.conversionBefore}% → {data.metrika.conversionAfter}%</strong><span>конверсия в запись</span><b>+{data.metrika.conversionDeltaPoints} п.п.</b></article></div><SourceLabel>{data.metrika.source}</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="ai-visibility" title="Страница услуги должна быть понятна не только поиску, но и AI-системам">
        <p className="eyebrow">AI-видимость</p><div className="medical-proof-ai-graph"><div className="medical-proof-ai-entities"><ProcessFlow items={data.ai.entities} /><div>{data.ai.evidence.map((item) => <span key={item}>{item}</span>)}</div></div><aside><h3>AI должен однозначно понимать</h3><ul><li>какая услуга оказывается</li><li>какой врач её оказывает</li><li>где проходит приём</li><li>сколько он стоит</li><li>как записаться</li><li>чем подтверждается квалификация</li></ul></aside></div>
        <div className="medical-proof-ai-dashboard"><LineChart ariaLabel="Демонстрационная динамика Share of Voice в Алисе AI" months={data.ai.months} series={[{ label:'Share of Voice, %', color:'#7c3aed', values:data.ai.shareOfVoice }]} suffix="%" /><div><strong>{data.ai.shareOfVoice[0]}% → {data.ai.shareOfVoice.at(-1)}%</strong><span>Share of Voice</span><b>{data.ai.mentions.before} → {data.ai.mentions.after}</b><small>контрольных коммерческих запросов с обнаружением сайта среди источников или упоминаний</small><ul>{data.ai.commercialQueries.map((item) => <li key={item}>«{item}»</li>)}</ul></div></div><SourceLabel>{data.ai.source}</SourceLabel>
      </Section>

      <Section className="board-case-section medical-case-section medical-proof-section" id="search-to-booking" title="Коммерческий поиск связан с маршрутом к записи" tone="muted">
        <ProcessFlow items={data.decision.causalFlow} /><div className="medical-proof-causal-kpis"><span><strong>{data.business.visibility}</strong>видимость</span><span><strong>{data.business.top10}</strong>запросов в ТОП-10</span><span><strong>{data.business.convertingPages}</strong>страниц</span><span><strong>{data.business.appointments}</strong>записей</span><span><strong>{data.business.conversion}</strong>конверсия</span></div><p className="medical-proof-note">Показатели относятся к одному проекту, но не соединяются ложной математической формулой.</p>
      </Section>

      <Section className="board-case-section medical-case-section" id="result" title="Результаты"><div className="medical-case-result-lead"><strong>+80</strong><span>записей из органического поиска в месяц</span><p>Рост с 46 до 126 подтверждённых записей.</p></div><div className="medical-case-table-wrap"><table className="medical-case-table"><thead><tr><th>Показатель</th><th>Было</th><th>Стало</th></tr></thead><tbody>{results.map(([metric,before,after]) => <tr key={metric}><th scope="row">{metric}</th><td>{before}</td><td><strong>{after}</strong></td></tr>)}</tbody></table></div><p className="medical-case-explainer">Итоговые цифры показывают рост не только поисковой видимости, но и реальных записей. За период работы количество подтверждённых записей из органического поиска выросло с 46 до 126 в месяц, видимость по коммерческим запросам — с 14% до 48%, а количество запросов в ТОП-10 — с 37 до 146.</p><p className="medical-case-sources"><strong>Источники данных:</strong> Яндекс Метрика · Google Search · Topvisor</p><div className="medical-proof-dashboard"><article><strong>{data.metrika.appointmentsAfter}</strong><span>записей в месяц из органики</span></article><article><strong>{data.business.appointments}</strong><span>динамика записей</span></article><article><strong>{data.metrika.conversionAfter}%</strong><span>конверсия в запись</span></article><article><strong>{data.business.conversion}</strong><span>динамика конверсии</span></article><article><strong>{data.visibility.after}%</strong><span>видимость</span></article><article><strong>{data.business.visibility}</strong><span>динамика видимости</span></article><article><strong>{data.business.top10}</strong><span>запросов в ТОП-10</span></article><article><strong>{data.business.convertingPages}</strong><span>страниц приводят обращения</span></article><article><strong>{data.business.period}</strong><span>работы</span></article></div><SourceLabel>{data.business.source}</SourceLabel></Section>

      <Section className="board-case-section medical-case-section" id="change" title="Что изменилось по сути" tone="muted"><div className="medical-case-before-after"><header><span>До</span><span>После</span></header>{beforeAfter.map(([before,after]) => <article key={before}><p>{before}</p><b aria-hidden="true">→</b><p>{after}</p></article>)}</div></Section>

      <Section className="board-case-section medical-case-section" id="conclusion" title="Вывод" tone="blue"><div className="medical-case-conclusion"><p>В медицине недостаточно быть в поиске. Пациент должен за один визит получить всё для решения: понятную услугу, понятного врача, доказательство экспертности, локальную прозрачность и спокойствие.</p><aside><p>Я собрал эти элементы в одну систему.</p><strong>Поэтому рост пошёл не только по трафику, но и по записям.</strong></aside></div></Section>

      <Section className="board-case-section medical-case-section" id="role" title="Моя роль в проекте"><div className="board-case-role medical-case-role"><ol>{projectRoles.map((role) => <li key={role}>{role}</li>)}</ol><aside><strong>Около 6 месяцев</strong><p>До системного результата в рамках SEO-сопровождения.</p></aside></div></Section>

      <Section className="board-case-disclaimer" id="disclaimer" title="Примечание" tone="muted"><p>Рост записей — результат комплексной работы со структурой, контентом и доверием. Конкретная динамика зависит также от репутации клиники, цен и работы администраторов. Я фиксирую состав работ и способ проверки результата.</p></Section>

      <Section className="board-case-cta medical-case-cta" id="contact" tone="muted"><div className="board-case-cta__layout"><div className="board-case-cta__copy"><p className="eyebrow">Следующий шаг</p><h2>У клиники есть сайт, но поиск не даёт нужного числа записей?</h2><p>Покажу, где пациент теряет доверие на вашем сайте и как собрать путь от симптома до записи.</p></div><div className="board-case-cta__form"><LeadForm compact context="SEO медицинской клиники" description="Обычно отвечаю в рабочий день или на следующий. Для первой оценки достаточно ссылки на сайт." eyebrow="Предварительная оценка" serviceCode="case_6" submitLabel="Получить предварительный разбор" title="Разобрать сайт клиники" /></div></div></Section>
    </>
  )
}
