export type AnalyticsGoal =
  | 'hero_cta_click'
  | 'situation_select'
  | 'services_category_open'
  | 'services_search'
  | 'quiz_start'
  | 'quiz_step'
  | 'quiz_complete'
  | 'quiz_result'
  | 'case_open'
  | 'proof_click'
  | 'pricing_view'
  | 'pricing_cta_click'
  | 'form_start'
  | 'form_step_1_submit'
  | 'form_complete'
  | 'telegram_click'
  | 'phone_click'
  | 'email_click'
  | 'service_cta_click'
  | 'quiz_fallback_click'
  | 'quiz_to_service'
  | 'quiz_to_form'
  | 'section_nav_click'
  | 'section_view'

interface YandexMetrikaFunction {
  (counterId: number, action: 'reachGoal', goal: string, params?: Record<string, unknown>): void
  (counterId: number, action: 'hit', url: string, params?: { referer?: string; title?: string }): void
}

declare global {
  interface Window {
    ym?: YandexMetrikaFunction
    Ya?: { _metrika?: { getCounters?: () => Array<{ id: number }> } }
  }
}

export function trackAnalyticsGoal(goal: AnalyticsGoal, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const payload = { page: window.location.pathname, ...params }
  const counters = window.Ya?._metrika?.getCounters?.() ?? []
  if (window.ym) {
    for (const counter of counters) {
      if (Number.isFinite(counter.id)) window.ym(counter.id, 'reachGoal', goal, payload)
    }
  }
  window.dispatchEvent(new CustomEvent('synapsee:analytics', { detail: { goal, params: payload } }))
}
