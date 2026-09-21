import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { articles } from '../data/articles'
import { AnalyticsBridge } from '../components/AnalyticsBridge'
import { ArticlePage } from '../pages/ContentPages'
import { PricingPage } from '../pages/PricingPage'

describe('article and pricing conversion alignment', () => {
  it('gives every journal article one relevant service and one final form', () => {
    for (const article of articles) {
      const html = renderToStaticMarkup(<MemoryRouter><ArticlePage article={article} /></MemoryRouter>)
      expect((html.match(/article-service-next/g) || [])).toHaveLength(1)
      expect((html.match(/<form class="lead-form/g) || [])).toHaveLength(1)
      expect(html).toContain(`&quot;article_slug&quot;:&quot;${article.id}&quot;`)
      expect(html).not.toContain('Подобрать формат')
    }
  })

  it('marks pricing actions with format context', () => {
    const html = renderToStaticMarkup(<MemoryRouter><AnalyticsBridge /><PricingPage /></MemoryRouter>)
    expect(html).toContain('data-analytics="pricing_cta_click"')
    expect(html).toContain('&quot;format&quot;:&quot;audit&quot;')
    expect(html).toContain('&quot;format&quot;:&quot;strategy&quot;')
    expect(html).toContain('&quot;format&quot;:&quot;retainer&quot;')
    expect(html).toContain('&quot;format&quot;:&quot;consulting&quot;')
  })
})
