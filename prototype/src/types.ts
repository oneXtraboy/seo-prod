
export interface FaqItem {
  question: string
  answer: string
}

export interface ServiceData {
  id: string
  path: string
  group: 'Диагностика' | 'Стратегия' | 'Сопровождение' | 'Специальные направления'
  eyebrow: string
  title: string
  summary: string
  price: string
  duration: string
  fit: string[]
  notFit: string[]
  outcomes: string[]
  includes: string[]
  excludes: string[]
  artifactTitle: string
  artifactPurpose: string
  caseId: string
  faq: FaqItem[]
  scenarios: string[]
}

export interface CaseData {
  id: string
  path: string
  niche: string
  title: string
  task: string
  period?: string
  metric: string
  result: string
  sourceLabel?: string
  resultContext?: string
  role: string
  clientRole: string
  findings: string[]
  actions: string[]
  seoContribution: string
  limitations: string[]
  otherFactors: string[]
  servicePath: string
}

export interface ArticleSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
  blocks?: ArticleContentBlock[]
}

export interface ArticleFigure {
  src: string
  alt: string
  caption: string
  width: number
  height: number
  eager?: boolean
}

export interface ArticleTable {
  headers: string[]
  rows: string[][]
  caption?: string
}

export interface ArticleLink {
  label: string
  path: string
}

export type ArticleContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level: 3 | 4 }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'table'; table: ArticleTable }
  | { type: 'figure'; figure: ArticleFigure }
  | { type: 'links'; title: string; links: ArticleLink[] }
  | { type: 'infographic'; variant: 'query-to-solution' | 'b2b-layers' | 'three-pl-before-after' | 'page-or-block' }

export interface ArticleData {
  id: string
  path: string
  title: string
  shortAnswer: string
  summary: string
  topic: 'Техника' | 'Коммерческие страницы' | 'Аналитика' | 'GEO / AI' | 'Локальное SEO'
  readingTime: string
  published?: string
  updated: string
  servicePath: string
  sections: ArticleSection[]
  intro?: string[]
  checklist: string[]
  sources: string[]
  seoTitle?: string
  seoDescription?: string
  primaryImage?: string
  relatedPaths?: string[]
  authorPath?: string
  cta?: {
    title: string
    text: string
    label: string
  }
  hideDefaultChecklist?: boolean
}

export type PageKind =
  | 'home'
  | 'legacy-index'
  | 'contact'
  | 'services-index'
  | 'service'
  | 'cases-index'
  | 'case'
  | 'pricing'
  | 'about'
  | 'process'
  | 'report-example'
  | 'results'
  | 'journal'
  | 'legal'
  | 'legacy-article'
  | 'author'
  | 'article'

export interface PageRoute {
  path: string
  kind: PageKind
  title: string
  dataId?: string
}
