import { useState } from 'react'
import { cases } from '../data/cases'
import { contactDetails } from '../data/routes'
import { articles } from '../data/articles'
import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import { ArticleCard, AuthorCard, ButtonLink, IconTile, ProofCard, Section } from '../components/ui'

export function AboutPage() {
  return (
    <>
      <PageHero aside={<div className="profile-hero-card"><img src="/images/fedor-magerya.jpg" alt="Фёдор Магеря, SEO-специалист" /><div><strong>Фёдор Магеря</strong><span>SEO-специалист</span><a className="button button--secondary" href="#about"><span>Обо мне</span></a></div></div>} breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Обо мне' }]} eyebrow="Независимая практика из Санкт-Петербурга" summary="Лично анализирую данные, определяю приоритеты, готовлю задачи для внедрения и проверяю результат." title="Моя SEO-практика и подход к проектам" />

      <Section eyebrow="Личное участие" id="about" title="Что я беру на себя" tone="muted">
        <div className="fact-grid fact-grid--four">
          <article><span>1</span><h3>Диагностика</h3><p>Сам анализирую спрос, сайт, данные и ограничения бизнеса.</p></article>
          <article><span>2</span><h3>Приоритеты</h3><p>Отделяю задачи, которые влияют на цель, от длинного списка улучшений.</p></article>
          <article><span>3</span><h3>Постановки и QA</h3><p>Готовлю требования для разработчиков и проверяю результат после релиза.</p></article>
          <article><span>4</span><h3>Измерение</h3><p>Сопоставляю внедрения с видимостью, обращениями и качеством лида.</p></article>
        </div>
      </Section>

      <Section eyebrow="Практика и доказательства" id="practice" title="Практика в проектах">
        <div className="feature-split feature-split--proof">
          <ProofCard item={cases[0]} />
          <div className="evidence-note"><p className="eyebrow">Моя роль</p><h3>Структура, требования и контроль внедрения</h3><div className="about-evidence-grid"><article><span>Источник</span><strong>Topvisor</strong></article><article><span>Период</span><strong>8 месяцев</strong></article><article><span>Контекст</span><strong>Команда · предложение · сезонность · рынок</strong></article></div><details className="about-disclosure"><summary>Как учитывать контекст результата</summary><p>Для измеримого результата указаны источник и период. Остальные факторы не выдаются за эффект одного действия.</p></details><div className="evidence-note__actions"><ButtonLink dataCta="view_case" dataContext="about_proof" to="/cases/seo-klining-dlya-biznesa/" variant="secondary">Посмотреть кейс</ButtonLink><ButtonLink dataCta="view_results" dataContext="about_proof" to="/results/" variant="secondary">Посмотреть результаты</ButtonLink></div></div>
        </div>
      </Section>

      <Section eyebrow="Модель взаимодействия" id="work" title="Как строится совместная работа" tone="blue">
        <div className="roles-map roles-map--two">
          <article><span>1</span><h3>С моей стороны</h3><ul><li>Анализ и стратегия.</li><li>Приоритеты и структура.</li><li>Контент, метатеги и микроразметка.</li><li>SEO-ТЗ, SEO-QA и оценка результата.</li></ul></article>
          <article><span>2</span><h3>Если у вас есть своя IT-команда</h3><ul><li>Изменения в коде, шаблонах и интеграциях выполняет ваша команда.</li><li>Я готовлю постановки.</li><li>Проверяю внедрение после публикации.</li></ul></article>
        </div>
      </Section>

      <Section eyebrow="Принципы" id="principles" title="Как принимаются решения">
        <div className="process-grid">
          <IconTile index="1" title="Приоритеты вместо шума"><p>Задача должна быть связана со спросом, техникой, доверием, заявкой или риском.</p></IconTile>
          <IconTile index="2" title="Внедрение важнее отчёта"><p>Для каждой рекомендации определяю критерий готовности и проверяю результат после публикации.</p></IconTile>
          <IconTile index="3" title="Проверяемые выводы"><p>Показываю гипотезы и результаты с контекстом, источником и факторами, которые могли повлиять на показатели.</p></IconTile>
          <IconTile index="4" title="Надёжные доказательства"><p>Использую фактические отзывы, доступные источники и проверяемые показатели.</p></IconTile>
        </div>
      </Section>

      <Section eyebrow="Опыт по типам задач" id="experience" intro="Основные направления видны сразу. Детали можно раскрыть по нужной задаче." title="Где особенно полезен мой опыт" tone="muted">
        <div className="about-expertise-grid">
          {[
            ['Технический SEO и индексация', 'Техническая устойчивость сайта', 'Нахожу системные ошибки, готовлю постановки и проверяю результат после релиза.'],
            ['Интернет-магазины и каталоги', 'Масштабируемая структура', 'Проектирую категории, фильтры и внутренние связи под реальный спрос.'],
            ['B2B и длинный цикл выбора', 'Поисковые сценарии бизнеса', 'Связываю страницы, доказательства и роли участников выбора.'],
            ['Local SEO и несколько точек', 'Локальный спрос', 'Выстраиваю региональные страницы и согласованность локальных сигналов.'],
            ['SEO-аналитика и конверсия', 'Данные для решений', 'Сопоставляю видимость, трафик, обращения и качество результата.'],
            ['GEO / AEO / AI-видимость', 'Видимость в AI-ответах', 'Проверяю сущности, источники и полноту представления бизнеса.'],
          ].map(([label, title, description]) => <details className="about-expertise-item" key={title}><summary><span>{label}</span><strong>{title}</strong><i aria-hidden="true">+</i></summary><p>{description}</p></details>)}
        </div>
      </Section>

      <Section className="final-form-section final-form-section--priority" eyebrow="Обсудить проект" id="contact" tone="muted">
        <div className="final-form-grid final-form-grid--form-priority"><LeadForm compact context="Обо мне: обращение" description="Я посмотрю сайт и отвечу по указанному контакту." serviceCode="about_contact" title="Покажите сайт — предложу следующий шаг" /><AuthorCard compact commercial /></div>
      </Section>

      <Section eyebrow="Материалы автора" id="articles" title="Методика в открытых разборах">
        <div className="card-grid card-grid--three">{articles.slice(0, 3).map((article) => <ArticleCard article={article} key={article.id} />)}</div>
        <div className="section-action"><ButtonLink to="/journal/" variant="secondary">Все материалы</ButtonLink></div>
      </Section>
    </>
  )
}

const processStages = [
  {
    weeks: 'Недели 1–2',
    title: 'Анализ сайта и исходных данных',
    action: 'Изучаю сайт, поисковый спрос, техническое состояние, ключевые страницы, аналитику и историю изменений.',
    client: 'Доступы к аналитике и поисковым панелям, цели бизнеса и информация о последних изменениях сайта.',
    result: 'Карта текущей ситуации, найденных точек роста и вопросов, которые требуют решения.',
    check: 'Сверяю выводы между crawl, поисковыми панелями, аналитикой и фактическим состоянием страниц.',
  },
  {
    weeks: 'Недели 3–4',
    title: 'Приоритеты и SEO-задачи',
    action: 'Оцениваю влияние, срочность и трудоёмкость найденных задач, затем готовлю последовательный план.',
    client: 'Информация о возможностях разработки, контента и сроках согласования.',
    result: 'Приоритеты, готовые постановки и план работ на ближайшие 8–12 недель.',
    check: 'У каждой приоритетной задачи есть понятный результат и критерий проверки после публикации.',
  },
  {
    weeks: 'Недели 5–8',
    title: 'Внедрение и проверка',
    action: 'Вношу доступные изменения самостоятельно или сопровождаю вашу команду, отвечаю на вопросы и провожу SEO-QA.',
    client: 'Публикация задач, для которых требуются разработка, дизайн или внутреннее согласование.',
    result: 'Опубликованные изменения и список проверенных страниц, шаблонов и технических сигналов.',
    check: 'Проверяю сайт после публикации и сопоставляю результат с исходной постановкой.',
  },
  {
    weeks: 'Недели 9–12',
    title: 'Оценка результата и следующий этап',
    action: 'Сравниваю поисковую видимость, трафик, конверсии и качество обращений на сопоставимых периодах.',
    client: 'Обратная связь по качеству обращений и бизнес-изменениям, которые могли повлиять на показатели.',
    result: 'Вывод по внедрённым задачам и новые приоритеты на основе полученных данных.',
    check: 'Использую релевантные источники конкретной задачи и учитываю сезонность, рынок и другие изменения.',
  },
]

export function ProcessPage() {
  const [activeStage, setActiveStage] = useState(0)
  const stage = processStages[activeStage]
  return (
    <>
      <PageHero breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Процесс' }]} eyebrow="Этапы работы" summary="Работа проходит по понятным этапам: я анализирую сайт и исходные данные, определяю приоритеты, готовлю и внедряю SEO-задачи, проверяю реализацию и оцениваю результат." title="Как SEO-задача проходит путь до измеримого результата"><a className="button button--primary" data-analytics="service_cta_click" data-cta="process_contact" data-context="process_hero" data-analytics-params={JSON.stringify({ service: 'process', placement: 'hero' })} href="#contact"><span>Обсудить SEO-задачи сайта</span></a></PageHero>

      <Section eyebrow="Формат взаимодействия" id="roles" title="Как строится работа над проектом" tone="blue">
        <div className="service-role-cards">
          <article><h3>Беру SEO-задачи на себя</h3><ul className="work-check-list"><li>Анализ сайта и поискового спроса</li><li>Семантика и структура страниц</li><li>Метатеги и контент</li><li>Микроразметка и SEO-ТЗ</li><li>Доступные изменения в CMS</li><li>Проверка после публикации</li></ul></article>
          <article><h3>Если у вас есть своя IT-команда</h3><ul className="work-check-list"><li>Передаю готовые постановки</li><li>Отвечаю на вопросы при реализации</li><li>Проверяю релиз</li><li>Возвращаю замечания</li><li>Контролирую итоговое состояние</li></ul><ButtonLink to="/services/" variant="secondary">Все SEO-направления</ButtonLink></article>
        </div>
      </Section>

      <Section eyebrow="Способ оценки" id="proof" title="Как я проверяю результат">
        <div className="dependency-callout dependency-callout--positive"><span aria-hidden="true">✓</span><div><p>До начала работ фиксирую текущие показатели. После внедрения сравниваю индексацию, поисковую видимость, трафик и конверсии за достаточный период, чтобы оценить результат.</p></div></div>
      </Section>

      <Section eyebrow="Сроки измерения" id="timing" title="Когда можно оценивать результат">
        <p className="section__intro">Изменения начинают влиять на показатели после публикации. Затем требуется время, чтобы поисковые системы обработали изменения и накопились данные для сравнения. Если внедрение переносится, дата оценки результата переносится вместе с ним.</p>
      </Section>

      <Section eyebrow="План первых недель" id="stages" title="Этапы работы" tone="muted">
        <div aria-label="Этапы процесса" className="process-tabs" role="tablist">{processStages.map((item, index) => <button aria-controls="process-stage-panel" aria-selected={activeStage === index} className={activeStage === index ? 'is-active' : undefined} id={'process-tab-' + index} key={item.title} onClick={() => setActiveStage(index)} role="tab" type="button"><span>{item.weeks}</span><strong>{item.title}</strong></button>)}</div>
        <article aria-labelledby={'process-tab-' + activeStage} className="process-stage-panel" id="process-stage-panel" role="tabpanel"><header><span>{stage.weeks}</span><h3>{stage.title}</h3></header><dl><div><dt>Что я делаю</dt><dd>{stage.action}</dd></div><div><dt>Что потребуется от вас</dt><dd>{stage.client}</dd></div><div><dt>Что будет готово</dt><dd>{stage.result}</dd></div><div><dt>Как проверяю результат</dt><dd>{stage.check}</dd></div></dl><div className="section-action section-action--left"><ButtonLink to="/report-example/" variant="secondary">Посмотреть пример отчёта</ButtonLink></div></article>
      </Section>

      <Section className="final-form-section final-form-section--priority" eyebrow="Следующий шаг" id="contact">
        <div className="final-form-grid final-form-grid--form-priority"><LeadForm compact context="Процесс: обращение" description="Я посмотрю сайт и предложу подходящий следующий шаг." serviceCode="process" submitLabel="Обсудить сайт" title="Покажите сайт — предложу первый этап работы" /><aside className="form-service-context"><span>Пример результата</span><strong>Отчёт и постановки</strong><ButtonLink to="/report-example/" variant="secondary">Посмотреть пример отчёта</ButtonLink></aside></div>
      </Section>
    </>
  )
}

const reportScreens = [['Сводка для бизнеса', 'Что происходит с сайтом, где теряется потенциал и что делать сначала.'], ['Точки роста', 'Какие страницы, запросы и этапы пользователя ограничивают результат.'], ['Приоритетный план', 'Что внедряем первым и какой показатель проверяем.'], ['SEO-задачи', 'Конкретный URL или шаблон, что изменить, пример и способ проверки.'], ['Контроль внедрения', 'Что опубликовано, что требует корректировки и что проверяется после публикации.'], ['Результат', 'Яндекс Метрика, Google Search Console (GSC) и Topvisor до и после внедрения на сопоставимом периоде.']]

export function ReportExamplePage() {
  return (
    <>
      <PageHero breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Пример отчёта' }]} eyebrow="Пример рабочего результата" summary="Руководитель видит состояние проекта, точки роста, приоритеты и результат. IT- и контент-команда получает конкретные задачи, примеры и способ проверки после внедрения." title="Как выглядит SEO-отчёт">
      </PageHero>
      <Section eyebrow="Шесть разделов" id="structure" title="Структура рабочего отчёта" tone="muted">
        <div className="report-screens">{reportScreens.map(([title, text], index) => <article key={title}><span>{String(index + 1)}</span><div className="report-screens__mock"><i /><i /><i /><strong>{title}</strong></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </Section>
      <Section eyebrow="Уровень решения" id="executive" title="Для руководителя">
        <div className="fit-grid"><article className="fit-card"><h3>Что делать первым и почему</h3><ul><li>Влияние на цель.</li><li>Риск и стоимость задержки.</li><li>Ответственный и срок выполнения.</li><li>Способ проверить эффект.</li></ul></article><article className="fit-card"><h3>Что можно решить быстро</h3><ul><li>Критичные ограничения.</li><li>Зависимости между задачами.</li><li>Необходимый ресурс команды.</li><li>Следующая контрольная точка.</li></ul></article></div>
      </Section>
      <Section eyebrow="Уровень внедрения" id="team" title="Для IT- и контент-команды" tone="blue">
        <div className="fit-grid"><article className="fit-card"><h3>Что означает «готово»</h3><ul><li>Точный сценарий.</li><li>Ожидаемые URL и состояния.</li><li>Исключения и ошибки.</li><li>Критерии приёмки.</li></ul></article><article className="fit-card"><h3>Как проходит проверка</h3><ul><li>Проверка на стенде.</li><li>Контроль после публикации.</li><li>Фиксация отклонений.</li><li>Повторный замер результата.</li></ul></article></div>
      </Section>
    </>
  )
}

const resultGoals = ['Все цели', 'Видимость', 'Квалифицированные обращения', 'Локальный спрос']
const resultNiches = ['Все ниши', 'B2B', 'B2C', 'Медицина']
const resultSiteTypes = ['Все типы', 'Услуги', 'Сеть точек', 'Каталог']
function filterResults(itemId: string, goal: string, niche: string, siteType: string) {
  const byGoal: Record<string, string[]> = { Видимость: ['1', '3'], 'Квалифицированные обращения': ['2', '4', '5', '6'], 'Локальный спрос': ['1', '3', '6'] }
  const byNiche: Record<string, string[]> = { B2B: ['2', '4'], B2C: ['1', '3', '5'], Медицина: ['6'] }
  const bySite: Record<string, string[]> = { Услуги: ['2', '5', '6'], 'Сеть точек': ['1', '3', '6'], Каталог: ['4'] }
  return (goal === 'Все цели' || byGoal[goal]?.includes(itemId)) && (niche === 'Все ниши' || byNiche[niche]?.includes(itemId)) && (siteType === 'Все типы' || bySite[siteType]?.includes(itemId))
}

export function ResultsPage() {
  const [goal, setGoal] = useState(resultGoals[0]); const [niche, setNiche] = useState(resultNiches[0]); const [siteType, setSiteType] = useState(resultSiteTypes[0])
  const visible = cases.filter((item) => filterResults(item.id, goal, niche, siteType))
  return <><PageHero breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Результаты' }]} eyebrow="Практика по задачам" summary="Выберите задачу, нишу и тип сайта, чтобы увидеть релевантные примеры выполненной работы." title="Примеры SEO-работ по контексту проекта" /><Section eyebrow="Фильтры" title="Найти релевантный пример" tone="muted"><div className="result-filters"><label><span>Цель</span><select value={goal} onChange={(event) => setGoal(event.target.value)}>{resultGoals.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Ниша</span><select value={niche} onChange={(event) => setNiche(event.target.value)}>{resultNiches.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Тип сайта</span><select value={siteType} onChange={(event) => setSiteType(event.target.value)}>{resultSiteTypes.map((item) => <option key={item}>{item}</option>)}</select></label></div><p aria-live="polite" className="filter-result">Найдено карточек: {visible.length}</p>{visible.length ? <div className="card-grid card-grid--two">{visible.map((item) => <ProofCard item={item} key={item.id} />)}</div> : <div className="empty-state"><h3>Нет карточек с таким сочетанием</h3><p>Расширьте фильтры, чтобы увидеть другие примеры работы.</p></div>}</Section><Section eyebrow="Как читать карточку" title="Что показано в примере работы"><div className="numbered-cards numbered-cards--six">{['Задача', 'Исходная ситуация', 'Что изменили', 'Период', 'Источник при наличии', 'Роль в проекте'].map((entry, index) => <article key={entry}><span>{String(index + 1)}</span><p>{entry}</p></article>)}</div></Section></>
}

export function ContactPage() {
  return (
    <>
      <PageHero aside={<LeadForm compact context="Контакты" serviceCode="contact_audit" title="Покажите сайт — подготовлю предварительный вывод" />} breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Контакты' }]} eyebrow="Простой первый контакт" summary="Пришлите сайт и удобный контакт. Я посмотрю публичную часть сайта и отвечу с предварительным выводом." title="Получить предварительный разбор сайта" />
      <Section eyebrow="Прямые способы связи" title="Выберите удобный канал" tone="muted"><div className="contact-grid"><a data-analytics="telegram_click" data-cta="telegram_contact" data-context="contact_page" href={contactDetails.telegramHref}><span>Telegram</span><strong>{contactDetails.telegramLabel}</strong></a><a data-analytics="phone_click" data-cta="phone_contact" data-context="contact_page" href={contactDetails.phoneHref}><span>Телефон</span><strong>{contactDetails.phoneLabel}</strong></a><div className="contact-channel"><span>Мессенджер MAX</span><strong>{contactDetails.phoneLabel}</strong><small>По номеру телефона</small></div><a data-analytics="email_click" data-cta="email_contact" data-context="contact_page" href={contactDetails.emailHref}><span>Email</span><strong>{contactDetails.emailLabel}</strong></a></div></Section>
      <Section eyebrow="Что произойдёт дальше" title="От ссылки до понятного следующего шага"><div className="timeline timeline--horizontal"><article><span>1</span><h3>Заявка сохранена</h3><p>Сайт и контакт сразу попадают в защищённый список обращений.</p></article><article><span>2</span><h3>Проверка сигналов</h3><p>Я смотрю индексацию, спрос, страницы, доверие и путь до обращения.</p></article><article><span>3</span><h3>Первичный вывод</h3><p>Вы получаете 3–5 наблюдений и рекомендуемый формат.</p></article><article><span>4</span><h3>Решение</h3><p>Если формат подходит, я уточню объём, данные и порядок работы.</p></article></div></Section>
      <Section eyebrow="Срок ответа" title="Обычно в рабочий день или на следующий"><div className="availability-card"><h3>Актуальная доступность</h3><p>Загрузку и возможный срок старта уточню в первом ответе.</p></div></Section>
    </>
  )
}
