import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackAnalyticsGoal, type AnalyticsGoal } from '../lib/analytics'

const clickGoals = new Set<AnalyticsGoal>([
  'hero_cta_click',
  'services_category_open',
  'situation_select',
  'quiz_to_service',
  'quiz_to_form',
  'case_open',
  'proof_click',
  'pricing_view',
  'pricing_cta_click',
  'telegram_click',
  'phone_click',
  'email_click',
  'service_cta_click',
])

function readParams(value?: string): Record<string, unknown> {
  if (!value) return {}
  try { return JSON.parse(value) as Record<string, unknown> } catch { return {} }
}

export function AnalyticsBridge() {
  const location = useLocation()
  const previousPageUrl = useRef<string | null>(null)

  useEffect(() => {
    const currentUrl = new URL(`${location.pathname}${location.search}`, window.location.origin).href
    const previousUrl = previousPageUrl.current
    previousPageUrl.current = currentUrl

    if (!previousUrl || previousUrl === currentUrl) return

    const timeout = window.setTimeout(() => {
      window.ym?.(112847372, 'hit', currentUrl, {
        referer: previousUrl,
        title: document.title,
      })
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [location.pathname, location.search])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const origin = event.target
      if (!(origin instanceof Element)) return
      const target = origin.closest<HTMLElement>('[data-analytics]')
      if (!target) return
      const goal = target.dataset.analytics as AnalyticsGoal | undefined
      if (!goal || !clickGoals.has(goal)) return
      trackAnalyticsGoal(goal, {
        label: target.dataset.analyticsLabel || target.textContent?.trim().slice(0, 120) || '',
        path: target instanceof HTMLAnchorElement ? target.getAttribute('href') || '' : window.location.pathname,
        ...(target.dataset.service ? { service: target.dataset.service } : {}),
        ...(target.dataset.situation ? { situation: target.dataset.situation } : {}),
        ...(target.dataset.category ? { category: target.dataset.category } : {}),
        ...readParams(target.dataset.analyticsParams),
      })
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])
  return null
}
