const targets = await fetch('http://127.0.0.1:9222/json').then((response) => response.json())
const target = targets.find((item) => item.type === 'page')
if (!target) throw new Error('No Chrome page')
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
await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
await call('Page.navigate', { url: 'http://localhost:5173/services/seo-for-b2b/' })
await new Promise((resolve) => setTimeout(resolve, 700))
const result = await call('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => [...document.querySelectorAll('body *')].map((element) => {
    const box = element.getBoundingClientRect();
    return {
      tag: element.tagName,
      cls: String(element.className || ''),
      text: String(element.textContent || '').trim().slice(0, 90),
      left: Math.round(box.left),
      right: Math.round(box.right),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      whiteSpace: getComputedStyle(element).whiteSpace,
    };
  }).filter((item) => item.scrollWidth > item.clientWidth + 1 || item.right > 391 || item.left < -1).slice(0, 60))()`,
})
console.log(JSON.stringify(result.result.value, null, 2))
socket.close()
