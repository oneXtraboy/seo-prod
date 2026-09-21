import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { trackAnalyticsGoal } from '../lib/analytics'
import { Button } from './ui'

type FormStatus = { kind: 'idle' | 'error' | 'success'; text: string }
type LeadState = { id: string; enrichmentToken: string }

const messages: Record<string, string> = {
  challenge: 'Не удалось подтвердить защиту формы. Обновите страницу.',
  consent: 'Нужно подтвердить согласие на обработку данных.',
  fields: 'Проверьте адрес сайта и Telegram или email.',
  email_domain: 'У домена email не найдена рабочая почта. Проверьте адрес.',
  website_domain: 'Сайт по этому адресу пока не открывается. Проверьте URL.',
  duplicate: 'Такая заявка уже получена. Повторно отправлять её не нужно.',
  rate_limit: 'Слишком много попыток. Попробуйте позже или напишите в Telegram.',
  timing: 'Проверка ещё не готова. Подождите несколько секунд и попробуйте снова.',
  origin: 'Не удалось подтвердить страницу отправки. Обновите сайт.',
  enrichment: 'Заявка уже сохранена, но дополнительный контекст не добавился. Его можно сообщить в ответном письме.',
  server: 'Заявка временно не отправляется. Попробуйте позже или напишите в Telegram.',
}

export function LeadForm({
  title = 'Получить предварительный разбор',
  context = 'Предварительный разбор сайта',
  compact = false,
  eyebrow = 'Сайт + один удобный контакт',
  description = 'Сначала посмотрю публичную часть сайта и предложу разумный следующий шаг.',
  source,
  serviceCode,
  formType = 'quick_lead',
  submitLabel = 'Отправить сайт',
  onSuccess,
}: {
  title?: string
  context?: string
  compact?: boolean
  eyebrow?: string
  description?: string
  source?: string
  serviceCode?: string
  formType?: 'quick_lead' | 'seo_quiz'
  submitLabel?: string
  onSuccess?: () => void
}) {
  const formId = useId().replace(/:/g, '')
  const startedAt = useRef(0)
  const formStarted = useRef(false)
  const completionTracked = useRef(false)
  const [phase, setPhase] = useState<'contact' | 'enrich' | 'done'>('contact')
  const [lead, setLead] = useState<LeadState | null>(null)
  const [challenge, setChallenge] = useState({ answer: '', token: '' })
  const [status, setStatus] = useState<FormStatus>({ kind: 'idle', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadChallenge = useCallback(async () => {
    setChallenge({ answer: '', token: '' })
    try {
      const response = await fetch('/api/audit/challenge', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      const data = await response.json() as { token?: string; question?: string }
      const operands = data.question?.match(/^\s*(\d+)\s*\+\s*(\d+)\s*$/)
      if (!response.ok || !data.token || !operands) throw new Error('challenge')
      setChallenge({ token: data.token, answer: String(Number(operands[1]) + Number(operands[2])) })
    } catch {
      setStatus({ kind: 'error', text: messages.challenge })
    }
  }, [])

  useEffect(() => {
    startedAt.current = Date.now()
    const timer = window.setTimeout(() => { void loadChallenge() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadChallenge])

  function handleFormStart() {
    if (formStarted.current) return
    formStarted.current = true
    trackAnalyticsGoal('form_start', { form: formType, context, service: serviceCode || 'general' })
  }

  function completeForm(enriched: boolean) {
    setPhase('done')
    if (!completionTracked.current) {
      completionTracked.current = true
      trackAnalyticsGoal('form_complete', { form: formType, context, service: serviceCode || 'general', enriched })
      onSuccess?.()
    }
  }

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setStatus({ kind: 'idle', text: '' })
    if (!form.reportValidity()) return
    if (!challenge.token || !challenge.answer) {
      setStatus({ kind: 'error', text: 'Дождитесь подготовки защищённой формы.' })
      return
    }

    const payload = new URLSearchParams(new FormData(form) as unknown as Record<string, string>)
    payload.set('challenge_token', challenge.token)
    payload.set('challenge_answer', challenge.answer)
    payload.set('started_at', String(startedAt.current))
    payload.set('service', serviceCode || context)
    payload.set('service_label', context)
    payload.set('source', source || (typeof window === 'undefined' ? 'Сайт' : window.location.pathname))

    setSubmitting(true)
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: payload,
      })
      const data = await response.json().catch(() => ({ code: 'server' })) as { code?: string; id?: string; enrichment_token?: string }
      if (!response.ok || !data.id) throw new Error(data.code || 'server')
      setLead({ id: data.id, enrichmentToken: data.enrichment_token || '' })
      setPhase('enrich')
      setStatus({ kind: 'success', text: `Заявка ${data.id} уже сохранена. Дополнительные поля ниже — необязательны.` })
      trackAnalyticsGoal('form_step_1_submit', { form: formType, context, service: serviceCode || 'general', result: 'success' })
      form.reset()
    } catch (error) {
      const code = error instanceof Error ? error.message : 'server'
      setStatus({ kind: 'error', text: messages[code] || messages.server })
      trackAnalyticsGoal('form_step_1_submit', { form: formType, context, service: serviceCode || 'general', result: 'error', code })
      startedAt.current = Date.now()
      await loadChallenge()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEnrichmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!lead?.enrichmentToken) return completeForm(false)
    const form = event.currentTarget
    const payload = new URLSearchParams(new FormData(form) as unknown as Record<string, string>)
    payload.set('id', lead.id)
    payload.set('enrichment_token', lead.enrichmentToken)
    setSubmitting(true)
    setStatus({ kind: 'idle', text: '' })
    try {
      const response = await fetch('/api/audit?step=enrich', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: payload,
      })
      const data = await response.json().catch(() => ({ code: 'enrichment' })) as { code?: string }
      if (!response.ok) throw new Error(data.code || 'enrichment')
      completeForm(true)
    } catch {
      setStatus({ kind: 'error', text: messages.enrichment })
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'done') {
    return (
      <div className={`lead-form lead-form--success ${compact ? 'lead-form--compact' : ''}`.trim()} role="status">
        <span className="lead-form__success-mark" aria-hidden="true">✓</span>
        <p className="eyebrow">Заявка сохранена</p>
        <h2>Спасибо — я получил сайт</h2>
        <p>Номер заявки: <strong>{lead?.id}</strong>. Обычно отвечаю в рабочий день или на следующий.</p>
      </div>
    )
  }

  if (phase === 'enrich') {
    return (
      <form className={`lead-form lead-form--enrich ${compact ? 'lead-form--compact' : ''}`.trim()} onSubmit={handleEnrichmentSubmit}>
        <div className="lead-form__heading">
          <div><p className="eyebrow">Заявка уже отправлена</p><h2>Добавить контекст?</h2></div>
          <span className="lead-form__secure" aria-label="Заявка сохранена">✓</span>
        </div>
        <p className="lead-form__description">Необязательно. Ответы помогут сделать первый разбор точнее, но можно завершить прямо сейчас.</p>
        <div className="lead-form__fields lead-form__optional-fields">
          <div className="field"><label htmlFor={`${formId}-niche`}>Ниша</label><input id={`${formId}-niche`} maxLength={120} name="niche" placeholder="Например: B2B-логистика" /></div>
          <div className="field"><label htmlFor={`${formId}-region`}>Регион</label><input id={`${formId}-region`} maxLength={120} name="region" placeholder="Например: Санкт-Петербург и РФ" /></div>
          <div className="field field--wide"><label htmlFor={`${formId}-task`}>Главная задача</label><textarea id={`${formId}-task`} maxLength={700} name="task" placeholder="Что должно измениться для бизнеса?" rows={3} /></div>
          <div className="field"><label htmlFor={`${formId}-tried`}>Что уже пробовали</label><input id={`${formId}-tried`} maxLength={240} name="tried" placeholder="Аудит, подрядчик, редизайн…" /></div>
          <div className="field"><label htmlFor={`${formId}-team`}>Кто внедряет</label><input id={`${formId}-team`} maxLength={240} name="team" placeholder="Своя команда, подрядчик, пока никто" /></div>
          <div className="lead-form__optional-actions">
            <Button data-context={serviceCode || formType} data-cta="lead_enrich" disabled={submitting} type="submit">{submitting ? 'Сохраняем…' : 'Добавить к заявке'}</Button>
            <button className="button button--secondary" data-context={serviceCode || formType} data-cta="lead_enrich_skip" onClick={() => completeForm(false)} type="button"><span>Пропустить</span></button>
          </div>
          <p aria-live="polite" className={`audit-form__status ${status.kind !== 'idle' ? `is-${status.kind}` : ''}`.trim()}>{status.text}</p>
        </div>
      </form>
    )
  }

  return (
    <form
      className={`lead-form audit-form ${compact ? 'lead-form--compact' : ''}`.trim()}
      data-form={formType}
      noValidate
      onFocusCapture={handleFormStart}
      onSubmit={handleContactSubmit}
    >
      <input name="form_type" type="hidden" value={formType} />
      <div className="lead-form__heading">
        <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
        <span className="lead-form__secure" aria-label="Защищённая форма">✓</span>
      </div>
      <p className="lead-form__description">{description}</p>

      <div className="lead-form__fields">
        <div className="field">
          <label htmlFor={`${formId}-website`}>Адрес сайта</label>
          <input autoComplete="url" id={`${formId}-website`} inputMode="url" maxLength={500} name="website" placeholder="https://example.ru" required type="url" />
        </div>
        <div className="field">
          <label htmlFor={`${formId}-contact`}>Telegram или email для ответа</label>
          <input autoComplete="email" id={`${formId}-contact`} maxLength={254} name="contact" placeholder="@username или name@example.ru" required />
        </div>
        <div className="field field--wide">
          <label htmlFor={`${formId}-goal`}>Цель (необязательно)</label>
          <select defaultValue="" id={`${formId}-goal`} name="goal">
            <option value="">Не выбрано</option>
            <option value="Увеличить обращения из поиска">Увеличить обращения из поиска</option>
            <option value="Увеличить или восстановить поисковую видимость">Увеличить или восстановить поисковую видимость</option>
            <option value="Подготовить сайт к росту или запуску">Подготовить сайт к росту или запуску</option>
          </select>
        </div>
        <label className="audit-form__consent">
          <input name="privacy_consent" required type="checkbox" value="yes" />
          <span>Даю <a href="/consent/">согласие на обработку персональных данных</a> и принимаю <a href="/privacy/">политику конфиденциальности</a>.</span>
        </label>
        <div className="honeypot" aria-hidden="true">
          <label htmlFor={`${formId}-company`}>Компания</label>
          <input autoComplete="off" id={`${formId}-company`} name="company" tabIndex={-1} />
        </div>
        <Button data-context={serviceCode || formType} data-cta="lead_submit" disabled={submitting || !challenge.token || !challenge.answer} type="submit">{submitting ? 'Отправляем…' : submitLabel}</Button>
        <p aria-live="polite" className={`audit-form__status ${status.kind !== 'idle' ? `is-${status.kind}` : ''}`.trim()} role="status">{status.text}</p>
        <p className="lead-form__note">Дополнительный контекст можно добавить после отправки — это необязательно.</p>
      </div>
    </form>
  )
}

export function LeadFormModal({ open, onClose, context }: { open: boolean; onClose: () => void; context: string }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const selector = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(selector) ?? []).filter((item) => !item.hasAttribute('disabled'))
    focusable()[0]?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('is-locked')
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('is-locked')
      previousFocus?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="modal" onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }} role="presentation">
      <div aria-labelledby="lead-modal-title" aria-modal="true" className="modal__dialog" ref={dialogRef} role="dialog">
        <div className="modal__topline"><h2 id="lead-modal-title">Показать сайт</h2><button aria-label="Закрыть форму" className="icon-button" onClick={onClose} type="button">×</button></div>
        <LeadForm compact context={context} />
      </div>
    </div>
  )
}
