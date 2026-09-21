import { useEffect, useState } from 'react'
import { PageHero } from '../components/PageHero'
import { LeadForm } from '../components/LeadForm'
import { SeoFormatQuiz } from '../components/SeoFormatQuiz'
import { ButtonLink, DataSourceBadge, FAQAccordion, PriceCard, Section } from '../components/ui'
import { trackAnalyticsGoal } from '../lib/analytics'
import { cleaningCaseSummary } from '../data/cleaningCaseData'

const priceFormats = [
  { id: 'audit', name: 'SEO-аудит', price: 'от 39 000 ₽', duration: 'Срок после оценки размера сайта', result: 'Приоритеты и план работ на 60–90 дней', includes: ['Техника и индексация', 'Спрос и структура', 'Коммерческие страницы', 'Приоритеты и критерии готовности'], excludes: 'Внедрение найденных задач можно продолжить отдельным этапом.', selectLabel: 'Выбрать аудит' },
  { id: 'strategy', name: 'SEO-стратегия', price: 'ориентир от 59 000 ₽', duration: 'Проект 3–6 недель', result: 'Карта спроса, структура сайта и понятный план внедрения', includes: ['Исследование спроса', 'Анализ конкурентов', 'Целевая архитектура', 'План внедрения и способ проверки'], excludes: 'Реализацию roadmap могу взять следующим этапом или передать вашей команде.', selectLabel: 'Выбрать стратегию' },
  { id: 'retainer', name: 'Сопровождение', price: 'от 69 000 ₽/мес.', duration: 'Минимальный срок — 4 месяца', result: 'Постоянная SEO-работа и контроль результата', includes: ['Регулярный анализ', 'Технические задания', 'Контроль публикаций', 'Отчёт и новые приоритеты'], excludes: 'Разработку и большой объём редакторской работы согласовываем отдельно, если они требуются.', recommended: true, selectLabel: 'Выбрать сопровождение' },
  { id: 'consulting', name: 'Консультация', price: 'от 7 000 ₽', duration: 'Разовая консультация', result: 'Решение и список следующих действий', includes: ['Предварительная подготовка', 'Рабочая встреча', 'Разбор вариантов', 'Письменные выводы'], excludes: 'Если вопрос требует полноценного аудита, предложу отдельный формат после первичного разбора.', selectLabel: 'Выбрать консультацию' },
]

const comparisonRows = [
  ['Когда подходит', 'Нужно понять причины проблем и точки роста', 'Нужен план развития SEO', 'Нужна постоянная работа над ростом', 'Есть один конкретный вопрос'],
  ['Что я сделаю', 'Полностью разберу сайт и расставлю приоритеты', 'Исследую спрос, конкурентов и построю план развития', 'Буду регулярно анализировать, ставить и внедрять задачи', 'Изучу вопрос и подготовлю решение'],
  ['Что вы получите', 'Приоритеты + план работ на 60–90 дней', 'Структура сайта + план внедрения', 'Постоянный SEO-процесс и контроль результата', 'Решение + список следующих действий'],
  ['Формат', 'Разовый проект', 'Проект 3–6 недель', 'Ежемесячная работа', 'Разовая консультация'],
  ['Следующий шаг', 'Можно внедрять самостоятельно или продолжить со мной', 'Можно перейти к внедрению', 'Работа продолжается по приоритетам', 'При необходимости выбираем следующий формат'],
]

const pricingFaq = [
  { question: 'Почему сопровождение стоит дороже работы начинающего специалиста?', answer: 'Я лично определяю стратегию, готовлю ключевые задачи, контролирую техническую реализацию и связываю изменения с показателями бизнеса. Конкретный состав фиксирую в предложении.' },
  { question: 'Можно ли начать с аудита?', answer: 'Да. Стоимость комплексного аудита начинается от 39 000 ₽; точный объём зависит от размера сайта, числа шаблонов, регионов и доступных данных.' },
  { question: 'Кто оплачивает разработку и контент?', answer: 'Разработку, большой объём редакторской работы и внешние сервисы согласовываем отдельно до начала соответствующих задач.' },
  { question: 'Есть ли гарантия результата?', answer: 'Я гарантирую согласованный состав работ, контроль качества и прозрачный способ проверки. Позиции и объём заявок также зависят от поисковых систем, конкурентов, продукта и скорости внедрения.' },
]

const quizToService = { audit: 'audit', strategy: 'strategy', retainer: 'retainer', consulting: 'consulting' } as const
const pricingContactTitles: Record<string, string> = {
  audit: 'Покажите сайт — уточню состав SEO-аудита',
  strategy: 'Покажите сайт — оценю задачу для SEO-стратегии',
  retainer: 'Покажите сайт — предложу первый этап сопровождения',
  consulting: 'Опишите вопрос — подготовлюсь к консультации',
}

export function PricingPage() {
  const [selectedFormat, setSelectedFormat] = useState('pricing_general')
  const selected = priceFormats.find((item) => item.id === selectedFormat)

  useEffect(() => { trackAnalyticsGoal('pricing_view', { placement: 'pricing_page' }) }, [])

  return (
    <>
      <PageHero breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Цены' }]} eyebrow="Стоимость и результат" summary="Сравните разовый анализ, стратегию, постоянное сопровождение и консультацию по результату, сроку и способу работы." title="Стоимость SEO-работ и форматы сотрудничества">
        <a className="button button--primary" data-analytics="pricing_cta_click" data-cta="pricing_compare" data-context="pricing_hero" data-analytics-params={JSON.stringify({ format: 'comparison', placement: 'hero' })} href="#prices"><span>Сравнить цены и результат</span></a>
        <ButtonLink dataCta="services_all" dataContext="pricing_hero" to="/services/" variant="secondary">Все направления</ButtonLink>
      </PageHero>

      <Section eyebrow="Четыре формата" id="prices" intro="По каждому формату сразу видно, что я сделаю, какой результат вы получите и как будет проходить работа." title="От разового анализа до постоянного SEO-сопровождения" tone="muted">
        <div className="price-grid">{priceFormats.map((format) => <PriceCard formatId={format.id} key={format.name} onSelect={setSelectedFormat} {...format} />)}</div>
      </Section>

      <Section className="pricing-proof-section" id="proof" intro="До старта фиксирую текущие показатели. После внедрения сравниваю те же данные на сопоставимом периоде и показываю, что изменилось." title="Как оцениваю результат">
        <div className="pricing-evaluation-grid">
          <div className="pricing-evaluation-steps">
            <article><span>1</span><h3>До старта</h3><p>Фиксирую поисковую видимость, трафик, обращения и состояние ключевых страниц.</p></article>
            <article><span>2</span><h3>После внедрения</h3><p>Проверяю, что изменения опубликованы корректно и доступны поисковым системам.</p></article>
            <article><span>3</span><h3>Сопоставимый период</h3><p>Сравниваю Яндекс Метрику, Google Search Console (GSC) и Topvisor на одинаковом временном отрезке.</p></article>
            <article><span>4</span><h3>Вывод</h3><p>Показываю, что изменилось и какие задачи становятся следующими.</p></article>
          </div>
          <aside className="pricing-proof-signal"><span>Пример результата</span><strong>{cleaningCaseSummary.top5} из {cleaningCaseSummary.monitored} запросов — в ТОП-5</strong><DataSourceBadge source="Topvisor · GSC · Яндекс Вебмастер" /><small>8 месяцев</small><ButtonLink dataCta="view_case" dataContext="pricing_proof" to="/cases/seo-klining-dlya-biznesa/" variant="cases">Посмотреть кейс</ButtonLink></aside>
        </div>
      </Section>

      <Section id="comparison" intro="Сравните форматы по задаче, результату, длительности и следующему шагу." title="Как выбрать формат">
        <div className="comparison-table-wrap"><table className="comparison-table"><caption className="sr-only">Сравнение четырёх форматов SEO-работ</caption><thead><tr><th scope="col">Критерий</th>{priceFormats.map((format) => <th className={'comparison-table__format--' + format.id} key={format.name} scope="col">{format.name}</th>)}</tr></thead><tbody>{comparisonRows.map((row) => <tr key={row[0]}><th scope="row">{row[0]}</th>{row.slice(1).map((value, index) => <td className={'comparison-table__format--' + priceFormats[index].id} key={row[0] + '-' + index}>{value}</td>)}</tr>)}</tbody></table></div>
        <div className="comparison-mobile">{priceFormats.map((format, formatIndex) => <article className={'comparison-mobile__format--' + format.id} key={format.name}><h3>{format.name}</h3><dl>{comparisonRows.map((row) => <div key={row[0]}><dt>{row[0]}</dt><dd>{row[formatIndex + 1]}</dd></div>)}</dl><a className="button button--secondary" data-analytics="pricing_cta_click" data-cta="pricing_select" data-context={'comparison:' + format.id} data-analytics-params={JSON.stringify({ format: format.id, placement: 'comparison_mobile' })} href="#pricing-contact" onClick={() => setSelectedFormat(format.id)}><span>{format.selectLabel}</span></a></article>)}</div>
      </Section>

      <section aria-label="Подбор формата по ситуации" className="section seo-quiz-section" id="quiz"><div className="container"><SeoFormatQuiz embeddedForm={false} onResult={(result) => setSelectedFormat(quizToService[result])} /></div></section>

      <Section id="faq" eyebrow="До обсуждения бюджета" title="Частые вопросы" tone="muted"><FAQAccordion items={pricingFaq} /></Section>

      <Section className="final-form-section final-form-section--priority" eyebrow="Следующий шаг" id="pricing-contact">
        <div className="final-form-grid final-form-grid--form-priority">
          <LeadForm compact context={selected ? 'Цены: ' + selected.name : 'Цены: формат не выбран'} description={selected ? 'Выбран формат «' + selected.name + '». Я посмотрю сайт и уточню подходящий объём работ.' : 'Я посмотрю сайт и предложу подходящий формат работы.'} serviceCode={selectedFormat} submitLabel={selected?.selectLabel || 'Отправить сайт'} title={pricingContactTitles[selectedFormat] || 'Покажите сайт — предложу подходящий формат'} />
          <aside className="form-service-context"><span>Выбранный формат</span><strong>{selected?.name || 'Определю после оценки сайта'}</strong><p>{selected?.price || 'Стоимость зависит от подходящего формата'}</p></aside>
        </div>
      </Section>
    </>
  )
}
