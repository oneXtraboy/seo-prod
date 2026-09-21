import fs from 'node:fs/promises'

const targets = await fetch('http://127.0.0.1:9222/json').then((response) => response.json())
const target = targets.find((item) => item.type === 'page')
if (!target) throw new Error('No Chrome page target')
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})
let id = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data))
  if (!message.id || !pending.has(message.id)) return
  const promise = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) promise.reject(new Error(message.error.message))
  else promise.resolve(message.result)
})
const call = (method, params = {}) => {
  id += 1
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}
await call('Page.enable')
await call('Runtime.enable')

const shots = [
  { name: 'cases-cards-desktop', route: '/cases/', width: 1440, height: 1000, mobile: false, y: 720 },
  { name: 'services-catalog-desktop', route: '/services/', width: 1440, height: 1000, mobile: false, y: 650 },
  { name: 'case-detail-desktop', route: '/cases/1/', width: 1440, height: 1000, mobile: false, y: 650 },
  { name: 'cases-cards-mobile', route: '/cases/', width: 390, height: 844, mobile: true, y: 650 },
  { name: 'case-detail-mobile-lower', route: '/cases/1/', width: 390, height: 844, mobile: true, y: 700 },
  { name: 'seo-audit-mobile-lower', route: '/services/seo-audit/', width: 390, height: 844, mobile: true, y: 760 },
]

for (const shot of shots) {
  await call('Emulation.setDeviceMetricsOverride', { width: shot.width, height: shot.height, deviceScaleFactor: 1, mobile: shot.mobile })
  await call('Page.navigate', { url: `http://localhost:5173${shot.route}` })
  await new Promise((resolve) => setTimeout(resolve, 650))
  await call('Runtime.evaluate', { expression: `scrollTo(0, ${shot.y})` })
  await new Promise((resolve) => setTimeout(resolve, 250))
  const screenshot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
  await fs.writeFile(`C:/Users/761D~1/AppData/Local/Temp/synapsee-${shot.name}.png`, Buffer.from(screenshot.data, 'base64'))
}

socket.close()
