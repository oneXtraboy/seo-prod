import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.argv[2]
if (!repoRoot) throw new Error('Pass the repository root as the first argument')
const outputDir = path.join(repoRoot, 'reports', 'qa-final')
await fs.mkdir(outputDir, { recursive: true })

async function findChromeTarget() {
  for (const port of [9222, 9223, 9224]) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
      const target = targets.find((entry) => entry.type === 'page')
      if (target?.webSocketDebuggerUrl) return { port, target }
    } catch {
      // Try the next local-only debugging port.
    }
  }
  throw new Error('No local Chrome debugging target on ports 9222-9224')
}

async function collectRoutes(directory, relative = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const routes = []
  if (entries.some((entry) => entry.isFile() && entry.name === 'index.html')) {
    routes.push(relative ? `/${relative.replaceAll('\\', '/')}/` : '/')
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'assets') continue
    routes.push(...await collectRoutes(path.join(directory, entry.name), path.join(relative, entry.name)))
  }
  return routes
}

const { port, target } = await findChromeTarget()
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let callId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data))
  if (!message.id || !pending.has(message.id)) return
  const handlers = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) handlers.reject(new Error(message.error.message))
  else handlers.resolve(message.result)
})

function call(method, params = {}) {
  callId += 1
  socket.send(JSON.stringify({ id: callId, method, params }))
  return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }))
}

function delay(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed')
  return result.result.value
}

async function navigate(route, wait = 260) {
  await call('Page.navigate', { url: `http://127.0.0.1:4173${route}` })
  await delay(wait)
}

async function click(selector) {
  return evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    element.click();
    return true;
  })()`)
}

await call('Page.enable')
await call('Runtime.enable')
const routes = (await collectRoutes(path.join(repoRoot, 'prototype', 'dist'))).sort()
const baseViewports = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
]
const extraViewports = [
  { name: 'mobile-360', width: 360, height: 800, mobile: true },
  { name: 'mobile-430', width: 430, height: 900, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true },
  { name: 'tablet-1024', width: 1024, height: 900, mobile: false },
  { name: 'desktop-1280', width: 1280, height: 900, mobile: false },
]
const keyRoutes = ['/', '/services/', '/services/seo-audit/', '/services/seo-prodvizhenie/', '/pricing/', '/about/', '/process/', '/report-example/', '/cases/seo-klining-dlya-biznesa/', '/contacts/']
const report = []

async function auditRoute(route, viewport) {
  await call('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile })
  await navigate(route)
  const result = await evaluate(`(() => {
    const width = document.documentElement.clientWidth;
    const overflowing = [...document.querySelectorAll('body *')].filter((element) => {
      const style = getComputedStyle(element);
      if (style.position === 'fixed' || style.position === 'sticky' || element.closest('.comparison-table-wrap') || element.closest('.article-table-wrap')) return false;
      const box = element.getBoundingClientRect();
      return box.right > width + 1 || box.left < -1;
    }).slice(0, 10).map((element) => ({
      tag: element.tagName,
      cls: typeof element.className === 'string' ? element.className : '',
      left: Math.round(element.getBoundingClientRect().left),
      right: Math.round(element.getBoundingClientRect().right),
    }));
    const forbidden = [
      'Рабочий артефакт',
      'Контекстное доказательство',
      'Третий способ выбора',
      'Покупка отзывов',
      'Создание фиктивных филиалов',
      'Массовая генерация непроверенного AI-контента',
      'Укажите ваш сайт и удобный контакт для отправки аудита.',
    ].filter((value) => document.body.innerText.includes(value));
    const sectionNav = document.querySelector('.section-nav');
    return {
      title: document.title,
      h1: document.querySelectorAll('h1').length,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: width,
      overflowing,
      forbidden,
      sectionNavVisible: sectionNav ? getComputedStyle(sectionNav).display !== 'none' : false,
      forms: document.querySelectorAll('form.lead-form').length,
    };
  })()`)
  report.push({ route, viewport: viewport.name, ...result })
}

for (const viewport of baseViewports) {
  for (const route of routes) await auditRoute(route, viewport)
}
for (const viewport of extraViewports) {
  for (const route of keyRoutes) await auditRoute(route, viewport)
}

const screenshots = [
  { route: '/', viewport: baseViewports[0], name: 'home-1440' },
  { route: '/', viewport: baseViewports[1], name: 'home-390' },
  { route: '/services/', viewport: baseViewports[0], name: 'services-1440' },
  { route: '/services/', viewport: baseViewports[1], name: 'services-390' },
  { route: '/services/seo-audit/', viewport: baseViewports[0], name: 'audit-1440' },
  { route: '/pricing/', viewport: baseViewports[0], name: 'pricing-1440' },
  { route: '/pricing/', viewport: baseViewports[1], name: 'pricing-390' },
  { route: '/about/', viewport: baseViewports[0], name: 'about-1440' },
  { route: '/report-example/', viewport: baseViewports[0], name: 'report-1440' },
  { route: '/contacts/', viewport: baseViewports[1], name: 'contact-390' },
]
for (const shot of screenshots) {
  await call('Emulation.setDeviceMetricsOverride', { width: shot.viewport.width, height: shot.viewport.height, deviceScaleFactor: 1, mobile: shot.viewport.mobile })
  await navigate(shot.route)
  const captured = await call('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
  await fs.writeFile(path.join(outputDir, `${shot.name}.png`), Buffer.from(captured.data, 'base64'))
}

const interactions = {}

await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
await navigate('/')
interactions.stickyClickAvailable = await click('.section-nav a[href="#services"]')
await delay(1800)
interactions.stickyNavigation = await evaluate(`(() => {
  const link = document.querySelector('.section-nav a[href="#services"]');
  const target = document.querySelector('#services');
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.section-nav');
  const expectedTop = (header?.getBoundingClientRect().bottom || 0) + (nav?.getBoundingClientRect().height || 0) + 20;
  return {
    current: Boolean(link?.closest('li')?.classList.contains('is-current')),
    hash: location.hash,
    topDelta: target ? Math.round(target.getBoundingClientRect().top - expectedTop) : null,
  };
})()`)

await navigate('/services/')
interactions.drawerClickAvailable = await click('[data-category="technical"]')
await delay(180)
interactions.drawerOpened = await evaluate(`Boolean(document.querySelector('.service-drawer [role="dialog"]'))`)
await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' })
await delay(180)
interactions.drawerClosed = await evaluate(`!document.querySelector('.service-drawer [role="dialog"]')`)

await navigate('/services/')
interactions.chooserClickAvailable = await click('[data-situation="ecommerce"]')
await delay(500)
interactions.chooser = await evaluate(`(() => {
  const result = document.querySelector('.service-chooser__result');
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.section-nav');
  const controlTop = (header?.getBoundingClientRect().bottom || 0) + (nav?.getBoundingClientRect().height || 0);
  return {
    selected: document.querySelector('[data-situation="ecommerce"]')?.getAttribute('aria-pressed') === 'true',
    visibleBelowNavigation: result ? result.getBoundingClientRect().top >= controlTop - 1 : false,
    heading: result?.querySelector('h3')?.textContent || '',
  };
})()`)

await navigate('/services/')
await click('.seo-quiz__intro button')
await click('[data-quiz-answer="system-growth"]')
await click('[data-quiz-answer="full-cycle"]')
await click('[data-quiz-answer="team"]')
await delay(180)
interactions.quiz = await evaluate(`(() => ({
  result: document.querySelector('.seo-quiz__recommendation h2')?.textContent || '',
  minimumShown: document.body.innerText.includes('Минимальный срок сопровождения — 4 месяца'),
  contextualForm: document.body.innerText.includes('Покажите сайт — проверю рекомендацию'),
}))()`)

await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
await navigate('/')
interactions.mobileMenuClickAvailable = await click('.menu-button')
await delay(180)
interactions.mobile = await evaluate(`(() => ({
  menuOpen: Boolean(document.querySelector('.mobile-menu [role="dialog"]')),
  sectionNavHidden: !document.querySelector('.section-nav') || getComputedStyle(document.querySelector('.section-nav')).display === 'none',
  noOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
}))()`)

const deviations = report.filter((item) =>
  item.h1 !== 1 ||
  item.scrollWidth > item.clientWidth ||
  item.overflowing.length > 0 ||
  item.forbidden.length > 0 ||
  (item.viewport.startsWith('mobile') && item.sectionNavVisible)
)
const interactionFailures = {
  stickyNavigation: !interactions.stickyClickAvailable || !interactions.stickyNavigation.current || interactions.stickyNavigation.hash !== '#services' || Math.abs(interactions.stickyNavigation.topDelta ?? 999) > 35,
  drawer: !interactions.drawerClickAvailable || !interactions.drawerOpened || !interactions.drawerClosed,
  chooser: !interactions.chooserClickAvailable || !interactions.chooser.selected || !interactions.chooser.visibleBelowNavigation,
  quiz: interactions.quiz.result !== 'SEO-сопровождение' || !interactions.quiz.minimumShown || !interactions.quiz.contextualForm,
  mobile: !interactions.mobileMenuClickAvailable || !interactions.mobile.menuOpen || !interactions.mobile.sectionNavHidden || !interactions.mobile.noOverflow,
}

const finalReport = {
  chromePort: port,
  routes: routes.length,
  checks: report.length,
  deviations,
  interactions,
  interactionFailures,
}
await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(finalReport, null, 2))
console.log(JSON.stringify(finalReport, null, 2))
socket.close()
if (deviations.length || Object.values(interactionFailures).some(Boolean)) process.exitCode = 1

