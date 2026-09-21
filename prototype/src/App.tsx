import { useEffect } from 'react'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import { articleById } from './data/articles'
import { caseById } from './data/cases'
import { publicRoutes } from './data/routes'
import { jsonLdForRoute, seoForRoute } from './data/seo'
import { serviceById } from './data/services'
import type { PageRoute } from './types'
import { SiteLayout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { CasePage, CasesIndexPage } from './pages/CasePages'
import { ArticlePage, AuthorPage, JournalPage, LegacyArticlePage, LegacyIndexPage } from './pages/ContentPages'
import { LegalPage } from './pages/LegalPages'
import { AboutPage, ContactPage, ProcessPage, ReportExamplePage, ResultsPage } from './pages/InfoPages'
import { PricingPage } from './pages/PricingPage'
import { ServicePage, ServicesIndexPage } from './pages/ServicePages'
import { ButtonLink, Container } from './components/ui'

function DocumentMeta({ route }: { route: PageRoute }) {
  useEffect(() => {
    const seo = seoForRoute(route)
    document.title = seo.title
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) description.content = seo.description
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = seo.canonical
    let structuredData = document.querySelector<HTMLScriptElement>('#structured-data')
    if (!structuredData) {
      structuredData = document.createElement('script')
      structuredData.id = 'structured-data'
      structuredData.type = 'application/ld+json'
      document.head.append(structuredData)
    }
    structuredData.textContent = JSON.stringify(jsonLdForRoute(route)).replace(/</g, '\\u003c')
  }, [route])
  return null
}

function NotFoundPage() {
  return (
    <section className="not-found">
      <Container>
        <p className="eyebrow">Ошибка 404</p>
        <h1>Такой страницы нет</h1>
        <p>Возможно, адрес изменился или в ссылке есть опечатка. Вернитесь на главную или выберите нужную услугу.</p>
        <ButtonLink to="/">На главную</ButtonLink>
      </Container>
    </section>
  )
}

export function RoutePage({ route }: { route: PageRoute }) {
  let page

  switch (route.kind) {
    case 'home': page = <HomePage />; break
    case 'legacy-index': page = <LegacyIndexPage />; break
    case 'contact': page = <ContactPage />; break
    case 'services-index': page = <ServicesIndexPage />; break
    case 'service': {
      const service = route.dataId ? serviceById.get(route.dataId) : undefined
      page = service ? <ServicePage service={service} /> : <NotFoundPage />
      break
    }
    case 'cases-index': page = <CasesIndexPage />; break
    case 'case': {
      const item = route.dataId ? caseById.get(route.dataId) : undefined
      page = item ? <CasePage item={item} /> : <NotFoundPage />
      break
    }
    case 'pricing': page = <PricingPage />; break
    case 'about': page = <AboutPage />; break
    case 'process': page = <ProcessPage />; break
    case 'report-example': page = <ReportExamplePage />; break
    case 'results': page = <ResultsPage />; break
    case 'journal': page = <JournalPage />; break
    case 'legal': page = <LegalPage type={route.dataId === 'privacy' ? 'privacy' : route.dataId === 'consent' ? 'consent' : 'terms'} />; break
    case 'legacy-article': page = <LegacyArticlePage />; break
    case 'author': page = <AuthorPage />; break
    case 'article': {
      const article = route.dataId ? articleById.get(route.dataId) : undefined
      page = article ? <ArticlePage article={article} /> : <NotFoundPage />
      break
    }
  }

  return <><DocumentMeta route={route} />{page}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        {publicRoutes.map((route) => <Route element={<RoutePage route={route} />} key={route.path} path={route.path} />)}
        <Route element={<NotFoundPage />} path="*" />
      </Route>
    </Routes>
  )
}

export function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}

export function ServerApp({ url }: { url: string }) {
  return <MemoryRouter initialEntries={[url]}><AppRoutes /></MemoryRouter>
}
