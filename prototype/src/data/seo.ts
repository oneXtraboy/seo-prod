import { caseById } from './cases'
import { articleById } from './articles'
import type { PageRoute } from '../types'
import { serviceById } from './services'

export interface SeoData {
  title: string
  description: string
  canonical: string
  ogTitle?: string
  ogDescription?: string
  type: 'website' | 'article'
  noIndex?: boolean
}

const origin = 'https://synapsee.ru'

function articleIsoDate(value?: string) {
  if (!value) return undefined
  const months: Record<string, string> = { января: '01', февраля: '02', марта: '03', апреля: '04', мая: '05', июня: '06', июля: '07', августа: '08', сентября: '09', октября: '10', ноября: '11', декабря: '12' }
  const match = value.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i)
  if (!match || !months[match[2].toLowerCase()]) return undefined
  return `${match[3]}-${months[match[2].toLowerCase()]}-${match[1].padStart(2, '0')}`
}

function breadcrumbsForRoute(route: PageRoute, canonical: string) {
  const items = [{ name: 'Главная', item: `${origin}/` }]
  if (route.kind === 'service') items.push({ name: 'Услуги', item: `${origin}/services/` })
  if (route.kind === 'case') items.push({ name: 'Кейсы', item: `${origin}/cases/` })
  if (route.kind === 'article') items.push({ name: 'Журнал', item: `${origin}/journal/` })
  if (route.kind === 'legacy-article') items.push({ name: 'Блог', item: `${origin}/blog/` })
  items.push({ name: route.title, item: canonical })
  return items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, ...item }))
}

const fixed: Partial<Record<PageRoute['kind'], { title: string; description: string }>> = {
  home: {
    title: 'Частный SEO-специалист Фёдор Магеря | Synapsee',
    description: 'SEO-продвижение, аудит и стратегия с одним ответственным специалистом. Понятный план, контроль внедрения и измеримые результаты.',
  },
  'services-index': {
    title: 'SEO-услуги для бизнеса: аудит, стратегия, продвижение | Synapsee',
    description: 'SEO-услуги частного специалиста: аудит, стратегия, техническое, локальное и комплексное продвижение сайтов в Яндексе и Google.',
  },
  'cases-index': {
    title: 'Кейсы SEO-продвижения с цифрами и ходом работ | Synapsee',
    description: 'Подробные кейсы SEO-продвижения: исходная задача, выполненные работы, динамика позиций, заявок и коммерческих результатов.',
  },
  pricing: {
    title: 'Цены на SEO-продвижение и аудит сайта | Synapsee',
    description: 'Открытые цены на SEO-аудит, стратегию, сопровождение и консультацию. Состав работ, результат и условия каждого формата.',
  },
  about: {
    title: 'Фёдор Магеря — частный SEO-специалист | Synapsee',
    description: 'Подход Фёдора Магери к SEO: личная стратегия, технический контроль, коммерческие страницы и измерение результата с личным ведением проекта.',
  },
  process: {
    title: 'Как проходит SEO-продвижение: процесс работы | Synapsee',
    description: 'Процесс SEO-работ от диагностики и roadmap до внедрения, проверки релизов и измерения результата по бизнес-метрикам.',
  },
  'report-example': {
    title: 'Пример SEO-отчёта и постановок для команды | Synapsee',
    description: 'Как выглядит SEO-отчёт: приоритеты для бизнеса, технические постановки, критерии приёмки и понятный план внедрения.',
  },
  results: {
    title: 'Результаты SEO: позиции, трафик и заявки | Synapsee',
    description: 'Результаты SEO-проектов с контекстом: метрика, исходная точка, период, источник данных и ограничения интерпретации.',
  },
  journal: {
    title: 'Журнал о SEO, аналитике и поисковой видимости | Synapsee',
    description: 'Практические статьи Фёдора Магери о техническом SEO, коммерческих страницах, аналитике, GEO, AEO и видимости в AI-поиске.',
  },
  contact: {
    title: 'Контакты SEO-специалиста и предварительный разбор сайта | Synapsee',
    description: 'Отправьте сайт на предварительный SEO-разбор. Ответ с первыми точками роста обычно приходит в рабочий день или на следующий.',
  },
  author: {
    title: 'Фёдор Магеря — автор и SEO-стратег Synapsee',
    description: 'Профиль автора: направления SEO-экспертизы, роль в проектах, практические статьи, кейсы и способы связи.',
  },
  legal: {
    title: 'Юридическая информация | Synapsee',
    description: 'Политика конфиденциальности и условия использования сайта Synapsee.',
  },
  'legacy-index': {
    title: 'Блог об SEO и развитии сайтов | Synapsee',
    description: 'Практические материалы о SEO-продвижении, структуре сайтов, поисковой аналитике и росте видимости в Яндексе, Google и AI-поиске.',
  },
  'legacy-article': {
    title: 'Как собрать сильную SEO-страницу | Synapsee',
    description: 'Практический разбор структуры SEO-страницы: оффер, доказательства, интент, коммерческие блоки и следующий шаг.',
  },
}

export function seoForRoute(route: PageRoute): SeoData {
  let title = fixed[route.kind]?.title || `${route.title} | Synapsee`
  let description = fixed[route.kind]?.description || 'SEO-продвижение, аудит и стратегия с личным контролем Фёдора Магери.'
  let type: SeoData['type'] = 'website'
  let ogTitle: string | undefined
  let ogDescription: string | undefined

  if (route.kind === 'service' && route.dataId) {
    const service = serviceById.get(route.dataId)
    if (service) {
      title = `${route.title}: цена и состав работ | Synapsee`
      description = service.summary
    }
  }

  if (route.kind === 'case' && route.dataId) {
    const item = caseById.get(route.dataId)
    if (item) {
      title = 'Кейс SEO: ' + route.title + ' — Synapsee'
      description = item.task + ' ' + item.result
      if (route.dataId === '1') {
        title = 'SEO клининговой компании для бизнеса: практический кейс — Synapsee'
        description = 'SEO-кейс B2B-клининга: семантика, структура посадочных, каннибализация, технический аудит, коммерческие факторы, Local SEO и динамика поисковой видимости.'
        ogTitle = 'SEO клининговой компании для бизнеса — Synapsee'
        ogDescription = 'Проверка спроса, отдельные страницы под сильные услуги, техническое SEO, локальные страницы и контроль позиций.'
      }
      if (route.dataId === '5') {
        title = 'SEO-кейс: производство мерча — рост заказов в 3,1 раза и ROI 380% | Synapsee'
        description = 'Как SEO превратило сайт производства корпоративного мерча из 20 пустых страниц в стабильный B2B-канал продаж: +42 новые страницы, рост органического трафика в 4,2 раза, корпоративных заказов — в 3,1 раза, ROI SEO-канала — 380%.'
        ogTitle = title
        ogDescription = description
      }
      type = 'article'
    }
  }

  if (route.kind === 'article' && route.dataId) {
    const article = articleById.get(route.dataId)
    if (article) {
      title = article.seoTitle || `${article.title.length > 58 ? route.title : article.title} | Synapsee`
      description = article.seoDescription || (article.summary.length >= 90 ? article.summary : `${article.summary} Чек-лист, примеры и практические рекомендации для внедрения.`)
      ogTitle = title
      ogDescription = description
      type = 'article'
    }
  }

  if (route.kind === 'legal') {
    title = `${route.title} | Synapsee`
    description = route.dataId === 'privacy'
      ? 'Политика обработки персональных данных на сайте synapsee.ru: состав, цели, срок хранения, права пользователя и контакты.'
      : route.dataId === 'consent'
        ? 'Согласие на обработку персональных данных при отправке формы synapsee.ru: состав данных, цели, срок действия и порядок отзыва.'
        : 'Условия использования сайта synapsee.ru: информационный характер материалов, коммерческие условия, ограничения и начало сотрудничества.'
  }

  return {
    title,
    description,
    ogTitle,
    ogDescription,
    canonical: origin + (route.path === '/' ? '/' : route.path),
    type,
  }
}

export function jsonLdForRoute(route: PageRoute) {
  const seo = seoForRoute(route)
  const pageType = route.kind === 'about' || route.kind === 'author'
    ? 'ProfilePage'
    : route.kind === 'contact'
      ? 'ContactPage'
      : route.kind === 'services-index' || route.kind === 'cases-index' || route.kind === 'journal' || route.kind === 'legacy-index'
        ? 'CollectionPage'
        : 'WebPage'
  const pageNode: Record<string, unknown> = {
    '@type': pageType,
    '@id': `${seo.canonical}#webpage`,
    url: seo.canonical,
    name: seo.title,
    description: seo.description,
    inLanguage: 'ru-RU',
    isPartOf: { '@id': `${origin}/#website` },
    author: { '@id': `${origin}/#fedor-magerya` },
    publisher: { '@id': `${origin}/#organization` },
  }
  if (route.kind === 'about' || route.kind === 'author') pageNode.mainEntity = { '@id': `${origin}/#fedor-magerya` }

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: `${origin}/`,
      name: 'Synapsee',
      inLanguage: 'ru-RU',
      publisher: { '@id': `${origin}/#organization` },
    },
    {
      '@type': 'Person',
      '@id': `${origin}/#fedor-magerya`,
      name: 'Фёдор Магеря',
      jobTitle: 'SEO-специалист',
      url: `${origin}/about/`,
      description: 'Частный SEO-специалист. Занимается SEO-аудитом, стратегией, техническим SEO, коммерческими страницами, локальным SEO и развитием видимости в Яндексе, Google и AI-поиске.',
      image: `${origin}/images/fedor-magerya.jpg`,
      worksFor: { '@id': `${origin}/#organization` },
      sameAs: ['https://t.me/oneXtraboy'],
    },
    {
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: 'Synapsee',
      url: `${origin}/`,
      logo: `${origin}/favicon.svg`,
      description: 'Независимая SEO-практика Фёдора Магери: аудит, стратегия, сопровождение и контроль внедрения.',
      email: '1extraboy@gmail.com',
      telephone: '+7-981-946-62-47',
      areaServed: ['Санкт-Петербург', 'Ленинградская область', 'Россия'],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+7-981-946-62-47',
        email: '1extraboy@gmail.com',
        contactType: 'customer service',
        availableLanguage: 'ru',
      },
      sameAs: ['https://t.me/oneXtraboy'],
      founder: { '@id': `${origin}/#fedor-magerya` },
    },
    pageNode,
  ]

  if (route.kind === 'article' || route.kind === 'legacy-article') {
    const article = route.kind === 'article' && route.dataId ? articleById.get(route.dataId) : undefined
    const articleNode: Record<string, unknown> = {
      '@type': 'BlogPosting',
      '@id': `${seo.canonical}#article`,
      url: seo.canonical,
      headline: article?.title || route.title,
      description: seo.description,
      inLanguage: 'ru-RU',
      author: { '@id': `${origin}/#fedor-magerya` },
      publisher: { '@id': `${origin}/#organization` },
      mainEntityOfPage: { '@id': `${seo.canonical}#webpage` },
    }
    const published = articleIsoDate(article?.published)
    const modified = articleIsoDate(article?.updated)
    if (published) articleNode.datePublished = published
    if (modified) articleNode.dateModified = modified
    if (article?.primaryImage) articleNode.image = article.primaryImage.startsWith('http') ? article.primaryImage : origin + article.primaryImage
    pageNode.mainEntity = { '@id': `${seo.canonical}#article` }
    graph.push(articleNode)
  }

  if (route.kind === 'service' && route.dataId) {
    const service = serviceById.get(route.dataId)
    if (service) {
      graph.push({
        '@type': 'Service',
        '@id': `${seo.canonical}#service`,
        name: service.title,
        description: service.summary,
        url: seo.canonical,
        provider: { '@id': `${origin}/#organization` },
        areaServed: ['Санкт-Петербург', 'Ленинградская область', 'Россия'],
      })
      pageNode.mainEntity = { '@id': `${seo.canonical}#service` }
      if (service.faq.length > 0) graph.push({
        '@type': 'FAQPage',
        '@id': `${seo.canonical}#faq`,
        mainEntity: service.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      })
    }
  }

  if (route.path !== '/') graph.push({
    '@type': 'BreadcrumbList',
    '@id': `${seo.canonical}#breadcrumb`,
    itemListElement: breadcrumbsForRoute(route, seo.canonical),
  })

  return { '@context': 'https://schema.org', '@graph': graph }
}
