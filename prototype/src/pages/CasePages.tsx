import { useState } from 'react'
import type { CaseData } from '../types'
import { cases } from '../data/cases'
import { LeadForm } from '../components/LeadForm'
import { PageHero } from '../components/PageHero'
import { ButtonLink, Section } from '../components/ui'
import { AutomotiveServiceCasePage } from './AutomotiveServiceCasePage'
import { ThreePLLogisticsCasePage } from './ThreePLLogisticsCasePage'
import { BoardGameProductionCasePage } from './BoardGameProductionCasePage'
import { MerchProductionCasePage } from './MerchProductionCasePage'
import { MedicalClinicCasePage } from './MedicalClinicCasePage'
import { CleaningBusinessCasePage } from './CleaningBusinessCasePage'

const caseFilters = ['Все', 'Локальный спрос', 'B2B', 'Контент и доверие', 'Есть источник']

function matchesFilter(item: CaseData, filter: string) {
  if (filter === 'Все') return true
  if (filter === 'Локальный спрос') return ['1', '3', '6'].includes(item.id)
  if (filter === 'B2B') return ['1', '2', '4', '5'].includes(item.id)
  if (filter === 'Контент и доверие') return ['4', '5', '6'].includes(item.id)
  return Boolean(item.sourceLabel)
}

export function CasesIndexPage() {
  const [filter, setFilter] = useState(caseFilters[0])
  const visibleCases = cases.filter((item) => matchesFilter(item, filter))
  return (
    <>
      <PageHero breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Кейсы' }]} eyebrow="Задача → роль → работа → результат" summary="Показываю шесть проектов: задачу, мою роль, работу команды, полученный результат и данные проекта." title="Кейсы SEO-продвижения с задачами и результатами"><ButtonLink to="/results/">Сравнить по задачам</ButtonLink></PageHero>
      <Section eyebrow="Выбор по контексту" title="Найти похожую задачу" tone="muted">
        <div aria-label="Фильтр кейсов" className="filter-bar" role="group">{caseFilters.map((name) => <button aria-pressed={filter === name} className={filter === name ? 'is-active' : undefined} key={name} onClick={() => setFilter(name)} type="button">{name}</button>)}</div>
        <p aria-live="polite" className="filter-result">Показано: {visibleCases.length} из {cases.length}</p>
        <div className="case-story-grid">
          {visibleCases.map((item, index) => (
            <article className="case-story-card" key={item.id}>
              <div className="case-story-card__top"><span>{String(index + 1)}</span><p className="eyebrow">{item.niche}</p>{item.sourceLabel && <span className="case-data-sources">Источники: {item.sourceLabel}</span>}</div>
              <h2>{item.title}</h2>
              <p className="case-story-card__task">{item.task}</p>
              {item.sourceLabel && <small className="case-story-card__evidence">{item.sourceLabel} · {item.period}</small>}
              <p className="case-story-card__role"><strong>Моя роль:</strong> {item.role}</p>
              <ButtonLink analytics="case_open" analyticsParams={{ case_id: item.id, placement: 'cases_index' }} to={item.path} variant="secondary">Посмотреть кейс</ButtonLink>
            </article>
          ))}
        </div>
      </Section>
    </>
  )
}

export function CasePage({ item }: { item: CaseData }) {
  if (item.id === '1') return <CleaningBusinessCasePage />
  if (item.id === '3') return <AutomotiveServiceCasePage />
  if (item.id === '2') return <ThreePLLogisticsCasePage />
  if (item.id === '4') return <BoardGameProductionCasePage />
  if (item.id === '5') return <MerchProductionCasePage />
  if (item.id === '6') return <MedicalClinicCasePage />

  const actionTitles = item.id === '2' ? ['Спрос', 'Структура', 'Проверка'] : ['Анализ', 'Изменения', 'Проверка']
  return (
    <>
      <PageHero
        aside={(
          <div className="case-hero-proof case-hero-proof--sourced">
            <span>Измеримый результат</span>
            <strong>{item.result}</strong>
            {item.resultContext && <p>{item.resultContext}</p>}
            <small className="case-data-sources">Источники: Метрика · GSC · Topvisor</small>
          </div>
        )}
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Кейсы', path: '/cases/' }, { label: item.niche }]}
        eyebrow={item.niche}
        meta={<div className="case-hero-role"><span>Моя роль</span><strong>{item.role}</strong>{item.period && <span>Период: {item.period}</span>}</div>}
        summary={item.task}
        title={item.title}
      />

      <Section id="context" eyebrow="Исходная задача" title="Что нужно было изменить">
        <div className="case-context-grid">
          <article><span>Бизнес-задача</span><p>{item.task}</p></article>
          <article><span>Что оценивали</span><p>{item.metric}</p></article>
          {item.period && <article><span>Период</span><p>{item.period}</p></article>}
          <article><span>Данные проекта</span><p>Яндекс Метрика · Google Search Console (GSC) · Topvisor</p></article>
        </div>
      </Section>

      <Section id="analysis" eyebrow="Анализ" title="Что мешало решению задачи" tone="muted">
        <div className="case-finding-grid">{item.findings.map((finding, index) => <article key={finding}><span>{String(index + 1)}</span><p>{finding}</p></article>)}</div>
      </Section>

      <Section id="actions" eyebrow="Решения" title="Что я подготовил и проверял">
        <div className="case-action-flow">{item.actions.map((action, index) => <article key={action}><span>{String(index + 1)}</span><div><h3>{actionTitles[index] || 'Проверка'}</h3><p>{action}</p></div></article>)}</div>
      </Section>

      <Section id="role" eyebrow="Роли в проекте" title="Кто за что отвечал" tone="blue">
        <div className="case-role-grid"><article><span>Моя работа</span><h3>SEO-анализ и внедрение</h3><p>SEO-анализ, спрос, структура, постановки и проверка.</p></article><article><span>Команда клиента</span><h3>Бизнес и внутренние процессы</h3><p>Бизнес-данные и изменения, которые требуют внутренней разработки или процессов клиента.</p></article></div>
      </Section>

      <Section id="result" eyebrow="Итог проекта" title="Результат" tone="muted">
        <div className="case-result-panel">
          <div><span>{item.metric}</span><strong>{item.result}</strong>{item.period && <p>Период: {item.period}</p>}</div>
          <div><p className="case-data-sources">Источники: Метрика · GSC · Topvisor</p>{item.resultContext && <p>{item.resultContext}</p>}<h3>Моя роль в результате</h3><p>{item.role}</p></div>
        </div>
      </Section>

      <Section id="factors" eyebrow="Контекст результата" title="Как читать результат">
        <div className="case-reading-note"><p>{item.seoContribution}</p><p>На итог также влияли условия проекта, продукт и работа команды клиента.</p></div>
        <div className="section-action section-action--left"><ButtonLink to={item.servicePath} variant="secondary">Посмотреть услугу →</ButtonLink></div>
      </Section>

      <Section className="final-form-section final-form-section--priority" eyebrow="Похожая задача" id="contact">
        <div className="final-form-grid final-form-grid--form-priority"><LeadForm compact context={'Кейс: ' + item.niche} description="Я посмотрю сайт и предложу подходящий следующий шаг." serviceCode={'case_' + item.id} submitLabel="Обсудить похожую задачу" title="Покажите сайт — разберу похожую задачу" /><aside className="form-service-context"><span>Другие примеры</span><ButtonLink to="/cases/" variant="cases">Все кейсы</ButtonLink></aside></div>
      </Section>
    </>
  )
}
