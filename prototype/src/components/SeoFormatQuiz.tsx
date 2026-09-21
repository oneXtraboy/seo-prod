import { useEffect, useRef, useState } from 'react'
import { trackAnalyticsGoal } from '../lib/analytics'
import { Button, ButtonLink, StartingPriceNote, TextLink } from './ui'
import { LeadForm } from './LeadForm'

type Step = 0 | 1 | 2 | 3 | 4
type ResultKey = 'consulting' | 'audit' | 'strategy' | 'retainer'
interface AnswerOption { id: string; title: string; description?: string }
interface QuizAnswers { situation?: string; outcome?: string; implementation?: string }

const questions: Array<{ title: string; options: AnswerOption[] }> = [
  { title: 'Что сейчас происходит с сайтом?', options: [
    { id: 'stalled', title: 'SEO почти не даёт роста', description: 'Трафик или позиции стоят на месте.' },
    { id: 'decline', title: 'Трафик или позиции снизились', description: 'Нужно понять причину просадки.' },
    { id: 'low-leads', title: 'Трафик есть, заявок мало', description: 'Нужно проверить страницы, UX и аналитику.' },
    { id: 'indexing', title: 'Есть проблемы с индексацией', description: 'Страницы не попадают в поиск, появляются дубли или другие технические проблемы.' },
    { id: 'new-site', title: 'Планируем новый сайт или редизайн', description: 'Нужно заложить SEO до разработки или сохранить текущий трафик.' },
    { id: 'system-growth', title: 'Хотим системно развивать SEO', description: 'Нужны приоритеты, постановки и контроль внедрения.' },
  ] },
  { title: 'Что вам нужно получить?', options: [
    { id: 'diagnosis', title: 'Понять, что мешает росту', description: 'Нужна проверка сайта и приоритеты.' },
    { id: 'plan', title: 'Получить план развития SEO', description: 'Нужна стратегия на несколько месяцев.' },
    { id: 'one-question', title: 'Решить один конкретный вопрос', description: 'Например, структура, индексация, миграция или спорное SEO-решение.' },
    { id: 'full-cycle', title: 'Не только найти проблемы, но и довести изменения до результата', description: 'Нужна регулярная работа с внедрением и аналитикой.' },
  ] },
  { title: 'Как у вас устроено внедрение?', options: [
    { id: 'team', title: 'Есть разработчик или команда', description: 'Нужны SEO-приоритеты, постановки и контроль.' },
    { id: 'contractors', title: 'Есть подрядчики, но нужен ведущий SEO-специалист' },
    { id: 'need-help', title: 'Нужна помощь и с SEO, и с организацией внедрения' },
    { id: 'unknown', title: 'Пока не знаю' },
  ] },
]

const resultCopy: Record<ResultKey, { title: string; name: string; lead: string; price: string; servicePath: string; primaryCta: string; includes: string[]; casePath?: string; caseLabel?: string }> = {
  consulting: { title: 'Скорее всего, большой проект сейчас не нужен', name: 'SEO-консультация', lead: 'Вопрос можно разобрать точечно и принять решение без полноценного аудита или сопровождения.', price: 'от 7 000 ₽', servicePath: '/services/seo-consulting/', primaryCta: 'Описать вопрос', includes: ['Изучу вопрос и материалы заранее', 'Сравню риски и варианты решения', 'Зафиксирую следующий шаг письменно'] },
  audit: { title: 'Похоже, лучше начать с проверки сайта', name: 'SEO-аудит', lead: 'Сейчас важнее определить причину проблемы, чем сразу переходить к регулярному продвижению.', price: 'от 39 000 ₽', servicePath: '/services/seo-audit/', primaryCta: 'Показать сайт', includes: ['Проверка спроса и структуры', 'Техническая проверка', 'Анализ ключевых посадочных', 'UX и аналитика при наличии данных', 'Приоритетный план и готовые постановки'], casePath: '/cases/seo-klining-dlya-biznesa/', caseLabel: 'Кейс с проверкой сайта и контролем внедрения' },
  strategy: { title: 'Нужен порядок инвестиций, а не список идей', name: 'SEO-стратегия', lead: 'Основная задача — определить направления роста, необходимые страницы и порядок использования ресурса команды.', price: 'от 59 000 ₽', servicePath: '/services/seo-strategy/', primaryCta: 'Показать сайт', includes: ['Исследование спроса и конкурентов', 'Целевая архитектура', 'План работ и роли команды', 'Критерии измерения и порядок внедрения'], casePath: '/cases/seo-3pl-logistika/', caseLabel: 'B2B-кейс со структурой спроса' },
  retainer: { title: 'Задачу нельзя закрыть одним документом', name: 'SEO-сопровождение', lead: 'Нужно определить ограничения, внедрить изменения, дождаться переобхода и проверить влияние на поиск и обращения.', price: 'от 69 000 ₽ / месяц', servicePath: '/services/seo-prodvizhenie/', primaryCta: 'Показать сайт', includes: ['Аналитика и приоритеты этапа', 'Постановки команде', 'Контроль релизов и QA', 'Повторный замер и следующий этап'], casePath: '/cases/seo-klining-dlya-biznesa/', caseLabel: 'Кейс системного SEO-сопровождения' },
}

const serviceCodes: Record<ResultKey, string> = { consulting: 'seo_consulting', audit: 'seo_audit', strategy: 'seo_strategy', retainer: 'seo_retainer' }
const serviceCtaLabels: Record<ResultKey, string> = {
  consulting: 'Посмотреть консультацию',
  audit: 'Посмотреть аудит',
  strategy: 'Посмотреть стратегию',
  retainer: 'Посмотреть сопровождение',
}

function chooseResult(answers: QuizAnswers): ResultKey {
  if (answers.outcome === 'one-question') return 'consulting'
  if (answers.outcome === 'full-cycle' || answers.situation === 'system-growth') return 'retainer'
  if (answers.outcome === 'plan' || answers.situation === 'new-site') return 'strategy'
  return 'audit'
}

function chooseFocus(answers: QuizAnswers) {
  if (answers.situation === 'indexing' || (answers.situation === 'decline' && answers.outcome === 'one-question')) return 'техническое SEO'
  if (answers.situation === 'new-site') return 'SEO нового сайта'
  if (answers.situation === 'low-leads') return 'конверсия SEO-трафика'
  return ''
}

export function SeoFormatQuiz({ embeddedForm = true, onResult }: { embeddedForm?: boolean; onResult?: (result: ResultKey) => void }) {
  const [step, setStep] = useState<Step>(1)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [result, setResult] = useState<ResultKey>('audit')
  const [focus, setFocus] = useState('')
  const questionHeadingRef = useRef<HTMLHeadingElement>(null)
  const quizMountedRef = useRef(false)
  const quizSource = embeddedForm ? 'services' : 'pricing'
  useEffect(() => {
    if (!quizMountedRef.current) {
      quizMountedRef.current = true
      return
    }
    if (step >= 1 && step <= 3) questionHeadingRef.current?.focus({ preventScroll: true })
  }, [step])

  function startQuiz() { setAnswers({}); setStep(1); trackAnalyticsGoal('quiz_start', { source: quizSource }) }
  function chooseAnswer(id: string) {
    if (step === 1) { setAnswers({ situation: id }); trackAnalyticsGoal('quiz_step', { source: quizSource, step: 1, answer: id }); setStep(2); return }
    if (step === 2) { setAnswers((current) => ({ ...current, outcome: id })); trackAnalyticsGoal('quiz_step', { source: quizSource, step: 2, answer: id }); setStep(3); return }
    const finalAnswers = { ...answers, implementation: id }
    const resultKey = chooseResult(finalAnswers)
    const projectFocus = chooseFocus(finalAnswers)
    setAnswers(finalAnswers); setResult(resultKey); setFocus(projectFocus); setStep(4); onResult?.(resultKey)
    trackAnalyticsGoal('quiz_step', { source: quizSource, step: 3, answer: id })
    trackAnalyticsGoal('quiz_complete', { source: quizSource, result: resultKey, focus: projectFocus || 'general' })
    trackAnalyticsGoal('quiz_result', { source: quizSource, result: resultKey, focus: projectFocus || 'general' })
  }
  function goBack() { if (step === 1) setStep(0); else if (step === 2) setStep(1); else if (step === 3) setStep(2); else setStep(3) }

  return (
    <div className={`seo-quiz seo-quiz--step-${step}`} id="seo-quiz">
      {step >= 1 && step <= 3 && <header className="seo-quiz__context"><p className="eyebrow">Подбор формата</p><h2>Ответьте на 3 вопроса</h2></header>}
      {step === 0 ? (
        <div className="seo-quiz__intro"><p className="eyebrow">Подбор формата</p><h2>Не уверены, что выбрать?</h2><p>Ответьте на 3 коротких вопроса — я покажу подходящий формат работы и следующий шаг.</p><Button onClick={() => { trackAnalyticsGoal('quiz_fallback_click', { source: quizSource }); startQuiz() }}>Подобрать формат</Button></div>
      ) : step <= 3 ? (
        <div className="seo-quiz__question">
          <header className="seo-quiz__question-header"><div><p className="seo-quiz__progress-label">{step} из 3</p><h2 ref={questionHeadingRef} tabIndex={-1}>{questions[step - 1].title}</h2></div>{step > 1 && <button className="seo-quiz__back" onClick={goBack} type="button">← Назад</button>}</header>
          <div aria-hidden="true" className="seo-quiz__progress"><span style={{ width: `${(step / 3) * 100}%` }} /></div>
          <div className="seo-quiz__answers">{questions[step - 1].options.map((option) => <button className="seo-quiz__answer" data-quiz-answer={option.id} key={option.id} onClick={() => chooseAnswer(option.id)} type="button"><strong>{option.title}</strong>{option.description && <span>{option.description}</span>}<i aria-hidden="true">→</i></button>)}</div>
        </div>
      ) : <QuizResult answers={answers} copy={resultCopy[result]} embeddedForm={embeddedForm} focus={focus} onBack={goBack} onRestart={startQuiz} result={result} />}
    </div>
  )
}

function QuizResult({ answers, copy, embeddedForm, focus, onBack, onRestart, result }: { answers: QuizAnswers; copy: typeof resultCopy[ResultKey]; embeddedForm: boolean; focus: string; onBack: () => void; onRestart: () => void; result: ResultKey }) {
  const answerSource = `quiz · ${answers.situation || ''}/${answers.outcome || ''}/${answers.implementation || ''}`
  return (
    <div className="seo-quiz__result">
      <div className="seo-quiz__result-topline"><span>Рекомендация готова</span><div><button onClick={onBack} type="button">← Изменить ответ</button><button onClick={onRestart} type="button">Пройти заново</button></div></div>
      <div className={`seo-quiz__result-layout ${!embeddedForm ? 'seo-quiz__result-layout--single' : ''}`.trim()}>
        <div className="seo-quiz__recommendation">
          <p className="eyebrow">{copy.title}</p><h2>{copy.name}</h2>{result === 'retainer' && <p className="seo-quiz__cycle">Минимальный срок сопровождения — 4 месяца</p>}<p className="seo-quiz__lead">{copy.lead}</p>{focus && <p className="seo-quiz__focus"><strong>Фокус проекта:</strong> {focus}</p>}
          <h3>Что проверю</h3><ul className="seo-quiz__includes">{copy.includes.map((item) => <li key={item}>{item}</li>)}</ul>{result === 'retainer' && <RetainerRoadmap />}<p className="seo-quiz__price"><span>Ориентир</span>{copy.price}<StartingPriceNote price={copy.price} /></p>
          <div className="seo-quiz__actions"><a className="button button--primary" data-analytics="quiz_to_form" data-cta="quiz_to_form" data-context={embeddedForm ? 'services_quiz_result' : 'pricing_quiz_result'} data-analytics-params={JSON.stringify({ source: embeddedForm ? 'services' : 'pricing', service: serviceCodes[result], format: result, placement: embeddedForm ? 'services_quiz_result' : 'pricing_quiz_result' })} href={embeddedForm ? '#seo-quiz-contact' : '#pricing-contact'}><span>{copy.primaryCta}</span></a><ButtonLink analytics="quiz_to_service" analyticsParams={{ source: embeddedForm ? 'services' : 'pricing', result, path: copy.servicePath }} dataCta="quiz_to_service" dataContext={embeddedForm ? 'services_quiz_result' : 'pricing_quiz_result'} to={copy.servicePath} variant="secondary">{serviceCtaLabels[result]}</ButtonLink></div>
          {copy.casePath && <p className="seo-quiz__case"><span>Похожий кейс</span><TextLink to={copy.casePath}>{copy.caseLabel}</TextLink></p>}
        </div>
        {embeddedForm && <div id="seo-quiz-contact"><LeadForm compact context={`SEO-квиз: ${copy.name}${focus ? ` · ${focus}` : ''}`} description="Пришлите ссылку — проверю рекомендацию на публичной части сайта и отвечу по удобному контакту." eyebrow="Проверить рекомендацию" formType="seo_quiz" serviceCode={serviceCodes[result]} source={answerSource} submitLabel="Показать сайт" title="Покажите сайт — проверю рекомендацию" /></div>}
      </div>
    </div>
  )
}

function RetainerRoadmap() {
  return <><div className="seo-quiz__roadmap"><article><span>1-й месяц</span><p>Анализ спроса, аналитика и приоритетный план.</p></article><article><span>2–3-й месяцы</span><p>Технические, структурные, контентные и UX-изменения.</p></article><article><span>4-й месяц</span><p>Проверка внедрения, анализ результата и следующий этап.</p></article></div><p className="seo-quiz__why"><strong>Почему минимум 4 месяца:</strong> за это время можно определить приоритеты, внедрить изменения, проверить их публикацию и оценить первые сопоставимые данные.</p></>
}
