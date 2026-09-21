import { caseById } from '../data/cases'
import { cleaningCaseSummary } from '../data/cleaningCaseData'
import { getServicePresentation } from '../data/servicePresentation'
import type { ServiceData } from '../types'
import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import { ServiceCatalog } from '../components/ServiceCatalog'
import { ServiceChooser } from '../components/ServiceChooser'
import { SeoFormatQuiz } from '../components/SeoFormatQuiz'
import {
  ButtonLink,
  CheckIcon,
  FAQAccordion,
  ProofCard,
  Section,
  StartingPriceNote,
} from '../components/ui'

export function ServicesIndexPage() {
  return (
    <>
      <PageHero
        compact
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Услуги' }]}
        eyebrow="Конкретная задача или неизвестная причина"
        summary="Не нужно заранее знать, какой именно аудит или услуга вам нужна. Можно выбрать конкретное направление или описать ситуацию — я предложу следующий шаг."
        title="SEO-задачи и форматы работы"
      >
        <a className="button button--primary" data-analytics="services_category_open" data-analytics-params={JSON.stringify({ placement: 'services_hero' })} data-cta="view_all_directions" data-context="services_hero" href="#directions"><span>Посмотреть направления</span></a>
        <a className="button button--secondary" data-analytics="situation_select" data-analytics-params={JSON.stringify({ placement: 'services_hero' })} data-cta="choose_by_situation" data-context="services_hero" href="#situations"><span>Подобрать решение</span></a>
      </PageHero>

      <Section
        eyebrow="14 крупных направлений"
        id="directions"
        intro="Выберите SEO-направление — справа откроется перечень работ и задач, которые я беру на себя."
        title="Все SEO-направления"
        tone="muted"
      >
        <ServiceCatalog />
      </Section>

      <Section
        className="section--situation"
        id="situations"
        intro="Выберите то, что сейчас происходит с сайтом — я покажу подходящие направления работы."
        title="Выбор по ситуации"
        tone="muted"
      >
        <ServiceChooser />
      </Section>

      <Section className="quiz-fallback-section" id="quiz" tone="muted">
        <SeoFormatQuiz />
      </Section>

      <Section className="final-form-section final-form-section--priority" eyebrow="Следующий шаг" id="contact" tone="muted">
        <div className="final-form-grid final-form-grid--form-priority"><LeadForm compact context="Выбор SEO-направления" description="Я посмотрю сайт и предложу подходящий формат работы." serviceCode="services_index" title="Покажите сайт — предложу подходящий формат" /><aside className="compact-proof-signal"><strong>{cleaningCaseSummary.top5} из {cleaningCaseSummary.monitored} запросов в ТОП-5</strong><span>Topvisor · GSC · Яндекс Вебмастер · 8 месяцев</span></aside></div>
      </Section>
    </>
  )
}


const strategyRoadmap = [
  {
    title: 'Приоритет 1 — структура коммерческих страниц',
    task: 'Разделить общий раздел услуг на отдельные посадочные под подтверждённые кластеры коммерческого спроса.',
    why: 'Сейчас несколько разных намерений пользователя конкурируют внутри одной страницы, поэтому поисковой системе сложнее определить наиболее релевантный URL.',
    prepare: 'Структуру новых посадочных, распределение запросов, требования к контенту, метатеги и схему внутренней перелинковки.',
    implementation: 'SEO-часть готовлю и вношу самостоятельно. Если изменения требуют разработки, передам готовую постановку вашей команде и проверю реализацию.',
    check: 'Новые URL доступны для обхода, включены во внутреннюю перелинковку, имеют корректные canonical и не конкурируют между собой по основному спросу.',
    measure: 'Индексация новых страниц, рост количества релевантных запросов и динамика целевых посадочных в поиске.',
  },
  {
    title: 'Приоритет 2 — технические дубли',
    task: 'Убрать из индексации дубли страниц, которые создаются параметрами URL и внутренней навигацией.',
    why: 'Поисковый обход и внутренние ссылки сейчас распределяются между несколькими версиями одной страницы.',
    prepare: 'Список шаблонов URL, правила canonical/noindex/robots там, где они действительно нужны, и техническое ТЗ.',
    implementation: 'При доступе к CMS внесу доступные настройки самостоятельно. Серверные и шаблонные изменения передам разработчику и проверю после публикации.',
    check: 'Повторный crawl, проверка canonical, индексируемости и внутренних ссылок.',
    measure: 'Сокращение количества дублей и концентрация индексации на целевых URL.',
  },
  {
    title: 'Приоритет 3 — коммерческий контент',
    task: 'Переработать ключевые страницы услуг под поисковый спрос и вопросы клиента перед обращением.',
    why: 'Страницы должны одновременно соответствовать поисковому запросу и давать пользователю достаточно информации для принятия решения.',
    prepare: 'Структуру страницы, метатеги, заголовки, новые смысловые блоки, FAQ и рекомендации по CTA.',
    implementation: 'Тексты и SEO-правки готовлю самостоятельно или передать готовый материал вашему редактору.',
    check: 'Содержание страницы, метаданные, внутренние ссылки и корректность публикации.',
    measure: 'Изменение поисковой видимости страницы, CTR и конверсий из органического трафика.',
  },
  {
    title: 'Приоритет 4 — измерение результата',
    task: 'Настроить точки контроля для внедрённых SEO-задач.',
    why: 'После изменений нужно понимать, какие задачи действительно повлияли на поисковую видимость, трафик и обращения.',
    prepare: 'Набор показателей и сегментов в GSC, Яндекс Метрике, Вебмастере и Topvisor в зависимости от задачи.',
    implementation: 'Настройку выполняю по доступам и согласованному набору показателей.',
    check: 'Сравню показатели до и после внедрения на сопоставимых периодах.',
    measure: 'По релевантным метрикам конкретной задачи: индексация, запросы, позиции, CTR, органический трафик и обращения.',
  },
]

function StrategyRoadmap() {
  return (
    <Section className="strategy-roadmap-section" eyebrow="Рабочий пример" id="roadmap" intro="Так я фиксирую последовательность работ: что нужно изменить, почему это важно, кто выполняет задачу и как я проверю результат." title="Пример SEO-плана">
      <div className="strategy-roadmap">
        {strategyRoadmap.map((item, index) => <details key={item.title} open={index === 0}><summary><span>{String(index + 1)}</span><strong>{item.title}</strong><i aria-hidden="true">+</i></summary><div className="strategy-roadmap__content"><p><b>Проблема</b>{item.why}</p><p><b>Решение</b>{item.task} {item.prepare}</p><p><b>Внедрение</b>{item.implementation}</p><p><b>Проверка</b>{item.check} {item.measure}</p></div></details>)}
      </div>
      <div className="section-action section-action--left"><ButtonLink dataCta="view_report_example" dataContext="seo_strategy" to="/report-example/" variant="secondary">Посмотреть пример отчёта</ButtonLink></div>
    </Section>
  )
}

const serviceMethodFlows: Record<string, string[]> = {
  'seo-prodvizhenie': ['Анализ этапа', 'Приоритеты', 'Внедрение', 'Повторный замер'],
  'seo-audit': ['Проблема', 'Влияние', 'Приоритет', 'Постановка'],
  'technical-seo-audit': ['До релиза', 'Проверка', 'Релиз', 'После релиза'],
  'seo-consulting': ['Вопрос', 'Варианты', 'Решение', 'Следующий шаг'],
  'seo-prodvizhenie-novogo-sayta': ['Спрос', 'Структура', 'Шаблоны', 'Релиз'],
  'geo-aeo-ai-seo': ['Тема', 'Факт', 'Источник', 'Проверка'],
  'seo-for-b2b': ['Спрос', 'Сценарий', 'Страница', 'CRM'],
  'seo-for-small-business': ['Цель', 'Приоритеты', 'Внедрение', 'Следующий этап'],
  'seo-prodvizhenie-internet-magazina': ['Категория', 'Подкатегория', 'Фильтр', 'Товар'],
  'local-seo-spb': ['Запрос', 'Локальная страница', 'Карта', 'Обращение'],
}

const intermediateCtas: Record<string, string> = {
  'seo-audit': 'Обсудить состав аудита',
  'technical-seo': 'Обсудить техническую задачу',
  'seo-strategy': 'Обсудить SEO-стратегию',
  'seo-consulting': 'Описать вопрос',
  'seo-prodvizhenie': 'Обсудить сопровождение',
  'geo-aeo-ai-seo': 'Проверить AI-видимость',
  'local-seo-spb': 'Обсудить локальное SEO',
  'seo-for-b2b': 'Проверить B2B-спрос',
  'seo-for-small-business': 'Обсудить первый этап',
  'seo-prodvizhenie-internet-magazina': 'Проверить каталог',
  'seo-prodvizhenie-novogo-sayta': 'Обсудить SEO до запуска',
}

export function ServicePage({ service }: { service: ServiceData }) {
  const relatedCase = caseById.get(service.caseId)
  const presentation = getServicePresentation(service.id)
  const methodFlow = serviceMethodFlows[service.id] || ['Анализ', 'Решение', 'Внедрение', 'Проверка']

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Услуги', path: '/services/' }, { label: service.title }]}
        eyebrow={service.eyebrow}
        meta={(
          <div className="hero-offer-meta">
            <div><span>Стоимость</span><strong>{service.price}</strong><StartingPriceNote price={service.price} /></div>
            <div><span>Срок</span><strong>{service.duration}</strong></div>
          </div>
        )}
        summary={service.summary}
        title={service.title}
      >
        <a className="button button--primary" data-analytics="service_cta_click" data-analytics-params={JSON.stringify({ service: presentation.serviceCode, placement: 'hero' })} data-cta="service_contact" data-context={presentation.serviceCode} href="#contact"><span>{presentation.heroCta}</span></a>
        {relatedCase && service.id !== 'seo-strategy' && <ButtonLink dataCta="view_case" dataContext={presentation.serviceCode} to={relatedCase.path} variant="secondary">Посмотреть кейс</ButtonLink>}
      </PageHero>

      <Section id="fit" title="Для каких задач подходит">
        <div className="fit-task-grid">{service.fit.slice(0, 4).map((item) => <article key={item}><CheckIcon /><p>{item}</p></article>)}</div>
      </Section>

      <Section id="result" eyebrow="Результат работы" title="Что вы получите" tone="muted">
        <div className="outcome-grid">
          {presentation.outcomes.map((outcome, index) => (
            <article key={outcome.title}><span>{String(index + 1)}</span><h3>{outcome.title}</h3><p>{outcome.description}</p></article>
          ))}
        </div>
        {service.id !== 'seo-strategy' && <div className="artifact-callout artifact-callout--demonstration"><span>Демонстрация методики</span><strong>{service.artifactTitle}</strong><div className="artifact-method-flow">{methodFlow.map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}</div><p>{service.artifactPurpose}</p></div>}
        {presentation.reportLinkLabel && <div className="service-proof-link"><ButtonLink dataCta="view_report_example" dataContext={presentation.serviceCode} to="/report-example/" variant="secondary">{presentation.reportLinkLabel}</ButtonLink></div>}
      </Section>

      {service.id === 'seo-strategy' && <StrategyRoadmap />}

      {service.id === 'seo-strategy' && relatedCase ? (
        <Section id="case" eyebrow="3PL · B2B-логистика" title="SEO-структура под коммерческий спрос" tone="muted">
          <article className="strategy-case-card">
            <div><p className="eyebrow">Что я менял</p><ul className="check-list"><li><CheckIcon /><span>Структуру коммерческих страниц.</span></li><li><CheckIcon /><span>Распределение поискового спроса.</span></li><li><CheckIcon /><span>Доказательства рядом с ключевыми предложениями.</span></li></ul></div>
            <div className="strategy-case-card__result"><span>Результат</span><strong>{relatedCase.result}</strong><ButtonLink analyticsParams={{ case_id: relatedCase.id, placement: 'strategy' }} dataCta="view_case" dataContext="seo_strategy" to={relatedCase.path} variant="secondary">Посмотреть кейс</ButtonLink></div>
          </article>
        </Section>
      ) : relatedCase ? (
        <Section id="case" eyebrow={relatedCase.niche} title="Релевантный кейс" tone="muted">
          <div className="feature-split feature-split--proof">
            <ProofCard item={relatedCase} />
          </div>
        </Section>
      ) : null}

      {relatedCase && <div className="service-intermediate-cta"><a className="button button--primary" data-analytics="service_cta_click" data-analytics-params={JSON.stringify({ service: presentation.serviceCode, placement: 'after_case' })} data-cta="service_contact" data-context={presentation.serviceCode} href="#contact"><span>{intermediateCtas[service.id] || 'Обсудить задачу'}</span></a></div>}

      <Section id="includes" eyebrow="Состав работы" title="Что входит в работу">
        <div className="feature-split feature-split--single">
          <div className="stacked-list">
            {presentation.includes.map((entry, index) => (
              <article key={entry.title}><span>{String(index + 1)}</span><div><h3>{entry.title}</h3><p>{entry.description}</p></div></article>
            ))}
          </div>
        </div>
      </Section>

      <Section id="process" eyebrow="Этапы работы" title="Как строится работа над проектом">
        <div className="service-process-flow">
          {presentation.process.map((step, index) => (
            <article key={step.title}><span>{String(index + 1)}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></article>
          ))}
        </div>
        <div className="service-role-cards">
          <article><h3>Беру SEO-задачи на себя</h3><ul className="work-check-list"><li>Анализ сайта и поискового спроса</li><li>Семантика и структура страниц</li><li>Метатеги, контент и микроразметка</li><li>SEO-ТЗ и доступные изменения в CMS</li><li>Проверка после публикации</li></ul></article>
          <article><h3>Если у вас есть своя IT-команда</h3><ul className="work-check-list"><li>Передаю готовые постановки</li><li>Отвечаю на вопросы при реализации</li><li>Проверяю релиз</li><li>Возвращаю замечания</li><li>Контролирую итоговое состояние</li></ul><ButtonLink dataCta="view_all_services" dataContext={presentation.serviceCode} to="/services/" variant="secondary">Все SEO-направления</ButtonLink></article>
        </div>
      </Section>

      <Section id="price" eyebrow="Условия работы" title="Стоимость, состав и следующий этап" tone="blue">
        <div className="price-boundary-grid">
          <div className="price-boundary-grid__main"><h3>Стоимость и срок</h3><strong>{service.price}</strong><StartingPriceNote price={service.price} /><p>{service.title}<br />{service.duration}</p></div>
          <div><h3>Что входит</h3><ul>{service.includes.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h3>Следующий этап</h3><p>После завершения текущего формата внедрение можно продолжить со мной или передать вашей IT-команде.</p></div>
        </div>
        <p className="commercial-footnote">Этапы оплаты и организационные условия фиксирую в предложении перед стартом.</p>
      </Section>

      <Section id="faq" eyebrow="Частые вопросы" title="Вопросы до старта" tone="muted">
        <FAQAccordion items={service.faq} />
      </Section>

      <Section className="final-form-section final-form-section--priority" eyebrow="Следующий шаг" id="contact">
        <div className="final-form-grid final-form-grid--form-priority">
          <LeadForm compact context={service.title} description={presentation.finalDescription} serviceCode={presentation.serviceCode} submitLabel={presentation.submitLabel} title={presentation.finalTitle} />
          <aside className="form-service-context"><span>Выбранная услуга</span><strong>{service.title}</strong><p>{service.price} · {service.duration}</p><StartingPriceNote price={service.price} /></aside>
        </div>
      </Section>
    </>
  )
}
