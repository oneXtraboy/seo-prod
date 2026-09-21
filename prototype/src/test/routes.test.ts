import { describe, expect, it } from 'vitest'
import { articles } from '../data/articles'
import { cases } from '../data/cases'
import { publicRoutes } from '../data/routes'
import { services } from '../data/services'

describe('route registry', () => {
  it('contains exactly 45 unique public routes', () => {
    expect(publicRoutes).toHaveLength(45)
    expect(new Set(publicRoutes.map((route) => route.path)).size).toBe(45)
  })

  it('maps every data record to a public route', () => {
    for (const service of services) expect(publicRoutes).toContainEqual(expect.objectContaining({ path: service.path, dataId: service.id, kind: 'service' }))
    for (const item of cases) expect(publicRoutes).toContainEqual(expect.objectContaining({ path: item.path, dataId: item.id, kind: 'case' }))
    for (const article of articles) expect(publicRoutes).toContainEqual(expect.objectContaining({ path: article.path, dataId: article.id, kind: 'article' }))
  })

  it('keeps required data collections complete', () => {
    expect(services).toHaveLength(11)
    expect(cases).toHaveLength(6)
    expect(articles).toHaveLength(12)
  })
})
