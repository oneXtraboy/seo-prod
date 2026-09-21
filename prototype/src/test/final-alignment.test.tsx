import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { cases } from '../data/cases'
import { getServicePresentation, servicePresentation } from '../data/servicePresentation'
import { services } from '../data/services'
import { ServicePage } from '../pages/ServicePages'

describe('final CRO alignment', () => {
  it('uses one conversion sequence for every concrete service page', () => {
    for (const service of services) {
      const html = renderToStaticMarkup(<MemoryRouter><ServicePage service={service} /></MemoryRouter>)
      expect(html).not.toContain('Подобрать формат')
      expect(html).not.toContain('С чего разумнее начать')
      expect((html.match(/<form class="lead-form/g) || [])).toHaveLength(1)

      const order = ['id="fit"', 'id="result"', 'id="case"', 'id="includes"', 'id="process"', 'id="price"', 'id="faq"', 'id="contact"']
        .map((marker) => html.indexOf(marker))
      expect(order.every((position) => position >= 0)).toBe(true)
      expect(order).toEqual([...order].sort((left, right) => left - right))
    }
  })

  it('keeps service context explicit and report links limited to relevant services', () => {
    expect(getServicePresentation('seo-audit').serviceCode).toBe('seo_audit')
    expect(getServicePresentation('technical-seo-audit').serviceCode).toBe('technical_audit')
    expect(getServicePresentation('seo-strategy').serviceCode).toBe('seo_strategy')
    expect(getServicePresentation('seo-consulting').serviceCode).toBe('seo_consulting')
    expect(getServicePresentation('seo-prodvizhenie-internet-magazina').serviceCode).toBe('ecommerce')
    expect(getServicePresentation('local-seo-spb').serviceCode).toBe('local_seo')
    expect(getServicePresentation('seo-for-small-business').serviceCode).toBe('small_business')

    const linked = Object.entries(servicePresentation).filter(([, item]) => item.reportLinkLabel).map(([id]) => id).sort()
    expect(linked).toEqual(['seo-audit', 'seo-prodvizhenie', 'seo-strategy', 'technical-seo-audit'])
  })

  it('keeps case attribution and source boundaries explicit', () => {
    expect(cases.every((item) => item.role && item.clientRole && item.seoContribution)).toBe(true)
    expect(cases.filter((item) => item.sourceLabel).every((item) => item.period)).toBe(true)
    expect(cases.every((item) => item.sourceLabel && item.period)).toBe(true)
    expect(cases.filter((item) => item.sourceLabel).map((item) => item.id)).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(cases[0].sourceLabel).toContain('Topvisor')
    expect(cases[0].resultContext).toContain('18 из 20')
  })
})
