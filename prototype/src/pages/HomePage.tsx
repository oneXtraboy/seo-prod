import { cases } from '../data/cases'
import { services } from '../data/services'
import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import {
  ButtonLink,
  CaseCard,
  FAQAccordion,
  IconTile,
  Section,
  ServiceCard,
} from '../components/ui'

const homeFaq = [
  { question: 'Что вы получите в первом ответе?', answer: 'Вы получите короткий предварительный вывод по сайту: 3–5 заметных точек роста, подходящий формат следующего шага и список данных для более глубокого анализа.' },
  { question: 'Кто будет вести проект?', answer: 'Я лично определяю стратегию и приоритеты, готовлю ключевые SEO-задачи и проверяю внедрение. При необходимости работаю напрямую с вашей IT-командой, редактором или маркетологом.' },
  { question: 'Можно гарантировать позиции или заявки?', answer: 'Я фиксирую состав работ, критерии качества, источники данных и способ проверки результата. Конкретная позиция зависит также от поисковых систем, конкурентов и скорости внедрения.' },
  { question: 'Сколько стоит старт?', answer: 'Текущая стоимость: аудит от 39 000 ₽, стратегический спринт от 59 000 ₽, сопровождение от 69 000 ₽ в месяц.' },
  { question: 'Что нужно подготовить?', answer: 'Для первого сообщения достаточно ссылки на сайт и Telegram или email. Доступы и подробности я запрошу только после предварительной оценки.' },
]

const soloWorkPoints = [
  {
    icon: 'person',
    title: 'Личное сопровождение',
    text: 'Сам анализирую данные, определяю приоритеты, готовлю задачи и проверяю внедрение. Ключевой анализ не передаю между менеджерами.',
  },
  {
    icon: 'calendar',
    title: 'Не более двух проектов одновременно',
    text: 'Каждый проект получает полное внимание и глубокое погружение. Это не маркетинговый ход — это условие качественной работы.',
  },
  {
    icon: 'chart',
    title: '10 лет в SEO',
    text: 'С 2016 года — от технических аудитов до стратегий роста для B2B и локального бизнеса. Знаю, какие задачи дадут рост, а какие — только съедят бюджет.',
  },
  {
    icon: 'map',
    title: 'Выверенная стратегия под ваши цели',
    text: 'Не шаблонный чек-лист, а пошаговый план на 6–12 месяцев с приоритетами, прогнозом и понятными критериями готовности каждого этапа.',
  },
  {
    icon: 'document',
    title: 'Подробные отчёты с влиянием на бизнес',
    text: 'Не просто позиции и трафик, а динамика обращений, конверсий и выручки из поиска. Сравниваю периоды до и после внедрения.',
  },
] as const

function SoloWorkIcon({ type }: { type: typeof soloWorkPoints[number]['icon'] }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.7 }
  if (type === 'person') return <svg aria-hidden="true" viewBox="0 0 32 32"><circle {...common} cx="16" cy="10" r="5" /><path {...common} d="M7 26c1.3-5.2 4.3-8 9-8s7.7 2.8 9 8" /></svg>
  if (type === 'calendar') return <svg aria-hidden="true" viewBox="0 0 32 32"><rect {...common} height="21" rx="3" width="24" x="4" y="7" /><path {...common} d="M10 4v6M22 4v6M4 13h24M10 18h4M18 18h4M10 23h4" /></svg>
  if (type === 'chart') return <svg aria-hidden="true" viewBox="0 0 32 32"><path {...common} d="M5 27V6M5 27h23M9 22l5-6 5 3 8-10" /><path {...common} d="M22 9h5v5" /></svg>
  if (type === 'map') return <svg aria-hidden="true" viewBox="0 0 32 32"><path {...common} d="M5 7l7-3 8 3 7-3v21l-7 3-8-3-7 3V7Z" /><path {...common} d="M12 4v21M20 7v21" /></svg>
  return <svg aria-hidden="true" viewBox="0 0 32 32"><path {...common} d="M8 3h11l6 6v20H8V3Z" /><path {...common} d="M19 3v7h6M12 16h9M12 21h9M12 26h6" /></svg>
}

export function HomePage() {
  return (
    <>
      <PageHero
        aside={(
          <div className="hero-person hero-person--compact">
            <img alt="Фёдор Магеря, SEO-специалист" className="hero-person__photo" height="1680" src="/images/fedor-magerya.jpg" width="1260" />
            <div className="hero-person__content">
              <strong>Фёдор Магеря</strong>
              <span>SEO-специалист · лично веду не более двух проектов одновременно</span>
            </div>
          </div>
        )}
        eyebrow="Независимая SEO-практика Фёдора Магери"
        summary="Помогаю компаниям находить точки роста в поиске, превращать анализ в понятные задачи и проверять результат после внедрения."
        title="SEO, которое превращается в понятный план работ и измеримый результат"
      >
        <div className="home-hero-cta">
          <ButtonLink analytics="hero_cta_click" analyticsParams={{ placement: 'home_hero', action: 'show_site' }} dataCta="show_site" dataContext="home_hero" to="/contacts/">Покажите ваш сайт</ButtonLink>
          <ButtonLink dataCta="choose_task" dataContext="home_hero" to="/services/" variant="secondary">Выбрать задачу</ButtonLink>
        </div>
      </PageHero>

      <Section className="solo-work-section" eyebrow="Почему работаю один" id="why" title="Личное сопровождение. Без делегирования ключевого анализа.">
        <div className="solo-work-status" role="status"><i aria-hidden="true" /><span>Сейчас свободно: <strong>1 место из 2</strong></span></div>
        <div className="solo-work-list">
          {soloWorkPoints.map((point) => (
            <article key={point.title}>
              <span className="solo-work-list__icon"><SoloWorkIcon type={point.icon} /></span>
              <div><h3>{point.title}</h3><p>{point.text}</p></div>
            </article>
          ))}
        </div>
        <div className="solo-work-cta">
          <div><h3>Хотите понять, что можно улучшить на вашем сайте?</h3><p>Обычно отвечаю в рабочий день или на следующий. Для первой оценки достаточно ссылки на сайт.</p></div>
          <ButtonLink dataCta="solo_work_contact" dataContext="home_why" to="/#contact">Получить предварительный вывод</ButtonLink>
        </div>
      </Section>

      <Section eyebrow="Практика в проектах" id="cases" intro="В каждом примере показаны задача, моя роль и результат работы." title="Примеры задач и результатов">
        <div className="card-grid card-grid--three">{cases.slice(0, 3).map((item) => <CaseCard item={item} key={item.id} />)}</div>
        <div className="section-action"><ButtonLink dataCta="cases_all" dataContext="home_cases" to="/cases/" variant="cases">Все кейсы</ButtonLink></div>
      </Section>

      <Section eyebrow="Основные форматы" id="services" intro="Для каждого формата указаны стоимость, результат и основные этапы работы. Точный объём я определю после знакомства с сайтом, задачей и исходными данными." title="Услуги и стоимость" tone="muted">
        <div className="card-grid card-grid--three">
          {['seo-audit', 'seo-strategy', 'seo-prodvizhenie'].map((id) => {
            const service = services.find((item) => item.id === id)
            return service ? <ServiceCard key={service.id} service={service} /> : null
          })}
        </div>
        <div className="section-action"><ButtonLink dataCta="services_all" dataContext="home_services" to="/services/">Все услуги</ButtonLink><ButtonLink dataCta="pricing_view" dataContext="home_services" to="/pricing/" variant="secondary">Сравнить форматы</ButtonLink></div>
      </Section>

      <Section eyebrow="Проверка после внедрения" id="process" intro="Срок оценки зависит от задачи, скорости внедрения и периода, необходимого для накопления данных." title="Как проходит работа" tone="blue">
        <div className="process-grid process-grid--home">
          <IconTile title="Анализ"><p>Изучаю сайт, спрос, аналитику, конкурентов и путь пользователя до обращения.</p></IconTile>
          <IconTile title="Приоритеты"><p>Выбираю задачи с наибольшим влиянием и фиксирую критерии готовности.</p></IconTile>
          <IconTile title="Внедрение"><p>Готовлю постановки, отвечаю на вопросы команды и проверяю публикацию.</p></IconTile>
          <IconTile title="Оценка"><p>После накопления данных сравниваю релевантные показатели и определяю следующий этап.</p></IconTile>
          <div className="home-process-action"><ButtonLink dataCta="process_view" dataContext="home_process" to="/process/">Посмотреть процесс</ButtonLink></div>
        </div>
      </Section>

      <Section eyebrow="До старта" id="not-fit" intro="SEO требует внедрения, доступа к данным и времени на проверку результата. Поэтому до старта сразу обозначаю ситуации, в которых моя работа не даст нормального результата." title="Когда я не подойду">
        <div className="fit-grid">
          <article className="fit-card"><h3>Нужна гарантия конкретной позиции</h3><p>Не обещаю ТОП-1 к определённой дате. Фиксирую состав работ, критерии качества, источники данных и способ проверки результата.</p></article>
          <article className="fit-card"><h3>Нужен результат без исходных данных</h3><p>Для системной работы нужен доступ к фактическим данным проекта: поисковой видимости, трафику, обращениям и информации о внедрениях.</p></article>
          <article className="fit-card"><h3>Проект работает в незаконной или серой тематике</h3><p>Не беру проекты, продвижение которых связано с незаконными услугами, обманом пользователей или обходом требований поисковых систем.</p></article>
        </div>
      </Section>

      <Section eyebrow="Коротко о важном" id="faq" title="Вопросы до первого разговора" tone="muted"><FAQAccordion items={homeFaq} /></Section>

      <Section className="final-form-section final-form-section--priority" eyebrow="Предварительный разбор" id="contact">
        <div className="final-form-grid final-form-grid--form-priority final-form-grid--home-full">
          <LeadForm compact context="Финальная форма главной" description="Я посмотрю публичную часть сайта и пришлю предварительный вывод по указанному контакту." serviceCode="home_audit" title="Получить предварительный разбор сайта" />
        </div>
      </Section>
    </>
  )
}
