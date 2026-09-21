import { renderToString } from 'react-dom/server'
import { ServerApp } from './App'
import { publicRoutes } from './data/routes'
import { jsonLdForRoute, seoForRoute } from './data/seo'

export { publicRoutes }

export function render(url: string) {
  const route = publicRoutes.find((item) => item.path === url)
  if (!route) return {
    html: renderToString(<ServerApp url={url} />),
    seo: {
      title: 'Страница не найдена | Synapsee',
      description: 'Запрошенная страница не найдена.',
      canonical: 'https://synapsee.ru/404.html',
      type: 'website' as const,
      noIndex: true,
    },
    jsonLd: null,
  }
  return {
    html: renderToString(<ServerApp url={url} />),
    seo: seoForRoute(route),
    jsonLd: jsonLdForRoute(route),
  }
}
