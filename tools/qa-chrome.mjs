import fs from 'node:fs/promises'

const targets = await fetch('http://127.0.0.1:9222/json').then((response) => response.json())
const pageTarget = targets.find((target) => target.type === 'page')
if (!pageTarget) throw new Error('No Chrome page target')

const socket = new WebSocket(pageTarget.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let callId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data))
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) reject(new Error(message.error.message))
  else resolve(message.result)
})

function call(method, params = {}) {
  callId += 1
  const id = callId
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

await call('Page.enable')
await call('Runtime.enable')

const routes = ['/', '/services/', '/services/seo-prodvizhenie/', '/services/seo-audit/', '/services/technical-seo-audit/', '/services/seo-strategy/', '/services/seo-consulting/', '/services/geo-aeo-ai-seo/', '/services/local-seo-spb/', '/services/seo-for-b2b/', '/services/seo-for-small-business/', '/services/seo-prodvizhenie-internet-magazina/', '/services/seo-prodvizhenie-novogo-sayta/', '/cases/', '/cases/1/', '/cases/2/', '/cases/3/', '/cases/4/', '/cases/5/', '/cases/6/', '/pricing/', '/about/', '/process/', '/report-example/', '/results/', '/journal/', '/journal/kak-podgotovit-sayt-k-seo-rostu-bez-haosa/', '/journal/kak-schitat-rezultat-seo-bez-samoobmana/', '/journal/oshibki-kommercheskih-stranic-kotorye-meshayut-ranzhirovatsya-i-konvertirovat/', '/journal/chto-vhodit-v-seo-audit-sayta/', '/journal/technical-seo-audit-chto-proveryat/', '/journal/geo-aeo-ai-seo-kak-podgotovit-sayt/', '/blog/agency-os-landing-mvp/', '/authors/synapsee/', '/contact/', '/privacy/', '/consent/', '/terms/']
const viewports = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
]
const report = []

for (const viewport of viewports) {
  await call('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile })
  for (const route of routes) {
    await call('Page.navigate', { url: `http://localhost:5173${route}` })
    await new Promise((resolve) => setTimeout(resolve, 300))
    const evaluated = await call('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const width = document.documentElement.clientWidth;
        const overflowing = [...document.querySelectorAll('body *')].filter((element) => {
          const style = getComputedStyle(element);
          if (style.position === 'fixed') return false;
          const box = element.getBoundingClientRect();
          return box.right > width + 1 || box.left < -1;
        }).slice(0, 12).map((element) => ({ tag: element.tagName, cls: element.className, right: Math.round(element.getBoundingClientRect().right), left: Math.round(element.getBoundingClientRect().left) }));
        return {
          title: document.title,
          innerWidth,
          clientWidth: width,
          scrollWidth: document.documentElement.scrollWidth,
          h1: document.querySelectorAll('h1').length,
          leadForms: document.querySelectorAll('.lead-form').length,
          quizBlocks: document.querySelectorAll('.seo-quiz').length,
          reportLinks: [...document.links].filter((link) => link.pathname === '/report-example/').length,
          pageForms: document.querySelectorAll('form.lead-form').length,
          bodyTextWarnings: ['С чего разумнее начать', 'дата из публичного sitemap', 'Получить 3 точки роста', 'Требует подтверждения'].filter((value) => document.body.innerText.includes(value)),
          footerCta: document.querySelectorAll('.site-footer__cta').length,
          overflowing,
        };
      })()`,
    })
    report.push({ viewport: viewport.name, route, ...evaluated.result.value })

    const screenshotRoutes = viewport.name === 'desktop'
      ? ['/services/seo-audit/', '/services/seo-strategy/', '/pricing/', '/cases/', '/about/', '/process/', '/journal/chto-vhodit-v-seo-audit-sayta/']
      : ['/services/technical-seo-audit/', '/services/seo-prodvizhenie-internet-magazina/', '/services/local-seo-spb/', '/cases/1/', '/journal/technical-seo-audit-chto-proveryat/', '/contact/']
    if (screenshotRoutes.includes(route)) {
      const shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
      const slug = route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '').replaceAll('/', '-')
      await fs.writeFile(`C:/Users/761D~1/AppData/Local/Temp/synapsee-${slug}-${viewport.name}.png`, Buffer.from(shot.data, 'base64'))
    }
  }
}

const deviations = report.filter((item) => item.scrollWidth > item.clientWidth || item.h1 !== 1 || item.bodyTextWarnings.length > 0 || (item.route.startsWith('/services/') && item.route !== '/services/' && (item.leadForms !== 1 || item.quizBlocks !== 0 || item.footerCta !== 0)) || ((item.route.startsWith('/cases/') && item.route !== '/cases/') && (item.leadForms !== 1 || item.footerCta !== 0)) || ((item.route.startsWith('/journal/') && item.route !== '/journal/') && (item.leadForms !== 1 || item.footerCta !== 0)))
console.log(JSON.stringify({ checked: report.length, deviations }, null, 2))
socket.close()
