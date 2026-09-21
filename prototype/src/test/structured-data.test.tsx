import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { RoutePage } from '../App'
import { articleById } from '../data/articles'
import { publicRoutes } from '../data/routes'
import { jsonLdForRoute, seoForRoute } from '../data/seo'

type JsonLdNode = Record<string, unknown>

const organizationId = 'https://synapsee.ru/#organization'
const personId = 'https://synapsee.ru/#fedor-magerya'
const websiteId = 'https://synapsee.ru/#website'

function graphFor(path: string) {
  const route = publicRoutes.find((item) => item.path === path)
  if (!route) throw new Error(`Unknown test route: ${path}`)
  return jsonLdForRoute(route)['@graph'] as JsonLdNode[]
}

function nodeById(graph: JsonLdNode[], id: string) {
  return graph.find((node) => node['@id'] === id)
}

afterEach(() => {
  cleanup()
  document.querySelector('#structured-data')?.remove()
})

describe('Schema.org graph', () => {
  it('uses one linked set of stable core entities on every public route', () => {
    for (const route of publicRoutes) {
      const graph = jsonLdForRoute(route)['@graph'] as JsonLdNode[]
      const ids = graph.map((node) => node['@id']).filter(Boolean)
      expect(new Set(ids).size, route.path).toBe(ids.length)
      expect(nodeById(graph, websiteId)).toMatchObject({ '@type': 'WebSite' })
      expect(nodeById(graph, websiteId)?.url).toBe('https://synapsee.ru/')
      expect(nodeById(graph, personId)).toMatchObject({
        '@type': 'Person',
        image: 'https://synapsee.ru/images/fedor-magerya.jpg',
        worksFor: { '@id': organizationId },
      })
      expect(nodeById(graph, organizationId)).toMatchObject({
        '@type': 'Organization',
        founder: { '@id': personId },
        contactPoint: { '@type': 'ContactPoint' },
      })
      expect(nodeById(graph, `${seoForRoute(route).canonical}#webpage`)).toBeDefined()
      expect(JSON.stringify(graph)).not.toContain('LocalBusiness')
    }
  })

  it('uses the requested page types and main entities', () => {
    expect(nodeById(graphFor('/'), 'https://synapsee.ru/#webpage')).toMatchObject({ '@type': 'WebPage' })
    expect(nodeById(graphFor('/about/'), 'https://synapsee.ru/about/#webpage')).toMatchObject({
      '@type': 'ProfilePage',
      mainEntity: { '@id': personId },
    })
    expect(nodeById(graphFor('/contacts/'), 'https://synapsee.ru/contacts/#webpage')).toMatchObject({ '@type': 'ContactPage' })
    expect(nodeById(graphFor('/journal/'), 'https://synapsee.ru/journal/#webpage')).toMatchObject({ '@type': 'CollectionPage' })
  })

  it('describes every concrete service without invented offers', () => {
    for (const route of publicRoutes.filter((item) => item.kind === 'service')) {
      const graph = jsonLdForRoute(route)['@graph'] as JsonLdNode[]
      const canonical = seoForRoute(route).canonical
      expect(nodeById(graph, `${canonical}#webpage`)).toMatchObject({
        '@type': 'WebPage',
        mainEntity: { '@id': `${canonical}#service` },
      })
      expect(nodeById(graph, `${canonical}#service`)).toMatchObject({
        '@type': 'Service',
        provider: { '@id': organizationId },
        areaServed: ['Санкт-Петербург', 'Ленинградская область', 'Россия'],
      })
      expect(nodeById(graph, `${canonical}#service`)).not.toHaveProperty('offers')
    }
  })

  it('keeps WebPage and BlogPosting separate and only exposes factual article metadata', () => {
    for (const route of publicRoutes.filter((item) => item.kind === 'article')) {
      const graph = jsonLdForRoute(route)['@graph'] as JsonLdNode[]
      const canonical = seoForRoute(route).canonical
      const page = nodeById(graph, `${canonical}#webpage`)
      const posting = nodeById(graph, `${canonical}#article`)
      const source = articleById.get(route.dataId || '')
      expect(page).toMatchObject({ '@type': 'WebPage', mainEntity: { '@id': `${canonical}#article` } })
      expect(posting).toMatchObject({
        '@type': 'BlogPosting',
        author: { '@id': personId },
        publisher: { '@id': organizationId },
        mainEntityOfPage: { '@id': `${canonical}#webpage` },
      })
      expect(posting?.datePublished).toBe(source?.published ? '2026-09-20' : undefined)
      expect(posting?.image).toBe(source?.primaryImage ? `https://synapsee.ru${source.primaryImage}` : undefined)
    }
  })

  it('adds a canonical breadcrumb trail to every logical internal page', () => {
    for (const route of publicRoutes.filter((item) => item.path !== '/')) {
      const canonical = seoForRoute(route).canonical
      const breadcrumb = nodeById(jsonLdForRoute(route)['@graph'] as JsonLdNode[], `${canonical}#breadcrumb`)
      const items = breadcrumb?.itemListElement as JsonLdNode[]
      expect(breadcrumb?.['@type']).toBe('BreadcrumbList')
      expect(items[0]).toMatchObject({ position: 1, item: 'https://synapsee.ru/' })
      expect(items.at(-1)?.item).toBe(canonical)
      expect(items.map((item) => item.position)).toEqual(items.map((_, index) => index + 1))
    }
  })

  it('replaces the JSON-LD graph during client-side navigation without duplication', () => {
    const home = publicRoutes.find((route) => route.path === '/')!
    const service = publicRoutes.find((route) => route.path === '/services/seo-audit/')!
    const view = render(<MemoryRouter><RoutePage route={home} /></MemoryRouter>)
    expect(document.querySelectorAll('#structured-data')).toHaveLength(1)
    expect(document.querySelector('#structured-data')?.textContent).toContain('https://synapsee.ru/#webpage')
    view.rerender(<MemoryRouter><RoutePage route={service} /></MemoryRouter>)
    expect(document.querySelectorAll('#structured-data')).toHaveLength(1)
    expect(document.querySelector('#structured-data')?.textContent).toContain('https://synapsee.ru/services/seo-audit/#service')
    expect(document.querySelector('#structured-data')?.textContent).not.toContain('https://synapsee.ru/#webpage')
  })
})
