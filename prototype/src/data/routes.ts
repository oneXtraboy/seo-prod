import type { PageRoute } from '../types'

export const publicRoutes: PageRoute[] = [
  { path: '/', kind: 'home', title: 'Главная' },
  { path: '/blog/', kind: 'legacy-index', title: 'Блог' },
  { path: '/contacts/', kind: 'contact', title: 'Контакты' },
  { path: '/services/', kind: 'services-index', title: 'Услуги' },
  { path: '/services/seo-prodvizhenie/', kind: 'service', title: 'SEO-продвижение', dataId: 'seo-prodvizhenie' },
  { path: '/services/seo-audit/', kind: 'service', title: 'SEO-аудит', dataId: 'seo-audit' },
  { path: '/services/technical-seo-audit/', kind: 'service', title: 'Технический SEO-аудит', dataId: 'technical-seo-audit' },
  { path: '/services/seo-strategy/', kind: 'service', title: 'SEO-стратегия', dataId: 'seo-strategy' },
  { path: '/services/seo-consulting/', kind: 'service', title: 'SEO-консультация', dataId: 'seo-consulting' },
  { path: '/services/geo-aeo-ai-seo/', kind: 'service', title: 'GEO / AEO / AI SEO', dataId: 'geo-aeo-ai-seo' },
  { path: '/services/local-seo-spb/', kind: 'service', title: 'Локальное SEO', dataId: 'local-seo-spb' },
  { path: '/services/seo-for-b2b/', kind: 'service', title: 'SEO для B2B', dataId: 'seo-for-b2b' },
  { path: '/services/seo-for-small-business/', kind: 'service', title: 'SEO для малого бизнеса', dataId: 'seo-for-small-business' },
  { path: '/services/seo-prodvizhenie-internet-magazina/', kind: 'service', title: 'SEO интернет-магазина', dataId: 'seo-prodvizhenie-internet-magazina' },
  { path: '/services/seo-prodvizhenie-novogo-sayta/', kind: 'service', title: 'SEO нового сайта', dataId: 'seo-prodvizhenie-novogo-sayta' },
  { path: '/cases/', kind: 'cases-index', title: 'Кейсы' },
  { path: '/cases/seo-klining-dlya-biznesa/', kind: 'case', title: 'B2B-клининг', dataId: '1' },
  { path: '/cases/seo-3pl-logistika/', kind: 'case', title: '3PL / B2B-логистика', dataId: '2' },
  { path: '/cases/local-seo-avtoservisy/', kind: 'case', title: 'Сеть автосервисов', dataId: '3' },
  { path: '/cases/seo-proizvodstvo-nastolnyh-igr/', kind: 'case', title: 'Настольные игры', dataId: '4' },
  { path: '/cases/seo-proizvodstvo-mercha/', kind: 'case', title: 'Производство мерча', dataId: '5' },
  { path: '/cases/seo-meditsinskaya-klinika/', kind: 'case', title: 'Медицинская клиника', dataId: '6' },
  { path: '/pricing/', kind: 'pricing', title: 'Цены' },
  { path: '/about/', kind: 'about', title: 'Обо мне' },
  { path: '/process/', kind: 'process', title: 'Процесс' },
  { path: '/report-example/', kind: 'report-example', title: 'Пример отчёта' },
  { path: '/results/', kind: 'results', title: 'Результаты' },
  { path: '/journal/', kind: 'journal', title: 'Журнал' },
  { path: '/privacy/', kind: 'legal', title: 'Политика конфиденциальности', dataId: 'privacy' },
  { path: '/consent/', kind: 'legal', title: 'Согласие на обработку персональных данных', dataId: 'consent' },
  { path: '/terms/', kind: 'legal', title: 'Условия использования', dataId: 'terms' },
  { path: '/blog/agency-os-landing-mvp/', kind: 'legacy-article', title: 'Как собрать лаконичную SEO-страницу' },
  { path: '/authors/synapsee/', kind: 'author', title: 'Фёдор Магеря' },
  {
    path: '/journal/kak-podgotovit-sayt-k-seo-rostu-bez-haosa/',
    kind: 'article',
    title: 'Как подготовить сайт к последовательному SEO-росту',
    dataId: 'seo-growth-without-chaos',
  },
  {
    path: '/journal/kak-schitat-rezultat-seo-bez-samoobmana/',
    kind: 'article',
    title: 'Как считать результат SEO без самообмана',
    dataId: 'measure-seo-honestly',
  },
  {
    path: '/journal/oshibki-kommercheskih-stranic-kotorye-meshayut-ranzhirovatsya-i-konvertirovat/',
    kind: 'article',
    title: 'Ошибки коммерческих страниц',
    dataId: 'commercial-page-errors',
  },
  {
    path: '/journal/chto-vhodit-v-seo-audit-sayta/',
    kind: 'article',
    title: 'Что входит в SEO-аудит сайта',
    dataId: 'seo-audit-composition',
  },
  {
    path: '/journal/technical-seo-audit-chto-proveryat/',
    kind: 'article',
    title: 'Технический SEO-аудит: что проверять',
    dataId: 'technical-audit-checklist',
  },
  {
    path: '/journal/geo-aeo-ai-seo-kak-podgotovit-sayt/',
    kind: 'article',
    title: 'GEO и AI SEO: как подготовить сайт',
    dataId: 'geo-ai-visibility',
  },

  {
    path: '/journal/seo-trafik-padaet-pri-stabilnyh-pozitsiyah/',
    kind: 'article',
    title: 'SEO-трафик падает при стабильных позициях',
    dataId: 'seo-traffic-stable-positions',
  },
  {
    path: '/journal/b2b-seo-pipeline-vyruchka/',
    kind: 'article',
    title: 'B2B SEO: pipeline и выручка',
    dataId: 'b2b-seo-pipeline-revenue',
  },
  {
    path: '/journal/lokalnoe-seo-seti-filialov/',
    kind: 'article',
    title: 'Локальное SEO сети филиалов',
    dataId: 'local-seo-branch-network',
  },
  {
    path: '/journal/vidimost-v-chatgpt-ai-overviews-alise-metriki-geo/',
    kind: 'article',
    title: 'GEO-метрики видимости в AI',
    dataId: 'geo-ai-visibility-metrics',
  },
  {
    path: '/journal/struktura-b2b-sayta-pod-process-vybora-klienta/',
    kind: 'article',
    title: 'Структура B2B-сайта под процесс выбора',
    dataId: 'b2b-site-structure',
  },
  {
    path: '/journal/seo-vyroslo-ili-rynok-vyros-sam/',
    kind: 'article',
    title: 'SEO выросло или рынок вырос сам',
    dataId: 'seo-growth-vs-market',
  },
]

export const prototypeRoutes: PageRoute[] = [
  { path: '/_prototype/variants/', kind: 'home', title: 'A/B-варианты первых экранов' },
]

export const allKnownPaths = new Set([...publicRoutes, ...prototypeRoutes].map((route) => route.path))

export const primaryNavigation = [
  { label: 'Услуги', path: '/services/' },
  { label: 'Кейсы', path: '/cases/' },
  { label: 'Цены', path: '/pricing/' },
  { label: 'Процесс', path: '/process/' },
  { label: 'Обо мне', path: '/about/' },
  { label: 'Журнал', path: '/journal/' },
]

export const footerNavigation = [
  ...primaryNavigation,
  { label: 'Контакты', path: '/contacts/' },
  { label: 'Политика', path: '/privacy/' },
  { label: 'Согласие', path: '/consent/' },
  { label: 'Условия', path: '/terms/' },
]

export const contactDetails = {
  region: 'Санкт-Петербург, Ленинградская область и проекты по России',
  telegramLabel: '@oneXtraboy',
  telegramHref: 'https://t.me/oneXtraboy',
  phoneLabel: '+7 981 946-62-47',
  phoneHref: 'tel:+79819466247',
  emailLabel: '1extraboy@gmail.com',
  emailHref: 'mailto:1extraboy@gmail.com',
}

export function normalizePath(pathname: string) {
  if (pathname === '/') return '/'
  const withoutQuery = pathname.split(/[?#]/, 1)[0]
  return withoutQuery.endsWith('/') ? withoutQuery : `${withoutQuery}/`
}

export function getRoute(pathname: string) {
  const path = normalizePath(pathname)
  return [...publicRoutes, ...prototypeRoutes].find((route) => route.path === path)
}
