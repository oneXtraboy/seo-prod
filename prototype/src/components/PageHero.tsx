import type { ReactNode } from 'react'
import { Breadcrumbs, Container, type Crumb } from './ui'

export function PageHero({
  breadcrumbs,
  eyebrow,
  title,
  summary,
  meta,
  aside,
  children,
  compact = false,
}: {
  breadcrumbs?: Crumb[]
  eyebrow?: string
  title: string
  summary: string
  meta?: ReactNode
  aside?: ReactNode
  children?: ReactNode
  compact?: boolean
}) {
  return (
    <section className={`page-hero ${aside ? 'page-hero--split' : ''} ${compact ? 'page-hero--compact' : ''}`.trim()}>
      <Container>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <div className="page-hero__grid">
          <div className="page-hero__content">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1>{title}</h1>
            <p className="page-hero__summary">{summary}</p>
            {meta && <div className="page-hero__meta">{meta}</div>}
            {children && <div className="page-hero__actions">{children}</div>}
          </div>
          {aside && <div className="page-hero__aside">{aside}</div>}
        </div>
      </Container>
    </section>
  )
}
