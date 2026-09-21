import { readFileSync } from 'node:fs'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnalyticsBridge } from '../components/AnalyticsBridge'

function NavigationFixture() {
  const navigate = useNavigate()
  return (
    <>
      <AnalyticsBridge />
      <button onClick={() => navigate('/about/?from=test')} type="button">Перейти</button>
    </>
  )
}

afterEach(() => {
  delete window.ym
})

describe('Yandex Metrika', () => {
  it('keeps one global counter loader and the noscript fallback in the HTML template', () => {
    const html = readFileSync('index.html', 'utf8')

    expect(html.match(/mc\.yandex\.ru\/metrika\/tag\.js\?id=112847372/g)).toHaveLength(1)
    expect(html.match(/ym\(112847372, 'init'/g)).toHaveLength(1)
    expect(html).toContain('<noscript><div><img src="https://mc.yandex.ru/watch/112847372"')
  })

  it('sends one hit after SPA navigation and does not duplicate the initial pageview', async () => {
    const ym = vi.fn()
    Object.defineProperty(window, 'ym', { configurable: true, value: ym, writable: true })
    document.title = 'Synapsee test'

    render(
      <MemoryRouter initialEntries={['/']}>
        <NavigationFixture />
      </MemoryRouter>,
    )

    expect(ym).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Перейти' }))

    await waitFor(() => expect(ym).toHaveBeenCalledWith(
      112847372,
      'hit',
      new URL('/about/?from=test', window.location.origin).href,
      { referer: new URL('/', window.location.origin).href, title: 'Synapsee test' },
    ))
    expect(ym).toHaveBeenCalledTimes(1)
  })
})
