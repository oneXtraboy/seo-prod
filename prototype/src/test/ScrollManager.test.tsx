import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollManager } from '../components/Layout'

describe('ScrollManager', () => {
  const scrollTo = vi.fn()
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    scrollTo.mockReset()
    scrollIntoView.mockReset()
    vi.stubGlobal('scrollTo', scrollTo)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
  })

  it('opens ordinary page links at the top, including a repeated menu link', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/about/']}>
        <ScrollManager />
        <Routes>
          <Route path="/about/" element={<Link to="/services/">Открыть страницу</Link>} />
          <Route path="/services/" element={<Link to="/services/">Открыть снова</Link>} />
        </Routes>
      </MemoryRouter>,
    )

    scrollTo.mockClear()
    await user.click(screen.getByRole('link', { name: 'Открыть страницу' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' })

    scrollTo.mockClear()
    await user.click(screen.getByRole('link', { name: 'Открыть снова' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })

  it('scrolls an anchored link to its existing target', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/about/']}>
        <ScrollManager />
        <Routes>
          <Route path="/about/" element={<Link to="/services/#target">Открыть анкор</Link>} />
          <Route path="/services/" element={<section id="target">Нужный блок</section>} />
        </Routes>
      </MemoryRouter>,
    )

    scrollIntoView.mockClear()
    await user.click(screen.getByRole('link', { name: 'Открыть анкор' }))
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' })
  })
})
